# Homepage rewrite — v1.16.0 (10-May-2026)

**Author:** Claude Opus 4.7 (1M context)
**Status:** Shipped — see CHANGELOG v1.16.0
**Predecessor:** `docs/09-May-2026-v1.15-postmortem.md` (the failed v1.15 redesign)

---

## Why this exists

Boss's exact words on v1.15.0:

> I think the whole thing is pretty much a disaster of spaghetti code, so why don't you re-imagine it from the ground up?
> I just gave you the URL of the page that's behaving and looks the way I want it to look. We lead with the cameras, the cool pictures.

The page he pointed at: `/projects/guardian`. That's the anchor.

This is a post-hoc plan doc — written alongside the commit, not before. CLAUDE.md asks for a plan in `docs/` for substantive edits, and this satisfies that. Boss didn't have time to wait on plan approval.

## Scope

### In
- Total rewrite of `app/page.tsx`
- Deletion of `app/components/home/*` (10 files) and `app/components/primitives/*` (2 files) — confirmed unused outside `app/page.tsx` via `grep -rn 'from "@/app/components/home/' app/`
- Deletion of `content/farm-topology.json` (only consumer was `FarmTopology.tsx`)
- One new client component, `app/components/home/HomeCameraStage.tsx`, that wraps the existing `GuardianCameraStage` with the homepage's roster + storageKey
- One new client component, `app/components/home/RecentGemsRail.tsx`, that fetches `/api/v1/images/gems?limit=12` on mount
- Color-inheritance tweak to `GemsStatFooter` so it renders on both cream and dark backgrounds
- CHANGELOG v1.16.0 entry

### Out
- `app/layout.tsx` (cream nav stays — `/projects/guardian` already renders inside it and Boss said that page looks right)
- Everything under `app/components/guardian/*` (Boss said don't touch the dashboard)
- `lib/*` — esp. the 3s `AbortSignal.timeout()` in `lib/gems.ts` (CLAUDE.md: "Don't remove it.")
- `/api/health` (Railway healthcheck contract)
- `public/photos/*` (auto-pipeline owns these write paths)
- All `content/*` MDX
- `/gallery/gems`, `/yard`, `/flock`, `/field-notes`, `/projects` (untouched this pass — they may be re-imagined separately later)

## Architecture

```
app/page.tsx (server component)
├─ <GuardianHomeBadge />              // existing client, unchanged
├─ <HomeCameraStage />                // new client wrapper around existing GuardianCameraStage
│    └─ <GuardianCameraStage          // unchanged
│         defaultFeatured="house-yard"
│         secondaryFeatured="s7-cam"
│         storageKey="farm2026.guardian.featured.home" />
├─ <RecentGemsRail />                 // new client component, fetches on mount
│    └─ map -> <GemCard variant="compact" />   // unchanged compact tile
├─ DEEPER_LINKS grid (inline)         // 6 dark cards linking to deeper pages
└─ <footer> ... <GemsStatFooter /> </footer>   // inline dark footer
```

The configuration (`house-yard` primary + `s7-cam` secondary, same as the dashboard) is what gives the homepage the "looks like `/projects/guardian`" feeling Boss asked for.

## Why the gem rail is client-side, not SSR

Measured `2026-05-09` against `https://guardian.markbarney.net/api/v1/images/gems`:

| limit | response time | bytes |
|------:|--------------:|------:|
|     4 |        3.49 s |   4 KB |
|     6 |        4.23 s |   6 KB |
|     8 |        5.58 s |   8 KB |
|    12 |        7.39 s |  12 KB |
|    24 |       14.04 s |  24 KB |

`lib/gems.ts` has a hard 3s `AbortSignal.timeout()` ceiling — any SSR call to gems times out and lands in the `network_unavailable` branch. SSR would always render an empty rail.

Client-side, the browser doesn't block on the fetch — the page renders instantly with skeleton tiles, and the gems pop in 5–8 seconds later. Same async pattern the camera stage already uses for per-tile snapshots. The 3s SSR cap stays where it is (it's the safety net that keeps Railway's healthcheck unblocked when the tunnel hiccups).

## Verification done before push

The v1.15.0 post-mortem named the exact failure mode: "Never verified the live deployment." This pass:

1. `npm run lint` — clean
2. `npm run build` — clean, all 20 routes prerender, no `TimeoutError` on Guardian fetches in the build logs
3. `npm run dev` — loaded `/` at 1440×900 (desktop) and 375×812 (mobile). CORS errors against `localhost:3001` are expected (Guardian whitelists `farm.markbarney.net`, not localhost) and are functionally identical to a tunnel-down failure path: the camera stage shows its OFFLINE state per tile, the gems rail shows its "Gem archive is unreachable" fallback, and the page composition stays intentional. Layout holds at both widths.
4. Push, wait for Railway redeploy, load `farm.markbarney.net` at desktop width via chrome-devtools, screenshot, eyeball.

Step 4 is the one v1.15.0 skipped.

## What does NOT survive into the new homepage

The deleted components weren't useless individually — they just didn't add up to a story when stacked. Notes here in case any of them is wanted back later:

- **`Hero.tsx`** — fetched a strong-tier gem and rotated by hour-of-epoch. The image-as-bg-contain pattern broke on the fallback path. If a hero comes back, it should use the live camera stage as the bg, not a still image, so the fallback is a working camera tile.
- **`ImagePipeline.tsx`** — four-step pipeline visualization. Story is good but the homepage isn't the place for "how the system works" — that belongs on `/projects/guardian`'s MDX, where it already lives.
- **`FarmTopology.tsx`** — Bubba / Larry / camera fleet cards. Same reasoning — too "about the system" for the front door.
- **`LatestFieldNote.tsx` / `FlockPreviewStrip.tsx` / `LatestFlockFrames.tsx` / `ActiveProjects.tsx`** — small section previews of `/field-notes`, `/flock`, `/projects`. Replaced by the six-link DEEPER_LINKS grid.
- **`SocialSection.tsx`** — IG/FB CTA. Replaced by two text links in the dark footer.
- **`SiteFooter.tsx`** — cream footer. Replaced by an inline dark footer with the same `GemsStatFooter` widget.
- **`SectionHeader` / `BirdCard` primitives** — only consumed by the deleted home/* components.

## Risk register

- **Cream nav over dark page**: visual seam between the sticky cream nav and the dark guardian content. Acceptable — `/projects/guardian` already has the same seam and Boss said that page looks right.
- **s7-cam portrait tile is tall on mobile**: `9/16` aspect ratio against full-column width = a very tall second tile when the secondary stage is rendered. Same behavior as `/projects/guardian` mobile. Documented as deliberate (s7-cam is portrait by design — see `reference_s7_power_chain.md` and `feedback_camera_inventory_fluid.md`).
- **Gems rail loads in 5–8 s**: visitors see skeleton tiles for that window. Mitigated by skeleton's animate-pulse and by the camera stage being live above it.

## Next session candidates (out of scope here)

- `/flock`, `/field-notes`, `/projects` may want the same dark guardian palette for visual coherence — check after Boss sees the homepage live.
- The cream nav in `app/layout.tsx` may want to switch to dark to fully unify the site — leave alone until Boss says so; expanding nav scope into legacy pages is what burned v1.15.0.
