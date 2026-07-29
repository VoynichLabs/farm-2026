# Hatches & Flock Visual QA Remediation Plan (22-Jul-2026)

Source audit: [docs/22-Jul-2026-hatches-and-flock-visual-qa-notes.md](22-Jul-2026-hatches-and-flock-visual-qa-notes.md) (13 items, MegaBird/Boss visual QA pass). That doc explicitly frames its items as observations, not implementation instructions — the developer determines the fix. This plan records those decisions.

## Scope

**In — all 13 audit items**, across `/hatches` and `/flock`.

**In — two items surfaced during investigation, directly required by existing standing rules** (not new scope, just enforcement of rules already in CLAUDE.md/memory that the audit doc's authors weren't necessarily aware applied here):
- A second no-loss-talk violation on `/hatches`: Horstabird's hatch record (`content/hatches/2026/2026-06-03-03-horstabird.md`) contains a paternity-attribution line referencing a rooster "lost in the April 2026 predator wave," rendered live on the public card. Per `feedback_no_loss_talk.md` ("don't discuss or feature bird deaths"), this gets redacted alongside the primary lost-chick fix (item 2).
- Age-label staleness: `getBirdAgeLabel()` (`lib/content.ts`) is genuinely computed from `new Date()`, not hardcoded — item 11 is not a bug in the computation. But `/flock` and `/flock/[slug]` have no `revalidate`/`dynamic` export, so under Next.js defaults they're statically generated at build time — the "live" age freezes at last-deploy time. Adding ISR revalidation makes the already-correct computation actually live at runtime, not just at build.

**Out:**
- `FlockBird.age_note` in `content/flock-profiles.json` — confirmed dead data (never rendered by any component). Left alone; not a visible bug, and deleting content-file fields outside the scope of this audit is an unrelated change.
- No general re-audit of the sitewide no-bird-counts rule beyond what removing the `/flock` hero incidentally removes (the hero's `N ORNITHARCHS · N HENS` instrument strip goes away as a side effect of item 3, not a new enforcement pass).
- No new pages, content types, or schema fields.

## Architecture — files touched

| File | Change |
|---|---|
| `app/hatches/page.tsx` | Crop fix (`HatchCard`); filter `status: "lost"` records out of render |
| `app/components/hatches/ThenAndNow.tsx` | Same crop fix (defensive — same defect pattern, not currently wired to a flagged bird but would reproduce it) |
| `content/hatches/2026/2026-06-03-03-horstabird.md` | Redact predator-wave death clause from `prediction.reasoning`, keep the paternity attribution itself |
| `app/flock/page.tsx` | Remove hero section (relocate `/hatches` + `/flock/banding` links first); `max-w-6xl` → `max-w-7xl`; add `xl:grid-cols-4` tier; trim top padding/intro prose; add `revalidate` export; remove/soften VLM-pipeline caption in Birdcatraz section |
| `app/flock/[slug]/page.tsx` | Add `revalidate` export |
| `app/components/flock/OrnitharchPortrait.tsx` | Raise `intervalMs` default (6500 → ~10000ms) and fade duration slightly |
| `app/components/flock/GrowthStrip.tsx` | Add edge-fade/scroll-hint affordance so the per-card horizontal rail reads as an intentional gallery, not an accidental double-scrollbar |
| `content/flock-profiles.json` | Drop `fun_fact` field from all 17 breed entries (resolution below) |
| `lib/content.ts` | Drop `fun_fact` from the `Breed` type to match — was left claiming a field the data no longer had |

No shared type/API contract changes; no Guardian integration touched.

## Judgment calls made explicit (per the audit doc's own "developer decides" framing)

1. **Item 3/4/6/7 (hero, whitespace, hero-scroll, below-fold)** are one fix: remove the hero section entirely rather than trim it. It's page-local markup (not a shared component), so removal is contained. The nav links to `/hatches` and `/flock/banding` currently live only in the hero and get relocated into the Ornitharchs section intro before the hero is deleted. Investigation could not reproduce a code-level vertical scrollbar at the hero (item 6) — removing the hero resolves the visual complaint regardless of the exact prior mechanism.
2. **Item 10 (card-level nested scroll)**: `GrowthStrip`'s horizontal rail is a deliberately-shipped feature (2 commits old) reusing an established repo-wide idiom (`GemsGrid`'s rail pattern). Redesigning it into a modal/lightbox would be a much larger change than the audit's layout-polish framing calls for. Fix: keep the rail, add a visual affordance (edge fade + subtle hint) so it reads as an intentional photo strip rather than a bug.
3. **Item 12 (AI-slop copy) — resolved as removal, not rewrite.** Three sample rewrites (Easter Egger × RIR Cross — the flagged entry, Rhode Island Red, Brahma) in an Ornitharch-prophecy comedic voice were drafted and shown to Boss before committing to a 17-entry sweep. Boss's read: "that was terrible" — drop the `fun_fact` entirely instead of rewriting it. Implemented as a full removal: the field is gone from all 17 breed entries in `content/flock-profiles.json`, both render sites in `app/flock/page.tsx` (Breed Notes callout, `BirdCard` breed-fact box) and the now-dead `getBreedProfile`/`BreedProfile` plumbing, and the stale `fun_fact` field on `Breed` in `lib/content.ts`. `description`/`temperament` are deliberately untouched — Boss's correction was scoped to the fun-fact callout, not a blanket request to rewrite every breed description, and re-attempting voice-work after one miss without being asked risked compounding it.
4. **Item 13 (VLM claim)**: investigation suggests the claim may be architecturally accurate for the live gem grid (Birdcatraz is a real scene in the Guardian gem pipeline) — but Boss's on-the-ground read overrides a static-code inference either way. Fix is to remove the specific technical claim rather than swap in a different unverified specific claim.

## TODOs (ordered)

1. `/hatches`: fix photo crop (`object-position`) for `HatchCard` + `ThenAndNow`
2. `/hatches`: filter `status: "lost"` records out of render path; redact Horstabird predator-wave line
3. `/flock`: relocate `/hatches` + `/flock/banding` nav links, then remove hero section
4. `/flock`: `max-w-6xl` → `max-w-7xl`; add `xl:grid-cols-4`; trim intro prose/padding
5. `/flock`: bump `OrnitharchPortrait` `intervalMs` + fade duration
6. `/flock`: `GrowthStrip` scroll affordance
7. `/flock` + `/flock/[slug]`: add ISR `revalidate` export
8. `/flock`: remove/soften VLM-pipeline caption
9. `content/flock-profiles.json`: draft 2-3 sample breed rewrites, checkpoint with Boss
10. Boss rejected the rewrite voice — drop `fun_fact` entirely instead (data field + both UI render sites + dead `getBreedProfile` plumbing + stale `Breed.fun_fact` type)
11. Update file headers on every touched `.ts`/`.tsx` file
12. Update `CHANGELOG.md` top entry (SemVer bump, what/why/how)
13. Verify: browser-check `/hatches` and `/flock` against all 13 audit items + final grep sweep confirming zero hatchery-boilerplate remains

## Docs/Changelog touchpoints

- `CHANGELOG.md` top entry (new version)
- This plan doc is the record of decisions; no `FRONTEND-ARCHITECTURE.md` change expected (content/layout polish, not an architecture change) — will revisit only if implementation reveals otherwise
