# /flock as the breeding-program memory surface — 11 May 2026

## Scope

In: `app/flock/page.tsx` rewrite to match the framing in:
- `docs/11-May-2026-hermes-breeding-showcase-notes.md` ("flock roster = breeding-program database")
- `docs/09-May-2026-bubba-on-the-farm.md` §13 ("the website is a farm memory surface") and §27 ("the flock page should show why memory matters")
- `docs/09-May-2026-openclaw-farm-ops-story-design-brief.md` §9 ("highlight hatch days, egg timelines, flock roster updates, breed-identification notes"), §10.2 (warm farm surfaces for narrative, darker instrument-panel surfaces for pipeline/data), §17.4 (flock loop: hatches and roster updates as durable memory), §19 ("treat flock profiles as memory made visible")
- `docs/10-May-2026-homepage-rewrite.md` §105 ("/flock may want the same dark guardian palette for visual coherence")

Out: structured lineage fields in `content/flock-profiles.json` (Hermes doc lists this as future scope). The page surfaces lineage from existing prose notes + a small lineage map declared in `page.tsx`, not from new JSON schema.

## What changes

### Hero
- Terminal-style instrument strip at the top of the hero — `[ROSTER]` tag, last-updated stamp, individual-bird counts (no 13).
- Title kept in serif.
- Subtitle rewritten in field-station prose, not marketing. Names the function ("hatch dates, names, lineage, losses").

### Name lineage panel (new)
- Dark guardian-card section directly under the hero.
- Renders the single named chain that exists today: **Birdgit → Birdadette → Birdadonna → Birdadotta**, with Birdgit's loss date, the EE hen 1 / Little Big Red Junior pair feeding Birdadonna, and the incubator step.
- This is the headline breeding-program story (per bubba §27 "biology has dates" and the openclaw brief's §9 "highlight hatch days").
- Lineage data is declared locally in `page.tsx` as a typed constant — small, no JSON schema change.

### Bird cards
- Top: photo (existing) or "Photo coming" placeholder (existing).
- New dark instrument strip across the bottom edge of the photo area: mono font, terminal palette, fields like `HATCH 2026-04-25 · AGE 16d · LINE Birdadonna→` when applicable. Renders only the fields a bird actually has.
- Card body: name (serif), breed (wood), age + egg-color badges (existing), color description, first sentence of notes (existing), breed fun-fact (existing).
- Lineage line is rendered when the bird is in the named chain or has a documented dam/sire.

### Sections
Order unchanged (Brooder & Nestbox → Growing Out → Hens → Breed Notes → In Memoriam). Section intros rewritten in field-station voice — no "discovering what a worm is", no marketing — focused on hatch-date facts and what each cohort is doing right now.

### Voice
Per openclaw brief §10.3 + §19: plain-spoken, specific, named nouns (S7, brooder, Cackle order, incubator). No SaaS, no hype verbs, no "unlocking" anything.

### Aesthetic
- Cream `bg-cream` body kept for the narrative sections (warm farm per §10.2).
- Dark guardian-card strips for data (the instrument-panel side per §10.2): `bg-guardian-card` background, `text-guardian-text`, mono font, dim borders.
- The lineage panel is a single dark guardian-card block — visible contrast that says "this is the record layer."

### What's NOT in scope this pass
- No structured `dam`/`sire`/`namesake_of` fields in `content/flock-profiles.json` (Hermes doc future scope).
- No edit-review queue or proposed-record-change workflow (Hermes doc future scope).
- No new field-note files. Existing notes still drive the prose.
- No header/nav changes — TerminalNav stays as-is.

## TODOs

1. Write `app/flock/page.tsx` rewrite per the above.
2. Run `npm run build` (per `feedback_rebuild_after_edits.md` memory).
3. Verify with `preview_start` + DOM eval that:
   - No "13" anywhere in rendered text.
   - All h2/h3 readable.
   - Hero photo fills, no sideband regression.
   - Lineage chain renders end-to-end.
   - Hatch-date strip renders on every brooder/coop card that has a hatch_date.
4. Update CHANGELOG (1.16.6 entry).
5. Commit + push.

## Docs touchpoints

- `CHANGELOG.md` — v1.16.6 entry describing the breeding-memory reframe.
- This plan doc.
