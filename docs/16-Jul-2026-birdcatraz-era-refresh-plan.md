# 16-Jul-2026 — Birdcatraz-Era Refresh Plan (v3)

**Status: DRAFT v3 — expanded after deep pipeline dive, rewritten for standalone execution; awaiting Boss approval before implementation.**

Boss decisions folded in:
- **Birdcatraz = the whole enclosed area**, including the chicken coop and the turkey pen. So usb-cam (coop) and mba-cam (turkey pen) are *inside* Birdcatraz; s7-cam watches the big water bowl.
- usb-cam disconnection is a separate issue Boss will handle — **out of scope**.
- **Reels stay the flagship lane** — they get the most engagement. Nothing in this plan reduces reel output; Part D makes reels *better* and adds photo/carousel as supplements, not replacements.
- **Reel music (D7) is deferred** — good idea, not now.
- VLM prompt fixes + S7 mislabeling: confirmed in scope. Per-bird growth timelapses + IG caption/reel quality: confirmed in scope.

## Orientation (read this if you're new to the system)

Two repos, one machine:

- **`~/Documents/GitHub/farm-2026`** — this repo. Next.js website (farm.markbarney.net, deployed on Railway). Also serves as the *image host* for Instagram: the pipeline commits JPEGs into `public/photos/` and posts the raw.githubusercontent.com URL to the Meta Graph API.
- **`~/Documents/GitHub/farm-guardian`** — Python backend on this Mac Mini. Cameras → VLM scoring ("gems") → Discord curation → Instagram/Facebook posting. Runs via `launchd` jobs (`ls ~/Library/LaunchAgents/com.farmguardian.*`). Read its `CLAUDE.md` and `docs/HOW_IT_ALL_FITS.md` before touching pipeline code.

Key facts you need before editing anything:

- **The gem database is `farm-guardian/data/guardian.db`, table `image_archive`** (`data/image_archive.db` is a 0-byte decoy — see C11). The VLM's per-frame output lives in the `vlm_json` blob column; `image_tier` is `skip|decent|strong`.
- **The human quality gate is Boss's Discord reactions** in `#farm-2026`, synced to the `discord_reactions` column every 30 min by `scripts/discord-reaction-sync.py`.
- **Meta/IG/FB tokens live on this Mac Mini only** (keychain + `~/bubba-workspace/secrets/farm-guardian-meta.env`). Never commit them, never add them to Railway.
- **Never delete or rename anything under `farm-2026/public/photos/`** that's already committed — IG media URLs are pinned to those files at their commit's HEAD.
- **Dry-run before posting:** `ig_poster.py` and `daily_reel_runner.py` have dry-run paths (grep `--dry-run` / `dry_run`); use them for every verification step below. A mistaken live post goes to 381 real followers.
- The IG account is `@pawel_and_pawleen`; the linked FB Page ("Yorkies App") auto-receives everything IG gets — no separate work needed.
- Timestamps in `image_archive` are UTC; posting schedules are America/New_York.

## Why (updated)

The site and pipeline froze in the May–June brooder era (v1 findings stand). The deep dive added a sharper picture of the Instagram problem — it's not vague "could be better," it's five specific mechanical failures:

