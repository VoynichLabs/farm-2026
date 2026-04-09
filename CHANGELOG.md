# Changelog

All notable changes to this project will be documented in this file.
Format: [SemVer](https://semver.org/) — what / why / how.

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
