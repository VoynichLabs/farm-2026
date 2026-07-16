# 16-Jul-2026 — Daylight Retheme Plan ("Field Guide")

Author: Claude Opus 4.8 (Bubba)
Status: **approved by Boss 16-Jul-2026** (proposal artifact reviewed; "the plan is approved, go ahead and implement it"). Commit + push authorized. No preview verification requested — Boss reviews live.

## Scope

**IN:** Sitewide light "Field Guide" theme replacing the dark terminal theme everywhere except `/markets`. New `--color-field-*` token family; `.terminal-prose` values flipped to light (class name kept — it styles every MDX body; renaming risks a silently unstyled page); nav rebuilt light with a dark variant on `/markets`; emoji accent vocabulary in `lib/emoji.ts`; Guardian camera surfaces stay **dark islands** (assumption: Boss approved the proposal containing this recommendation — flagged in the final report so he can flip it); docs/CHANGELOG/version bump.

**OUT:** `/markets` page body (`Terminal.tsx` untouched — self-contained by construction); Guardian dashboard internals beyond confirming they keep their dark tokens; any content/copy changes (styling only — especially the flock memorial content, see Guardrails); pipeline directories (`public/photos/*`); anything in farm-guardian.

## Architecture

- **Two token families coexist in `app/globals.css` `@theme`:**
  - `--color-field-*` (new, light): paper `#f8f5ec`, card `#fdfbf4`, ink `#262b1e`, muted `#6c6551`, border `#d9d0b8`, hairline `#e2dac4`, wash `#f3efe1`, accent (moss) `#3e6b34`, accent-deep `#2c4f25`, accent-soft `#eef2e2`, accent-line `#a9bd93`, honey `#c98f1b`, honey-ink `#8f6511`.
  - `--color-guardian-*` (existing, dark): **unchanged** — retained by the dark-island components below and the historical gem-filter chips.
  - `body` flips to field bg/ink. Legacy `--color-cream/forest/wood/bark` tokens removed after the four cream-holdout gem components are converted (last remaining consumers).
  - `ppm-*` keyframes (lines 139–152) and `orn-fade` **preserved verbatim** — markets dies silently without them.
- **`.terminal-prose`**: same class name, values redefined to the light palette (ink body, moss links, wash code blocks). No call-site churn.
- **Nav**: `TerminalNav.tsx` → `SiteNav.tsx` (single import in `layout.tsx`). Light field-guide chrome (serif wordmark, mono identity strip, emoji page marks on links, moss clock); `usePathname()` renders the previous dark terminal variant on `/markets` only, so the CRT stays hermetically sealed.
- **Emoji SSoT**: new `lib/emoji.ts` — typed constants (PAGE_MARKS, STATUS, DAY_SLOTS, GARDEN, DIVIDER). Rules: one emoji per label, leading, `aria-hidden`, never in body prose, never on `/markets`. No raw emoji in JSX outside this module's consumers.
- **Dark islands (keep guardian tokens, no conversion):** `GuardianCameraFeed`, `GuardianCameraStage`, `GuardianPTZPanel`, `GuardianDashboard`, `GuardianStatusBar`, `GuardianDetections`, `GuardianInfoPanels`, `GuardianHomeBadge`, `HomeCameraStage`, `components/markets/Terminal.tsx`.
- **Everything else converts** guardian-*/emerald/amber/white classes → field tokens per the mapping table (kept in this doc's appendix within the conversion-agent prompts; canonical mapping lives in globals.css token comments).

## Guardrails

1. **Styling only.** No content text changes anywhere. The flock page's memorial/founders content is **visually de-emphasized only** (quieter color, smaller presence) — zero new or rewritten loss copy, nothing deleted. Report exactly what changed there.
2. **Content rules survive:** no rendered bird counts, no literal 13 in the DOM, hardware-only camera labels.
3. `npm run lint` + `npm run build` must pass before push (deploy safety, not testing).
4. `git pull --rebase` before push (async pipeline commits land on main continuously).
5. File headers updated on every touched TS/TSX file.

## TODOs (ordered)

1. ✅ Plan doc (this file)
2. `app/globals.css` — field tokens, body flip, `.terminal-prose` light values, preserve ppm-*/orn-fade/guardian-*
3. `lib/emoji.ts`
4. `SiteNav.tsx` (+ `layout.tsx` import, delete `TerminalNav.tsx`)
5. Exemplar conversion by hand: `app/field-notes/page.tsx` + `[slug]/page.tsx`
6. Parallel mechanical conversions (agents, exhaustive mapping table, no improvised colors):
   a. `flock/page.tsx` + `OrnitharchPortrait`, `GrowthStrip`, `FlockGemStrip`
   b. `hatches/page.tsx` + `ThenAndNow`; `projects/page.tsx` + `projects/[slug]/page.tsx`
   c. gems components (incl. the four cream holdouts) + `gallery/gems/page.tsx` + `yard/page.tsx` (+ ☀️🌤️🌙 slots)
   d. `app/page.tsx` + `SystemBanner`, `RecentGemsRail`
7. `markets/page.tsx` — stale header comment fix only
8. Docs touchpoints: CHANGELOG v1.31.0, FRONTEND-ARCHITECTURE theme rule rewrite, CLAUDE.md design-tokens section, package.json 1.31.0
9. Lint + build, fix, pull --rebase, commit, push

## Docs/Changelog touchpoints

- `CHANGELOG.md` v1.31.0 — what/why/how, author model
- `docs/FRONTEND-ARCHITECTURE.md` — "one dark theme" rule replaced with field-guide + dark-islands + markets-exemption rules
- `CLAUDE.md` — design-tokens section updated
