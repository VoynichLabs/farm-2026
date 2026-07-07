# 06-Jul-2026 — Terminal Glow-Up Plan (rev 3)

Author: Claude Fable 5
Status: awaiting approval
Rev 2: markets deprioritized per Boss; Ornitharch showcase is the centerpiece; gem filters get stripped to what the data supports.
Rev 3: the Ornitharch section is a **legacy story**, not just a portrait wall — all eleven descend from founders who are now gone.

Boss's asks (06-Jul-2026):
1. Site is unreadable post-v1.16.3 — fix readability, **keep the terminal-style dark colors**.
2. `/gallery/gems` is "full of junk" — it shows every strong-tier VLM frame, not just Discord-reacted ones. Also the filter bar is "kind of ridiculous" — and only the S7 feeds the gem pipeline now; other cameras make timelapse reels.
3. **Showcase the birds properly: the 11 Ornitharchs** (= every chick hatched on the farm this year), by cohort — and tell the real story: they hatched here, from hens who lived good lives here, and the whole founding generation behind them has passed on.
4. Birdadette → **Birddor** (turned out male); the "named after Birdgit" claim is false — correct it everywhere.
5. Markets page: don't worry about it this pass (explicitly deprioritized; earlier fake-ticker punch-up idea rejected — if it's ever revisited, direction is real market data with chickens commentating).

## The story the data supports (verified in hatch records + roster)

