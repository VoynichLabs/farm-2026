# 22-Jun-2026 — Birdimir "then & now" + latest-photo freshen — Plan

Author: Claude Opus 4.8 (1M context)

## Scope

**In**

- Add two real Birdimir photos to the repo (hatch day 2 Jun 2026; juvenile 22 Jun 2026).
- Fill Birdimir's hatch record (`content/hatches/2026/2026-06-02-01-birdimir.md`): the
  `photos` array and an append-only day-20 phenotype observation.
- A tasteful, minimal "then → now" comparison block on `/hatches`, bound to
  Birdimir as the single worked example.
- Freshen the homepage hatchlings hero so the newest photo (Birdimir) shows, and
  fix its stale hardcoded ages by computing them live from `hatch_date`.

**Out**

- No sprawling new feature, no per-bird then/now generator, no new data source.
- No change to `/markets` imagery — its frames are coop-cam stock-pick stills from a
  different pipeline; a chick portrait does not belong there, and its maximalist
  aesthetic is intentional and route-scoped.
- No data-derivation refactor of the homepage hero (most hatch records have empty
  `photos`, so deriving the hero would render placeholder-heavy). The hardcoded array
  is edited, not replaced.
- No edits to the dirty WIP `content/flock-profiles.json` or any private workspace
  file in the tree.

## Architecture

- **Photos** → `public/photos/birds/` following the recent convention
  `IMG_<n>-<descriptor>-<DDmmmYYYY>.jpg`:
  - `IMG_5089-birdimir-hatch-02jun2026.jpg`
  - `IMG_6233-birdimir-juvenile-22jun2026.jpg`
- **Record** → real paths + captions in `photos[]`; a new `phenotype_observations`
  entry dated 2026-06-22 (age_days 20). `current_location` stays `brooder` (not
  flipped on a photo's say-so).
- **Component** → `app/components/hatches/ThenAndNow.tsx`, purely presentational
  (typed props), calm-farm palette. The `/hatches` page selects Birdimir's record by
  id, derives then/now from the record itself (first photo = hatch day; last photo =
  most recent; dates/age from `hatch_date` + latest observation), strips the
  `public/` prefix exactly as `HatchCard` does, and passes plain props in. The block
  self-suppresses unless the record has two committed photos.
- **Homepage hero** → `Chick.ageDays` (hardcoded, ~5 weeks stale) replaced by
  `hatchISO` + live `getBirdAgeLabel` (the age SSoT from CHANGELOG 1.18.0). Birdimir
  added newest-first with the juvenile photo. Tile count derived (de-duped by name),
  never a literal.

## Reused, not rebuilt

- `getBirdAgeLabel` (lib/content.ts) — live age, day-13 triskaidekaphobia guard.
- `HatchRecord` / `getHatchRecords` types + loader.
- The `/${path.replace(/^public\//,"")}` image-path strip from `HatchCard`.
- guardian/cream design tokens.

## TODOs

1. Copy photos (cp, originals untouched). ✓
2. Update `2026-06-02-01-birdimir.md` (photos + append observation). ✓
3. Build `ThenAndNow.tsx`; wire into `/hatches` above the records grid. ✓
4. Freshen homepage hero (live ages + Birdimir). ✓
5. Plan doc + CHANGELOG `[1.21.0]`. ✓
6. `npm run build` must pass. → verify before ship.
7. Stage only the explicit paths (never `git add -A`); commit; push to deploy.

## Docs / changelog touchpoints

- `CHANGELOG.md` → new `[1.21.0]` (minor: new surface + content).
- This plan doc.
