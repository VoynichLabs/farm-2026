# Plan: per-bird photo history — track every picture of a bird over time

**Date:** 22-Jul-2026
**Author:** Claude Opus 4.8
**Goal:** Keep every photo ever taken of a bird, and show how that bird ages over time — an accumulating, browsable timeline per bird, for *all* birds (not just the farm-hatched ones).

## What already exists (don't rebuild)

- **Timeline data (ornitharchs only):** `content/hatches/2026/*.md` frontmatter has a `photos:` array — `{path, date, caption, confidence}` per shot. E.g. Henridotta already has 3 dated photos.
- **Timeline UI:** `app/components/flock/GrowthStrip.tsx` renders a horizontally-scrollable N-photo aging strip (date + age labels), already shown on each ornitharch tile on `/flock`. Self-suppresses below 2 photos.
- **Every photo is preserved as a file** in `public/photos/birds/` — the ingest pipeline commits each drop as a new file and never deletes (Birdsilla 5 files, Henridotta 3, etc.). The raw history is already safe on disk.

## The three gaps

1. **It doesn't accumulate automatically.** `bird_photo_ingest.py` overwrites the single `photo` (current portrait) field but does **not** append the new shot to any timeline. Today the hatch-record `photos:` arrays are grown by hand (Bubba). A new drop should extend the history on its own.
2. **Only ornitharchs have a timeline.** Non-farm-hatched birds (adult hens, Robirda, Bobirda, turkeys) have no hatch record, so no timeline — even though their photos pile up as files.
3. **No accumulating home every bird shares.** The timeline lives in ornitharch-only MDX; there's no per-bird picture ledger that covers the whole roster.

## Proposed design

**One accumulating photo ledger per bird, in the roster SSoT.** Add an append-only `photos: [{ file, date, caption }]` array to each bird in `content/flock-profiles.json` (every bird has an entry there; the ingest module already writes that file for the `photo` field). Keep `photo` as the "current hero portrait" pointer (newest, or Boss-chosen); `photos[]` is the full history that never shrinks.

1. **Data:** add `photos?: BirdPhoto[]` to `FlockBird` (`lib/content.ts`), `BirdPhoto = { file, date, caption? }`.
2. **Ingest appends:** `bird_photo_ingest.py` — on each drop, append `{file, date, caption}` to the bird's `photos[]` (dedup by file) *and* update `photo` to the newest. Same file, same commit it already makes. This is the core of the ask: the history grows by itself.
3. **UI (all birds):** generalize `GrowthStrip` to read `bird.photos` and render it on **every** card — the ornitharch tiles *and* the adult `BirdCard`s — sorted oldest→newest with live age-at-photo labels. Self-suppress below 2 photos (unchanged).
4. **Backfill (so timelines are full on day one):**
   - Ornitharchs: seed `photos[]` from their hatch-record `photos:` arrays (already dated + captioned).
   - Everyone else: seed from committed `public/photos/birds/` files whose name matches the bird's slug; date parsed from the filename (`…-21jul2026.jpg`) where present, else left undated.

**Optional phase 2 (recommend as a follow-up, not v1):** a dedicated per-bird page `/flock/[slug]` — the full-size aging gallery for one bird (every photo, chronological, with age + caption), linked from each card. v1 gives the accumulating data + the on-card strip; phase 2 is the deep-dive view.

## Decisions I'd like your call on

1. **Ledger home:** `flock-profiles.json` `photos[]` (my recommendation — one home, all birds, ingest already writes it) vs. keep growing the hatch-record MDX arrays (ornitharch-only, fragile to auto-append). → *Recommend flock-profiles.json.*
2. **Phase 2 per-bird page** now or later? → *Recommend later; ship the accumulating strip first.*
3. **Undated legacy photos:** show them at the end labeled "undated," or omit until dated? → *Recommend show, labeled.*

## TODOs (ordered)

1. `lib/content.ts`: `BirdPhoto` type + `photos?` on `FlockBird`.
2. Backfill script: seed `photos[]` for every bird from hatch records + matching files; commit.
3. `bird_photo_ingest.py`: append to `photos[]` on each drop (dedup), keep `photo` = newest. Verify + dedup lock unchanged.
4. `GrowthStrip` / `/flock`: render `bird.photos` on all cards (ornitharch tiles + BirdCard).
5. Build, verify locally (screenshot a multi-photo bird), push.
6. (Phase 2, optional) `/flock/[slug]` aging gallery.

## Docs / changelog

- `farm-2026/CHANGELOG.md` — new per-bird photo history + timeline on all cards.
- `farm-guardian/CHANGELOG.md` — ingest now appends to the photo ledger.
- Update `skills/farm-bird-roster-photo/SKILL.md` — note the ledger grows automatically.
