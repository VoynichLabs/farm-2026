# Hermes Breeding Showcase Notes — 11 May 2026

## Purpose

This note captures the repo-backed showcase angle for presenting how Hermes-style agent orchestration can help with the Farm 2026 chicken breeding program.

The key constraint: this repository already contains strong flock, breed, camera, field-note, and image-archive foundations, but it does **not** currently show a first-class Hermes integration in the Farm 2026 app code. The defensible story is therefore:

> Farm 2026 provides the structured farm records and live visual evidence. Hermes can sit above those sources as the orchestration layer that routes evidence review, proposes record updates, drafts notes, and asks Mark for final judgment.

## Repo-backed evidence

### Flock and breed records

- `content/flock-profiles.json` is the authoritative bird and breed data source.
- `app/flock/page.tsx` renders the public flock roster from that data.
- The current model supports breed profiles, individual bird records, status, hatch dates, ages, egg color, temperament, notes, and deceased records.

Showcase use:

- Treat the flock roster as the breeding-program database.
- Have Hermes route proposed updates through a review workflow instead of silently editing production records.

### Agent-assisted chick identification precedent

- `content/field-notes/2026-04-12-larry-chick-id-estimate.md` records an agent-assisted breed and sex estimate.
- The estimate was revised when feathered legs changed the breed hypothesis from Delaware to Light Brahma.
- The note includes confidence levels and an explicit reminder that feather sexing is unreliable unless strain-specific.

Showcase use:

- Demonstrate that agents can help reason over visible traits while keeping uncertainty visible.
- Use this as the pattern for future chick-ID reviews: evidence, hypothesis, revision, confidence, and human confirmation.

### Cackle Hatchery identification workflow

- `docs/cackle-hatchery-breed-id.md` documents the Cackle Hatchery order, likely breed pools, individual chick candidates, and maturation traits to watch.
- Useful trait checks include feathered feet, head crest, five toes, comb shape, long tail feathers, posture, and plumage patterns.

Showcase use:

- Hermes can assign a breed-ID specialist agent to compare new brooder images against this checklist.
- The output should be a confidence-ranked candidate list, not a final declaration.

### Guardian visual evidence layer

- `content/projects/guardian/index.mdx` documents the Farm Guardian system: cameras, live dashboard, PTZ, Cloudflare tunnel, snapshot polling, detection plumbing, and known limitations.
- `app/components/guardian/GuardianDashboard.tsx` renders the live Guardian dashboard and polls status/camera data.
- `app/components/guardian/types.ts` defines the Guardian API response shapes.

Showcase use:

- Guardian supplies the observation layer for the breeding program.
- Hermes can request or review the latest relevant camera evidence before proposing breeding-record updates.

### Gems and image archive

- `app/gallery/gems/page.tsx` and `lib/gems.ts` expose the image archive and stats surfaces.
- `GemRow` metadata includes camera, timestamp, scene, bird count, activity, lighting, composition, image quality, visible individuals, special-chick flag, apparent age, draft caption, and share reason.
- `app/components/home/FarmPulse.tsx` turns Guardian image stats into public farm-story data such as Birdadette sightings, top activity, busiest camera, and gems saved.

Showcase use:

- The gems archive becomes a visual development record for chicks and the broader flock.
- Hermes can use image metadata to find candidate frames for growth milestones, field notes, or review packets.

## Claims to avoid

Avoid claiming any of the following unless backed by newer repo or runtime evidence:

- That Hermes is already integrated directly into the Farm 2026 Next.js app.
- That VLM scoring is currently a medical or health/vigor diagnosis system.
- That pedigree or genealogy tracking already exists as a structured data model.
- That Larry is officially a Farm Guardian watchdog node.
- That Guardian fully autonomously recovers all failures; the Guardian project docs explicitly describe some remaining reliability gaps.

## Recommended showcase story

### One-line pitch

Farm 2026 already has the records and the eyes. Hermes adds coordination: it turns live camera evidence, flock data, and breed-ID notes into reviewable breeding-program decisions.

### Demo flow

1. Open `/flock` and show the current data-backed flock and breed records.
2. Open the Guardian dashboard or gems gallery and show live/recent visual evidence.
3. Ask Hermes: “Review the current brooder cohort and propose the next breeding-record update.”
4. Hermes routes the work:
   - Breed-ID agent checks visible traits against `docs/cackle-hatchery-breed-id.md`.
   - Records agent proposes changes to `content/flock-profiles.json`.
   - Writing agent drafts a field note summarizing the update.
   - Verifier checks that every claim is supported by repo files or Guardian data.
5. Mark receives a review packet:
   - proposed roster changes,
   - confidence levels,
   - evidence paths or image references,
   - public-facing field-note draft,
   - explicit “needs human confirmation” items.

## Future feature ideas

These are natural next steps, but should be presented as future scope unless implemented:

- Add structured pairing and lineage fields to `content/flock-profiles.json`.
- Add hatch clutch records: eggs set, eggs hatched, survival counts, source pair, incubator notes.
- Add growth milestone logging per chick or batch.
- Add a review queue for proposed flock-record edits.
- Add a `breeding-program` project page that explains the human-in-the-loop workflow.
- Add Guardian-derived “candidate milestone frames” for each chick or cohort.

## Final framing

The honest version is stronger than the inflated one:

> Hermes does not magically run the farm. It coordinates the boring evidence work: collect the relevant frames, compare traits against documented breed clues, propose careful data updates, draft the public story, and leave the final husbandry decision with Mark.
