# 06-May-2026 — Stop Railway healthcheck restart loop + bound SSR Guardian fetches

Author: Claude Opus 4.7 (1M context)

## Symptom

Boss reports `farm.markbarney.net` shows as down for a few seconds, then recovers, repeatedly. The recent flap-hysteresis fixes (1.14.0/1.14.1) addressed the Guardian *banner* and per-tile *RECONNECTING* strip, but those only smooth the dashboard UI — they can't keep the Next.js process itself responding to Railway's healthchecks if the homepage is slow to render.

## Root cause analysis

Two separate problems compound on a jittery Cloudflare tunnel:

1. **`railway.json` healthchecks the homepage (`healthcheckPath: "/"`)**, which is the heaviest page in the app. The homepage is rendered by three Server Components that each `await` a Guardian-tunnel fetch during SSR:
   - `app/components/home/Hero.tsx` → `fetchGems({ limit: 10 })`
   - `app/components/home/FarmPulse.tsx` → `fetchImageStats()`
   - `app/components/home/LatestFlockFrames.tsx` → `fetchRecent({ limit: 6, tier: ["strong","decent"] })`
   With `restartPolicyType: ON_FAILURE`, every cold-cache HTML render rides on the tunnel's worst-case latency. When the tunnel hangs or the Mac Mini is busy, the healthcheck times out → Railway restarts the container → site is "back up" ~10–30 s later.

2. **No upper bound on those SSR fetches.** `lib/gems.ts:request()` calls `fetch(url, { next: { revalidate: 300 } })` with `try/catch` for network errors, but no `AbortSignal.timeout()`. A hung TCP through Cloudflare keeps SSR awaiting indefinitely.

The 1.2 s per-tile frame polling is loud on the tunnel, but it loads `guardian.markbarney.net`, not `farm.markbarney.net` — it's a co-conspirator (slows Guardian → slows SSR fetches → trips healthcheck), not the trigger. Out of scope here; revisit only if the two fixes below don't resolve the symptom.

## Scope

In:
- New `app/api/health` route returning `200 {ok:true}` with no upstream calls.
- `railway.json` healthcheckPath repointed at `/api/health`.
- `lib/gems.ts` adds an `AbortSignal.timeout(3000)` ceiling on every Guardian fetch. Existing `FetchResult` error path handles the abort case as `network_unavailable` — every consumer already renders a fallback for that branch (Hero swaps to `HERO_FALLBACK_IMAGE`, FarmPulse and LatestFlockFrames render empty/error states).

Out:
- No change to per-tile frame polling cadence (1.2 s).
- No change to dashboard `/api/status` cadence (10 s) or roster cadence (30 s).
- No retry/backoff layering on top of existing hysteresis.
- No backend (`farm-guardian`) changes.

## Architecture

**Health route.** Standard Next.js 16 App Router: `app/api/health/route.ts` exports an async `GET()` returning `Response.json({ok:true}, {status:200})`. Marked `dynamic = "force-dynamic"` so the response proves the live server process answered (not a static asset served by an edge cache). No imports from `lib/`, no env reads, no Guardian calls — must stay independent of every external dependency.

**Railway config.** `railway.json` flips `healthcheckPath` from `/` to `/api/health`. `restartPolicyType` stays `ON_FAILURE` so a genuinely-stuck Next.js process still restarts.

**SSR fetch timeout.** `lib/gems.ts:request()` adds `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)` to its `fetch()` call. New constant `REQUEST_TIMEOUT_MS = 3000` near `REVALIDATE_SECONDS`. The existing `catch (err)` already returns `{ ok: false, status: 0, code: "network_unavailable", message }` on any throw — abort errors land there cleanly.

3 s ceiling rationale: normal Cloudflare → Mac Mini round-trip is 100–300 ms; 3 s is ~10× headroom for jitter while keeping cold-cache SSR bounded. Cache-warm renders (`revalidate: 300`) are unaffected because Next serves from the data cache without touching `fetch`.

## TODOs

1. Write `app/api/health/route.ts` with required file header.
2. Update `railway.json` → `healthcheckPath: "/api/health"`.
3. Edit `lib/gems.ts`: add `REQUEST_TIMEOUT_MS = 3000`, attach `AbortSignal.timeout()` to the `fetch()` call, refresh the file header date.
4. **Verify locally:** `npm run build` succeeds (TypeScript + Next compilation).
5. **Verify locally:** `npm run lint` clean (existing baseline).
6. Update `CHANGELOG.md` — new top entry `[1.14.2] — 2026-05-06`, what/why/how, author tag.
7. Commit as **two** atomic commits so each is independently reviewable / revertable on Railway:
   - `ops: healthcheck on dedicated /api/health, not the homepage`
   - `gems: 3s timeout on SSR Guardian fetches so /  can't hang on the tunnel`
8. Push to `main` — Railway auto-deploys.
9. **Verify in prod:** after Railway redeploys, `curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://farm.markbarney.net/api/health` returns `200` in ~tens of ms. Watch Railway deployment logs for absence of "Healthcheck failed".

## Docs / Changelog touchpoints

- `CHANGELOG.md` top entry, SemVer `1.14.2`, fix-only release.
- This plan doc.
- No CLAUDE.md update needed — healthcheck path is a deployment detail, captured in `railway.json`.
- No `docs/FRONTEND-ARCHITECTURE.md` update needed — no architectural shift, just bounded latency on existing fetches.
