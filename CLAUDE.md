# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Related Repositories

This project is part of a two-repo system:

- **[farm-2026](https://github.com/VoynichLabs/farm-2026)** (this repo) — Next.js public website at [farm.markbarney.net](https://farm.markbarney.net). Deployed on Railway. Embeds live Guardian camera feeds and system data.
- **[farm-guardian](https://github.com/VoynichLabs/farm-guardian)** — Python backend running on a Mac Mini: camera discovery, YOLO detection, vision refinement, automated deterrence, tracking, alerts, REST API. Exposed via Cloudflare tunnel at `guardian.markbarney.net`.

The Guardian components in this repo (`app/components/guardian/`) consume farm-guardian's REST API. The TypeScript interfaces in `types.ts` must stay in sync with the API response shapes in farm-guardian's `api.py` and `dashboard.py`.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test suite exists. Deployment targets Railway.app using the standalone Next.js output.

## Architecture

**Next.js 16 App Router** hobby farm website for a property in Hampton, CT. Content is MDX-driven and loaded server-side via `lib/content.ts` using `gray-matter`.

### Content sources

| Path | Purpose |
|------|---------|
| `content/flock-profiles.json` | Breed definitions + individual bird roster (9 breeds, 13 entries incl. deceased + groups) |
| `content/field-notes/*.mdx` | Weekly farm updates (frontmatter: title, date, cover, photos[], tags) — **the main content type** |
| `content/projects/[slug]/index.mdx` | Project overview (frontmatter: title, status, description, startDate, location) |
| `content/projects/[slug]/entries/*.mdx` | Per-project diary entries (frontmatter: date, title, tags) |
| `content/projects/[slug]/materials.json` | Bill of materials (item, qty, unit, cost) |
| `content/diary/*.mdx` | Raw developer notes (not published — source material for field notes) |
| `content/instagram-posts.json` | Curated Instagram post URLs for embed component |
| `public/photos/` | All site photos — `april-2026/`, `birds/`, `coop/`, `history/`, `enclosure/`, `guardian-detections/` |

**Note:** `content/flock.json` is deprecated. `content/flock-profiles.json` is the single source of truth for bird data.

### Pages

- `/` — Hero (Birdadette), Guardian live camera feeds + system panel, latest field note, flock preview, projects, Instagram
- `/field-notes` — Photo-forward weekly update feed (replaces diary)
- `/field-notes/[slug]` — Individual field note with cover image, MDX content, photo gallery, prev/next nav
- `/flock` — Bird roster (active / In Memoriam sections) + breed reference guide
- `/projects` — Project listing with status badges (planning/active/complete/shelved)
- `/projects/guardian` — **Live dashboard**: 4 camera feeds via snapshot polling (house-yard, s7-cam, usb-cam, gwtc), detection table, patrol/deterrent/track status, eBird sightings. Rendered by `GuardianDashboard.tsx` above MDX project docs.
- `/projects/[slug]` — MDX project detail with materials table and diary timeline
- `/gallery` — Lightbox photo gallery (April 2026 + historical)
- `/diary` — Redirects to `/field-notes`
- `/sitemap.xml` — Dynamic sitemap for SEO
- `/robots.txt` — Crawler directives

### Guardian integration

The Guardian page (`/projects/guardian`) is a live interactive dashboard, not a static MDX page. Key architecture:

- **Client components** in `app/components/guardian/` — `GuardianDashboard` (orchestrator), `GuardianStatusBar`, `GuardianCameraFeed`, `GuardianDetections`, `GuardianInfoPanels`, `GuardianHomeBadge`, `types.ts`
- **API base**: `https://guardian.markbarney.net` (Cloudflare tunnel to Mac Mini port 6530)
- **Four cameras** (v2.12 names): `house-yard` (Reolink 4K PTZ), `s7-cam` (Samsung S7 RTSP), `usb-cam` (USB brooder), `gwtc` (Gateway laptop webcam via MediaMTX). Names are device-based, not location-based.
- **Snapshot polling feeds**: `GuardianCameraFeed` fetches a JPEG from `/api/cameras/{name}/frame` every ~1.2s via `fetch()` + `createObjectURL()`. Replaced persistent MJPEG streaming (v1.1.0) because browsers cap HTTP/1.1 connections at ~6 per domain — 4 MJPEG streams + API polling starved connections through the Cloudflare tunnel.
- **Polling**: fast (5s: status, detections, tracks, deterrent), slow (60s: summary, effectiveness), glacial (5min: eBird)
- **Offline handling**: per-camera offline state with label. System-level offline via `GuardianHomeBadge`.
- **`'use client'` must be line 1** — before file header comments, or Next.js treats the component as a Server Component
- Guardian slug gets `max-w-7xl` container (wider than standard `max-w-4xl`)
- Hero photo suppressed for Guardian slug (live feeds replace it)
- Homepage uses both `GuardianHomeBadge` (status bar) and `GuardianCameraFeed` (4 feeds)
- **Content pipeline**: see `docs/CONTENT-PIPELINE.md` for the full operational guide

### Design tokens

Defined in `app/globals.css`:
- `--color-forest` / `--color-forest-light` — nav and footer backgrounds
- `--color-cream` / `--color-cream-dark` — page backgrounds
- `--color-wood` / `--color-wood-light` — accent/links
- `--color-guardian-*` — Guardian dashboard palette (`bg` #0f172a, `card` #1e293b, `border` #334155, `hover` #475569, `muted` #64748b, `text` #e2e8f0, `accent` #059669)
- Headings use Georgia serif; body uses system font stack
# Mark's Coding Standards

## Non-negotiables

- No guessing: for unfamiliar or recently changed libraries/frameworks, locate and read docs (or ask for docs) before coding.
- Quality over speed: slow down, think, and get a plan approved before implementation.
- Production-only: no mocks, stubs, placeholders, fake data, or simulated logic shipped in final code.
- SRP/DRY: enforce single responsibility and avoid duplication; search for existing utilities/components before adding new ones.
- Real integration: assume env vars/secrets/external APIs are healthy; if something breaks, treat it as an integration/logic bug to fix.

## Workflow (how work should be done)
1. Deep analysis: understand existing architecture and reuse opportunities before touching code.
2. Plan architecture: define responsibilities and reuse decisions clearly before implementation.
3. Implement modularly: build small, focused modules/components and compose from existing patterns.
4. Verify integration: validate with real services and real flows (no scaffolding).

## Plans (required)
- Create a plan doc in `docs/` named `{DD-Mon-YYYY}-{goal}-plan.md` before substantive edits.
- Plan content must include:
  - Scope: what is in and out.
  - Architecture: responsibilities, modules to reuse, and where new code will live.
  - TODOs: ordered steps, including verification steps.
  - Docs/Changelog touchpoints: what will be updated if behavior changes.
- Seek approval on the plan before implementing.

## File headers (required for TS/JS/Py)
- Every TypeScript, JavaScript, or Python file you create or edit must start with:

  ```
  Author: {Your Model Name}
  Date: {timestamp}
  PURPOSE: Verbose details about functionality, integration points, dependencies
  SRP/DRY check: Pass/Fail - did you verify existing functionality?
  ```

- If you touch a file, update its header metadata.
- Do not add this header to file types that cannot support comments (e.g., JSON, SQL migrations).

## Code quality expectations
- Naming: meaningful names; avoid one-letter variables except tight loops.
- Error handling: exhaustive, user-safe errors; handle failure modes explicitly.
- Comments: explain non-obvious logic and integration boundaries inline (especially streaming and external API glue).
- Reuse: prefer shared helpers over custom one-offs.
- Architecture discipline: prefer clean component composition and shared types.
- Pragmatism: fix root causes; avoid unrelated refactors and avoid over-engineering (small hobby project).

## UI/UX expectations (especially streaming)
- State transitions must be clear: when an action starts, collapse/disable prior controls and reveal live streaming states.
- Avoid clutter: do not render huge static lists or "everything at once" views.
- Streaming: keep streams visible until the user confirms they have read them.
- Design: avoid "AI slop" (default fonts, random gradients, over-rounding). Make deliberate typography, color, and motion choices.

## Docs, changelog, and version control
- Any behavior change requires:
  - Updating relevant docs.
  - Updating the top entry of `CHANGELOG.md` (SemVer; what/why/how; include author/model name).
- Commits: do not commit unless explicitly requested; when asked, use descriptive commit messages and follow user instructions exactly.
- Keep technical depth in docs/changelog rather than dumping it into chat.

## Communication style
- Keep responses tight and non-jargony; do not dump chain-of-thought.
- Ask only essential questions after consulting docs first.
- Mention when a web search could surface important, up-to-date information.
- Call out when docs/plans are unclear (and what you checked).
- Pause on errors, think, then request input if truly needed.
- End completed tasks with "done" (or "next" if awaiting instructions).

## Platform and command conventions
-


## Prohibited habits
- No time estimates.
- No premature celebration. Nothing is completed or fixed until the user tests it.
- No shortcuts that compromise code quality.
- No overly technical explanations to the user.
