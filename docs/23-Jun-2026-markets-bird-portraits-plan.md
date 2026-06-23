# 23-Jun-2026 — Rotating bird portraits on /markets — Plan

Author: Claude Opus 4.8
Status: **proposed, not started** — handoff notes for the next session.

## Goal

Add a rotating selection of the good portrait-style chicken photos to the
`/markets` ("Poultry Capital Markets") terminal. Boss asked for this directly
on 2026-06-23. Keep it small — this is a hobby site, not a product.

## What's there now

- `/markets` is `app/markets/page.tsx` → reads `content/markets/picks.json` off
  disk, hands it to the client island `app/components/markets/Terminal.tsx`.
- `Terminal.tsx` already renders images with plain `<img>` tags in the green
  terminal style, and already runs a `setInterval` clock/ticker loop. Relevant
  spots:
  - the daily-pick coop **frame** (`today.frame`, ~line 338)
  - **analyst cards** (`a.img`, ~line 500)
  - a hardcoded **"live coop floor"** strip of 4 photos
    (`/photos/markets/live-1..4.jpg`, ~line 522)

## Approach (light)

1. Curate ~6–8 of the best portrait shots already in `public/photos/birds/`
   — candidates: Henriella (`IMG_6283`/`IMG_6292`), Birdadotta (`IMG_6271`),
   Quasibirdo (`IMG_5874`), Ravenessa (`IMG_5958`), Birdimir juvenile
   (`IMG_6233`), Birdthazar (`IMG_6268`), Chonkers/Chonkette (`IMG_5948`).
   Put `{ src, name }` in a small const array at the top of `Terminal.tsx`.
2. Add ONE client-side rotator: a single framed portrait that cross-fades to
   the next every ~5s. Reuse the existing `setInterval` pattern and the
   existing `<img>` + green-border styling — no new dependency, no new data
   file, no Guardian fetch.
3. Drop it into the terminal grid as a "TRADING FLOOR" / "FLOOR CAM" tile so it
   reads as part of the bit, matching the existing maximalist look.

## Reuse, don't rebuild

- Existing `<img>` + `border-[#1f3b2e]` terminal styling already in `Terminal.tsx`.
- The component's existing `useState`/`useEffect`/`setInterval` machinery.
- Photos already committed in `public/photos/birds/` — no new pipeline.

## Heads-up for next session

- The original markets page header comment says portraits were *deliberately*
  kept off /markets to protect the maximalist aesthetic. Boss's 2026-06-23 ask
  overrides that — fine to add, just style it to fit the terminal rather than
  the calm-farm look.
- There is a pre-existing lint error in `Terminal.tsx:209`
  (`react-hooks/set-state-in-effect` on the clock) — already tracked as a
  separate task; the rotator should avoid the same pattern.

## TODO

1. Pick the final 6–8 photos.
2. Add the array + rotator component in `Terminal.tsx`.
3. Verify: `npm run build`, then preview `/markets` and watch one full rotation.
4. CHANGELOG entry; commit; push.
