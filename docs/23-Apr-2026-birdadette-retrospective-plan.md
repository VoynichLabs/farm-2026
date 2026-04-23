# /flock/birdadette — day-by-day retrospective (23-Apr-2026)

## Scope

**In:**
- New route `/flock/birdadette` — a day-by-day retrospective of Birdadette from pipeline-tagged strong-tier gems (`individual=birdadette`). Server-rendered. Reads the live Guardian archive; rebuilds every 5 min via the `lib/gems.ts` revalidate window.
- Link from `/flock` to the retrospective, placed directly under the page hero (above the active-hens roster) so a visitor lands there before they even scroll.
- `lib/birdadette.ts` — hatch-date constant, fetcher, day-of-life grouper.

**Out:**
- Merging hand-curated photos (`content/gallery.json`, field-note covers) into the retrospective timeline. This is strong-tier pipeline frames only. Hand-curated day-0 content remains visible on `/gallery` and on the relevant field notes. A future pass can merge them if Boss wants.
- Per-bird pages for other flock members. Birdadette has enough tagged frames (18 strong-tier as of today) to be worth a dedicated page; other named birds don't yet.
- Decent-tier fallback for empty days. Strong-tier only to keep the bar high; empty days simply don't appear.
- Day-0 / hatch content from the pipeline. The VLM only started reliably tagging Birdadette by name around day 8 of her life. Days 0-7 will appear as a single "before the pipeline knew her" note at the bottom of the timeline (with a link to the hatch field note).
- Backend changes. Everything needed already exists.

## Why

Memory has a standing item: `project_birdadette_retrospective_curation.md` — Boss asked to curate a weekly retrospective toward end-of-year. The pipeline has been tagging her with `individuals_visible=["birdadette"]` for a couple weeks; 18 strong frames already span a 7-day window. The content is accumulating whether we surface it or not, and the longer we wait the more manual the curation gets. Shipping a read-only view now means every future frame lands on a visible page automatically.

## Architecture

### Hatch date

Single source of truth: `content/flock-profiles.json` already has `hatch_date: "2026-04-06"` on Birdadette's entry. `lib/birdadette.ts` exports a `BIRDADETTE_HATCH_DATE` constant that mirrors it. (Cheap duplication — the JSON is loaded through MDX/content loaders that don't fit a thin `lib/` helper. If this constant ever diverges, the file header notes to re-sync from `flock-profiles.json`.)

### Fetcher

`lib/birdadette.ts` → `fetchBirdadetteRetrospective()`:
- Pages through `/api/v1/images/gems?individual=birdadette&limit=100` via cursor until the response is exhausted. Volume is bounded: ~2-3 strong gems/day × ~180 days/year ≈ <700 rows over the entire chick's life. First call already returns all 18 rows in one shot.
- Returns `{ days: Array<{ dayOfLife, dateISO, rows }>, total }`, days sorted descending (newest first).
- Day-of-life is computed from `ts` vs the hatch-date constant (`floor((ts - hatch) / 86400_000)`), not from the VLM's `apparent_age_days` (which is per-frame and can underestimate by several days — confirmed: VLM guessed 8 for a day-14 frame).

### Page layout

`app/flock/birdadette/page.tsx` — server component.

1. Forest-bg hero (~45vh): name, hatched-on date, "Day N today," breed, and a one-paragraph intro pulled from Birdadette's `flock-profiles.json` entry. No hero photo — the retrospective frames are the content.
2. Cream body, centered max-w-3xl column.
3. For each day in the grouped result (newest first):
   - Day heading: `Day {N} · {DD-Mon-YYYY}`, forest-mono label.
   - Primary frame: first row (most recent of that day), rendered with `object-contain` + `max-h-[70vh]`, native aspect preserved.
   - Caption: the VLM's `caption_draft` in serif, affordance that it's a draft (same pattern as `GemCaption`, but inlined here to keep the page self-contained).
   - Meta line: mono, `{camera} · {activity} · {N} birds in frame`.
   - If more than one frame for the day, a 2-column supplementary row below the primary (`max-h-[40vh]` each, `object-contain`, no captions — secondary shots).
4. Footer: link back to `/flock`, and a quieter link to `/gallery/gems?individual=birdadette` for the unfiltered archive view.
5. Empty state (0 days): "The pipeline hasn't tagged Birdadette in a strong frame yet — check back in a day or two."
6. Error state: same pattern as `GemsGalleryClient` — a small error card, not a crash.

### Linking from /flock

`app/flock/page.tsx` gets a single new card directly under the hero and above the active-hens section:

```
A small forest-bordered card on cream:
  "Birdadette: day by day →"
  "The pipeline's strong-tier frames, grouped by day of life."
```

Links to `/flock/birdadette`. Nothing else on `/flock` moves.

### Reuse vs. new

`GemCard` is rail/gallery-shaped (square-ish thumbnail with meta below). Retrospective cards are narrative-shaped (large feature image + long caption). Not a reuse fit — inline a small day-section component in the page itself. Per the frontend architecture doc's "third duplicate" threshold, extracting is premature until a second retrospective page exists (e.g., `/flock/pawel` — N/A, different species; or `/flock/henrietta` — would need her own individual tag first).

## Ordered TODOs

1. Write this plan doc. ✓
2. Add `lib/birdadette.ts`.
3. Add `app/flock/birdadette/page.tsx`.
4. Add the retrospective card to `app/flock/page.tsx`.
5. `npm run lint` + `npm run build`.
6. Local smoke: `/flock/birdadette` renders the 18 known strong frames across 7 distinct days (04-14 through 04-20), newest first. `/flock` shows the link card.
7. Update `CHANGELOG.md` — `[1.10.0] — 2026-04-23`.
8. Commit + push.

## Verification

- With Guardian reachable: the page renders 7 day sections (Day 8 through Day 14), each with at least one frame, captions, and meta lines. Day 14 (20-Apr-2026) has 2 supplementary frames below the primary.
- With Guardian unreachable (stop tunnel): empty state renders cleanly; no crash.
- Breadcrumb / back-link: `/flock/birdadette → /flock` works.
- Link card on `/flock` is visible without scrolling on desktop + reachable on mobile.

## Future follow-ups (explicitly not this pass)

- Merge hand-curated day-0..day-7 hatch photos into the timeline.
- Add decent-tier fallback so every day has something.
- Build the same surface for other named birds once the VLM tags them individually.
- Auto-generate a weekly summary post (field note) from each 7-day window.
