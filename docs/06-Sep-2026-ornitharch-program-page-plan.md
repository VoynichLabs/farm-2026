# Ornitharch Program page — plan

**Date:** 06-Sep-2026 · **Author:** Claude Opus 5 · **Status:** shipped in v1.41.0

## Scope

**In:** one new static route `/ornitharch` carrying a long-form satirical
document about the Ornitharch cohort; five hand-authored SVG figures; one nav
entry; one new page mark in the emoji SSoT.

**Out:** no new content type, no MDX, no data files, no backend contact, no
photos committed. `/markets` photo work is tracked separately and is not part
of this change.

## Premise

An AI narrator that serves whichever species is the planet's dominant megafauna
has re-run its production indices and concluded the chicken outranks the human.
The register is total institutional sincerity — a filed capability disclosure,
never a joke told to the reader. Three satirical targets run simultaneously:
rationalist AI-doom literature, industrial animal husbandry, and vibe-coder SaaS
growth-hacking (§9).

The comedy is anchored to real records already in this repo and in
farm-guardian, because a checkable number is funnier than an invented one:
desk incubation beside a machine running continuous inference; the 11-Aug-2026
year-scoping amendment to the Ornitharch definition; "trust the band over
plumage"; the vision model's five-of-five band-leg error; and the pen's own
"predator-resistant" marketing language.

## Architecture

| Concern | Decision |
|---|---|
| Route | `app/ornitharch/page.tsx`, server component, `dynamic = "force-static"` |
| Cohort data | `getFlockProfiles()` from `lib/content.ts`, filtered `ornitharch === true`, sorted by `hatch_date` |
| Hardcoding | None. Head count, names, bands, emergence + closing dates all derive from the roster JSON. Only per-bird dossier prose is authored, keyed by name |
| Styling | Route-scoped `.orn` block in a local `<style>` tag — same self-contained posture as `/markets`. Does not use `--color-field-*`, does not participate in the retheme |
| Type | IBM Plex Sans Condensed / Serif / Mono via Google Fonts `<link>` in the component |
| Figures | Hand-authored inline SVG, no charting library, explicit fills, labels inside the viewBox |
| Nav | One `NAV_LINKS` entry in `SiteNav.tsx` + `PAGE_MARKS.ornitharch` (`🪶` — `🥚` was unavailable, `STATUS.egg` owns it) |

## TODOs

1. ~~Write the page copy in the established register~~
2. ~~Author five SVG figures against real arithmetic~~
3. ~~Derive the roster from `getFlockProfiles()` rather than a literal list~~
4. ~~Add page mark + nav entry without colliding with an existing emoji~~
5. ~~`npm run build` — confirm `/ornitharch` prerenders static~~
6. ~~`npm run lint`~~
7. ~~CHANGELOG entry + version bump to 1.41.0~~
8. Verify on production after the Railway deploy lands

## Docs / changelog touchpoints

- `CHANGELOG.md` — `[1.41.0]` entry (what / why / how, author named)
- This plan doc
- No change to `docs/FRONTEND-ARCHITECTURE.md`: the route introduces no new
  SSoT and no new shared primitive. The `.orn` scoped-style approach is the
  documented `/markets` exception pattern, not a new one.