1. **The best captions in the system never reach Instagram.** The per-frame VLM `caption_draft` is vivid and specific, but the photo lane is off (`tools/pipeline/config.json` → `instagram.enabled=false`, stories off, only reels on). Output has been **100% reels since 2026-07-06**.
2. **The carousel lane is starved to death.** The 18:00 mixed reel selects all reacted gems with no `ig_permalink IS NULL` filter and stamps every source frame with the reel's permalink; the carousel (also 18:00) requires `ig_permalink IS NULL`. DB-verified: **every completed day 07-09→07-14 left zero carousel-eligible gems.** Last carousel: 07-06.
3. **Timelapse reels post hardcoded literal captions** — "A day in the brooder." / "A day at the coop." verbatim daily (`daily_reel_runner.py:133,152,169,227`), because vlm_bypass lanes have no drafts and fall to `caption_fallback`.
4. **The smart reels are homogenized by a stale diary.** Reel captions blend gem drafts with farm context from `farm-2026/content/diary/*.md` filtered to ≤21 days — and only ONE entry (07-09 roost order) is in the window. Result: "Henriella and Birdsilla claim the top perch" rephrased every single day. No caption dedup exists (posted captions aren't even stored), and hashtag rotation is inert (`last_n_tags_used=[]` at every call site).
5. **Reels are mechanically weak:** silent (blank audio track — IG down-ranks silent reels), uniform 1s/frame + 0.15s fade, no title/hook, raw chronological order, redundant frames never pruned (the `codex_reel_curator.curate()` pilot is intentionally inert), s7 portrait output is 607×1080 (below IG's 1080-wide recommendation). Multiple reels/day stack at 21:00 (six s7 reels posted 07-13).

On per-bird timelapses: **the roster is `farm-2026/content/flock-profiles.json`** (32 birds, names + hatch dates + `ornitharch` flags) — and farm-guardian never reads it. Machine bird-identity was deliberately removed in v2.38.2 (false positives); the only structured tags ever written were `birdadette`, Apr 14–May 1 (~203 strong frames on disk) — and Birdadette is now **Birddor, a rooster**. Raw frames prune at 24h; only strong gems persist (~1yr). So: a **flock-level** growth timelapse (Apr→Jul, s7 strong gems) is buildable today with existing tools; a true per-bird one needs new identity tagging.

## Scope

**In:** Parts A–E below, docs + changelogs both repos.
**Out:** usb-cam reconnection (Boss), healthcheck/SSR posture, frame-polling cadence, gem scoring math (v2.45.x fresh), ig-engage, Nextdoor, on-this-day, /hatches page structure, re-enabling structured named-bird VLM classification (v2.38.2 lesson stands — identity comes from humans or reference photos, not the VLM enum).

---

## Part A — farm-guardian: teach the pipeline where the cameras live

Updated for "Birdcatraz = whole enclosure":

| # | Change | Where |
|---|--------|-------|
| A1 | Rewrite s7-cam VLM `context`: Birdcatraz outdoor enclosure, adult/adolescent birds, aimed at the big water bowl — drinking/social scenes are the expected subject. Follow the mba-cam 21-Jun rewrite pattern. Also refresh usb-cam ("coop, inside Birdcatraz") and mba-cam ("turkey pen, inside Birdcatraz") contexts. | `tools/pipeline/config.json:118-157` |
| A2 | Fix the water-bowl skip rule (`prompt.md:71,95` teaches "bird at water bowl = skip"): rewrite to distinguish boring floor-pecking from a genuine water-bowl portrait; update `test_floor_pecking_calibration.py`. | `tools/pipeline/prompt.md` |
| A3 | Scene enum: add `"birdcatraz"` (the enclosure); keep `coop`/`nesting-box` as sub-locations within it. Map scene→hashtag bucket + scene→subdir accordingly. | `tools/pipeline/schema.json:7` |
| A4 | Discord labels: `"S7 Brooder"` → `"S7 Birdcatraz"`; fix mba ("Turkey Pen") and usb ("Coop") labels. | `tools/pipeline/gem_poster.py:26-29` |
| A5 | IG photo destination: replace hardcoded `subdir="brooder"` with scene-based mapping, default `birdcatraz/` for s7 gems. Existing `public/photos/brooder/` untouched (pinned IG URLs). | `tools/pipeline/ig_poster.py:1353,1405` |
| A6 | Hashtag buckets: retire #chicks/#babychicks routing for s7; add birdcatraz/outdoor bucket (adult chickens, turkeys, backyard flock). | `ig_poster.py:486-494`, `hashtags.yml` |
| A7 | Fix stale reel lane strings: "A day in the brooder" (mba = turkey pen) etc. — subsumed by D3's caption fix, but the lane *names/labels* get corrected here. | `daily_reel_runner.py:125-133` |

## Part B — farm-guardian: close the Instagram loop (unchanged from v1)

1. **B1 — Insights fetcher.** `tools/pipeline/ig_insights.py`, nightly LaunchAgent: per-media likes/comments/reach/saves/plays + daily follower count via existing Graph token. New `ig_media_insights` table keyed on the media_id recorded at post time.
2. **B2 — Weekly digest to Discord** `#farm-2026`: best/worst posts, best lane, best hour, follower delta.
3. **B3 — (deferred)** feed insights into `ig_selection.py` ranking once weeks of data exist.

Rationale strengthened by the dive: every quality change in Parts D/E needs B1 to know whether it worked.

## Part C — farm-2026: bring the website into July (unchanged from v1, plus one item)

C1 homepage hero de-chickification · C2 OG image/alt · C3 flock-profiles location/prose refresh (locations → `birdcatraz`, with coop/turkey-pen noted in prose) · C4 /flock nursery→Birdcatraz section + hero photo + EE-hen-1/Birdsula lookup fix · C5 new Birdcatraz project page · C6 guardian project copy + camera-count contradictions · C7 "S7 coop cam" copy fixes · C8 `DEFAULT_FEATURED` → `s7-cam` · C9 overdue field note from July diary + Birdcatraz move · C10 housekeeping (.bak files, CONTENT-PIPELINE.md roster).

- **C11 (new):** fix farm-2026 `CLAUDE.md` claim that gem-lane state lives in `data/image_archive.db` — that file is empty; live rows are in `data/guardian.db` (`image_archive` table). Also update the pipeline table's destination subdirs when A5 lands.

## Part D — farm-guardian: caption & reel quality overhaul (the "tighten up Instagram" core)

Framing: **reels are the engagement engine and remain the primary lane.** D3–D9 make each reel better; D1–D2 revive the supplementary lanes (carousel, single photo) so the vivid per-frame captions get a surface too — they must never crowd out or consume the reel lanes' material.

Ordered by impact:

| # | Change | Where |
|---|--------|-------|
| D1 | **Un-starve the carousel.** Stop stamping reel usage into `ig_permalink` on source frames — add a separate `reel_permalink`/`used_in_reel_at` column so reels and carousels draw from independent ledgers. Move carousel to midday (e.g. 12:30) so the two lanes stop colliding at 18:00. | `ig_selection.py:510-569`, `ig_poster.py`, `store.py` migration, LaunchAgent plist |
| D2 | **DECIDED (16-Jul): photo lane stays OFF for now — carousel-only.** The carousel already surfaces the best gem's `caption_draft` as its caption, so reviving it (D1) delivers the caption win without a third lane. Revisit the single-photo lane after B1 has ~2 weeks of insights data. Stories stay off. | `tools/pipeline/config.json` |
| D3 | **Kill hardcoded fallback captions.** vlm_bypass timelapse reels get generated captions from lane + date + golden-window + season context (and roster ages via E1) instead of "A day in the brooder." | `daily_reel_runner.py:631-750` |
| D4 | **Persist every posted caption** (new column/table at publish time). Fixes the audit gap (today captions are only reconstructable from `/tmp/ig-*.log`) and becomes the dedup source. | `ig_poster.py`, `store.py` |
| D5 | **Dedup + rotation.** Feed the last N posted captions into the Codex caption call ("do not repeat these phrasings/subjects"); actually pass `last_n_tags_used` to `pick_hashtags` (today `[]` at every call site). | `daily_reel_runner.py:538,775`, `orchestrator.py:765`, `codex_reel_curator.py` |
| D6 | **Fresh farm context.** The 21-day diary window with one entry homogenizes everything. Two moves: (a) C9's cadence revival keeps `content/diary/` fed; (b) caption generator samples/rotates among available facts and is allowed to use *none* rather than repeat yesterday's. | `daily_reel_runner.py:591-628` |
| D7 | **Reels: audio — DEFERRED per Boss (16-Jul).** Noted for later: mux a royalty-free/owned music bed (local track library, rotated) instead of the silent `anullsrc` track. Likely the biggest algorithmic lever on reel reach when we're ready. Do not implement now. | `reel_stitcher.py:375-392` |
| D8 | **Reels: curation + pacing.** Wire in the existing-but-inert `codex_reel_curator.curate()` to prune redundant frames; variable pacing (hold the highest-scored frame ~2s as an opener/hook, 0.7–1s mid-frames); optional 1-frame date title card. | `reel_stitcher.py`, `daily_reel_runner.py`, `codex_reel_curator.py:231-269` |
| D9 | **DROPPED (16-Jul).** Upscaling s7 output to 1080×1920 contradicts the standing decision in `docs/20-Apr-2026-ig-next-phases-plan.md §3` ("do NOT upscale — it looks worse"), which reel_stitcher's header honors. That decision stands. Replacement item, deferred and gated on B1 data: investigate *capture-side* why the stitcher receives 607-wide crops from a 1080×1920-native camera, only if insights show resolution hurting reach. | `reel_stitcher.py:35-37,341` |
| D10 | **Posting discipline.** Reels stay daily — the two flagship reels (18:00 mixed gem reel, 21:00 s7 daily reel) are untouched. What gets tamed is the redundant stack: six near-identical s7 reels went out on 07-13, and the per-camera timelapse reels (mba/gwtc/usb/dominator/duo2) pile into the 20:30–21:15 window with hardcoded captions. Consolidate those into one rotating "camera of the day" timelapse slot, spread slots, and stagger the carousel away from 18:00 (D1). Add a per-day lane budget to `config.json` so the cap is data, not code. | `daily_reel_runner.py`, plists |
| D11 | **Voice.** Add a light persona layer for @pawel_and_pawleen to the caption-synthesis step (warm, wry, farm-diary voice — extending the existing `BRAND_RULES`), and vary/retire the hardcoded `📸 @markbarney121` sign-off. Per-frame `caption_draft` stays descriptive (it's the raw material, not the post). | `codex_reel_curator.py:76-87`, `ig_poster.py:637-668` |

D1+D2+D3 alone end the "same generic caption every day" era; D4+D5 keep it from creeping back; D8+D9 are the "reels well put together" work (D7/music joins later); B1 measures all of it.

## Part E — bird roster integration + growth timelapses (NEW)

The roster Boss referenced is `farm-2026/content/flock-profiles.json` (canonical: names, hatch dates, breed, `ornitharch` flags). farm-guardian currently never reads it.

| # | Change | Notes |
|---|--------|-------|
| E1 | **Roster bridge.** farm-guardian reads `flock-profiles.json` (it already reads `content/diary/` from the same repo — same pattern). Uses: live ages in captions ("the flock at 14 weeks"), named-bird *soft guidance* in `prompt.md` generated from the roster's ornitharchs + `color_description` (caption-only, replacing the two hardcoded names at `prompt.md:17-22`; structured enum stays dead per v2.38.2). | new `tools/pipeline/roster.py` |
| E2 | **Flock growth timelapse (buildable today).** s7 strong gems span 2026-04-16 → now. Sample one frame/day (bucketed, sharpest-per-bucket — `select_timelapse_gems` already does this) → `stitch_gems_to_reel` (90-frame cap fits ~13 weeks at 1/day). Publish as a monthly "watch them grow" reel; embed on the Birdcatraz project page (C5). | existing `ig_selection.py:732`, `reel_stitcher.py:234` |
| E3 | **Per-bird identity via humans, not the VLM. DECIDED (16-Jul): reply-with-name, not emoji.** Boss replies a bird's name (e.g. "Birddor") to a gem's Discord message → `discord-reaction-sync` validates it case-insensitively against `flock-profiles.json` names (❓ react-back on no match, never a silent drop) → writes the name via the existing `image_archive_edits` audit path → tagged frames get `retained_until` pinned (E4). Emoji rejected: 32-bird roster makes an emoji legend unmemorable and collision-prone. Over weeks this accrues a per-bird photo timeline that E2's stitcher can consume per name. | `scripts/discord-reaction-sync.py`, `database.py` |
| E4 | **Retention pinning** for bird-tagged frames so a bird's timeline survives the sweeps. | `tools/pipeline/retention.py` |
| E5 | **Website surface.** Generalize `ThenAndNow.tsx` (currently a hardcoded 2-photo Birdimir comparison) into an N-photo growth strip fed by hatch records' `phenotype_observations` + dated photos; add to ornitharch profiles on /flock. This is the manual-but-correct per-bird story today, while E3 accrues data for automated ones. | `app/components/hatches/ThenAndNow.tsx`, `content/hatches/` |

Caveat logged: "Birdadette chick→hen" specifically is impossible — Birdadette is now **Birddor** and a rooster; his ~2-week April tag archive can still make a fun "baby Birddor" throwback clip (E3 data path can backfill from those 203 frames).

## Verification

- **A:** one manual pipeline cycle on a live s7 frame → new scene label, sane water-bowl score, dry-run URL predicts `photos/birdcatraz/`, Discord label correct.
- **D:** dry-run each lane; confirm carousel selects gems on a day a reel already ran (D1); ffprobe a stitched reel for audio stream + 1080×1920 (D7/D9); captions differ across 3 consecutive dry-run days (D5); posted-caption rows land in DB (D4).
- **B:** one manual insights fetch against a recent media_id before installing the LaunchAgent.
- **E:** stitch the flock timelapse locally and review before any publish; roster bridge unit-checked against renames (Birdadette→Birddor case).
- **C:** `npm run build` + `npm run check:contract`; browser pass over `/`, `/flock`, `/projects`, `/gallery/gems`, `/markets`; OG tags verified.

## Docs / Changelog touchpoints

- farm-guardian: `docs/16-Jul-2026-s7-birdcatraz-move.md` (relocation record), `docs/16-Jul-2026-ig-quality-overhaul-plan.md` (Parts B+D+E detail, mirrors this doc), CHANGELOG v2.46.x per part.
- farm-2026: CHANGELOG v1.29.0; `CLAUDE.md` pipeline table (subdirs + image_archive.db correction, C11); `docs/CONTENT-PIPELINE.md`.

## Suggested order

1. **A1–A6** — the pipeline is mis-scoring and mislabeling the main camera right now.
2. **D1–D3** — un-starve the carousel, re-enable photos, kill hardcoded captions (ends the visible genericness).
3. **C1–C4** — homepage/OG/flock, the loudest stale surfaces.
4. **B1** — start collecting insights early so later changes are measurable.
5. **D4–D11**, **E1–E2**, **C5–C11**, then **B2**, **E3–E5**.

## Decisions log (all open questions resolved 16-Jul)

1. **D2 cadence:** carousel-only; photo lane stays off until B1 has ~2 weeks of insights data.
2. **E3 tagging UX:** reply-with-name in Discord, validated against the roster; emoji rejected (32-bird legend).
3. **D10 daily budget:** 2 flagship reels + 1 rotating camera-of-the-day timelapse reel + 1 carousel + 0 photos. Reels untouched.
4. **D9:** dropped — the 20-Apr no-upscale decision stands; capture-side resolution investigation deferred, gated on B1 evidence.
5. Reels are the flagship lane; D7 music deferred; Birdcatraz spans coop + turkey pen; usb-cam hardware is Boss's to fix.

## Execution guardrails (agreed with implementing dev, 16-Jul)

- Back up `guardian.db` (plain file copy while the orchestrator is paused, or `sqlite3 .backup`) before ANY schema migration (D1, D4, B1).
- **No live-posting behavior flips without explicit per-flip approval** — dry-run is the default for every lane change; the 381 real followers are the blast radius.
- Work lands in phased chunks with verification between them, in the suggested order (A1–A6 → D1–D3 → C1–C4 → B1 → rest), not one continuous pass.
- **Phase 1 (A1–A6) is approved to start now** — it's config/prompt/label work with no posting-behavior change, and the pipeline is actively mis-scoring the S7's water-bowl subject every cycle until it lands. Per standard workflow, write the phase implementation doc first.
