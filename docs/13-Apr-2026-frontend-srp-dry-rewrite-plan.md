# Frontend SRP/DRY Rewrite + De-Fluff — Plan

**Date:** 13-April-2026
**Author:** Claude Opus 4.6
**Repo:** farm-2026
**Related:** `docs/13-Apr-2026-mba-cam-and-camera-audit-plan.md` (the trigger — adding one camera touched four files; that's the smell this plan addresses.)

## Context

Adding `mba-cam` to the frontend required edits to `lib/cameras.ts`, `content/projects/guardian/index.mdx`, `app/page.tsx`, `app/components/guardian/GuardianHomeBadge.tsx`, and `CHANGELOG.md`. Four of those edits were the same literal change — bump a hardcoded "4 cameras" string to "5 cameras." The camera registry in `lib/cameras.ts` is the single source of truth, but the homepage, the badge component, and the MDX all restate the count in hand-written prose. That's the DRY failure.

The camera count is one instance of a broader pattern across the site:

- `app/page.tsx` hardcodes **eight birds** inline (lines 288–297) while `content/flock-profiles.json` is the SSoT for the flock.
- `app/page.tsx` line 138 hardcodes backend version `v2.15` — farm-guardian is on `v2.22.1`.
- `app/page.tsx` line 161 hardcodes a `~10s` refresh — backend polls cameras every 5 s (2 s at night); frontend fetches `/frame` at ~1.2 s.
- `app/page.tsx` line 389 has `© {year} Mark Barney` in the footer — Boss's memory rule is explicit: never put his name in public files.
- `app/flock/page.tsx` line 8 hardcodes "22 reinforcements in the brooder" in metadata; actual count lives in `flock-profiles.json` (and drifts — current is ~19).
- `content/projects/guardian/index.mdx` claims "every line built by Claude" — editorializing Boss has asked to stop.
- `app/page.tsx` is **394 lines of inline layout** — hero, Guardian section with its own system panel, latest field note, flock preview, projects, Instagram, footer — all in one file. Four near-identical "section header" blocks (title + subtitle + trailing link) are duplicated across sections.

The frontend has been built piecemeal, vibe-coded off a SaaS-template mental model. Every new piece of reality — a camera, a bird — requires prose edits in multiple places that drift from reality in between.

## Goal

**The data is the source. Prose references it, never duplicates it. Pages compose from small, single-responsibility sections. No marketing template.**

Future developers — AI or human — should be able to add a camera or a bird by editing one data file and having the site catch up, without a grep-and-replace sweep across layout files.

## Principles (the future-dev contract)

1. **SSoT:** every fact appears in exactly one data file. Cameras → `lib/cameras.ts`. Birds → `content/flock-profiles.json`. Field notes → `content/field-notes/*.mdx`. Projects → `content/projects/*/index.mdx`.
2. **No hardcoded counts in layout prose.** "5 cameras" is `{CAMERAS.length}`, inline, at the point of use. Numbers don't need a named constant; they need to be derived.
3. **Don't re-export data that's already importable.** A `lib/site.ts` that just re-exports `CAMERAS.length` adds an indirection, not a layer. Import `CAMERAS` directly.
4. **Don't hand-maintain backend truths on the frontend.** If the Guardian version matters to the page, fetch it from `/api/status` (already polled). If it doesn't matter, don't display it. Stale stat-bar values like `v2.15` are symptoms of hand-maintenance; the fix is to stop hand-maintaining, not to move the constant to a new file.
5. **One component = one responsibility.** Homepage becomes a composition, not a 400-line layout.
6. **Extract primitives only when a pattern repeats.** Four copies of a section-header block? Extract. A card used once? Don't. Premature extraction is indirection.
7. **No editorializing in public copy.** No "built by Claude" self-promotion. No attributing quotes to real people. No Boss's name in public files.

## Scope

**In**
- Split `app/page.tsx` (394 lines) into one component per section under `app/components/home/`.
- Extract `SectionHeader` primitive (genuinely duplicated 4×) and `BirdCard` primitive (used in the flock strip and on the flock page).
- Replace the inline 8-bird array with `getFlockProfiles()`-driven `FlockPreviewStrip`.
- Replace hardcoded "5 cameras" strings with `${CAMERAS.length}` inline where they appear.
- Delete stale/hand-maintained backend stats (`v2.15`, `~10s`, `M4 Pro 64GB` duplicated) — don't relocate them. If a stat matters, fetch it from `/api/status`; otherwise cut it.
- Remove `Mark Barney` from the footer (`app/page.tsx:389`). Memory rule.
- Remove "every line built by Claude" / "Built by Claude" self-promo phrasing from `app/page.tsx` and `content/projects/guardian/index.mdx`. Memory rule.
- Fix `app/flock/page.tsx:8` metadata — drop or derive the "22 reinforcements" count.
- Delete unused `getEggColorClass` in `app/flock/page.tsx:22-24` (ESLint has been flagging it).
- Write `docs/FRONTEND-ARCHITECTURE.md` — the future-dev contract, short and practical.

**Out**
- Visual redesign. This is a structure pass, not a CSS pass. Rendered output should be near-identical except for intentional fluff deletions.
- Guardian MDX content gut. Visitors who click into `/projects/guardian` want to understand the system — keep "How It Watches" and "The Eyes" table. Trim only the "Built by Claude" self-promo, stale version claims, and any copy that's measurably wrong (e.g. "Four cameras, a Mac Mini…" is already handled by the mba-cam sweep). The MDX roster table is documentation that updates quarterly; hand-written is fine. No MDX component for the table.
- A `lib/copy.ts` editorial-strings module — each tagline is used exactly once on this site; moving single-use strings to a constants file is indirection, not DRY.
- A `lib/site.ts` derived-values module — `CAMERAS.length` works inline; backend version/hardware should come from `/api/status` or be dropped. Creating a file just to re-export them adds a layer without solving the drift problem.
- Primitives beyond `SectionHeader` and `BirdCard`. `Card`, `StatusBadge`, `FieldNoteCard`, `ProjectCard` would each be used once — YAGNI.
- Changes to Guardian API shape or `lib/cameras.ts` schema.
- `/gallery`, `/field-notes/[slug]` body layouts.
- i18n, CMS migration, framework swap.

## Current-state audit (evidence)

| Symptom | File:line | What to do |
|---|---|---|
| Camera count hardcoded | `app/page.tsx:189`, `app/components/guardian/GuardianHomeBadge.tsx:75` | `{CAMERAS.length}` inline |
| Inline 8-bird array | `app/page.tsx:288-297` | Drive from `flock-profiles.json` |
| Hardcoded backend version `v2.15` | `app/page.tsx:138` | Fetch from `/api/status` if useful; otherwise cut |
| Hardcoded `~10s` refresh | `app/page.tsx:161` | Cut — it's rarely right and never interesting to readers |
| Hardcoded hardware `M4 Pro 64GB` ×2 | `app/page.tsx:169, 189` | Cut the duplicate; keep one plain string |
| Boss's name in footer | `app/page.tsx:389` | Remove |
| "Every line built by Claude" editorializing | `app/page.tsx:380`, `content/projects/guardian/index.mdx:60-68` | Remove/soften |
| Flock description with count | `app/flock/page.tsx:8` | Derive or remove count |
| Unused `getEggColorClass` | `app/flock/page.tsx:22` | Delete |
| 394-line homepage | `app/page.tsx` (whole file) | Split into `app/components/home/*` |
| 4 identical section-header blocks | `app/page.tsx:206-213, 274-285, 326-336, 366-370` | Extract `SectionHeader` primitive |

## Target architecture

```
lib/
  cameras.ts        SSoT — unchanged
  content.ts        loaders — unchanged

app/components/
  primitives/       NEW
    SectionHeader.tsx       — title + subtitle + trailing link; de-dupes 4 copies
    BirdCard.tsx            — photo + name + breed + optional age badge; used in home strip + flock page
  home/             NEW
    Hero.tsx                — the Birdadette hero
    GuardianHomeSection.tsx — badge + stage + data-driven system panel (maps over CAMERAS)
    LatestFieldNote.tsx     — featured + 2 recent
    FlockPreviewStrip.tsx   — reads flock-profiles.json via getFlockProfiles()
    ActiveProjects.tsx      — maps over getProjects()
    InstagramSection.tsx    — wraps InstagramFeed
    SiteFooter.tsx          — links + © year (no name)

app/
  page.tsx          — thin composition, ~50 lines
  flock/page.tsx    — uses BirdCard; derived/neutral metadata description
  projects/page.tsx — unchanged (only one project list; primitive isn't earned)
```

## Phases (each phase = one commit + push — parallel-dev-safe)

**Phase 0 — Plan doc only (clean commit)**
- This doc committed as the spec of record. No code changes in the same commit. Other dev pulling should see only a new doc.

**Phase 1 — Split `page.tsx` into `app/components/home/*`**
- Cut-paste each section into its own file. No prose edits, no data-source changes, no primitive extraction. Goal is pure SRP: seven ~60-line files instead of one 394-line file.
- `page.tsx` becomes a composition (~50 lines).
- Build + dev-server visual diff should be near-zero (only change: file layout).

**Phase 2 — Extract `SectionHeader` + `BirdCard` primitives**
- `SectionHeader`: title + subtitle + optional trailing link. Used in `LatestFieldNote`, `FlockPreviewStrip`, `ActiveProjects`, `InstagramSection`.
- `BirdCard`: photo + name + breed + optional age badge. Used in `FlockPreviewStrip` and later on `/flock`.
- Replace the four duplicated headers + inline bird tiles in place. Still no data-source change yet — `FlockPreviewStrip` still has the 8-bird inline array, just passed through `BirdCard`.

**Phase 3 — Data-driven flock + inline camera-count derivation**
- `FlockPreviewStrip` imports `getFlockProfiles()`, picks the set to feature (prefer birds with hatch dates for age labels; fall back to `status === "active"`). Delete the 8-item inline array.
- Replace `"5 cameras · M4 Pro 64GB"` in `GuardianHomeSection` with `{CAMERAS.length} cameras · M4 Pro 64GB`.
- Replace `"5 cameras · snapshot polling"` in `GuardianHomeBadge.tsx:75` with `{CAMERAS.length} cameras · snapshot polling`.

**Phase 4 — De-fluff**
- Remove `Mark Barney` from `app/page.tsx` footer (migrating to `SiteFooter.tsx`).
- Remove `Hampton, CT — every line built by Claude` footer tagline; replace with `Hampton, CT`.
- Remove the "Built by Claude" / "every line written by Claude" paragraph from `content/projects/guardian/index.mdx` (the `## Built by Claude` section at the bottom).
- Delete the hardcoded `v2.15` tag in the system panel (it's been stale for a week and doesn't add value; better to show nothing than a wrong number). If version-on-dashboard matters, fetch from `/api/status` — but first check the payload shape; if it's not there, just drop the display.
- Delete one of the duplicated `M4 Pro 64GB` strings (line 169 stays as the system-panel hardware line; line 189 bottom-bar duplicate goes).
- Delete the stale `Refresh: ~10s via Cloudflare tunnel` line.
- Fix `app/flock/page.tsx:8` metadata: drop the count. Neutral description stands.
- Delete unused `getEggColorClass` at `app/flock/page.tsx:22-24`.
- Run `rg -ni 'mark barney|built by claude|every line' app/ content/` and confirm zero matches in public-facing files.

**Phase 5 — Architecture doc + CHANGELOG + final verify**
- Write `docs/FRONTEND-ARCHITECTURE.md`: short, practical, aimed at the next dev (AI or human):
  - Where data lives (SSoT table)
  - How to add a camera / bird / field-note / project
  - The "no hardcoded counts in prose" rule with before/after examples
  - The primitive extraction rule (extract on the third duplicate, not the second)
- Update `CLAUDE.md`: pointer to the architecture doc in the Architecture section; fix the stale "4 camera feeds" bullet under `/projects/guardian`.
- `CHANGELOG.md`: `[1.6.0]` entry summarizing the rewrite.
- Verify: `npm run lint` passes; `npm run build` passes; dev-server smoke test confirms no visual regression beyond intentional deletions.

## Parallel-dev coordination

Boss said another dev is working on other stuff. Each phase is an independent commit + `git push`. Before each phase, `git pull --ff-only`. If a conflict appears in a file the other dev is editing, stop and reconcile.

Files most likely to see concurrent edits: `content/field-notes/*.mdx` (author space), `content/flock-profiles.json` (roster updates). The rewrite mostly touches layout files, so conflicts should be rare.

## Risk + tradeoffs

- **Visual regression in Phase 1** — the biggest diff is pure cut-paste, no semantic change. Dev-server walkthrough before pushing. Rollback is `git revert`.
- **`/api/status` version fetch (Phase 4)** — only do this if the payload already exposes version. If it doesn't, don't add a backend change for a one-line dashboard frippery; just delete the display.
- **Boss's-name audit completeness** — Phase 4 grep pass catches any occurrences I missed in Phase 0 planning.

## Verification

```bash
cd ~/Documents/GitHub/farm-2026
npm run lint    # pass
npm run build   # pass
npm run dev     # smoke test
```

Final acceptance pass against the dev server:
1. `/` — hero, guardian section, latest note, flock strip, projects, instagram, footer all render. Footer has no name. No "built by Claude" tagline.
2. `/` — system panel lists all cameras from `lib/cameras.ts`. Temporarily adding a sixth camera in dev should make it appear without any other file edit.
3. `/projects/guardian` — MDX still has "How It Watches" and "The Eyes". No "Built by Claude" section. No stale version claims.
4. `/flock` — page renders; metadata has no hardcoded count; no dead functions.
5. `/field-notes` — unchanged (out of scope).
6. `rg -n '\b[0-9]+\s+(camera|bird|chick|breed)' app/` — zero matches in layout files.
7. `rg -ni 'mark barney|built by claude|every line' app/ content/projects/` — zero matches.

## Docs/Changelog touchpoints

- `CHANGELOG.md` — one `[1.6.0]` entry at the end (Phase 5). Per-phase detail stays in per-phase commit messages, not CHANGELOG noise.
- `docs/FRONTEND-ARCHITECTURE.md` — created in Phase 5.
- `CLAUDE.md` — Phase 5: pointer to the architecture doc; fix the "4 camera feeds" bullet.
- `docs/13-Apr-2026-mba-cam-frontend-integration-plan.md` + `docs/13-Apr-2026-mba-cam-and-camera-audit-plan.md` — leave in place as historical. This plan supersedes their *approach*, not their outputs (the mba-cam addition is already merged).