- **Little Big Red Junior** (lead rooster, †24-Apr-2026, predator attack) — sire (probable/confirmed) of the spring cohorts: Birddor, Birdadotta, Birdthazar, Henriella, Birdsilla — and of June's Horstabird, Boss-corrected 07-Jun by the rust coming in on her face, *after LBRJ was already gone*.
- **Whitey Red Legs** (LBRJ's own son, †01-May-2026, disappeared without trace) — paternity window for the June clutch: Birdimir, Ingebird, Henriessa, Henridotta, Adelbird.
- **Henrietta** (the flock's only brown-egg layer, †05-Jun-2026, natural causes, passed peacefully overnight) — dam of Henriella, Henriessa, Henridotta, all named for her. **Her last two chicks hatched two days before she died.**
- Every one of the eleven carries one of those three forward. Parentage, confidence hedges ("sire window", "probable"), and clutch ids are already structured frontmatter in `content/hatches/2026/*.md` — the story renders from data, not new prose claims.

## Facts established (audit + DB, 06-Jul-2026)

- 17 files still carry cream-era styling on the now-dark body; `@tailwindcss/typography` was never installed so every `prose` class is dead — MDX renders unstyled with light body text inheriting onto white cards.
- Reacted gems: 1,949 total (1,594 from s7-cam = 82%; rest are legacy one-offs). Unfiltered strong-tier: 10,333. Boss reaction lives in `image_archive.discord_reactions` (guardian.db).
- Filter-bar reality check ("does it even work?"): Activity + Range work. Camera chips are built from the *live* roster (`lib/cameras.ts`) queried against a mostly-single-camera archive — most chips return nearly nothing. Individual chips are stale VLM tags: "birdadette" matches only 15 rows; "chick"/"adult-survivor" are too coarse to mean anything. Verdict: strip Camera + Individual rows, keep Activity + Range.
- Real activity distribution among reacted gems: foraging 615, alert 246, sleeping 146, huddling 56, drinking 33, eating 31, preening 30, sparring 3, dust-bathing 1. Current chip list includes dust-bathing/sparring (dead) and omits huddling/drinking (live).
- All 11 Ornitharchs exist in `content/flock-profiles.json` and have hatch records in `content/hatches/2026/`. Cohorts by hatch date: **C1** Apr 6 (Birddor, fka Birdadette) · **C2** Apr 25 (Birdadotta) · **C3** May 16 (Birdthazar, Henriella, Birdsilla) · **C4** Jun 2–4 (Birdimir, Ingebird, Henriessa, Horstabird, Henridotta, Adelbird). C3+C4 = the nine juniors in the nesting box.
- Photo wiring is the gap: 9 of 11 roster entries have no `photo` (or a stale April baby pic), while current portraits sit in `public/photos/birds/` (23-Jun batch) and `june-2026/`. **Henriessa and Henridotta have zero committed photos anywhere** (hatch records reference uncommitted IMG_5144/5147) — they get an honest styled placeholder, flagged for Boss/Bubba to commit portraits.

## Scope

**IN:** A–D below. **OUT:** markets page (deferred), homepage layout beyond name/photo fixes, TerminalNav, Guardian dashboard components, nav structure, pipeline dirs, IG/FB code, flock-profiles age_note refresh beyond the birds we touch.

## Workstream A — dark-terminal readability restyle (17 files)

One dark theme, no dual-theme conditionals. Additions to `app/globals.css`:
- `.terminal-prose` — hand-rolled MDX typography for the dark palette (guardian-text body, Georgia serif headings, emerald links, dark table stripes, hairline guardian-border rules, mono code on guardian-card). No typography-plugin dependency.

Per-file conversions (from the audit): `projects/[slug]` (prose-on-white cards → terminal-prose on guardian-card panels; forest metadata → guardian-muted; materials table dark), `projects`, `field-notes` ×2, `flock` (kill `bg-cream` wrapper + chessboard; breed section dark; amber fun-fact → amber-on-dark), `gallery/gems`, `hatches`, `yard`, plus shared components: `GemCard`, `GemFilters`, `GemsEmpty`, `GemsError`, `GemsLoadMore`, `FlockGemStrip`, `ThenAndNow`. `GemLightbox` already safe. File headers updated per standards.

## Workstream B — the Ornitharchs (centerpiece): a legacy section on /flock

Placement: directly under the flock hero, before the roster sections. All-new lead section in the terminal idiom, composed of three parts:

1. **Narrative block** — short serif prose (3–4 sentences) telling the inheritance story: eleven birds hatched here in 2026; both sires are gone (LBRJ to the April predator wave, his son Whitey Red Legs disappeared 01-May); Henrietta passed peacefully two days after her last clutch hatched; three chicks carry her name. Framed in a guardian-card panel with a mono `[THE ORNITHARCHS]` strip; count derived from data.
2. **Founders' memorial strip** — three tiles: Henrietta (`birds/henrietta.jpg`), Little Big Red Junior (`birds/little-big-red.jpg` — orphaned on disk today, gets wired to his roster entry), Whitey Red Legs (`birds/whitey-red-legs.jpg`); dates + one-line legacy each, derived offspring counts.
3. **Portrait wall by cohort (clutch)** — C1 Apr 6 · C2 Apr 25 · C3 May 16 · C4 Jun 2–4. Each tile: portrait, name (Birddor tagged "fka Birdadette"), hatch date + live age (existing age util), **egg color chip (blue/brown — it's the actual parentage evidence: brown = Henrietta)**, dam → sire line **with the records' own confidence hedges** ("sire window", "probable", dam candidates for Birdsilla), line badge (Henrietta line / LBRJ / Whitey Red Legs). Henriessa + Henridotta render a styled "portrait pending" tile (no committed photo exists).

Portrait picks (per Bubba's verified-live notes, 06-Jul): Birddor `birds/IMG_5849-birdadette-23jun2026.jpg`; Birdadotta `birds/IMG_6259-birdadotta-23jun2026.jpg`; Birdthazar `birds/IMG_6268-birdthazar-23jun2026.jpg`; Henriella `birds/IMG_6283-henriella-23jun2026.jpg` (best-covered); Birdsilla `birds/IMG_4940-birdsilla-perch-28may2026.jpg`; Birdimir `birds/IMG_6233-birdimir-juvenile-22jun2026.jpg`; Ingebird `birds/IMG_6227-ingebird-suspected-22jun2026.jpg` **(low-confidence ID — caption hedges it)**; Horstabird `june-2026/horstabird-IMG_5171.jpg`; Adelbird `june-2026/adelbird-IMG_5184.jpg`.

Data architecture (SRP/DRY):
- **Parentage/clutch SSoT stays in `content/hatches/2026/*.md`** frontmatter (`parent_hen`, `parent_rooster_window`, `parentage_confidence`, `clutch_id`, `hatch_date`) — loaded via the existing hatch-record loader in `lib/content.ts`. The flock page joins hatch records to roster entries by name; no parentage strings duplicated into flock-profiles.json or page code.
- **`content/flock-profiles.json`** gains `ornitharch: true` on the 11 (identity/status/photo SSoT); cohort derives from `clutch_id`/hatch date, not a new hand-set field.
- Rename Birdadette → **Birddor**, `egg_color: "N/A (rooster)"`, notes get "formerly Birdadette — turned out to be a cockerel" and lose the false "named after Birdgit" line. Birdgit entry loses "her namesake chick"; Birdadotta loses the invented name-lineage chain (real parentage stays). Wire best committed portraits into all ornitharch entries (23-Jun batch, june-2026 shots, Birdsilla perch, Birdimir juvenile). Wire LBRJ's photo.
- Hatch record + field note corrections: `2026-04-06-01-birdadette.md` (etymology fixed, rename noted), `2026-04-06-birdadette-hatches.mdx` (false claim corrected, one-line July update appended). Historical notes otherwise keep period-correct names. Existing LINEAGE map in flock/page.tsx: drop `namesakeOf`, fix comments (the genetic-chain panel may fold into the new section if redundant).
- **Homepage hatchling cards** (`app/page.tsx`): Birddor name + current portraits. `Terminal.tsx` FLOOR_BIRDS label → Birddor (one-word change).

## Workstream C — gallery: curated + honest filters

1. **farm-guardian**: `query_images`/`count_images` gain optional `min_reactions`; `/api/v1/images/gems` passes `min_reactions=1`, tiers `["strong","decent"]`. Row shape unchanged (types.ts/check:contract unaffected). IG pipeline reads the DB directly — unaffected. Restart `com.farmguardian.guardian`; farm-guardian CHANGELOG entry.
2. **GemFilters**: remove Camera + Individual rows entirely; Activity chips updated to the tags that actually exist (foraging, alert, sleeping, huddling, drinking, eating, preening); keep Range; dark chip styling (part of A).
3. **Gallery header copy**: this is the S7 brooder/nesting-box feed, and every frame here got a human reaction in Discord.

## Workstream D — verification, docs

- `npm run lint`, `npm run build`.
- Dev-server screenshot pass: `/`, `/projects/guardian`, `/projects`, one non-guardian project, `/field-notes`, one field-note, `/flock`, `/gallery/gems`, `/hatches`, `/yard`.
- Backend: `npm run check:contract` against live tunnel; curl gems endpoint, confirm reacted-only rows.
- Docs: CHANGELOG v1.27.0 (all workstreams, what/why/how); FRONTEND-ARCHITECTURE.md (terminal-prose, one-dark-theme rule, ornitharch data fields); farm-guardian CHANGELOG.
- Flag (not in this pass): commit Henriessa/Henridotta portraits so the two placeholder tiles fill in.

## TODO order

1. A: globals.css terminal-prose
2. B1: flock-profiles.json (ornitharch flags, Birddor, photos)
3. B2: flock page ornitharch wall + restyle (A) in one pass
4. A: projects ×2, field-notes ×2, gallery, hatches, yard, shared components
5. B3–B5: content corrections, homepage names, floor label
6. C: GemFilters strip-down + backend min_reactions + restart + contract check
7. D: verify, screenshots, docs, CHANGELOGs

## Appendix (post-ship, same day) — rotating portraits + throwbacks

Boss follow-up after v1.27.0 shipped: "find some real good ones… rotating amount of pictures… throwbacks to birds when they were younger." Delivered as v1.28.0: full 38-photo visual audit (three mislabels caught: the 3weeks-a flower photo, the birdadotta-fluffy turkey poult, the sideways day-8 file — rotated in place), per-photo `date`/`showcase` fields on hatch-record photos[], and the `OrnitharchPortrait` rotator (staggered cross-fade, age chips, hydration-safe). Pools build from hatch-record frontmatter in `buildPortraitPool()`; Henrietta's memorial tile rotates to her 2022 throwback. Still open: real solo portraits for Henriessa/Henridotta (IMG_5144/5147 uncommitted), a genuine LBRJ photo, a better current Birdsilla portrait.
