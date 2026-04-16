# 16-Apr-2026 — Dynamic camera roster

Author: Claude Opus 4.7 (1M context)

## The problem (how it came up)

After a Mac Mini reboot, Boss reported the Farm Guardian section on `farm.markbarney.net` "still looks like shit, like you were supposed to fix it." Investigation found:

- `mba-cam` was in `farm-2026/lib/cameras.ts` as the 2nd camera in the roster.
- Guardian's `config.json` no longer had `mba-cam` — Boss had repurposed the MacBook Air (commit `0a9a0a5` on `farm-guardian`, v2.27.2).
- Result: the site kept polling `mba-cam`, which returned 404. My earlier "smart visibility" fix (15-Apr) hid it as OFFLINE, but only after the per-feed threshold expired — so on every page load the user still briefly saw `mba-cam` as `CONNECTING`, and even after that the stage had fewer visible thumbs than the hardcoded list promised.
- usb-cam-host was independently serving 11-minute-stale frames, which is why the brooder view specifically was bad (and that's the tile Boss actually watches for ~19 chicks).

My initial instinct was to remove `mba-cam` from `lib/cameras.ts`. Boss pushed back hard:

> "There's no such thing as a fucking decommissioned camera. We're going to be adding and taking cameras offline frequently. The front end has to fucking deal with it."
>
> "What about when I add new fucking cameras? Can you think beyond just finishing this one fucking task?"

The real requirement: the frontend camera roster must be **data**, not a hardcoded list. Adding a camera to Guardian's backend should make it appear on the site. Unplugging one should just show an offline indicator, not require a redeploy.

## Scope

**In:**

- Frontend changes only. No backend changes.
- The live camera rail (homepage + `/projects/guardian`) reads its roster from Guardian's `/api/cameras` at runtime.
- `lib/cameras.ts` becomes an optional display-metadata overlay, not a roster gate. Unknown camera names render with sensible defaults.
- All `CAMERAS.length` and `CAMERAS.map` usages in live-rail code paths switch to the live roster. Historical gem filters keep using the overlay.
- Lint clean: the 3 pre-existing `react-hooks/set-state-in-effect` errors and 1 `<img>` warning all resolved (not just my changes — Boss asked that none be left).

**Out:**

- Guardian backend config (`farm-guardian/config.json`). Not touched.
- The narrative MDX in `content/projects/guardian/index.mdx` — left as hardware documentation.
- Gem filter chips (`GemFilters.tsx`) — historical, stays on the overlay.

## Architecture

```
Guardian backend (Mac Mini)
  /api/cameras  ───────┐
                       │  HTTPS (Cloudflare QUIC tunnel)
                       ▼
  lib/guardian-roster.ts  ──►  useGuardianRoster() hook
    fetch every 30s                 returns { cameras, ready }
    resolveCameraMeta(name)               │
                                          ▼
                                 ┌───────────────────────┐
                                 │ GuardianHomeSection   │  (homepage)
                                 │ GuardianDashboard     │  (/projects/guardian)
                                 └────────────┬──────────┘
                                              │
                                              ▼
                                 GuardianCameraStage
                                   cameras prop is live data
                                   featured fallback to cameras[0]
                                   smart offline hiding unchanged

  lib/cameras.ts  ◄─ resolveCameraMeta() fallback lookup
    CAMERAS overlay = UI labels only (hardware historical)
    Unknown name → { name, label: name, aspect: "16/9" }
```

Key invariants:

1. **Guardian backend decides what renders.** If a name is in `/api/cameras`, it renders. If not, it doesn't. Full stop.
2. **Overlay is opt-in metadata, not a gate.** A camera not in `lib/cameras.ts` still renders, just with its name as the label.
3. **Overlay is sticky.** Historical gems in `/gallery/gems` reference cameras by name; the overlay keeps those labels pretty even when the camera is currently offline or removed from the backend.

## Files touched

| File | Change |
|------|--------|
| `lib/guardian-roster.ts` | **New.** Client hook that fetches `/api/cameras` every 30s, maps entries through `resolveCameraMeta`, keeps last-good roster on fetch errors. |
| `lib/cameras.ts` | Reframed as overlay. `CameraName` → `string`, `isCameraName` accepts any non-empty string. New `resolveCameraMeta(name)` with defaults. `CAMERAS` array kept (sticky hardware list for gem filters). Header rewritten to document the new contract. |
| `app/components/guardian/GuardianCameraStage.tsx` | Loosened types. Featured-fallback now uses `cameras[0]` when the pinned cam isn't in the current roster. Empty-state copy updated. |
| `app/components/guardian/GuardianDashboard.tsx` | Uses `useGuardianRoster()` instead of hardcoded `CAMERAS`. `/api/status` poller refactored to put setState in `.then` callback (React-19 lint). |
| `app/components/home/GuardianHomeSection.tsx` | Converted to `"use client"`. Uses `useGuardianRoster()`. System panel cameras list + pipeline summary row now driven by live roster. |
| `app/components/guardian/GuardianHomeBadge.tsx` | Dropped `CAMERAS` import; fallback caption no longer prints a stale count. |
| `app/components/guardian/GuardianPTZPanel.tsx` | Effect refactored to put setState in `.then` callback (React-19 lint). |
| `app/components/guardian/GuardianCameraFeed.tsx` | Targeted eslint-disable for blob-URL `<img>` (snapshot polling defeats `next/image` optimization). |

Not touched: `content/projects/guardian/index.mdx`, `lib/gems-format.ts`, `app/components/gems/GemFilters.tsx`, `docs/FRONTEND-ARCHITECTURE.md` (touched separately, see below).

## Behavior matrix

| Scenario | Before | After |
|----------|--------|-------|
| Camera added to Guardian backend | Invisible on site until `lib/cameras.ts` edited + deploy | Appears within ≤30s of next roster refresh, no code change |
| Camera removed from Guardian backend | Stayed in frontend list, polled forever, eventually shown as OFFLINE via smart-visibility fix | Disappears from roster immediately on next refresh |
| Camera in backend but no overlay metadata | N/A (couldn't happen — required TS literal) | Renders with `{ label: name, aspectRatio: "16/9" }` |
| Camera in overlay but not in backend | Polled forever as OFFLINE, stuck in hidden container | Not in roster → not rendered (zero polls) |
| User's pinned featured cam unplugged | Stage empty, relied on smart-visibility to auto-promote | Stage auto-falls-back to `cameras[0]` even before status signal |
| Guardian `/api/cameras` fetch fails | N/A | Last good roster stays (no blink to empty). First-load failure: static overlay acts as fallback so page isn't blank. |

## Verification

- `npm run lint` — 0 errors, 0 warnings (was 3 + 1).
- `npm run build` — clean, all 18 routes.
- Local dev server smoke: `/` and `/projects/guardian` return HTTP 200 with no runtime errors in the server log.
- Tunnel spot check: `curl https://guardian.markbarney.net/api/cameras` returns 4 cameras (house-yard, s7-cam, usb-cam, gwtc). The page will reflect whatever Guardian returns at fetch time.

Live verification (Boss): load `https://farm.markbarney.net/projects/guardian` and confirm the rail shows exactly the 4 live cameras and nothing else. Unplugging/adding on Guardian's side should reflect within 30s without redeploying the site.
