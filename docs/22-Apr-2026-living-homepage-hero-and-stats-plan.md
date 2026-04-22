# Living homepage — rotating hero + farm-pulse stats strip (22-Apr-2026)

## Scope

**In:**
- Convert the homepage `Hero` from a static Birdadette-fresh-hatch JPG into a server-rendered rotating hero that uses the most recent strong-tier gem from Guardian's `/api/v1/images/gems` as the background image, falling back to the static JPG on tunnel drop or empty result.
- Add a new `FarmPulse` server component — a thin mono-font stats band inserted directly under the hero — driven by `/api/v1/images/stats`. Surfaces Birdadette sightings, top activity, top camera, total gems, and the window label.

**Out:**
- `/flock/birdadette` day-of-life retrospective (separate follow-up, planned).
- Any backend changes to farm-guardian (the endpoints already exist and have been in production since v2.25.0).
- Tagline rewrite in the hero ("wonders of Claude's own creation" stays for now — not part of this scope).
- Opengraph / social-share image — those stay on the fixed Birdadette-hatch JPG (a rotating OG image would break previously-shared links).

## Why

The homepage was reading low-effort despite a rich live database (13,116 rows in the last 7 days, 377 strong-tier, 190 Birdadette sightings). The hero has been the same frozen frame since 12-Apr-2026 and no surface on the homepage reflects that the pipeline is actually running. Two small changes flip the homepage from "static portfolio" to "live log."

## Architecture

### Hero rotation

`app/components/home/Hero.tsx` — currently a synchronous server component. Becomes `async`:

1. `await fetchGems({ limit: 1 })` — default order is `newest`. `/api/v1/images/gems` already filters to strong-tier only (that's what makes it the gems endpoint).
2. If `result.ok && rows.length > 0`, use `rows[0].full_url` (already sized `1920`) as the background.
3. Otherwise, use the existing `HERO_FALLBACK_IMAGE = "/photos/april-2026/birdadette-fresh-hatch.jpg"`.
4. Everything else stays identical — vignette gradients, top-left title, bottom-left body, bottom-right location + nav links. No layout changes; background URL is the only moving part.
5. `lib/gems.ts` already layers `{ revalidate: 300 }`, so the hero image turns over every 5 minutes at most — fast enough to feel live, slow enough to not thrash the tunnel.

### FarmPulse stats band

New `app/components/home/FarmPulse.tsx` — server async component.

1. `await fetchImageStats()` — no params, Guardian defaults to last 7 days.
2. On success, render a single horizontal band: forest background (matches hero's dark bottom edge), cream mono-text, pipe-separated stat cells. Five cells:
   - Window label: `PAST 7 DAYS` (derived from `range.since` / `range.until`; fall back to literal `PAST 7 DAYS` if something is off).
   - `{birdadette_sightings} Birdadette sightings`.
   - Top activity from `by_activity`, excluding the uninteresting `none-visible` / `unknown` / `other` buckets. Format: `top activity: {activity} ({count.toLocaleString()})`.
   - Top camera from `by_camera`. Format: `busiest camera: {camera_id} ({count.toLocaleString()})`.
   - Total gems: `{by_tier.strong + by_tier.decent} gems saved`.
3. On any non-ok response, render `null` — same pattern `LatestFlockFrames` uses for tunnel drops.

Stats live inline in the component (helper functions for top-activity / top-camera extraction). If they are reused elsewhere later, extract to `lib/gems-format.ts` — not before (per architecture doc's "third duplicate" threshold).

### Composition

`app/page.tsx` gains one new line:

```tsx
<Hero />
<FarmPulse />          // new
<GuardianHomeSection />
```

No other sections move.

## Ordered TODOs

1. Write this plan doc. ✓
2. Add `FarmPulse.tsx` under `app/components/home/`.
3. Rewrite `Hero.tsx` to be async and fetch the latest strong gem; rename constant to `HERO_FALLBACK_IMAGE`.
4. Insert `<FarmPulse />` into `app/page.tsx` between `<Hero />` and `<GuardianHomeSection />`.
5. `npm run build` — confirm no type errors, no React server-component issues, static prerender succeeds.
6. `npm run lint` — 0 errors / 0 warnings.
7. Update `CHANGELOG.md`: new top entry `[1.9.0] — 2026-04-22`.
8. Commit + push. Railway redeploy picks it up.

## Docs / Changelog touchpoints

- `CHANGELOG.md`: new `[1.9.0]` entry, "Changed — living homepage: rotating hero + farm-pulse stats band".
- No `docs/FRONTEND-ARCHITECTURE.md` changes — the SSoT table doesn't need a new row; Guardian's image archive is already listed and the components here are pure consumers of it.
- No `CLAUDE.md` change — the Guardian integration section already documents that the homepage consumes live Guardian data.

## Verification

- Load `/` in dev with Guardian reachable: hero should render a fresh strong-tier frame (not Birdadette-hatch). FarmPulse should show non-zero numbers matching what `curl https://guardian.markbarney.net/api/v1/images/stats` returns.
- Stop the Cloudflare tunnel (or unplug the Mini): reload. Hero should fall back to the static JPG; FarmPulse should render nothing, not a broken band with zeros.
- Portrait s7-cam frame in the hero slot: should letterbox on the left/right with the forest bg showing through. Vignette still legible over text.
- `npm run build` succeeds. Mobile layout at narrow viewport — FarmPulse wraps gracefully (overflow-x scroll on narrow screens is acceptable for a mono stats band).

## Future work (out of scope here)

- `/flock/birdadette` day-of-life retrospective — next pass.
- Hero tagline rewrite — when Boss decides on the copy.
- Stories-style portrait rail for s7-cam — separate component, after this lands.
- Retiring or repurposing the static `/gallery` surface — content call, not engineering.
