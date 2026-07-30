# 30-Jul-2026 — Analyst desk photos → real Ornitharch birds — Plan

Author: Claude Sonnet 5
Status: approved 30-Jul-2026 — Boss also asked to swap the fictional analyst
`name` fields for the real bird names (title/rating/specialty/blurb stay as
written; only `name` changes, in `content/markets/picks.json`).

## Goal

Boss asked: fix the six "THE ANALYST DESK — COVERAGE TEAM" tiles on `/markets`
so every photo is a real, identifiable picture of one of the farm's
Ornitharchs (the 11 birds hatched here in 2026 — `app/flock/page.tsx:392`:
"*Ornitharch* is what we call any bird that hatched here"), pulled from
existing photos already committed to the repo. No new photography, no new
pipeline.

## What's there now

- `content/markets/picks.json` → `analysts[]` (6 entries) → each has a fixed
  fictional persona (name/title/rating/specialty/blurb) plus an `img` path.
- Today all six `img` point at `/photos/markets/analyst-1.jpg` … `-6.jpg`.
  Checked all six: they're anonymous, dim brooder-box close-ups (feather
  patches, blurry motion, no visible identity) — not tied to any named bird.
  They are NOT the ornitharch cohort's usual clean portrait shots.
- `Terminal.tsx:574` renders them as plain `<img class="h-36 w-full
  object-cover">` — a short, wide tile. `object-cover` center-crops whatever
  it's given, so composition (subject centered, not center-of-torso) has to
  be baked into the source file, not left to CSS.
- The existing `analyst-*.jpg` files are pre-cropped portrait stills, ~800–950
  × 1000–1190px, ~200–290KB each — someone already did this crop-and-compress
  step once for this exact tile.
- `public/photos/birds/*.jpg` (the canonical bird photos referenced from
  `content/flock-profiles.json`) are full-res phone photos (2160×2880 or
  4284×5712, several MB) — good source material, wrong size/crop/weight for
  a 144px-tall terminal tile.

## Scope

**In scope:** the 6 images under `◉ THE ANALYST DESK — COVERAGE TEAM`
(`public/photos/markets/analyst-1.jpg` … `analyst-6.jpg`).

**Out of scope — do not touch:**
- `live-1..4.jpg` (the separate "TRADING FLOOR / MEET THE TRADERS" rotator,
  `FloorCams` component) and `pick-tsn.jpg` (today's real-stock pick tile).
- Analyst names, titles, ratings, specialties, or blurbs in `picks.json` —
  the fictional personas stay; only the photo attached to each changes.
- `alt` text — already `{a.name}`, still correct once the photo changes.
- The dark terminal aesthetic / maximalist layout (route-scoped, preserved
  per `app/markets/page.tsx` header comment).

## Persona → bird mapping

Three of the six blurbs describe specific photo content, so the mapping
isn't arbitrary — those three are pinned first, the rest fill the remaining
slots:

| Slot | Old (fictional) name | Title/rating/specialty/blurb (unchanged) | Constraint from blurb | New `name` | Source photo |
|---|---|---|---|---|---|
| analyst-1 | Henrietta "Big Bird" Cluxton | Chief Market Strategist, "27 years on the perch" | wants the biggest/most senior-reading adult | **Henriella** | `birds/IMG_7791-henriella-large-adult-23jul2026.jpg` |
| analyst-2 | Dr. Pecks Featherstone, PhD | Head of Quant Research | none | **Birddor** | `birds/IMG_5849-birdadette-23jun2026.jpg` |
| analyst-3 | Goldie Hawkins | Macro & Feed Commodities | none | **Horstabird** | `birds/IMG_7644-horstabird-21jul2026.jpg` |
| analyst-4 | Marge Coop-erfield | Head of Liquidity / Order Flow | none | **Ingebird** | `birds/IMG_7718-ingebird-black-white-21jul2026.jpg` |
| analyst-5 | Penny Brood | "literally a chick... three weeks old" | must be a chick photo | **Birdimir** | `birds/IMG_6233-birdimir-juvenile-22jun2026.jpg` |
| analyst-6 | Reginald Roostchild III | "the only analyst who flies" | must show flight/wings out | **Henridotta** | `birds/IMG_8044-henridotta-wings-flapping-29jul2026.jpg` |

Only the `name` field changes in `picks.json` (fictional → real bird name);
title/rating/specialty/blurb keep the satirical Wall Street flavor text as
written. All six are Ornitharchs (`ornitharch: true` in
`content/flock-profiles.json`), all six are different birds (max variety
across the desk), and all six are clear, well-lit, identifiable shots — a
real upgrade over the current anonymous brooder photos.

## Architecture / approach

Reuse the existing asset slot rather than repointing JSON at full-res
originals: **overwrite `public/photos/markets/analyst-N.jpg` in place** with
a cropped, downscaled copy of the matched source photo.

- `content/markets/picks.json` does not change — `img` paths stay
  `/photos/markets/analyst-N.jpg`. No JSON edit, no orphaned-asset cleanup
  question.
- Crop each source to a portrait framing (~4:5, matching the existing
  798–952 × 1000–1190px files) centered on the bird's head/upper body, so
  the render-time `object-cover` (which crops a wide-short window out of a
  taller image) keeps the head in frame instead of showing torso/hand.
- Resize + re-encode to land in the same ~200–300KB ballpark as the files
  being replaced, so the density of this page (already the heaviest route
  on the site) doesn't regress.
- Do the crop/resize with local tooling (Python/Pillow, already installed)
  — no new dependency, no server-side pipeline involved.
- `public/photos/birds/*.jpg` originals are untouched (read-only source);
  only the derived `public/photos/markets/analyst-*.jpg` copies change.

## TODOs

1. ~~Confirm scope, mapping, and crop approach with Boss (this doc).~~ →
   pending approval.
2. Crop + downscale each of the 6 source photos per the mapping above;
   overwrite the matching `analyst-N.jpg`.
3. Visual check: `npm run dev`, open `/markets`, screenshot the analyst desk
   row at desktop width — confirm all 6 heads are framed in-shot, no
   decapitated/cropped-wrong tiles, page still reads as the dense terminal
   bit.
4. `npm run lint` (no code changes expected, but cheap to confirm).
5. Add a CHANGELOG top entry (SemVer patch/minor — visual/content fix, no
   behavior change) describing the swap and why.

## Docs/Changelog touchpoints

- `CHANGELOG.md` — new top entry once images are verified.
- No other docs describe the analyst desk specifically
  (`23-Jun-2026-markets-bird-portraits-plan.md` covers the separate
  "TRADING FLOOR" rotator, not this tile — confirmed by reading it).
