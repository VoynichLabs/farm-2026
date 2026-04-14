<!--
Author: Claude Opus 4.6 (1M context)
Date: 14-April-2026
PURPOSE: Canonical long-form documentation of the Farm Guardian image
         archive dataset AND the detailed plan for exposing it on
         farm-2026. This is the authoritative reference for any work
         that touches curated farm imagery — public gallery, homepage
         rails, Birdadette retrospective, review tooling, Instagram
         export, any of it.

         READ THIS BEFORE touching:
           - app/components/guardian/*
           - app/gallery/*
           - any new photo / curation / "best of" feature
           - farm-guardian's api.py when adding image endpoints

SRP/DRY check: Pass — single source of truth for cross-repo image
               pipeline integration. No overlap with
               FRONTEND-ARCHITECTURE.md (this = data origin + API
               contract; that = how to render it).
-->

# The Guardian Image Archive Dataset — and the Plan to Expose It

> **If you are about to add a photo gallery, a "recent shots" widget, a "best of the week" digest, an Instagram feed, a Birdadette retrospective, or ANY feature that curates farm imagery — you want this dataset. It already exists. It is growing hourly. Read this doc before writing anything.**

---

## Part 0 — The 60-second read

There is a continuous multi-camera image curation pipeline running on the Mac Mini (shipped in **farm-guardian v2.23.0**, 2026-04-13). Every few minutes, each camera produces a sharp frame; a local vision model (`glm-4.6v-flash` via LM Studio) classifies it against a structured JSON schema; the result lands in a SQLite archive at `data/guardian.db` (`image_archive` table) plus JPEGs under `data/archive/{YYYY-MM}/{camera}/`.

Every classified frame carries:
- **Scene** (brooder / yard / coop / nesting-box / sky / other)
- **Bird count**, **individuals visible** (Birdadette / adult-survivor / chick / unknown-bird)
- **Activity** (eating / foraging / sleeping / huddling / preening / dust-bathing / sparring / alert / …)
- **Lighting**, **composition**, **image quality**
- **`share_worth`** verdict — `skip` / `decent` / `strong` — drives a tiered storage policy
- **Drafted plain-language caption**, **share reason**
- **`concerns[]`** — flags for welfare/safety observations (never publish; see Part 1.g)
- **`any_special_chick`**, **`apparent_age_days`**
- Pre-VLM gate metrics (sharpness, exposure, std-dev) for forensics

Two hardlinked views over the archive:
- `data/gems/{YYYY-MM}/{camera}/` — every `share_worth='strong'` frame, indefinitely retained
- `data/private/{YYYY-MM}/{camera}/` — every `concerns`-flagged frame, indefinitely retained, **never exposed publicly**

The archive is NOT exposed to farm-2026 yet. Part 2 of this doc specifies how to expose it — backend endpoints in `farm-guardian/api.py`, shared TypeScript types in `app/components/guardian/types.ts`, frontend components under `app/components/gems/`, and four public-facing surfaces (gems gallery, homepage rail, Birdadette retrospective, optional Instagram autofeed) plus a Boss-only review UI.

**If you do nothing:** the pipeline keeps running, disk fills at ~40 MB/day, Boss manually eyeballs folders over SSH. No public benefit, no retrospective, no Instagram. The plan below changes that without destabilizing the live Guardian surface.

Three rules bind every line of code this spec produces:

1. **Never leak `has_concerns=1` to any public endpoint or component.** Three-layer filter: query, API boundary, component. Boss has explicitly asked that welfare/safety observations stay off farm.markbarney.net.
2. **Captions are drafts, not ground truth.** Display them honestly (labelled or editable), never as if they were editorial copy. No invented attributions. No owner name. No editorializing. (See `feedback_no_editorializing.md` auto-memory.)
3. **Camera display labels are hardware-only.** `mba-cam` is "MacBook Air camera" in the UI. Not "brooder." Locations change; devices don't. (See FRONTEND-ARCHITECTURE.md rule 3; same rule applies verbatim here.)

---

## Part 1 — The dataset (what exists today)

### 1.a Physical location

All paths below are relative to `~/Documents/GitHub/farm-guardian/` on the Mac Mini. The SQLite file is the one farm-guardian already owns for detection data — the image pipeline added a new table to the existing DB rather than creating a second store. This keeps concerns consolidated and lets future code join image rows against detection events (e.g., "did the Reolink's YOLO see the bird that GLM is now describing?").

| Path | What's there | Authority |
|---|---|---|
| `data/guardian.db` | SQLite file — `image_archive` table plus Guardian's existing tables (`detections`, `tracks`, `alerts`, etc.). WAL mode; concurrent reads are safe during writes. | Single source of truth for structured metadata. |
| `data/archive/{YYYY-MM}/{camera}/*.jpg` | Every archived JPEG. Filename format: `2026-04-14T01-45-10-decent.jpg` — ISO-compact timestamp + tier suffix. | Binary payload. Safe to delete; DB row survives. |
| `data/archive/{YYYY-MM}/{camera}/*.json` | Sidecar JSON: full GLM metadata + pre-VLM gate metrics + model id + prompt hash + inference latency. Redundant with the DB row. | Belt-and-braces: DB corruption / filesystem-only workflows can still recover the metadata. |
| `data/gems/{YYYY-MM}/{camera}/` | Hardlink-populated view of `share_worth='strong'` frames. Survives the archive's 90-day retention because hardlink refcount keeps the inode alive. **This is where Boss and the public site look.** | Derived view; rebuildable from the DB + archive. |
| `data/private/{YYYY-MM}/{camera}/` | Hardlink-populated view of `concerns`-flagged frames. Same retention-survival property. **NEVER expose publicly.** | Private review set; out-of-band from the public site. |
| `data/pipeline-logs/orchestrator.log` | Running daemon's stdout+stderr. One line per cycle. Grep this when diagnosing dropped frames, VLM errors, retention sweeps. | Diagnostic only. |

**Why hardlinks for `gems/` and `private/`:** zero extra disk cost, identical bytes, and independent lifetimes. When the retention sweep unlinks the archive entry, the inode's refcount is still ≥1 (the gem link), so the file persists. Gems are kept indefinitely by default; archive recycles at 90 days. A single `ln` call at write-time; no cron, no rsync, no risk of drift.

### 1.b SQLite schema — the `image_archive` table

Full DDL lives in `farm-guardian/tools/pipeline/store.py` as `_SCHEMA_SQL`. Run `sqlite3 data/guardian.db ".schema image_archive"` to see what's actually deployed on the Mini right now.

**Row identity columns:**

| Column | Type | Notes |
|---|---|---|
| `id` | INTEGER PK AUTOINCREMENT | DB row id. Stable; use this as the public URL anchor. |
| `camera_id` | TEXT NOT NULL | One of `house-yard`, `usb-cam`, `s7-cam`, `gwtc`, `mba-cam`. Must match `lib/cameras.ts` `CameraName` union on the frontend — drift here = broken rendering. |
| `ts` | TEXT NOT NULL | ISO 8601 with timezone (e.g., `2026-04-14T01:45:10+00:00`). Capture time. **This is the time you sort on for "most recent".** |
| `created_at` | TEXT NOT NULL DEFAULT `datetime('now')` | DB insert time. Differs from `ts` if a future feature imports historical frames. |

**Storage / binary columns:**

| Column | Type | Notes |
|---|---|---|
| `image_path` | TEXT | Path relative to `data/` (e.g. `archive/2026-04/mba-cam/2026-04-14T01-45-10-decent.jpg`). **NULL after retention sweep OR when `image_tier='skip'`.** Never display a broken `<img>` — always check this for NULL first. |
| `image_tier` | TEXT NOT NULL | `strong` / `decent` / `skip`. Distinct from `share_worth` denormalized below — `image_tier` tracks **what we actually persisted on disk**, which can diverge from `share_worth` if we later change tier rules. |
| `sha256` | TEXT | Of the stored JPEG bytes. Use for de-duplication if you ever backfill. |
| `width` | INT | Stored JPEG width. |
| `height` | INT | Stored JPEG height. |
| `bytes` | INT | Stored JPEG byte count. NULL for skip tier. |

**Pre-VLM gate metrics (forensic; not for UI):**

| Column | Type | Notes |
|---|---|---|
| `std_dev` | REAL | Pixel std-dev. Frames < ~5 are all-black/all-white/dropped — rejected before VLM. |
| `laplacian_var` | REAL | Laplacian variance; higher = sharper. Used to pick the sharpest frame from a burst on fixed-focus cameras (gwtc, mba-cam). Absolute value varies wildly by resolution; don't threshold on this cross-camera. |
| `exposure_p50` | REAL | Median luminance. Logged for later analysis. |

**VLM metadata columns (the good stuff):**

| Column | Type | Notes |
|---|---|---|
| `vlm_model` | TEXT | Always `zai-org/glm-4.6v-flash` as of v2.23.0. Change this when the model changes; it matters for explaining drift. |
| `vlm_inference_ms` | INT | Round-trip latency. Ranges 15-60s on the Mini. |
| `vlm_prompt_hash` | TEXT | First 16 chars of SHA-256 of the rendered prompt string. Edit the prompt → hash changes → you can correlate metadata shifts with prompt versions. This is **load-bearing** for debugging "GLM suddenly stopped calling things sharp" — look at the prompt hash boundary. |
| `vlm_json` | TEXT NOT NULL | **The full structured GLM response, as JSON text.** The authoritative metadata. Everything below is a denormalized projection of this. `json_extract(vlm_json, '$.field')` works and uses the JSON index if one exists. |

**Denormalized fields (for query speed; same as `vlm_json` contents):**

| Column | Type | Enum values |
|---|---|---|
| `scene` | TEXT | `brooder` / `yard` / `coop` / `nesting-box` / `sky` / `other` |
| `bird_count` | INT | Integer ≥ 0. GLM estimate, not ground truth. Expect noise ±2 on brooder-scale groups. |
| `activity` | TEXT | `huddling` / `eating` / `drinking` / `dust-bathing` / `foraging` / `preening` / `sleeping` / `sparring` / `alert` / `none-visible` / `other` |
| `lighting` | TEXT | `natural-good` / `heat-lamp` / `dim` / `blown-out` / `backlit` / `mixed` |
| `composition` | TEXT | `portrait` / `group` / `wide` / `cluttered` / `empty` |
| `image_quality` | TEXT | `sharp` / `soft` / `blurred` — see Part 1.h for calibration notes |
| `share_worth` | TEXT | `skip` / `decent` / `strong` — drives tiering |
| `any_special_chick` | INT 0/1 | GLM saw a chick visually distinct from its siblings in-frame |
| `apparent_age_days` | INT | **Sentinel: -1 means "n/a" / not a chick scene.** 0-365 for actual estimates. Converting to `null` on the way to the frontend is the right move (see Part 2.b). |
| `has_concerns` | INT 0/1 | True iff `concerns[]` was non-empty. **Every public query filters `has_concerns = 0`.** |
| `individuals_visible_csv` | TEXT | Comma-joined from `individuals_visible[]`. Example: `"birdadette,chick,chick"`. Use `LIKE '%birdadette%'` for filtering; split by `,` on the frontend if you need the list. |

**Retention column:**

| Column | Type | Notes |
|---|---|---|
| `retained_until` | TEXT | ISO date. **`NULL` means keep indefinitely** (strong tier with concerns, or manually-promoted frames). `skip` tier rows also get NULL here since there's no JPEG to expire. The retention sweep deletes only where `retained_until IS NOT NULL AND retained_until <= today AND has_concerns = 0`. |

**Indices:**

```sql
CREATE INDEX idx_archive_camera_ts ON image_archive(camera_id, ts);
CREATE INDEX idx_archive_share    ON image_archive(share_worth, image_quality);
CREATE INDEX idx_archive_concerns ON image_archive(has_concerns);
CREATE INDEX idx_archive_retain   ON image_archive(retained_until);
```

The `(camera_id, ts)` composite is what newest-first-per-camera pagination hits. `(share_worth, image_quality)` powers the gem lookup. `has_concerns` is cardinality-low but queried on every public request so it's worth indexing.

### 1.c Extra fields in `vlm_json` (not denormalized)

These live only inside the JSON blob. Extract via `json_extract(vlm_json, '$.fieldname')` in SQL, or parse the `vlm_json` string on the frontend.

| Field | Type | Purpose |
|---|---|---|
| `share_reason` | string (≤200 chars) | GLM's one-sentence rationale for the `share_worth` verdict. Useful for tuning; surface in the review UI; skip on public. |
| `caption_draft` | string (≤200 chars) | Plain-language caption. **Always labelled "Draft" or editable when rendered.** Never styled as finished editorial copy. |
| `concerns` | string[] (each ≤200 chars) | Welfare/safety observations. Non-empty → row goes to `private/` track. Never leaks to public endpoints. |

**Why these aren't columns:** they're either user-editable (caption) or only read by the review UI (share_reason, concerns). Keeping them out of the indexed denormalized set keeps the hot path small. If you find yourself querying over `caption_draft` text, add a denormalized column + FTS index; don't grep a TEXT blob.

### 1.d Cameras contributing to the archive

Complete per-camera table. Keep this in sync with `farm-guardian/config.json` and this repo's `lib/cameras.ts`. The name is hardware-anchored; the "Angle today" column moves.

| `camera_id` | Hardware | Native res | Focus behavior | Angle today | Cadence | Capture recipe |
|---|---|---|---|---|---|---|
| `house-yard` | Reolink E1 Outdoor Pro 4K PTZ | 3840×2160 | Motorized AF, triggerable | Yard + sky (sky-watch preset) | 600 s | HTTP `cmd=Snap` (reuses Guardian's `/api/v1/cameras/house-yard/snapshot` — no auth duplication) |
| `usb-cam` | Generic USB webcam on the Mini | 1920×1080 | Continuous AF, consumer-grade | Brooder | 180 s | OpenCV AVFoundation + `CAP_PROP_AUTOFOCUS=1` + 5-frame warmup |
| `s7-cam` | Samsung Galaxy S7 running IP Webcam | ~1080p | App-driven AF, retriggerable | Coop (when phone is on) | 600 s | RTSP burst via ffmpeg; disabled in config when phone is offline |
| `gwtc` | Gateway laptop built-in webcam via MediaMTX | 1280×720 | **Fixed focus** | Coop | 600 s | RTSP burst of 5 frames, Laplacian-sharpest wins |
| `mba-cam` | MacBook Air 2013 FaceTime HD via MediaMTX | 1280×720 | **Fixed focus** (no AF at all — 2013 hardware) | Brooder | 300 s | RTSP burst of 5 frames, Laplacian-sharpest wins |

**Notable operational quirks:**

- **The brooder has two cameras on it** (usb-cam from above, mba-cam from the side). Both emit rows; both will show the same chicks. Expect redundancy in brooder rows — this is a feature (different angles) not a bug (duplicate captures).
- **`mba-cam` is fixed-focus 2013 hardware.** If it produces soft frames, that's a physical-placement signal. Moving the Air closer to the brooder (2-4 ft) helps more than any software tuning.
- **`gwtc` is also fixed-focus.** Same constraint.
- **`s7-cam` drops offline when the phone is off** (IP Webcam app stops serving). `enabled: false` in the pipeline config when this happens. Re-enable by flipping the config flag and restarting the daemon.
- **Configuration file drift:** `farm-guardian/tools/pipeline/config.json` is the pipeline's config. Names must match `farm-guardian/config.json` cameras entries. Mismatches = silent dead cycles.

### 1.e Production rate, growth, retention

**Cycles/day (with 4 enabled cameras, as of 2026-04-14):**

- `house-yard` — 600 s cadence → 144/day
- `usb-cam` — 180 s cadence → 480/day
- `s7-cam` — 600 s cadence → 144/day (when online)
- `gwtc` — 600 s cadence → 144/day
- `mba-cam` — 300 s cadence → 288/day
- **Total: ~1,200/day with 4 cameras, ~1,350/day with s7-cam online**

**Tier mix (empirical, early data, will refine):**

- `skip` — ~70% (empty yard at dusk, blurred auto-exposure moments, boring sleep frames)
- `decent` — ~25% (normal clear archive-worthy frames)
- `strong` — ~5% (genuinely interesting / well-composed frames)

**Disk footprint:**

- `decent` archived at 1920px long edge, JPEG q=85 → ~80 KB/frame → ~24 MB/day
- `strong` archived at full resolution → 80-350 KB/frame (depends on camera; house-yard is 4K, others 720p) → ~10 MB/day
- **Daily total: ~35 MB/day; 90-day steady state: ~3.2 GB**
- SQLite metadata: ~3 KB/row × 1,200/day × 365 = ~1.3 GB/year (cheap)

**Retention policy:**

- `skip` — no JPEG ever written; metadata row kept forever
- `decent` — JPEG 90 days, then deleted by `retention.py` daily sweep; metadata row kept forever (image_path set to NULL)
- `strong` — JPEG 90 days in `archive/`, then auto-deleted, BUT the hardlink in `gems/` keeps the inode alive indefinitely. Gems are kept forever by default.
- `concerns` non-empty — JPEG kept forever in `archive/` AND in `private/`, exempt from retention sweep

**The public API must assume any row may have `image_path = NULL` and handle it.** It's the 90-day boundary where otherwise-valid metadata points at a file that's been swept.

### 1.f Caption rules — non-negotiable

GLM is prompted via `farm-guardian/tools/pipeline/prompt.md` to emit captions obeying Boss's durable rules (see `feedback_no_editorializing.md` auto-memory):

1. **No owner name.** Boss's name never appears in a caption. This is a persistent cross-session directive.
2. **No invented attributions.** No "by Claude," no "courtesy of Farm Guardian," no fake artist credit.
3. **No editorializing.** Factual descriptions only. "A group of young chicks in a heated brooder" is right. "A magical moment captures the wonder of new life" is wrong.
4. **Captions are drafts.** Frontend must either label them ("Draft caption: …") or provide an edit flow, never auto-publish as if final.

If you see a violation in a live caption, the likely causes are (a) GLM slipping on a prompt edge case (file an issue, add to the prompt's negative examples), (b) prompt drift (check `git blame tools/pipeline/prompt.md` in farm-guardian), or (c) a fine-tune/version change in `glm-4.6v-flash` (check `vlm_model` on the offending row).

### 1.g Private-notes routing — non-negotiable

Frames where GLM populates `concerns[]` with anything non-empty land in `data/private/` AND carry `has_concerns=1` in the DB. These rows:

- **MUST NEVER** appear on a public endpoint (`/api/v1/images/gems`, `/api/v1/images/recent`, `/api/v1/images/stats`).
- **MUST NEVER** appear in a component rendered for unauthenticated visitors.
- **MUST** be available in the Boss-only review UI behind bearer auth.

Historical context: the auto-memory `project_brooder_private_notes.md` documents Boss's explicit directive to keep losses, injuries, and welfare concerns off farm.markbarney.net. This is a persistent constraint across sessions and contractors. Not up for reinterpretation.

**Defense-in-depth pattern:** filter at three boundaries.

1. **Query** — every public endpoint's SQL has `WHERE has_concerns = 0`. Period.
2. **API** — the Pydantic response shape for `GemRow` doesn't have a `concerns` field. Can't leak what isn't in the type.
3. **Component** — even though the field isn't there, components fetching lists defensively skip rows that look off (e.g., if a future field makes the shape nullable, skip nulls). Paranoid, cheap, catches unknown-unknowns.

**The `image_archive_edits` audit table** (added in Layer 1 below) logs every promote/demote/flag/delete so we can reconstruct: if something leaked publicly and shouldn't have, we can see when and how its state changed.

### 1.h Trust + calibration notes (GLM quirks observed so far)

GLM 4.6v-flash at 4-bit quant is good but not perfect. Known quirks as of v2.23.0:

**Bird counting is noisy.** Brooder scenes with ~22 chicks often come back as 22, 23, 24, or 25. The error is bidirectional and small. **Never display "GLM counted 24 chicks" as authoritative.** Treat `bird_count` as a rough density signal; aggregate or round when surfacing.

**Sharpness is judged against an implicit high-resolution ideal.** Before the 14-Apr prompt fix, every 720p webcam frame was called `soft`, no matter how focused. The fix (in the current prompt) explicitly tells GLM to judge sharpness relative to native resolution and not penalize low megapixels. Monitor the ratio of `image_quality='sharp'` per camera over the next few days; if gwtc/mba-cam frames still never clear `sharp`, the prompt needs another pass.

**Breed identification requires visual-description anchors, not taxonomic labels.** Current prompt describes Birdadette by her current chick appearance (black body, orange face, ~2 days older than siblings). That works. Giving GLM the adult-plumage description would fail because she doesn't look like the adult form yet. **Any new named-bird identification must be anchored to current visible appearance, not breed name.** Update the prompt as birds age.

**`any_special_chick` is loose.** GLM flags it for any visually-distinct chick, including ones that are just standing apart or in different lighting. Don't treat it as a reliable "we found Birdadette" signal; use `individuals_visible_csv LIKE '%birdadette%'` instead.

**Activity calls are decent but biased toward `none-visible`.** When chicks are huddled under the heat lamp with their heads down, GLM often returns `none-visible` — technically correct (you can't see what they're doing) but not informative. If a frontend feature wants "here's what the flock is up to," filter `activity != 'none-visible' AND activity != 'other'`.

**Apparent age estimation is rough.** ±2-3 days on brooder chicks. Useful for binning (week 1 / week 2 / week 3) but not for daily precision. The Birdadette retrospective uses `GROUP BY apparent_age_days` as a bucketing signal, not a literal daily count.

**GLM occasionally outputs malformed JSON despite the schema.** Current rate < 0.5% but nonzero. The enricher validates and on validation failure records a `skip` row with raw response preserved in `vlm_json`. These rows are visible in SQL as `share_worth='skip' AND image_path IS NULL AND laplacian_var IS NOT NULL` — they're diagnostic material. Ignore for public rendering.

**Caption repetition.** GLM slips into the same phrasing ("A group of young chicks in a heated brooder") for visually similar scenes. Archive works fine; Instagram-autofeed will need dedup. See Part 2.g.

---

## Part 2 — The plan to expose this in farm-2026

The dataset is on the Mac Mini. The public site is on Railway. They talk via the Cloudflare tunnel at `https://guardian.markbarney.net`. Today the tunnel only exposes Guardian's live-feed and detection endpoints; the image archive is not yet queryable over the network.

Exposing it is a four-layer job: **backend endpoints, shared types, frontend components, rules that bind.**

### 2.a Layer 1 — Backend: new REST endpoints in `farm-guardian/api.py`

These are the minimum endpoints to drive the frontend features in Layer 3. Goes under `/api/v1/images/` to avoid colliding with `/api/v1/cameras/...`.

#### Global request/response conventions

- **Content-Type:** `application/json; charset=utf-8` on data endpoints. Image endpoints return `image/jpeg`.
- **Timestamps:** ISO 8601 with timezone. Always UTC from the backend; frontend formats to America/New_York.
- **Pagination:** cursor-based. Query param `cursor` is an opaque base64(ts + id). Response includes `next_cursor` (null when exhausted). `limit` defaults to 24, max 100.
- **Caching:** public endpoints set `Cache-Control: public, max-age=60, s-maxage=300` for list endpoints; `max-age=3600, immutable` for image bytes (rows are immutable once written). Private endpoints set `Cache-Control: no-store`.
- **Errors:** `{ "error": { "code": "<short-code>", "message": "<human>", "detail": <optional-struct> }, "request_id": "<uuid>" }`. HTTP status matches (400, 401, 403, 404, 500, 503).
- **Request IDs:** generate a UUIDv4 per request; include in error responses; log with the request so support chat can trace a broken-image report.
- **Rate limits:** 60 req/min per IP on public image-bytes endpoints (Cloudflare tunnel caps incoming; still protect the Mini). 600 req/min on metadata endpoints. Return `429` with `Retry-After` header when exceeded.
- **CORS:** allow `https://farm.markbarney.net` and `http://localhost:3000` (for dev). Pre-flight `OPTIONS` supported on every data endpoint.

#### Public endpoints — anyone can hit these over the tunnel

Every public endpoint enforces `has_concerns = 0` at the query level. Public responses never carry `concerns`, `share_reason`, or `vlm_json` fields.

**`GET /api/v1/images/gems`**

List `share_worth='strong'` rows, newest first.

Query params:
- `camera` — filter by camera_id (repeatable, e.g. `?camera=mba-cam&camera=gwtc`)
- `scene` — filter by scene enum (repeatable)
- `activity` — filter by activity enum (repeatable)
- `individual` — filter by individual name (`birdadette` / `adult-survivor` / `chick`) — repeatable, OR-matched
- `since` — ISO date lower bound (inclusive). Defaults to 90 days ago.
- `until` — ISO date upper bound (inclusive). Defaults to now.
- `limit` — 1..100, default 24
- `cursor` — opaque pagination token
- `order` — `newest` (default) | `oldest` | `random` (random uses `ORDER BY RANDOM()`; cursor ignored)

Response:
```json
{
  "count": 24,
  "total_estimate": 412,
  "next_cursor": "MjAyNi0wNC0xNFQwMTo0NToxMHwxMjM",
  "rows": [
    {
      "id": 123,
      "camera_id": "mba-cam",
      "ts": "2026-04-14T01:45:10+00:00",
      "thumb_url": "/api/v1/images/gems/123/image?size=thumb",
      "full_url": "/api/v1/images/gems/123/image?size=1920",
      "width": 1280,
      "height": 720,
      "scene": "brooder",
      "bird_count": 22,
      "activity": "sleeping",
      "lighting": "heat-lamp",
      "composition": "group",
      "image_quality": "sharp",
      "individuals_visible": ["chick", "chick", "chick"],
      "any_special_chick": false,
      "apparent_age_days": 7,
      "caption_draft": "A group of young chicks huddled under the heat lamp in the brooder.",
      "share_reason": "Warm lighting, clear composition, chicks visible and resting peacefully."
    }
    // ...
  ]
}
```

Notes: `total_estimate` is a cheap COUNT(*) bounded at 10000 (beyond that, set to `10000` and flag `"estimated": true` in the JSON). `individuals_visible` is the CSV field parsed to array at the API boundary.

**`GET /api/v1/images/gems/{id}`**

Single gem with full public metadata. Returns 404 if:
- Row doesn't exist
- Row has `has_concerns=1` (defense in depth — the URL is guessable; you might try hitting `/gems/{id}` for a concerns row)
- Row has `share_worth != 'strong'` (same reason — enforce the "gems endpoint = strong only" invariant)
- Row has `image_path IS NULL` (post-retention or skip)

Response: same shape as a single row from `/gems` plus:
- `related` — up to 4 other gem IDs from the same camera_id in the ±2-hour window, for "next/prev in stream" UI

**`GET /api/v1/images/gems/{id}/image`**

Binary JPEG. Same 404 rules as `/gems/{id}`.

Query param `size`:
- `thumb` — 480px long edge, q=80, `Cache-Control: public, max-age=86400, immutable`
- `1920` — 1920px long edge (or native if smaller), q=85, `Cache-Control: public, max-age=86400, immutable`
- `full` — stored resolution (note: `decent` tier is already downscaled to 1920; `strong` tier is native)

Thumbnails generated lazily with Pillow, cached under `data/cache/thumbs/{sha256}-{size}.jpg`. Cache populates on first request; serve from disk on subsequent hits. `ETag` header is the sha256.

**`GET /api/v1/images/recent`**

Recent rows, any tier except `skip`, newest first. Used by the homepage rail. Filters `has_concerns=0`.

Query params same as `/gems` but also:
- `tier` — filter by `image_tier` (repeatable; e.g. `?tier=strong&tier=decent`). Default: `strong,decent`.

Response: same row shape as `/gems` plus one extra field per row: `image_tier: "strong" | "decent"`. Frontend can surface a badge/tint difference.

**`GET /api/v1/images/stats`**

Aggregate counts for badges and hero copy.

Query params:
- `since` — ISO date lower bound. Default: 7 days ago.

Response:
```json
{
  "range": { "since": "2026-04-07T00:00:00+00:00", "until": "2026-04-14T23:59:59+00:00" },
  "total_rows": 8241,
  "by_tier": { "strong": 412, "decent": 2103, "skip": 5726 },
  "by_camera": { "mba-cam": 2016, "usb-cam": 3360, "gwtc": 1008, "house-yard": 1008, "s7-cam": 849 },
  "by_scene": { "brooder": 5200, "coop": 1008, "yard": 1008, "other": 25, "nesting-box": 0, "sky": 0 },
  "by_activity": { "none-visible": 4200, "foraging": 1200, "eating": 800, "sleeping": 700, "preening": 150, "dust-bathing": 80, "alert": 50, "sparring": 20, "huddling": 10, "drinking": 8, "other": 23 },
  "birdadette_sightings": 47,
  "oldest_ts": "2026-04-07T03:12:45+00:00",
  "newest_ts": "2026-04-14T23:58:11+00:00"
}
```

All counts filter `has_concerns=0` — these are public stats, not the full dataset.

**`GET /api/v1/images/search`** *(v0.2 — optional)*

Free-text search over `caption_draft` via SQLite FTS5. Out of scope for v0.1 since captions are templated and repetitive; revisit once captions accumulate genuine variety.

#### Private endpoints — auth-gated (Boss-only review UI)

All `/review/*` endpoints require `Authorization: Bearer <token>` where the token matches the `GUARDIAN_REVIEW_TOKEN` env var on the Mini. Missing/wrong → 403 + audit log entry.

**`GET /api/v1/images/review/queue`**

Full recent feed INCLUDING `has_concerns=1` rows. Supports all filter params from `/recent` plus:
- `tier` — can include `skip` (no other endpoint allows this)
- `only_concerns` — bool; default false. When true, returns only `has_concerns=1` rows.
- `only_unreviewed` — bool; default false. When true, returns rows with no entry in `image_archive_edits`.

Response rows include every field including `concerns`, `share_reason`, `vlm_json`.

**`POST /api/v1/images/review/{id}/promote`**

Body: `{ "reason": "optional string ≤500 chars" }`.
Effect: `share_worth` → `strong`, creates hardlink into `gems/` if not already there, writes an `image_archive_edits` row with `action='promote'`.

**`POST /api/v1/images/review/{id}/demote`**

Body: `{ "reason": "optional string ≤500 chars" }`.
Effect: `share_worth` → `skip`, unlinks the `gems/` hardlink if present, leaves `archive/` JPEG (it'll expire at retention), writes an edit row.

**`POST /api/v1/images/review/{id}/flag`**

Body: `{ "note": "required string ≤500 chars" }`.
Effect: appends `note` to the row's `concerns[]` in `vlm_json`, sets `has_concerns=1`, hardlinks into `private/`, writes an edit row. Row immediately vanishes from public endpoints.

**`POST /api/v1/images/review/{id}/unflag`**

Body: `{ "reason": "required string ≤500 chars" }`.
Effect: clears `concerns[]`, sets `has_concerns=0`, removes the `private/` hardlink. Writes an edit row. Restores row to public visibility per its `share_worth`.

**`DELETE /api/v1/images/review/{id}`**

Body: `{ "reason": "required string ≤500 chars" }`.
Effect: deletes JPEG + sidecar + all hardlinks + writes edit row with `action='delete'`. **Keeps the `image_archive` row** (sets `image_path=NULL`) so audit history persists. To fully purge, the `action='purge'` variant also deletes the row — reserved for actual-data-mistake cleanups and requires a second confirmation token.

**`GET /api/v1/images/review/edits`**

Read the audit log. Query params: `since`, `until`, `action`, `limit`, `cursor`. Returns rows from `image_archive_edits`.

#### New tables

**`image_archive_edits`**

```sql
CREATE TABLE IF NOT EXISTS image_archive_edits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  target_image_id INTEGER NOT NULL REFERENCES image_archive(id),
  ts TEXT NOT NULL DEFAULT (datetime('now')),
  action TEXT NOT NULL,  -- 'promote' | 'demote' | 'flag' | 'unflag' | 'delete' | 'purge'
  actor TEXT,            -- future: user id; for now always 'boss' or 'pipeline-auto'
  note TEXT,
  request_id TEXT,
  pre_state TEXT,        -- JSON snapshot of the row's relevant fields before the edit
  post_state TEXT        -- JSON snapshot after
);

CREATE INDEX IF NOT EXISTS idx_edits_target ON image_archive_edits(target_image_id);
CREATE INDEX IF NOT EXISTS idx_edits_ts ON image_archive_edits(ts);
CREATE INDEX IF NOT EXISTS idx_edits_action ON image_archive_edits(action);
```

**`caption_overrides`** *(v0.2, not v0.1)*

When Boss edits a caption in the review UI, the edit needs to persist somewhere — we don't want to mutate `vlm_json` because that's the raw-model-output record. A separate table:

```sql
CREATE TABLE IF NOT EXISTS caption_overrides (
  image_id INTEGER PRIMARY KEY REFERENCES image_archive(id),
  caption TEXT NOT NULL,
  edited_at TEXT NOT NULL DEFAULT (datetime('now')),
  editor TEXT
);
```

Reader helpers should `COALESCE(caption_overrides.caption, vlm_json.caption_draft)` when building `GemRow.caption_draft`. Rename the response field to `caption` + include `caption_is_override: bool` for UI to indicate "hand-edited vs. draft" state.

#### Implementation notes for the backend agent

- **Repository pattern.** Add query helpers to `database.py` — `get_gems(filters)`, `get_gem(id)`, `get_recent(filters)`, etc. Handlers in `api.py` are thin; they only parse query params, call the repository, and shape the response.
- **No new DB engine.** All of this lives in `data/guardian.db`. Do not stand up PostgreSQL, MongoDB, or object storage for v0.1.
- **Pillow for thumbnails.** Already a farm-guardian dependency. Implement once; reuse the existing JPEG-decode path from `store.py`.
- **Env var validation.** Crash loudly at startup if `GUARDIAN_REVIEW_TOKEN` is unset when review endpoints are enabled (configurable via another env). Don't silently run with auth disabled.
- **Never auto-load the review token into public response bodies** (e.g., in a "config" echo endpoint). Grep the codebase for `GUARDIAN_REVIEW_TOKEN` uses; it should appear only in the auth middleware.
- **Run DB writes inside a transaction** for review endpoints — `BEGIN IMMEDIATE` → update `image_archive` + insert `image_archive_edits` + touch hardlinks → `COMMIT`. Rollback on hardlink IO errors.

### 2.b Layer 2 — Shared types in `app/components/guardian/types.ts`

Extend the existing file. Add at the bottom, after the PTZ types, with a banner comment pointing here. Don't create a new `image-types.ts` — types.ts is the SSoT for every Guardian API interaction.

```typescript
// ---------------------------------------------------------------------------
// Image archive — curated frames from the multi-camera pipeline.
// Populated by farm-guardian/tools/pipeline/ (see farm-guardian v2.23.0 and
// farm-2026/docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md).
//
// RULES THAT BIND:
//   - has_concerns=1 rows must NEVER reach this type. Public responses omit
//     concerns entirely; if you see the field in a Gem response, the backend
//     is broken.
//   - Captions are drafts until overridden. Render as "Draft caption: …" or
//     use an edit flow. Never style as final editorial copy.
//   - apparent_age_days: backend uses -1 as "n/a"; we normalize to null here.
// ---------------------------------------------------------------------------

export type Scene = "brooder" | "yard" | "coop" | "nesting-box" | "sky" | "other";
export type Activity =
  | "huddling" | "eating" | "drinking" | "dust-bathing" | "foraging"
  | "preening" | "sleeping" | "sparring" | "alert" | "none-visible" | "other";
export type Lighting = "natural-good" | "heat-lamp" | "dim" | "blown-out" | "backlit" | "mixed";
export type Composition = "portrait" | "group" | "wide" | "cluttered" | "empty";
export type ImageQuality = "sharp" | "soft" | "blurred";
export type ShareWorth = "skip" | "decent" | "strong";
export type IndividualTag = "birdadette" | "adult-survivor" | "chick" | "unknown-bird";

export interface GemRow {
  id: number;
  camera_id: string;                // keep as string; CameraName may drift
  ts: string;                       // ISO 8601 with timezone
  thumb_url: string;                // absolute path on guardian.markbarney.net
  full_url: string;
  width: number;
  height: number;
  scene: Scene;
  bird_count: number;
  activity: Activity;
  lighting: Lighting;
  composition: Composition;
  image_quality: ImageQuality;
  individuals_visible: IndividualTag[];
  any_special_chick: boolean;
  apparent_age_days: number | null; // -1 in backend → null here
  caption_draft: string;
  share_reason: string;             // present on list endpoints; safe because public
  caption_is_override?: boolean;    // v0.2; absent in v0.1 responses
}

export interface RecentRow extends GemRow {
  image_tier: "strong" | "decent";
}

export interface ImageListResponse<T> {
  count: number;
  total_estimate: number;
  next_cursor: string | null;
  rows: T[];
}

export interface ImageStats {
  range: { since: string; until: string };
  total_rows: number;
  by_tier: Record<"strong" | "decent" | "skip", number>;
  by_camera: Record<string, number>;
  by_scene: Record<Scene, number>;
  by_activity: Record<Activity, number>;
  birdadette_sightings: number;
  oldest_ts: string;
  newest_ts: string;
}

export interface ImageError {
  error: { code: string; message: string; detail?: unknown };
  request_id: string;
}

// Review types (auth-gated; Boss-only UI — do NOT import these into
// components rendered for unauthenticated visitors).
export interface ReviewRow extends GemRow {
  share_worth: ShareWorth;
  image_tier: "strong" | "decent" | "skip";
  has_concerns: boolean;
  concerns: string[];
  vlm_json: string;
}

export interface ReviewEdit {
  id: number;
  target_image_id: number;
  ts: string;
  action: "promote" | "demote" | "flag" | "unflag" | "delete" | "purge";
  actor: string | null;
  note: string | null;
  request_id: string | null;
}
```

### 2.c Layer 3 — Frontend components

Four user-facing surfaces, in priority order. All under `app/components/gems/` so they share conventions.

#### 2.c.1 — `/gallery/gems` public curated gallery (HIGH PRIORITY — first feature to ship)

**Responsibility:** browsable wall of the latest gems with filters and a lightbox.

**Files:**

```
app/gallery/gems/page.tsx        — route entry (server component)
app/components/gems/
  GemsGallery.tsx                — server component; server-renders the first page, hands off to client for lightbox/pagination
  GemsGalleryClient.tsx          — 'use client'; filter state, load-more, lightbox coordination
  GemCard.tsx                    — single card (thumb, badges, caption preview)
  GemLightbox.tsx                — full-size modal with caption, metadata, prev/next
  GemFilters.tsx                 — filter bar (camera, activity, individual, date range)
  GemLoadMore.tsx                — cursor-paginated load-more button with Suspense fallback
lib/gems.ts                      — typed fetch helpers; lives with other content loaders
```

**Behavior:**

- Server-renders the first 24 cards (SEO + first-paint).
- Filter changes push to URL as query params and re-fetch. Deep-linkable.
- "Load more" button at the bottom; cursor-based; 24 more per click.
- Click a card → lightbox opens with `full_url` image + full caption + metadata pills + prev/next buttons.
- Lightbox keyboard support: left/right arrows, Escape to close.
- Card badges (small, understated): camera label (hardware name), activity, special-chick indicator. Derived strings, not hardcoded.
- Caption rendered as the literal `caption_draft` string. No "Caption:" prefix; just the sentence. Styled slightly muted (not body weight).
- Mobile-responsive: 1-column on small, 2-column on md, 3-column on lg, 4-column on xl.
- Fade-in on image load to hide the blank-box moment during JPEG fetch.

**Data contract:** uses `fetchGems(params)` from `lib/gems.ts`. Server-side cache: `next: { revalidate: 300 }` (5-minute). No client-side cache library; Next's revalidation is enough for v0.1.

**Filter UX:**

- Camera chips (multi-select; derived from `CAMERAS` in `lib/cameras.ts` — hardware labels only)
- Activity chips (multi-select; derived from the `Activity` enum)
- Individual chips: Birdadette / Adults / Chicks / Other
- Date range: presets ("Today", "This week", "This month", "All time") + custom
- Clear-all button; reset to defaults

**Empty state:** "No gems match these filters yet. Try broadening your filters or check back — the pipeline adds new images every few minutes." Include a link to the blog post explaining the pipeline (write it separately).

**Error state:** "The gems gallery is temporarily unavailable. Live feeds are still available on the Guardian page." Link to `/projects/guardian`.

#### 2.c.2 — Homepage "Latest from the Flock" rail (MEDIUM PRIORITY)

**Responsibility:** horizontal rail of 6 latest recent frames on the homepage, sitting alongside existing `FlockPreviewStrip`.

**Where:** insert into `app/components/home/` as `LatestFlockFrames.tsx`. Add `<LatestFlockFrames />` to `app/page.tsx` between `FlockPreviewStrip` and `LatestFieldNote` (or whichever section matches editorial intent — coordinate with Boss).

**Behavior:**

- Server-fetches 6 rows via `fetchRecent({ tier: 'strong,decent', limit: 6 })`. Strong+decent so the rail always has content even on quiet days.
- Each tile is a `GemCard` with `variant="compact"` — no filter chips, shorter caption preview.
- "See all" link to `/gallery/gems`.
- Revalidates every 5 minutes.

**Never show:** `has_concerns=1` rows (public endpoint already filters; defense-in-depth anyway).

#### 2.c.3 — Birdadette retrospective (MEDIUM PRIORITY; becomes HIGH as she ages)

**Responsibility:** one-portrait-per-day-of-life timeline of Birdadette's first year.

**Where:** either `/flock/birdadette` (if we want it on the bird roster) or `/projects/birdadette-retrospective` (if we want it as a milestone project). Pick one; don't ship both.

**Files:**

```
app/flock/birdadette/page.tsx    — route entry
app/components/gems/
  BirdadetteTimeline.tsx         — day-by-day grid
  BirdadetteHero.tsx             — latest/best portrait at the top
  BirdadetteStats.tsx            — sightings count, best-sharpness chart
lib/birdadette.ts                — dedicated fetch helpers
```

**Behavior:**

- Hero section: most recent `share_worth='strong'` frame of Birdadette, or (if none yet) the best-sharpness frame of her.
- Timeline: one tile per `apparent_age_days` value (bucket), showing the best-sharpness portrait from that day. Null-age rows excluded.
- Click a tile → lightbox same as gems gallery.
- Side panel: stats (total sightings, first seen date, latest seen date, current estimated age).

**Data contract:** uses `fetchBirdadettePortraits()` — backend endpoint `/api/v1/images/gems?individual=birdadette&composition=portrait&order=newest&limit=100`. Frontend groups by `apparent_age_days` and picks the best-sharpness per bucket.

**Alternative data strategy (v0.2):** dedicated backend endpoint `/api/v1/images/birdadette` that does the bucket-and-pick server-side, returning one row per age-day. Saves client compute and network; moves the logic where it belongs.

**Scales to:** 365 days × ~1 tile/day = ~365 tiles. Virtualize the grid if performance bites (unlikely at this volume; revisit if tile count crosses 200 with visible lag).

#### 2.c.4 — `/review` Boss-only review UI (LOWER PRIORITY — folder view works today)

**Responsibility:** promote/demote/flag/caption-edit UI, gated by bearer auth.

**Gate:** read token from `?token=…` in URL (one-time entry), store in `sessionStorage`, send as `Authorization: Bearer` on every fetch. Or implement proper auth via Clerk/next-auth — up to whoever builds it.

**Views:**

- Queue: infinite-scroll feed of recent rows, filterable, with action buttons per card.
- Concerns: same but filtered to `has_concerns=1`.
- Edits log: audit trail view.

**Actions:** promote / demote / flag / unflag / delete. Each requires a reason string (short confirm modal).

**Deferral rationale:** Boss currently reviews gems by `open data/gems/` in Finder on the Mini. This works fine for the first weeks. Build the web review UI when:
- Gems accumulate past ~100/week and Finder-browse becomes annoying, OR
- Boss is away from the Mini and wants to review from elsewhere, OR
- Concerns reviews need an actual workflow (not just "look at the folder")

### 2.d Layer 4 — Shared rules that bind

**Repeat for emphasis — these are non-negotiable:**

1. **`has_concerns=1` never reaches a public endpoint or component.** Three-layer filter.
2. **No owner name in captions, filenames, public strings.**
3. **Camera labels are hardware-only.** `mba-cam`, not "brooder."
4. **Captions are drafts.** Label or enable editing.
5. **`apparent_age_days = -1` is a sentinel.** Convert to `null` at the API boundary; never render "-1 days old."
6. **Don't mutate `vlm_json`.** Caption edits and concerns flags go to separate tables.
7. **Never display GLM counts or ages as authoritative.** Use them for binning, density, bucketing. Not as ground truth.

### 2.e Cross-camera identity (future concern, document now)

The brooder is covered by two cameras. Birdadette seen on both emits two rows. If we're surfacing "Birdadette sightings today" as a stat, we double-count.

**Current state:** raw per-row count (double-counts acknowledged).

**Fix (v0.2):** add a `scene_id` column — a fuzzy-hash of (scene + camera_group + 5-minute-window) — that lets us dedup. Cameras in the same scene can share a `scene_id` for the same temporal bucket. For public counts, use `COUNT(DISTINCT scene_id)` instead of `COUNT(*)`.

This is intentionally deferred. Noting the issue so the next dev doesn't accidentally spec a feature that relies on per-row counts as if they were per-event counts.

### 2.f Instagram auto-post (possible v0.3 feature — document, don't build)

Existing site has `content/instagram-posts.json` + an InstagramFeed component. The gems dataset + caption drafts put an auto-post pipeline in reach:

**Shape:**

1. Nightly job on the Mini picks the best gem from the last 24h (`share_worth='strong'` + `image_quality='sharp'` + max `laplacian_var`).
2. Job writes a draft Instagram-post record with `image_url`, `caption_draft`, `ts`, `status: 'pending_review'`.
3. Boss has a `/review/instagram-queue` endpoint/page to approve or reject each draft.
4. Approved drafts hit Instagram's Graph API.

**Why not v0.1:** Instagram Graph API requires a Facebook Page + Business Verification, and the current site doesn't talk to Instagram for posting (only embeds). Substantial integration work for a feature that's "nice to have" not "need."

**Tangentially:** the dedup concern (2.e) matters here — don't post two almost-identical brooder frames captured one minute apart on separate cameras. Require min-interval and scene-variance checks.

### 2.g Caption variety (operational concern)

GLM repeats phrasing. Of the first ~100 rows, captions cluster into maybe 20 distinct sentences. For archive this is fine; for Instagram or any "featured caption" display it's a problem.

**Mitigations (choose one when this becomes pressing):**

- **Dedup on display.** Frontend groups cards by exact-caption-match; shows the highest-share-worth frame per caption.
- **Prompt for variety.** Add to the GLM prompt: "Describe each image with a fresh sentence; do not repeat exact phrasings from prior responses." Caveat: GLM doesn't actually have memory across calls, so this is fuzzy at best.
- **Second-pass caption model.** For Instagram candidates only, run a second LLM pass with a dedicated "write a fresh social-ready caption for this image given these metadata fields" prompt. Higher cost; better output.
- **Boss-edited captions.** The `caption_overrides` table and review UI let Boss rewrite in his voice; Instagram posts use overridden captions when present.

Defer until the archive grows enough that repetition is user-visible.

---

## Part 3 — Implementation TODOs (ordered)

**Phase 0 — Prerequisites (BLOCKERS):**

0.1. Approve this plan doc. It's draft-status until Boss signs off.
0.2. Add `GUARDIAN_REVIEW_TOKEN` to the Mini's env (e.g., `~/.farm-guardian.env`). Keep it out of git.
0.3. Confirm the Cloudflare tunnel can route new paths under `/api/v1/images/` (test with a temporary echo endpoint; verify `curl https://guardian.markbarney.net/api/v1/images/ping` returns).

**Phase 1 — Backend (farm-guardian). Nothing frontend ships without this:**

1.1. Write a separate plan doc: `farm-guardian/docs/{DD-Mon-YYYY}-image-archive-api-plan.md`. This current doc is the cross-repo overview; that one is the backend-internal spec. Follow `CODING_STANDARDS.md` plan requirements.
1.2. Add repository helpers to `farm-guardian/database.py` — `get_gems(filters)`, `get_gem(id)`, `get_recent(filters)`, `get_stats(since)`, `append_edit(...)`, `update_share_worth(...)`, `append_concern(...)`.
1.3. Create `farm-guardian/images_api.py` with the route handlers (keep `api.py` thin; the image surface is big enough to deserve its own module). Wire into the FastAPI app in `api.py`.
1.4. Implement the 5 public GET endpoints + image-bytes endpoint. Pillow for thumbnails; cache under `data/cache/thumbs/`.
1.5. Add the `has_concerns=0` filter at every public query + unit test that regressions fail loudly.
1.6. Add `/api/v1/images/stats` aggregate endpoint.
1.7. Add bearer-auth middleware; validate env var at startup; require it on every `/review/*` route.
1.8. Add the 4 review POST endpoints + DELETE + edits-audit table + transactional wrapping.
1.9. Add `image_archive_edits` DDL to `store.ensure_schema()` (idempotent addition).
1.10. CHANGELOG bump: farm-guardian v2.24.0 — "Image archive REST surface + review endpoints."
1.11. Smoke-test over the tunnel: `curl https://guardian.markbarney.net/api/v1/images/stats`, `curl .../gems?limit=3`, `curl -I .../gems/{id}/image?size=thumb`.

**Phase 2 — Frontend types + loaders (farm-2026):**

2.1. Extend `app/components/guardian/types.ts` with the types from Part 2.b. Banner comment pointing here.
2.2. Add `lib/gems.ts` with `fetchGems()`, `fetchGem()`, `fetchRecent()`, `fetchImageStats()`. Use `next: { revalidate: 300 }`. Typed error handling (reject with `ImageError` shape).
2.3. Add `lib/birdadette.ts` with retrospective helper.

**Phase 3 — Frontend components (farm-2026):**

3.1. Build `GemCard`, `GemLightbox`, `GemFilters`, `GemLoadMore`. Unit test nothing (no test suite); eyeball against real data from the tunnel in dev mode.
3.2. Build `GemsGallery` + `GemsGalleryClient`. Wire up the `/gallery/gems` route.
3.3. Build `LatestFlockFrames` for the homepage rail.
3.4. Build `BirdadetteTimeline`, `BirdadetteHero`, `BirdadetteStats`. Wire up the `/flock/birdadette` or `/projects/birdadette-retrospective` route.
3.5. Defer the `/review` UI.
3.6. Update `docs/FRONTEND-ARCHITECTURE.md` — add SSoT table row, add "How to add a gallery section" paragraph.
3.7. CHANGELOG bumps per feature surface.

**Phase 4 — Polish + observability:**

4.1. Add a ping widget showing "N gems this week" somewhere discreet (footer? About page?). Uses `/stats`. Visible signal that the pipeline is alive.
4.2. Write an MDX field note introducing the gallery. Written by Boss in his voice; not auto-generated.
4.3. Grep the built Railway bundle for Boss's name in any HTML/JSON. Must return zero results. If any, trace back through captions or hardcoded strings.
4.4. Monitor `image_quality='sharp'` rates per camera over the first week; if fixed-focus cameras still never get `sharp`, iterate on the prompt again.

**Verification checklist for "feature complete":**

- [ ] `curl https://guardian.markbarney.net/api/v1/images/gems?limit=3` returns 3 JSON rows from Railway's IP.
- [ ] Fetching `thumb_url` returns an `image/jpeg` under 100 KB with a valid ETag.
- [ ] A concerns-flagged row is invisible on `/api/v1/images/gems`, `/recent`, `/stats`, and every frontend component. Unit test: POST a flag to a known row via `/review/{id}/flag`, then GET `/gems` and confirm it's gone.
- [ ] `/gallery/gems` in dev mode shows real brooder and yard frames.
- [ ] Clicking a card opens the lightbox; keyboard nav works; Escape closes.
- [ ] Homepage rail shows recent frames; no `has_concerns=1` leaks.
- [ ] Birdadette retrospective shows a timeline, one tile per age-day where she was visible and portrait-composed.
- [ ] No proper names in any caption rendered anywhere.
- [ ] Camera labels are hardware-only in every UI string (grep the built app).
- [ ] Offline behavior: if Cloudflare tunnel drops, the gallery page shows the error state, not a JS error.

---

## Part 4 — Failure modes catalog

Designing for what breaks, in priority order.

**F1. Cloudflare tunnel drops.**
Symptoms: all `fetch` to `guardian.markbarney.net` times out or returns 5xx.
Handling: components show error state with "live feeds still up" messaging. Next cache still serves previously-fetched data on `revalidate: 300` for up to 5 minutes. Log and alert (future monitoring).

**F2. Mac Mini crashes / rebooted.**
Symptoms: tunnel still up (Cloudflare daemon on Mini restores on boot) but Guardian takes 30-60 s to come back. `/stats` returns stale or empty.
Handling: same as F1 — error state on components. Pipeline auto-resumes; no manual intervention needed if launchd plist is installed (see Phase 4 todo).

**F3. LM Studio crashed / different model loaded.**
Symptoms: no new rows hitting `image_archive`. Pipeline logs "VLM skip — model_not_loaded" per cycle.
Handling: pipeline logs and skips; dataset stops growing but existing rows remain queryable. Surface: a tiny "paused" indicator in the `/gallery/gems` header when `newest_ts` is more than ~1 hour old. Don't page the user; the dataset is still there.

**F4. GLM goes temporarily off-schema.**
Symptoms: rows with `share_worth='skip'` AND `image_path IS NULL` AND `vlm_json` containing error traceback.
Handling: these rows are already filtered out (skip tier, no path). Non-issue for public rendering.

**F5. Camera drops off network.**
Symptoms: `capture` errors in the pipeline log; that camera's row count stops growing.
Handling: existing rows remain. Stats show uneven per-camera distribution (useful signal). `camera_online` is NOT reflected in the image-archive data; it's in Guardian's `/api/v1/status` — surface that separately.

**F6. JPEG file missing but DB row says path exists.**
Symptoms: 404 on `/gems/{id}/image`, 200 on `/gems/{id}`.
Handling: image endpoint returns a placeholder ("Image retained only as metadata") JPEG. Metadata endpoint unchanged. Caller can degrade gracefully (show caption + stats, hide thumbnail).

**F7. Hardlink filesystem corruption.**
Symptoms: `gems/` has orphan files that don't match archive; vice versa.
Handling: periodic reconciliation script walks `gems/`, looks up by sha256 in DB, removes orphans. Reserve as an ops-level script; not in the hot path.

**F8. Review action conflicts.**
Symptoms: two concurrent `POST /review/{id}/promote` + `/demote` calls.
Handling: transactional DB update + last-write-wins on the row; both edits log in `image_archive_edits`. Actor can reconstruct order from `ts` in the audit log. In practice this is a single-operator system; rare.

**F9. Retention sweep deletes a JPEG that's in `gems/`.**
Symptoms: can't happen if hardlinks are used correctly. The retention sweep only unlinks the `archive/` path, not the `gems/` link. If it does happen, the `gems/` JPEG persists (hardlink keeps inode alive). Verify with a unit test that retention.py respects hardlinks.

**F10. Malformed query params.**
Symptoms: 400 from backend.
Handling: Pydantic validation errors rendered as the standard error shape. Frontend shows a filter-error hint.

**F11. Caption contains Boss's name despite prompt.**
Symptoms: QA grep finds it.
Handling: add the specific phrasing to the prompt's negative examples, ship a prompt update, regenerate metadata for affected rows (or mask them). Escalate to a Prompt Review incident; don't silently fix.

---

## Part 5 — Useful SQL (query catalog)

For the backend repository layer, the review UI, or ad-hoc Boss queries over SSH. Tested against the current `image_archive` schema; copy-paste ready.

```sql
-- Recent gems, newest first (the main public query)
SELECT id, camera_id, ts, image_path, scene, bird_count, activity,
       lighting, composition, image_quality,
       json_extract(vlm_json, '$.caption_draft') AS caption,
       json_extract(vlm_json, '$.share_reason') AS reason
FROM image_archive
WHERE share_worth = 'strong'
  AND has_concerns = 0
  AND image_path IS NOT NULL
ORDER BY ts DESC
LIMIT 24;

-- Today's Instagram candidates (strong + sharp + non-empty)
SELECT id, camera_id, image_path,
       json_extract(vlm_json, '$.caption_draft') AS caption
FROM image_archive
WHERE share_worth = 'strong'
  AND image_quality = 'sharp'
  AND bird_count > 0
  AND has_concerns = 0
  AND date(ts) = date('now');

-- Birdadette portrait-per-age-day (retrospective)
WITH ranked AS (
  SELECT id, camera_id, ts, image_path, apparent_age_days, laplacian_var,
         json_extract(vlm_json, '$.caption_draft') AS caption,
         ROW_NUMBER() OVER (PARTITION BY apparent_age_days ORDER BY laplacian_var DESC) AS rk
  FROM image_archive
  WHERE individuals_visible_csv LIKE '%birdadette%'
    AND composition = 'portrait'
    AND image_quality IN ('sharp', 'soft')
    AND has_concerns = 0
    AND image_path IS NOT NULL
)
SELECT * FROM ranked WHERE rk = 1 ORDER BY apparent_age_days;

-- Activity audit per day, per camera
SELECT date(ts) AS day, camera_id, activity, COUNT(*) AS n
FROM image_archive
WHERE ts > date('now', '-7 days')
  AND has_concerns = 0
GROUP BY day, camera_id, activity
ORDER BY day DESC, camera_id, n DESC;

-- Private review queue (concerns, Boss-only)
SELECT id, camera_id, ts, image_path, vlm_json
FROM image_archive
WHERE has_concerns = 1
ORDER BY ts DESC;

-- Stats snapshot (per /api/v1/images/stats)
SELECT
  COUNT(*) AS total_rows,
  SUM(CASE WHEN share_worth = 'strong' THEN 1 ELSE 0 END) AS strong,
  SUM(CASE WHEN share_worth = 'decent' THEN 1 ELSE 0 END) AS decent,
  SUM(CASE WHEN share_worth = 'skip'   THEN 1 ELSE 0 END) AS skip_count,
  SUM(CASE WHEN individuals_visible_csv LIKE '%birdadette%' THEN 1 ELSE 0 END) AS birdadette
FROM image_archive
WHERE has_concerns = 0
  AND ts > date('now', '-7 days');

-- Per-camera health (most-recent-row per camera — if this is hours old, camera is down)
SELECT camera_id, MAX(ts) AS last_seen, COUNT(*) AS rows_24h
FROM image_archive
WHERE ts > datetime('now', '-1 day')
GROUP BY camera_id;

-- Orphan gem files (hardlinks that don't match DB rows) — ops script
-- (Python-side comparison; not a pure SQL query.)
```

---

## Part 6 — Evolution (what happens at scale)

**At ~10K rows:** SQLite is still comfortable. Queries hit the indices. No action needed.

**At ~100K rows (~3 months of continuous operation):** Still SQLite-comfortable. Start considering:
- Partitioning the archive folder structure deeper (`{YYYY-MM-DD}/` instead of `{YYYY-MM}/`) if directory listings get slow.
- Adding materialized-view-style summary tables (`daily_rollups`) for the stats endpoint if COUNT-heavy queries get slow.

**At ~1M rows:** Possibly migrate to Postgres per farm-guardian CLAUDE.md's Phase 5 vision. Schema is portable; repository layer makes the switch mechanical.

**Storage growth:** 3.3 GB/90 days steady. At the current rate the Mini doesn't fill disk for years. If storage becomes an issue: (a) tighten retention on `decent`, (b) archive older `gems` to external drive or S3, (c) keep full-res `strong` only, regenerate smaller sizes on demand.

**Prompt evolution:** Every prompt change produces a different `vlm_prompt_hash` cohort. Downstream analysis should group by hash before computing "activity mix" or similar metrics; a prompt that changed the `activity` enum meaning would otherwise pollute trends.

**Model upgrade path:** When a better local vision model appears, add it to LM Studio, update `vlm_model` in pipeline config, keep running. The `vlm_model` column lets analytics isolate the old/new cohorts. Don't retroactively re-enrich; it's cheap data, let it age.

**Schema changes:** Additive only — new columns with defaults, new indices, new tables. Never rename or drop a column while farm-2026 has a TypeScript type pinning the old shape. Coordinate changes via this plan doc + a PR pair (backend shape change → frontend type change → deploy together).

---

## Part 7 — Docs / CHANGELOG touchpoints

**farm-guardian changes will require:**

- `docs/{DD-Mon-YYYY}-image-archive-api-plan.md` — backend spec (separate plan, references this doc)
- `docs/{DD-Mon-YYYY}-image-archive-review-ui-plan.md` — review UI spec (when that work starts)
- `CHANGELOG.md` — one entry per major release (v2.24.0 API surface; v2.25.0 review endpoints; etc.)
- `CLAUDE.md` — add bullet under "Architecture / Modules" describing `images_api.py` + `tools/pipeline/` role

**farm-2026 changes will require (when implementation ships):**

- `docs/FRONTEND-ARCHITECTURE.md` — SSoT table row, "How to add a gem surface" section, caption-rules reminder
- `CHANGELOG.md` — entry per feature surface (gems gallery, homepage rail, retrospective, review UI)
- `app/components/guardian/types.ts` — prefix comment pointing here
- `README.md` — one-paragraph mention of the gallery page with a link to this plan

---

## Part 8 — Glossary

- **Archive** — the full collection of image_archive DB rows + JPEGs on disk. Includes everything: skip, decent, strong, concerns.
- **Gem** — any frame with `share_worth='strong'` AND `has_concerns=0`. Public-facing curated subset.
- **Private / Concerns** — any frame with `has_concerns=1`. Boss-only; never public.
- **Tier** — `skip` / `decent` / `strong`. Drives storage behavior (no-JPEG / downscaled / full-res).
- **Cycle** — one pipeline iteration for one camera: capture → quality gate → VLM → store. ~15-40 s elapsed.
- **Enrichment** — the VLM call that produces metadata for a captured frame.
- **Pipeline** — `farm-guardian/tools/pipeline/`. The daemon that runs cycles on per-camera cadences.
- **Sidecar** — the `.json` file next to a stored JPEG. Same metadata as the DB row; filesystem-durable.
- **Bucket / age-day** — `apparent_age_days` used as a grouping key (all rows with age=7 in the same bucket).
- **Review token** — the bearer secret in `GUARDIAN_REVIEW_TOKEN` that guards the Boss-only review endpoints.

---

## Part 9 — What this doc is NOT

- **Not a backend API spec.** Part 2.a is the contract; the full spec (request/response schemas, error codes, middleware order, SQL pagination cursor design) goes in a separate farm-guardian plan doc.
- **Not a design review.** No mockups, no wireframes, no typography decisions. Use existing design tokens (`--color-guardian-*`, cream/forest/wood palette) and primitives (`SectionHeader`, `BirdCard`). Add new primitives only after the pattern repeats 3+ times.
- **Not a product roadmap.** The retrospective, Instagram auto-post, daily digest, anomaly alerts — all possible, all out of scope for the first cut.
- **Not an ML/model spec.** GLM 4.6v-flash is the current model; swap it when a better one lands. Pipeline tracks which model produced which row (`vlm_model` column); downstream consumers treat row cohorts accordingly.

---

## Part 10 — Onboarding read-order

For the next developer (human or AI) coming to this subsystem cold, read in this order:

1. **`farm-2026/docs/FRONTEND-ARCHITECTURE.md`** — the SSoT rules, naming, component layout, the 13-Apr rewrite philosophy.
2. **This doc** — the dataset + cross-repo plan.
3. **`farm-guardian/docs/13-Apr-2026-multi-cam-image-pipeline-plan.md`** — the pipeline plan (shipped in v2.23.0).
4. **`farm-guardian/docs/13-Apr-2026-lm-studio-reference.md`** — how Guardian talks to local VLMs safely (watchdog incident post-mortem is in there too).
5. **`farm-guardian/CHANGELOG.md`** v2.23.0 — the implementation report.
6. **`farm-guardian/tools/pipeline/prompt.md`** — the actual GLM prompt. Know what the model sees.
7. **`farm-guardian/tools/pipeline/schema.json`** — the JSON schema GLM's response is validated against.
8. **This repo's `lib/cameras.ts`** — the canonical camera registry that the frontend consumes.
9. **This repo's `app/components/guardian/types.ts`** — the existing shared types.

Everything else is reachable from there.

---

## Part 11 — Cross-reference anchors

For "where did this go" searches later.

- **Canonical dataset name:** *the Guardian image archive*. Not "the gallery dataset," not "the gems database," not "the photo archive." Those are views over it.
- **Pipeline source:** `farm-guardian/tools/pipeline/`
- **Pipeline shipped:** farm-guardian v2.23.0, 2026-04-13
- **DB table:** `image_archive` in `data/guardian.db`
- **Hardlink views:** `data/gems/` (public-worthy), `data/private/` (concerns-flagged, never public)
- **Model:** `zai-org/glm-4.6v-flash` on LM Studio at `http://localhost:1234`
- **LM Studio safety doc:** `farm-guardian/docs/13-Apr-2026-lm-studio-reference.md`
- **First public exposure:** farm-2026 — pending this plan
- **Auto-memory entries that bound behavior:**
  - `feedback_no_editorializing.md` — caption rules
  - `project_brooder_private_notes.md` — private-notes routing directive
  - `project_birdadette_retrospective_curation.md` — retrospective project this enables
  - `feedback_camera_naming.md` — device-not-location rule

---

## Part 12 — Living document notes

This plan is intentionally verbose. It's the onboarding doc that keeps the pipeline from being forgotten. Short docs get skimmed; long, specific, example-heavy docs get used.

**When to update this doc:**

- Schema changes in `image_archive` or any new table → update Part 1.b.
- New camera added or removed → update Part 1.d.
- Prompt major revision → update Part 1.h (trust/calibration) with observed shifts.
- New frontend feature surface added → update Part 2.c.
- New rule emerges from Boss feedback → add to Part 2.d and the relevant surface's spec.

**When to split this doc:**

- If Part 2 grows past ~30 KB or it becomes the bottleneck for parallel feature work, split `/gallery/gems`, the retrospective, and the review UI into separate plan files. Keep this one as the dataset + cross-repo overview.

**Authorship convention:**

- Changes noted in a "Revision log" at the very bottom (added below when the first revision lands). Keep initial ownership line; append change entries with name + date + 1-line summary.

---

## Revision log

*(Add an entry when you revise this doc. Keep this log dense; it's the changelog for the plan itself.)*

- **2026-04-14** — Initial draft (Claude Opus 4.6). Pipeline shipped on farm-guardian v2.23.0; no backend endpoints yet; no frontend code yet. Status: **Draft — awaiting Boss approval.**

---

**Status:** Draft. Committed to this repository so that the existence of the dataset is discoverable to the next developer. Backend work has not started. Do not begin frontend implementation until Layer 1 (backend endpoints) is live — you'll hit dead fetches and waste time on shim/mock paths, which violate the "no mocks" rule in CLAUDE.md.
