# Front page film strip — plan (18-Nov-2026)

Author: Claude Haiku 5.5 Medium
Date: 18-Nov-2026
PURPOSE: Record of the plan for the rebuilt homepage. The Boss approved the design mock (a dense dark strip page, one row per Ornitharch, hatch to newest picture) and asked for it built in code.

## Scope
- In: homepage (app/page.tsx) replaced by a strip layout; a new strip component; a new data module that derives the strip from the flock roster; two optional type fields added to the roster type (sex, leg band history); changelog entry.
- Out: the flock roster content beyond the sex fields already written; the camera components (kept as they are); the /flock, /ornitharch and /hatches pages (unchanged); the SystemBanner, RecentGemsRail and GardenStrip components (kept in the repo, no longer on the homepage).

## Architecture
- lib/ornitharch-strip.ts: PICKS (editorial, one picture file per day per bird), GROUP_PICTURES (the four shared frames), buildStrips() derives dates, day counts, band text, breed text and counts from content/flock-profiles.json via getFlockProfiles(). Missing files and second same-day frames are reported at build time and skipped.
- app/components/home/OrnitharchStrip.tsx: server component, layout only.
- app/page.tsx: composition. Keeps the live camera section (GuardianHomeBadge + HomeCameraStage) and the footer. The site-wide SiteNav in layout.tsx provides navigation, so the page adds none.
- lib/content.ts: FlockBird gains optional sex and leg_band_history fields (types only; no behaviour change).

## TODOs
1. Write the data module and strip component. [done]
2. Rebuild the homepage around them. [done]
3. Type-check, lint and production build. [done: no errors; no picture warnings]
4. Check the rendered page at desktop and phone width (no sideways scroll; images load). [done]
5. Changelog entry, minor bump (new page structure, new data source). [done, 1.46.0]
6. Commit the changes that belong to this work.

## Docs and changelog touchpoints
- CHANGELOG.md: new top entry 1.46.0 with the reason for a minor bump.
- docs/FRONTEND-ARCHITECTURE.md mentions the old homepage; not updated in this pass (flagged for follow-up).

## Known open items
- Henridot's 12-Nov frame is left out of his strip: its filename says rust-black, which does not fit a barred bird. Needs the Boss's look before it is added.
- The camera tiles in the approved mock were placeholders; the built page uses the live camera components instead.
