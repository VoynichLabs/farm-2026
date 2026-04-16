# Changelog

All notable changes to this project will be documented in this file.
Format: [SemVer](https://semver.org/) — what / why / how.

## [Unreleased] — 2026-04-16

### Changed — camera roster is now derived from Guardian backend, not a hardcoded list (Claude Opus 4.7 (1M context))

The frontend camera roster is no longer a static TypeScript array. Boss's rule: cameras come and go on the farm (phones plugged/unplugged, laptops repurposed, new hardware added) and the website must deal with that without a code change or redeploy. Previously, `lib/cameras.ts`'s `CAMERAS` array was the single source of truth; a camera being absent from it meant it didn't render, and a camera being in it but offline in Guardian meant the grid showed stuck-in-`CONNECTING` tiles.

**What changed:**

- **New `lib/guardian-roster.ts`:** client hook `useGuardianRoster()` fetches Guardian's `/api/cameras` endpoint every 30s and returns `{ cameras: CameraMeta[], ready }`. Each backend entry is run through `resolveCameraMeta(name)` so it arrives at the UI with full display metadata — either from the static overlay in `lib/cameras.ts` or a sensible default derived from the camera name. Fetch errors keep the last good roster (or the fallback overlay) visible rather than blinking to empty.
- **`lib/cameras.ts` — repurposed from "the roster" to "optional display overlay":** the `CAMERAS` array is now documented as a metadata overlay for cameras that have ever been on the farm, used for labels/aspect ratios when those cameras appear in the live roster or in historical gem data. `CameraName` is now `string` (not a literal union) because the backend can name any camera whatever it wants. `isCameraName` accepts any non-empty string. New `resolveCameraMeta(name)` always returns a usable `CameraMeta` — either the overlay entry or a `{ name, label: name, shortLabel: name, device: name, aspectRatio: "16 / 9" }` default. Old semantics preserved: do NOT delete entries from here when a camera goes offline; the overlay is intentionally "sticky" so historical gem filter chips keep their labels.
- **`GuardianCameraStage.tsx`:** types loosened to `string` for `defaultFeatured`, `CameraName` import removed. Featured-fallback improved: if the user's stored/URL-pinned camera is not in the current roster, fall back to `cameras[0]` instead of rendering an empty stage. Empty-state copy updated to say "Guardian's /api/cameras returned no cameras yet" (old text pointed at `lib/cameras.ts`, which is no longer authoritative).
- **`GuardianDashboard.tsx`:** stops passing hardcoded `CAMERAS` into the stage; uses `useGuardianRoster()` instead. Refactored the `/api/status` poller to put `setState` inside `.then` callbacks (fixes React-19 `react-hooks/set-state-in-effect` lint).
- **`GuardianHomeSection.tsx`:** converted to `"use client"` so it can consume the roster hook. The system info panel's "Cameras" list now enumerates the live roster (was previously hardcoded from `CAMERAS`), as does the pipeline summary row's camera count.
- **`GuardianHomeBadge.tsx`:** removed the `{CAMERAS.length}` fallback string — the live count comes from `/api/status`; when Guardian is unreachable we just say "Snapshot polling" rather than print a stale number.
- **`GuardianPTZPanel.tsx`:** effect refactored to put `setState` inside `.then` callbacks (React-19 lint fix, same as GuardianDashboard).
- **`GuardianCameraFeed.tsx`:** added a targeted `// eslint-disable-next-line @next/next/no-img-element` with a comment explaining why blob-URL snapshot polling intentionally bypasses `next/image`.

**What did not change:**

- `lib/gems-format.ts` and `app/components/gems/GemFilters.tsx` still import `CAMERAS` — intentionally. The gem filter chips are historical (they filter gems already in the archive), so they want the full "known hardware" list even when a camera is currently offline.
- The `content/projects/guardian/index.mdx` hardware table is narrative documentation and was left untouched.

**Lint + build:** `npm run lint` is now 0 errors / 0 warnings (down from 3 errors + 1 warning that were pre-existing baseline). `npm run build` succeeds cleanly for all 18 routes. Full plan: `docs/16-Apr-2026-dynamic-camera-roster-plan.md`.

### Added — smart camera visibility on the Guardian stage (Claude Opus 4.6 (1M context))

The shared `GuardianCameraStage` (used by the homepage and `/projects/guardian`) now leads with cameras that are actually online and hides ones that aren't. Per-camera `FeedState` (already detected internally by `GuardianCameraFeed`) is collected via a new `useCameraStatuses` hook. Cameras whose state is `"offline"` drop out of the visible thumbnail grid; they stay mounted in a hidden container so their snapshot polling continues and they reappear automatically when they recover. If the featured camera goes offline and any other camera is live, the stage auto-promotes to the first live camera in canonical (`lib/cameras.ts`) order — done as a derived `useMemo` value rather than a setState chain, so there's no extra effect or render churn. The thumbnail grid scales to visible-thumb count (1 → full width, 2 → 2-col, 3+ → 3-col), and an empty-state panel shows when zero cameras are reachable, so the layout never collapses. `GuardianCameraFeed`'s `onStatusChange` callback was widened from `(name, isLive: boolean)` to `(name, state: FeedState)` and `FeedState` is now exported. SRP/DRY: layout decisions live in one stage component serving both surfaces; adding/removing a camera is still a one-line change in `lib/cameras.ts` (0..N supported). Plan + behavior matrix: `docs/15-Apr-2026-smart-camera-visibility-plan.md`.

### Status note — v1.7.0 gems gallery is pending review (Claude Opus 4.6 (1M context))

Live URL `https://farm.markbarney.net/gallery/gems` and homepage rail are deployed and serving real data (68 strong-tier gems as of the audit window). The page reflects the VLM's curation verdict directly — every frame shown was tagged `share_worth='strong'` by `glm-4.6v-flash` upstream. Today's strong-tier set skews heavily to `usb-cam` brooder feeder shots with near-duplicate captions; whether that's a frontend issue, a VLM-curation issue, or both should be noted during review.

If today's review surfaces UX changes (deduping near-duplicate captions, hand-curate override, filter defaults, sort order) those land in v1.7.1+ rather than reopening v1.7.0.

## [1.7.0] — 2026-04-14

### Added — curated image archive on farm-2026 (Claude Opus 4.6 (1M context))

Ships the frontend surface for farm-guardian's image-archive REST layer (v2.25.0, commit 6f69306 on `farm-guardian`). The pipeline has been producing scored + tiered frames since v2.23.0 on 2026-04-13; this release makes them visible on the public site.

**New route — `/gallery/gems`:** responsive grid of curated "strong"-tier frames with URL-driven filters (camera / activity / individual / date-range), cursor-paginated load-more, and a native-`<dialog>` lightbox with keyboard navigation. Server-renders the first page so the URL is deep-linkable and SEO-crawlable.

**Homepage rail — "Latest from the Flock":** horizontal scroll strip of six recent strong/decent frames sitting between the flock preview and projects section. Silently hides on tunnel-drop so the homepage never crashes.

**Footer stat widget:** discreet "N gems in the last 7 days" line linking to the gallery. A visible signal that the pipeline is alive.

**Modularity contract:** thirteen small components under `app/components/gems/` — `GemCard` (variant: default / compact), `GemsGrid` (variant: gallery / rail), `GemCardBadges`, `GemCaption`, `GemMetaTable`, `GemLightbox`, `GemFilters`, `GemsLoadMore`, `GemsGallery`, `GemsGalleryClient`, `GemsEmpty`, `GemsError`, `GemsStatFooter`. `GemCard` + `GemsGrid` are reused by the gallery and the homepage rail with zero duplication. All I/O lives in `lib/gems.ts`; all formatting lives in `lib/gems-format.ts` (both pure). Full plan + rationale: `docs/14-Apr-2026-frontend-gems-implementation-plan.md`.

**Rules enforced in code:**

- `has_concerns=1` rows are filtered at the backend, absent from `GemRow`, and never rendered — three-layer defense per the cross-repo plan.
- Camera labels come from `lib/cameras.ts` SSoT (hardware-only strings).
- Captions are rendered with a "Draft caption:" affordance via `GemCaption`; never styled as finished editorial copy.
- `apparent_age_days = -1` sentinel normalised to `null` at the `lib/gems.ts` boundary; UI never renders "-1 days old."
- No owner name in any gems-path source file or rendered HTML (verified by grep on both the tree and the production build).

**Types:** `app/components/guardian/types.ts` extended with `GemRow`, `RecentRow`, `ImageListResponse<T>`, `ImageStats`, `ImageApiError`, and the `Scene` / `Activity` / `Lighting` / `Composition` / `ImageQuality` / `ShareWorth` / `IndividualTag` enums. Banner comment points at the parent plan.

**Base URL:** `NEXT_PUBLIC_GUARDIAN_BASE` env var override; defaults to `https://guardian.markbarney.net`. `next: { revalidate: 300 }` on every fetcher.

**Out of this release (scheduled for v0.2+):** Birdadette day-of-life retrospective (planned separately, backend already supports it), Boss-only `/review` UI (Finder browse works for now), Instagram autofeed, caption overrides.

## [Unreleased-docs] — 2026-04-14

### Docs — cross-repo plan: expose the Guardian image archive on farm-2026 (Claude Opus 4.6)

farm-guardian shipped v2.23.0 on 2026-04-13 with a continuous multi-camera image curation pipeline that writes structured metadata + tiered JPEGs to SQLite every few minutes. The dataset is large, growing hourly, and **not visible from this codebase** — the next developer (human or AI) will not know it exists unless it's documented aggressively in this repo.

**New:** `docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md` — the authoritative long-form reference for:

- What the dataset is, where it lives on the Mac Mini, the full `image_archive` SQLite schema, the `data/gems/` and `data/private/` hardlinked views.
- Observed GLM 4.6v-flash quirks and calibration notes (sharpness judgment, bird-count noise, caption repetition).
- The three non-negotiable rules: never leak `has_concerns=1` to public endpoints, never put the owner name in captions, camera labels stay hardware-only.
- A detailed four-layer plan to expose the dataset: new `/api/v1/images/*` endpoints in `farm-guardian/api.py`, TypeScript types extending `app/components/guardian/types.ts`, frontend components under `app/components/gems/`, and a Boss-only review UI at `/review`.
- Four public surfaces specified: `/gallery/gems`, homepage `LatestFlockFrames` rail, `/flock/birdadette` retrospective, Instagram autofeed (v0.3 only; documented, not built).
- Full request/response contracts for every endpoint including the review surface with bearer-token auth, the `image_archive_edits` audit table, and the `caption_overrides` override table.
- Failure-modes catalog, query catalog, scale/evolution discussion.

**Also updated:** `docs/FRONTEND-ARCHITECTURE.md` — added the "Curated image archive" row to the SSoT table, bolded to make sure nobody misses it.

**Status:** Plan is draft; approval pending. Backend work has not started. Frontend work blocked until `/api/v1/images/*` lands on guardian.markbarney.net. Do not pre-build against mocks.

## [1.6.0] — 2026-04-13

### Refactored — frontend SRP/DRY rewrite + de-fluff (Claude Opus 4.6)

The mba-cam sweep in v1.5.0 exposed a structural failure: a single camera addition required edits in four separate layout files, all re-stating the camera count as hand-written prose. That pattern was everywhere on the site — eight birds hardcoded on the homepage while `flock-profiles.json` was right there; stale "v2.15" backend strings; a marketing-template hero-stats shape grafted onto a farm log; Boss's name and "every line built by Claude" self-promotion scattered across public copy. This release is the cleanup.

**Plan:** `docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md` — the spec of record for this rewrite, trimmed down after advisor review from 8 phases to 5.

**Contract:** `docs/FRONTEND-ARCHITECTURE.md` (new) — the working contract for the next dev (human or AI): the SSoT table, naming rules, primitive-extraction threshold, how to add a camera/bird/field-note/project, and the "no hardcoded counts, no re-stated data, no SaaS template" rules. `CLAUDE.md` now points to it.

**Changed — structure (Phases 1–2)**
- Split the 394-line `app/page.tsx` monolith into seven single-responsibility section components under `app/components/home/`: `Hero`, `GuardianHomeSection`, `LatestFieldNote`, `FlockPreviewStrip`, `ActiveProjects`, `InstagramSection`, `SiteFooter`. `page.tsx` is now ~30 lines of composition.
- Extracted two primitives under `app/components/primitives/`: `SectionHeader` (deduped four near-identical title + subtitle + trailing-link blocks) and `BirdCard` (shared between the homepage strip and slated for `/flock`). No other primitives extracted — per the "third duplicate" threshold in the architecture doc.

**Changed — data-driven (Phase 3)**
- `FlockPreviewStrip` now reads `content/flock-profiles.json` via `getFlockProfiles()`. The 8-item inline bird array is deleted; active birds with photos flow through automatically (up to 8 tiles).
- Camera counts now derive inline: `{CAMERAS.length}` replaces every hardcoded "5 cameras" in `GuardianHomeSection` and `GuardianHomeBadge`. Adding a camera to `lib/cameras.ts` updates every count on the site with no grep-sweep.

**Changed — camera naming (sidecar fix, commit `ea1de41`)**
- Boss caught three cameras all labeled "brooder" in the UI today (the `shortLabel` and `location` fields were encoding location-as-identity). The device-not-location naming rule now applies to every UI string on a camera, not just the primary name. Removed the `location` field from `CameraMeta` entirely. Rewrote every `label` and `shortLabel` to identify the hardware only (`"USB"`, `"MBA"`, `"S7"`, `"GWTC"`, `"Reolink"`). The `lib/cameras.ts` file header now encodes the rule. Memory (`feedback_camera_naming.md`) updated so future agents know the rule covers labels and UI strings, not just primary names.

**Removed — de-fluff (Phase 4)**
- Owner name: `SiteFooter` no longer says "© {year} Mark Barney"; the nav external-link-back text is now `markbarney.net ↗` instead of "Mark Barney ↗". The link destination is unchanged.
- Self-promotion: dropped the "Hampton, CT — every line built by Claude" footer tagline, the whole `## Built by Claude` section at the end of the Guardian MDX (four paragraphs including stale "v2.15.0" and "Fifteen Python modules" boasts), and the `"Every line of code built by Claude"` string from `app/projects/page.tsx` metadata.
- Stale counts: every "three cameras" / "four cameras" / "22 reinforcements" string in layout prose (`app/layout.tsx` OG + Twitter descriptions, `app/projects/page.tsx` "Why We Build", `content/projects/guardian/index.mdx` intro) replaced with durable phrasing that doesn't drift week-to-week.
- Stale backend facts: the system panel's `v2.15` version badge (stale for a week) and `Refresh: ~10s via Cloudflare tunnel` line (was never quite right, and nobody needed to know) are gone. Duplicated `M4 Pro 64GB` removed from the bottom pipeline row (already on the Hardware row). Guardian MDX "every ten seconds" replaced with "steady cadence".
- Flock page: `app/flock/page.tsx` metadata's "22 reinforcements in the brooder" softened to "current brooder cohort" (no drift-prone count). Unused `getEggColorClass` deleted (ESLint had been flagging it since its logic was inlined).

**Why**
- The frontend was built piecemeal off a SaaS-template mental model that doesn't fit a farm log. Every new piece of reality (a camera, a bird, a week) required prose edits in multiple files that drifted between them.
- Boss's memory rules on naming and editorializing were being violated in several places; those violations were in code for days because the rules hadn't been documented in the repo itself. They are now.

**Verification**
- `npm run build` passes after each phase.
- Grep for `\b[0-9]+\s+(camera|bird|chick|breed)` in `app/` returns zero matches outside code comments.
- Grep for `mark barney|built by claude|every line` in `app/` + `content/projects/` returns only a source-code comment documenting the removal.
- Dev-server smoke test: homepage renders the 7 active birds from `flock-profiles.json`, system panel shows `{CAMERAS.length}` derived count, footer has no name, no "built by Claude" tagline.

**Parallel-dev coordination**
- Five commits (`docs: plan`, Phase 1, camera-label fix sidecar, Phase 2, Phase 3, Phase 4, this final doc/CHANGELOG push). Each standalone, each pushed to `main` so the other dev could see progress and avoid stepping on the diffs.

## [1.5.0] — 2026-04-13

### Added — mba-cam is the fifth camera + camera-wiring audit (Claude Opus 4.6)

Backend Guardian has been running five cameras since farm-guardian v2.22.1 (MacBook Air 2013 webcam via MediaMTX → `rtsp://192.168.0.50:8554/mba-cam`, polled by Guardian to serve JPEGs at `/api/cameras/mba-cam/frame`). The frontend was still advertising four. This release closes that gap and sweeps every hardcoded "four cameras" copy string I could find against backend v2.22.1 reality.

**Added**
- `lib/cameras.ts` — `"mba-cam"` added to the `CameraName` union and inserted at index 1 of `CAMERAS` (right after `usb-cam`), so the brooder angles cluster at the front of the stage. Metadata: device = `MacBook Air 2013 webcam (FaceTime HD)`, location = `Brooder (currently)`, 16:9. Device-based naming (not location) per the rule Boss re-stated twice on 13-Apr.
- `content/projects/guardian/index.mdx` — new `mba-cam` row in the camera roster table ("A second brooder angle. 720p built-in FaceTime HD, ffmpeg + MediaMTX → RTSP").
- `docs/13-Apr-2026-mba-cam-and-camera-audit-plan.md` — plan doc for this change (supersedes the earlier handoff plan).

**Changed**
- `content/projects/guardian/index.mdx` — "Four cameras" → "Five cameras" in frontmatter description, body intro, and "Live snapshot feeds from all four cameras" → "…all five cameras".
- `app/page.tsx` hero hardware row — `"4 cameras · M4 Pro 64GB"` → `"5 cameras · M4 Pro 64GB"`.
- `app/components/guardian/GuardianHomeBadge.tsx` offline-fallback caption — `"4 cameras · HLS streaming · snapshot polling"` → `"5 cameras · snapshot polling"`. Dropped the stale `HLS streaming` claim — the backend removed video pipelines in farm-guardian v2.15/v2.18 in favor of pure snapshot polling.

**Audit result (no drift found)**
- Existing four cameras (`house-yard`, `s7-cam`, `usb-cam`, `gwtc`) device/label/location strings all still match farm-guardian `config.json`. No corrections needed.
- `DEFAULT_FEATURED = "usb-cam"` (homepage) vs. `defaultFeatured="house-yard"` (dashboard) is intentional — homepage leads with the brooder, dashboard leads with the PTZ. Kept both.

**Why**
- Boss pushed the fifth camera into Guardian on 13-Apr and asked the frontend to catch up. The site should reflect what Guardian is actually watching.
- While I was in there, sweeping "four cameras" strings prevents the stat block and offline badge from lying about the system.

**How**
- Single-source-of-truth pattern (`lib/cameras.ts`) already existed — new cameras flow through to the stage, thumbs, homepage panel, and dashboard via the array, with zero component changes. `GuardianCameraFeed.tsx` and `GuardianCameraStage.tsx` stayed untouched.
- No new dependencies, no API shape changes, no backend coordination needed (Guardian endpoint is live).

**Verification**
- `npm run lint` — pass.
- `npm run build` — pass.
- Local dev: `/projects/guardian` shows five thumbs; `mba-cam` in the second slot; click promotes to the stage.
- Network tab: `GET https://guardian.markbarney.net/api/cameras/mba-cam/frame` returns 200 with a ~100–150 KB JPEG every ~1.2 s.

## [1.4.4] — 2026-04-13

### Changed — Site nav restyled + outbound link to markbarney.net (Claude Opus 4.6)

Replaced the solid forest-green nav bar (which read as a bit heavy and repo-named) with a sticky, translucent cream bar that matches the pill-style nav idiom used on markbarney.net. Brand text changed from the repo name "Farm 2026" to "Hampton Farm". Appended an external link back to markbarney.net after a divider so the farm site is reachable as part of the personal-brand network without formally integrating the two codebases.

**Changed**
- `app/layout.tsx` nav markup — sticky, `bg-cream/85` with `backdrop-blur-md`, 1px `border-forest/10` bottom, pill-style links with hover fill, serif brand wordmark.
- Brand text: `Farm 2026` → `Hampton Farm`.

**Added**
- External `<a href="https://markbarney.net">Mark Barney ↗</a>` after a thin divider.

**Why**
- "Farm 2026" is the repo name, not a public brand — Boss runs this cycle every year.
- Consistent visual feel across markbarney.net and farm.markbarney.net without sharing components or integrating stacks.

**How**
- Styling only; no new deps, no theme system, no mobile menu component. Nav row scrolls horizontally on narrow viewports.

## [1.4.3] — 2026-04-13

### Added — Birdadette day-8 keyboard photo (Claude Opus 4.6)

Added a new gallery entry showing Birdadette back on the laptop, one week after hatching. Bookends the existing `birdadette-fresh-hatch` photo from day 1. The screen behind her is the Guardian brooder camera — she's the only chick from her clutch that made it, and she's watching the Cackle Hatchery arrivals live.

**Added**
- `public/photos/april-2026/birdadette-day8-keyboard.jpg` (2000px, pulled from iPhone IMG_2155, taken 2026-04-13 14:09).
- New entry `birdadette-day8-keyboard` in `content/gallery.json`, placed immediately after `birdadette-hatch` to read as a then/now pair.

## [1.4.2] — 2026-04-13

### Fixed — Guardian camera tiles now show connecting and reconnecting states (OpenAI Codex GPT-5.4)

The Guardian page looked broken on first load because each tile rendered `OFFLINE` before the first frame had even arrived. That made normal startup latency through the tunnel feel like a dead camera.

**Fixed**
- `app/components/guardian/GuardianCameraFeed.tsx` now distinguishes `CONNECTING`, `LIVE`, `RECONNECTING`, and `OFFLINE` states instead of collapsing everything into a hard offline badge.
- Initial page load shows a spinner and `CONNECTING…` while waiting for the first frame.
- Temporary snapshot failures now keep the last good frame visible with a `RECONNECTING…` overlay before falling back to a true offline state.

**Why**
- First-load tunnel latency is expected; it should not look like a dead feed.
- Short polling hiccups should feel like recovery, not failure.

**How**
- Added frontend-only state handling in `GuardianCameraFeed.tsx` with separate thresholds for reconnecting vs true offline.
- Kept the change entirely in `farm-2026`; no Guardian backend/API changes were required.

## [1.4.1] — 2026-04-12

### Fixed — Guardian camera feeds no longer blank on shared status hiccups (Claude Opus 4.6)

The live camera tiles on `/projects/guardian` and the homepage were being blanked whenever the shared `/api/status` poll hiccupped, even if the per-camera snapshot poll was still returning fresh JPEGs. That made the feeds look like they were flapping offline every so often.

**Fixed**
- `app/components/guardian/GuardianCameraFeed.tsx` now treats snapshot polling as the source of truth for per-camera visibility. The camera stays visible unless its own snapshot polling fails repeatedly; a transient status poll failure no longer hides healthy frames.

**Why**
- The Guardian page has one shared status poll and four independent camera snapshot polls. A transient status failure was cascading into all feeds through the `online` prop, which turned a shared blip into a full-page offline flash.

**How**
- Removed the `online !== false` gate from the feed render path so the camera frame remains visible while snapshots are healthy.
- Kept the existing 3-failure snapshot threshold for true per-camera offline handling.
- Updated the component header and this changelog entry to match the behavior change.

## [1.4.0] — 2026-04-12

### Added — Manual PTZ controls; detection UI stripped from Guardian page (Claude Opus 4.6)

Mark asked for the Guardian page to become a remote control for the `house-yard` Reolink — not a broken detection dashboard. This release delivers that and follows the plan in `docs/12-Apr-2026-guardian-ptz-controls-plan.md`.

**Added**
- `app/components/guardian/GuardianPTZPanel.tsx` — new `"use client"` control surface. Reads current position, pan/tilt nudges by an approximate degree input (default 10°, max 60°), one-tap recall of the five on-camera presets (yard-center, coop-approach, fence-line, sky-watch, driveway), a save-current-position dialog, spotlight toggle, 10-second siren with confirm dialog, always-visible emergency STOP, and auto-stop on component unmount. Auto-fires autofocus after every move and surfaces a "refocusing ~3s" note so stale frames aren't misread as blurry lens.
- `lib/ptz.ts` — pure timing helpers: `estimateBurstMs(deg)`, `panDelta(from, to)`, plus `PTZ_SPEED`, `BURST_CAP_MS`, `MAX_DEGREE_INPUT` constants. Bursts are capped at 500ms per click; larger degree requests iterate (up to 5 bursts) with a `/position` re-read between each, so the UI reports **actual** movement instead of a fictional degree count.
- `PTZPosition`, `PresetMapResponse` types added to `app/components/guardian/types.ts`.

**Removed (from Guardian page — component files preserved for future reuse)**
- `GuardianDetections` render call in `GuardianDashboard.tsx`.
- `GuardianInfoPanels` render call in `GuardianDashboard.tsx`.
- The Patrol / Deterrent / Tracks compact status row. Replaced with a single "Cameras N/M online" line.
- The `fetchFast`'s detections/tracks/deterrent calls, plus `fetchSlow` and `fetchEbird` entirely. The dashboard now polls only `/api/status` (every 10s). That's a ~6× reduction in Cloudflare-tunnel requests per cycle while detection is dormant.

**Copy**
- `content/projects/guardian/index.mdx` — "How It Watches" rewritten to match v2.15 reality. No more YOLOv8+GLM-4V promises the live pipeline isn't currently delivering. Says what Mark's system actually does today: four snapshot feeds, manual PTZ, spotlight + siren deterrents, 4K alert snapshots, detection paused on purpose.

**Why**
Mark's own words from 12-April: *"I really want the ability to just be able to move it from the web UI… set kind of how many degrees I want to turn. And absolutely ignore the detections."* The detection cards were rendering zeros because the pipeline isn't running; they made the site look broken. The site now shows only things that are live.

**How — honest timing**
Absolute pan/tilt is a firmware limit (see `farm-guardian/docs/08-Apr-2026-absolute-ptz-investigation.md`, re-confirmed three times — don't re-investigate). Nudges are timed move→stop bursts. Empirically, at speed 5: a 180ms burst moves ~0.8°, a 500ms burst moves ~12.5°. The ramp-up is nonlinear and tunnel jitter adds overshoot, so a single click does **one** ≤500ms burst and then re-reads position. The status line reports "Requested X° · moved ≈Y°" so Mark can re-nudge if needed. Precision positioning uses presets.

**Safety**
Emergency STOP is always visible. The component's unmount cleanup also sends a stop — if Mark navigates away mid-burst, the camera halts. The siren button prompts for confirmation (10s blast scares the chickens). Zoom is deliberately absent — camera stays at zoom 0 per the camera agents doc.

**Verified**
- Empirically nudged the house-yard camera from 183.7° to 169.7° via the Guardian API during development. The Reolink view now shows the truck prominently in the driveway — what Mark asked for today.
- Local preset recall and spotlight toggle tested end-to-end through the Cloudflare tunnel.
- Siren not test-fired (chickens on-site).
- No `farm-guardian` backend changes. Every endpoint already existed in v2.15.0.

## [1.3.2] — 2026-04-12

### Changed — Guardian share image now uses fresh-hatch Birdadette (OpenAI GPT-5.4)

- **Guardian project metadata** — changed `content/projects/guardian/index.mdx` so the Guardian page now uses `/photos/april-2026/birdadette-fresh-hatch.jpg` as its `heroPhoto`, which also drives the project page's Open Graph and Twitter image metadata.

**Why:** Mark wanted the Guardian SEO/share image to be Birdadette freshly hatched on the keyboard instead of the broader command-center shot.

**How:** Reused the existing `heroPhoto` → `generateMetadata()` pipeline already wired into `app/projects/[slug]/page.tsx`; only the source image path changed.

## [1.3.1] — 2026-04-12

### Added — Light Brahma estimate field note (OpenAI GPT-5.4)

- **New field note** — `content/field-notes/2026-04-12-light-brahma-estimate.mdx` records Bubba's read on the four week-old chicks: Light Brahma straight-runs, pullet-leaning but uncertain, moved to the nesting box on 12-April-2026.
- **New photos** — staged two close-up wing-check photos in `public/photos/april-2026/` and attached them to the note so the estimate is anchored to the actual birds from that day.

**Why:** Mark asked for each lobster to push up a note with his estimate. The public farm log already uses field notes as the durable record, so this update captures the breed/sex guess and the move to the nesting box in the right place.

**How:** Reused the existing MDX field-note pipeline, copied the attached chick photos into the public photo tree, and added a patch changelog entry for the new content.

## [1.3.0] — 2026-04-12

### Changed — Modular camera stage + stop cropping story photos (Claude Opus 4.6)

- **Modular camera picker** — `app/components/guardian/GuardianCameraStage.tsx` (new) renders one featured camera large plus the other three as live, clickable thumbnails. Clicking a thumb promotes it to the stage. Selection persists in `localStorage` per page (separate keys for homepage and `/projects/guardian`), and accepts `?cam=<name>` deep-linking. No `useSearchParams` — reads/writes `window.location` + `history.replaceState` directly so static pre-render works without a Suspense boundary.

- **Camera registry (single source of truth)** — `lib/cameras.ts` (new) exports `CAMERAS`, `DEFAULT_FEATURED`, and `getCamera()`. Every hardcoded camera literal in `app/page.tsx`, `GuardianDashboard.tsx`, and the homepage system panel's Cameras sub-list now maps over this registry. Native aspect ratios (all 16:9, verified from live JPEG dimensions) live with each entry so stage/thumb containers size correctly.

- **Stop cropping story photos** — replaced `object-cover` + fixed-height containers with `object-contain` + `max-h` (capped at 60–75 vh) + subtle neutral canvas on these story-critical images:
  - Homepage featured field note cover (was `h-[350px] object-cover`)
  - Field notes index featured card (was `h-[400px] object-cover`)
  - Individual field note cover (was `max-h-[500px] object-cover`)
  - Field note inline photo gallery (was `aspect-[3/2] object-cover` — forced 3:2)
  - Project hero photo (was `max-h-[480px] object-cover`)
  - Homepage Birdadette hero section (was `bg-cover` — cropped top/bottom)
  - Flock page hero section (was `bg-cover`)

  Thumbnail grids (homepage flock preview, secondary field note cards, gallery thumbs) intentionally left as `object-cover` — uniform grid height still wins there.

**Why:** Two complaints. (1) The homepage and live dashboard hardcoded a single "featured" camera — swapping the hero cam required a deploy. Users should be able to flip between brooder and yard cams on demand. (2) Story photos (Birdadette, the command-center field note cover, project heroes) were getting their top and bottom shaved by `object-cover` instead of being shown whole. Story images must be seen in full; thumbnails can crop.

**How:** `GuardianCameraStage` is a new `"use client"` component that owns featured-camera state and a three-thumbnail grid. Server renders the default; client's `useEffect` reconciles with `localStorage`/URL. For photos, switched to a pattern where the image drives container height (`w-full h-auto max-h-[65vh] object-contain` with a soft-tint background behind any letterbox gap). Heroes moved from `bg-cover` to `bg-contain bg-no-repeat bg-forest` — the forest background fills any canvas gap cleanly.

## [1.2.0] — 2026-04-12

### Changed — Hero layout, brooder cameras, chick ages, Guardian v2.15 (Claude Opus 4.6)

- **Hero redesign** — text no longer covers the bird. Title and tagline anchored top-left, body text bottom-left (narrow column), nav links bottom-right. Center of the image stays clear so Birdadette is the focal point. Gradient changed from a heavy bottom-up wash to edge vignetting.

- **Camera reorder** — brooder cameras promoted to hero position. Featured large feed is now `usb-cam` (desk brooder) instead of `house-yard`. Small row: `s7-cam` (brooder), `gwtc`, `house-yard` (4K PTZ). Reflects that the chicks are the focus right now, not the yard.

- **Dynamic chick age** — added `hatch_date` fields to `flock-profiles.json` for Birdadette (Apr 6), Turkey poults (est. Mar 31), Tractor Supply chicks (est. Mar 27), Cackle Hatchery chicks (Apr 8). New `getChickAgeLabel()` utility in `lib/content.ts` computes "Day X" / "X weeks" / "X months" at render time. Age badges appear on both homepage flock preview and `/flock` page BirdCard. Adult birds without `hatch_date` still show their static age string.

- **Guardian system panel updated for v2.15** — removed YOLO detection pipeline, deterrence levels, and patrol sections (detection not currently running). Replaced with Cameras section (listing all 4 by current location), Streaming section (snapshot polling via OpenCV, ~10s refresh, no ffmpeg / no HLS), and Hardware section noting detection is offline. Bottom bar simplified to "Snapshot polling (OpenCV)". Offline badge text updated from "Pipeline: YOLOv8 → GLM-4V → Deterrent" to "4 cameras · snapshot polling".

- **Copy fixes** — removed bird count from hero stats (was "26 birds", now just "4 cameras, 0 cloud services"). Updated flock preview description.

**Why:** The farm-guardian backend shipped v2.15 (2026-04-12) which *replaced* the HLS video pipeline entirely with simple periodic JPEG snapshots via OpenCV. `stream.py` was deleted; zero ffmpeg processes remain. Detection (YOLO/GLM-4V) isn't running — the system is focused on camera feeds for watching the chicks. The hero text was covering the bird photo. Chick ages were static strings frozen at time of entry.

**How:** Hero section restructured with absolute positioning (top-left / bottom-left / bottom-right). `getChickAgeLabel()` is a pure function that computes days from `hatch_date` — no client JS, runs at SSR time. Guardian panel content replaced to match current v2.15 operational state (snapshot polling only). No new dependencies.

## [1.1.0] — 2026-04-11

### Fixed — Camera feeds starving through Cloudflare tunnel (Claude Opus 4.6)

- **`GuardianCameraFeed.tsx`** — Replaced persistent MJPEG streaming (`multipart/x-mixed-replace`) with snapshot polling. The component now fetches a single JPEG from `/api/cameras/{name}/frame` every ~1.2s and swaps the img src via `URL.createObjectURL()`. Previous object URLs are revoked to prevent memory leaks. Errors require 3 consecutive failures before showing offline state (tolerates occasional dropped frames).

- **`GuardianDashboard.tsx`** — Removed dead `CAMERAS` array that was defined but never used in the JSX.

**Why:** With 4 cameras, the browser was opening 4 persistent MJPEG connections through the Cloudflare tunnel. MJPEG uses `multipart/x-mixed-replace` (HTTP/1.1 legacy), and browsers cap at ~6 concurrent connections per domain. The 4 held-open MJPEG streams plus API polling calls (status, detections, tracks every 5s) competed for connections, causing feeds to starve — users would see one camera load but the others stuck on OFFLINE. Snapshot polling uses short-lived requests compatible with HTTP/2 multiplexing, so all 4 feeds load reliably.

## [1.0.0] — 2026-04-09

### Changed — Weekly Updates, Content Refresh, Instagram (Claude Opus 4.6)

- **Field Notes system** replaces Diary — new `content/field-notes/` directory with MDX files, `FieldNote` interface and loaders in `lib/content.ts`, new `/field-notes` feed page (photo-forward, not a plain list) and `/field-notes/[slug]` detail page with inline photo gallery. Three initial field notes covering Week 1: Birdadette's hatch, the hawk attack and reinforcements, and the command center setup. `/diary` now redirects to `/field-notes`.

- **Homepage overhaul** — hero image now rotates weekly (uses latest field note cover — currently Birdadette on the keyboard). Guardian remains front and center with updated v2.11 system info (three cameras, step-and-dwell patrol, sky-watch mode). Stats bar updated (26 birds, 3 cameras, v2.11, 100% built by Claude). New "Latest from the Farm" section features the latest field note with cover photo. Flock preview reflects current survivors + new arrivals. Instagram section with @markbarney121 link.

- **Flock roster updated** — Birdgit (Speckled Sussex), Birdatha (RIR), Birdadonna (EE×RIR), and Black Australorp marked deceased (losses first week of April). Birdadette added (Easter Egger chick, hatched Apr 6, named after Birdgit). 3 turkey poults, 4 Cream Legbar chicks, and 15 Cackle Hatchery chicks added. New breeds: White Broad-Breasted Turkey, Cream Legbar. Flock page now shows active birds, chick groups, and an "In Memoriam" section with grayscale photos.

- **Chicken enclosure project shelved** — status changed to "shelved", narrative rewritten as an AI design showcase (Claude designed 3D models, elevation drawings, floor plan, and BOM from a single photo). Enclosure drawings copied into `public/photos/enclosure/`. Points to the prefab Producers Pride Universal Poultry Pen that replaced it.

- **Instagram integration** — `InstagramFeed` client component using Instagram's embed.js for curated post embeds. Currently shows @markbarney121 profile link; individual post embeds can be added to `content/instagram-posts.json`.

- **Gallery expanded** — 10 new photos from April 2026 (Birdadette hatch, command center, turkey poult, Cackle Hatchery arrival, chicks with Samsung enrichment, new coop, backyard panorama, hawk shot, Pawel supervising, brooder desk).

- **New photos** added to `public/photos/`: `april-2026/` (9 photos from other developer), `coop/` (1), `enclosure/` (2 drawings), `command-center-*.jpg` (2), `aerial-map.png` (1), `hawk-shot.jpg` (1), `guardian-detections/` (curated).

- **Projects page** updated — shelved status badge, narrative copy rewritten to lead with Guardian and the hawk attack story.

**Why:** The site was frozen at March 14 content while the farm had its most eventful week. Farm Guardian went from v2.5 to v2.11. Four birds were lost. A chick hatched on the keyboard. 22 new birds arrived. The website needed to tell this story and establish a weekly update cadence.

**How:** New content directory, new page routes, content loader additions. Photos staged by other developer, additional photos copied from Guardian events and farm-vision projects. No new npm dependencies. All server-rendered except InstagramFeed and gallery lightbox.

## [0.5.0] — 2026-04-06

### Changed — Remove PTZ Controls, Watch-Only Dashboard (Claude Opus 4.6)

- **Deleted `GuardianPTZPanel.tsx`** — PTZ controls (d-pad, zoom, presets, spotlight, siren) removed from the website. Web-based camera control was unreliable; the camera now runs automated sweep patrol autonomously.
- **Dashboard layout redone** — both camera feeds (house-yard and nesting-box) now display side by side (55/45 split) instead of the old camera + PTZ panel layout. New compact status row below feeds shows patrol status, deterrent status, and active track count (read-only monitoring).
- **Removed PTZ polling** — the 10-second `fetchMedium` interval for PTZ status is gone. Patrol status is now inferred from the system online state.
- **Removed `PTZStatus` interface** from `types.ts` (no longer consumed).
- **Removed preset references** from homepage patrol section and MDX docs — presets exist in the backend but are no longer user-facing on the website.

**Why:** PTZ controls from the web UI don't work reliably over the Cloudflare tunnel. The sweep patrol runs autonomously. The website is now purely a monitoring tool — watch feeds, see detections, review stats.

**How:** Deleted PTZ panel component, rewrote dashboard layout, removed dead imports/state/polling. No new dependencies.

## [0.4.0] — 2026-04-06

### Added — Nesting-Box Camera & Multi-Camera Dashboard (Claude Opus 4.6)

- **Nesting-box camera feed** on Guardian dashboard — Samsung Galaxy S7 (720p, fixed) streams via RTSP Camera Server. Renders as a compact full-width feed below the main house-yard camera + PTZ panel. Per-camera offline handling: if the S7 is down, only its feed shows "OFFLINE" while house-yard continues.
- **Nesting-box feed on homepage** — compact MJPEG stream added below the house-yard + system panel row in the Guardian section.
- **Parameterized `GuardianCameraFeed`** — component now accepts `cameraName`, `label`, and `compact` props instead of hardcoding "house-yard". Supports any camera served by the Guardian API. Per-feed error state via `onError`/heartbeat retry.
- **Guardian MDX docs updated** — hardware table adds S7 camera, detection pipeline documents per-camera RTSP transport (TCP for Reolink, UDP for S7), PTZ section renamed to "PTZ Patrol & Sweep" documenting the new continuous serpentine scan, architecture diagram shows both camera inputs, implementation status reflects v2.2.0 multi-camera support.
- **Homepage hardware references** — system panel and summary table now reflect both cameras.

**Why:** Farm Guardian backend (v2.2.0) added the S7 nesting-box camera and sweep patrol. The website needed to surface the second camera feed and update documentation to match.

**How:** Parameterized the existing `GuardianCameraFeed` component for reuse. Dashboard adds a second instance. Homepage adds a static `<img>` tag. No new dependencies. No backend changes needed — Guardian already serves `/api/cameras/nesting-box/stream`.

## [0.3.1] — 2026-04-05

### Fixed — Guardian Dashboard Cleanup (Claude Opus 4.6)

- **`'use client'` directive placement** — moved to line 1 in all Guardian client components. Was after file header comments, causing Next.js to treat them as Server Components. All hooks and fetch calls were silently failing.
- **PTZ pan/tilt values** — changed from 50/-50 to 1/-1 (unit direction values) matching the real Guardian dashboard. Camera was slamming to limits on every click.
- **Zoom auto-stop** — zoom now sends a stop command after 500ms, matching the real Guardian dashboard. Was zooming continuously until manual stop.
- **`guardianPost()` error handling** — network errors now caught and return `false` instead of throwing unhandled promise rejections.
- **`Object.entries(effectiveness.by_type)` crash** — guarded against missing `by_type` field. The API returns no `by_type` when there are zero deterrent actions.
- **`timeAgo()` NaN** — now returns "—" on invalid timestamps instead of "NaNs ago".
- **Dead eBird fallback** — removed `Array.isArray(data)` branch that could never execute (API always returns `{count, sightings}`).
- **Dead loader files removed** — deleted `GuardianDashboardLoader.tsx` and `GuardianHomeBadgeLoader.tsx`, unused since switching from `next/dynamic` to direct imports.
- **CLAUDE.md updated** — added Guardian integration section documenting component architecture, API base, polling strategy, `'use client'` line-1 requirement, and design tokens. Removed stale `shadcn/ui` reference.

**Why:** Multiple bugs from not testing against real API responses and not matching the actual Guardian dashboard's PTZ protocol.

**How:** Compared every POST body and API response against `farm-guardian/static/app.js` and live endpoint output. No new dependencies.

## [0.3.0] — 2026-04-05

### Added — Guardian Live Dashboard (Claude Opus 4.6)

- **Live interactive dashboard** on `/projects/guardian` — replaces static hero photo with full dashboard: live MJPEG camera feed, PTZ d-pad controls (pan/tilt/zoom/stop), 5 patrol preset buttons, spotlight ON/OFF, siren with 2-click confirmation, real-time detection table, active tracks, deterrent status + effectiveness stats, today's summary with species bar chart, and eBird raptor sightings.
- **Guardian components** in `app/components/guardian/`: `GuardianDashboard` (orchestrator with polling), `GuardianStatusBar`, `GuardianCameraFeed` (MJPEG with heartbeat reconnect), `GuardianPTZPanel`, `GuardianDetections`, `GuardianInfoPanels`, `GuardianHomeBadge`, `types.ts`.
- **Live homepage stats** — `GuardianHomeBadge` client component fetches real status from Guardian API (cameras online, detections today, alerts today) instead of static text.
- **Polling strategy** — fast (5s: status, detections, tracks, deterrent), medium (10s: PTZ), slow (60s: daily summary, effectiveness), glacial (5min: eBird).
- **Offline handling** — graceful degradation when Guardian is down (red status, feed offline state, controls disabled, placeholder data).
- **CORS middleware** added to farm-guardian `dashboard.py` to allow POST requests from farm.markbarney.net.
- **Wider container** — project page uses `max-w-7xl` for guardian slug to fit the 63/37 camera+PTZ split.

**Why:** The previous static MDX page showed a redundant backyard photo and read like a blog post. The Guardian page should be a live control panel matching the actual Guardian dashboard — dense, dark, interactive, with real-time data.

**How:** Client components imported directly in `[slug]/page.tsx` with conditional rendering for `slug === "guardian"`. All API calls go directly to `guardian.markbarney.net` (Cloudflare tunnel). No new npm dependencies.

## [0.2.0] — 2026-04-04

### Added — Farm Guardian Integration (Claude Opus 4.6)

- **Guardian project page** (`/projects/guardian`) — full MDX content covering detection pipeline, automated deterrence, PTZ patrol, eBird early warning, intelligence reports, architecture, REST API, and tech stack. Content sourced from the farm-guardian README. Live MJPEG stream embedded with Guardian dashboard-style status bar and feed overlay.
- **Homepage Guardian section** — dense, terminal-style panel matching the actual Guardian dashboard aesthetic (`#0f172a` bg, `#1e293b` cards, `#334155` borders). Includes live MJPEG camera feed with status overlay, system info panel with detection pipeline, deterrence levels, patrol config, eBird status, and hardware specs. Bottom summary table with link to full project page.
- **Guardian color tokens** in `globals.css` — `guardian-bg`, `guardian-card`, `guardian-border`, `guardian-hover`, `guardian-muted`, `guardian-text`, `guardian-accent` matching the Guardian dashboard palette.
- **Nav link** — "Guardian" added to top nav between Home and Flock.
- **Footer link** — Guardian added to footer navigation.

**Why:** Guardian is the flagship feature — AI predator detection protecting the flock. The farm site should present it in the same dense, data-heavy style as the actual Guardian dashboard, not as a marketing page.

**How:** New MDX project entry uses existing content system (`lib/content.ts`). Homepage section uses Guardian dashboard color palette and layout patterns (63/37 split, status bar, feed overlay, compact tables). No new dependencies.
