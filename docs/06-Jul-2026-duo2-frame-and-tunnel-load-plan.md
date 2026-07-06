# 06-Jul-2026 — Duo 2 camera "not showing" fix + snapshot tunnel-load reduction

**Author:** Claude Fable 5
**Status:** Implemented 2026-07-06 (this doc is committed last so it sits at HEAD for the next dev)

## Symptom

Boss, looking at the deployed site: "it's not even showing the new Duo 2 camera."

## Root cause (verified, not guessed)

The frontend roster plumbing was **working correctly**. `/api/cameras` reports
`duo2` with `is_live: true`; `useGuardianRoster` includes it; both the homepage
and `/projects/guardian` render a tile for it. Verified live in Chrome against
the deployed site — the duo2 thumbnail exists.

The tile is stuck in amber **CONNECTING forever**, which reads as "not showing":

1. The Reolink Duo 2 is a dual-lens panoramic camera. Its frames are **8:3**
   (e.g. 4608×1728) and its native snapshot JPEG is **~4 MB**.
2. `GuardianCameraFeed` fetched `/api/cameras/{name}/frame` with **no size
   params** — full native resolution — under a 12 s `AbortController` cap
   (`FRAME_FETCH_TIMEOUT_MS`).
3. Through the Cloudflare tunnel, 4 MB takes **longer than 12 s** (measured:
   curl hit a 10 s timeout mid-download at 3.85 MB). Every poll aborts; the
   tile never receives its first frame; `hadFrameRef` stays false; the feed
   stays in CONNECTING indefinitely (by design — see v1.16.1 notes in the file
   header).

The backend already had the cure. farm-guardian's `dashboard.py`
`/api/cameras/{name}/frame` supports `max_width` and `q` query params, added
specifically because "the Reolink's native 4K (~1.4MB) chokes the home upstream
Cloudflare tunnel." The frontend just never used them.

Measured through the live tunnel (2026-07-06):

| Request | Size | Time |
|---|---|---|
| `duo2/frame` (native) | ~4 MB | > 12 s (times out) |
| `duo2/frame?max_width=1280&q=70` | 122 KB | 0.61 s |
| `duo2/frame?max_width=1920&q=80` | 377 KB | 1.57 s |
| `house-yard/frame?max_width=1280&q=70` | 253 KB | 1.48 s |

## Scope

**In:**
1. `GuardianCameraFeed` requests display-sized frames (`max_width` + `q`),
   with the width passed as a prop so featured tiles get more pixels than
   thumbnails. This also cuts house-yard's ~1.4 MB-per-poll 4K pass-through
   roughly 5–10×, per tile, every 1.2 s — a large tunnel-load reduction across
   the whole fleet, not just duo2.
2. `lib/cameras.ts` overlay entry for `duo2` (hardware label, 8/3 aspect
   ratio) so the panoramic frame doesn't letterbox inside a 16:9 box.
3. `content/projects/guardian/index.mdx` hardware table gains a duo2 row.
4. GFM table rendering: the hardware table rendered as literal pipe characters
   because `MDXRemote` was mounted with no remark plugins. Add `remark-gfm`
   to both MDX surfaces (`app/projects/[slug]/page.tsx`,
   `app/field-notes/[slug]/page.tsx`).
5. Repo hygiene: commit the stranded 2026-06-26 flock-profiles breed
   correction; re-sync `package.json` version with `CHANGELOG.md`
   (package.json had stalled at 1.16.8 while the changelog advanced to
   1.25.0 — the site header version comes from package.json, so it was
   under-reporting).

**Out:**
- No farm-guardian/backend changes (none needed).
- No change to poll cadence, roster logic, or feed state machine.
- s7-cam and dominator-cam showing `is_live: false` right now — that's
  camera/host state on the farm side, not a frontend bug.

## Architecture

- `GuardianCameraFeed` gains an optional `maxWidth` prop (default 1280) and
  requests `?max_width=<w>&q=75`. Single responsibility unchanged: it still
  just polls and renders one camera.
- `GuardianCameraStage` decides sizes (layout decisions live there once):
  featured/secondary → 1600, thumbnails → 800.
- Frame width is a *hint*: the backend only re-encodes when the source is
  wider, so small cams (720p laptops) are pass-through as before.

## TODOs

- [x] Plan doc (this file)
- [x] `GuardianCameraFeed.tsx` — `maxWidth` prop + `q=75` on the frame URL
- [x] `GuardianCameraStage.tsx` — pass 1600 (stage) / 800 (thumbs)
- [x] `lib/cameras.ts` — append duo2 overlay entry
- [x] `remark-gfm` on both MDXRemote surfaces
- [x] `index.mdx` hardware table — add duo2 row
- [x] CHANGELOG 1.26.0 + package.json 1.26.0
- [x] `npm run lint` + `npm run build`
- [x] Verify on deployed site: duo2 tile goes LIVE with a real frame at 8/3
- [x] Commit flock-profiles correction separately; plan doc committed last

## Docs/Changelog touchpoints

- `CHANGELOG.md` 1.26.0 (this change)
- This plan doc
