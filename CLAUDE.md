# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
| `content/flock-profiles.json` | Breed definitions + individual bird roster (7 breeds, 9 birds) |
| `content/projects/[slug]/index.mdx` | Project overview (frontmatter: title, status, description, startDate, location) |
| `content/projects/[slug]/entries/*.mdx` | Per-project diary entries (frontmatter: date, title, tags) |
| `content/projects/[slug]/materials.json` | Bill of materials (item, qty, unit, cost) |
| `content/diary/*.mdx` | Global diary entries not tied to a project |
| `public/photos/` | Bird portraits, group shots, historical photos |

### Pages

- `/` — Hero, stats, Guardian live status section (with MJPEG feed + system panel), flock preview, active projects, recent diary entries
- `/flock` — Bird roster cards + breed reference guide
- `/projects` — Project listing with status badges (planning/active/complete)
- `/projects/guardian` — **Live dashboard**: MJPEG camera feed, PTZ controls, real-time detection table, active tracks, deterrent status, eBird sightings, daily summary. Rendered by `app/components/guardian/GuardianDashboard.tsx` (client component) above the MDX technical docs.
- `/projects/[slug]` — MDX project detail with materials table and diary timeline
- `/gallery` — Lightbox photo gallery (current + historical)
- `/diary` — Full chronological diary feed

### Guardian integration

The Guardian page (`/projects/guardian`) is a live interactive dashboard, not a static MDX page. Key architecture:

- **Client components** in `app/components/guardian/` — `GuardianDashboard` (orchestrator), `GuardianStatusBar`, `GuardianCameraFeed`, `GuardianPTZPanel`, `GuardianDetections`, `GuardianInfoPanels`, `GuardianHomeBadge`, `types.ts`
- **API base**: `https://guardian.markbarney.net` (Cloudflare tunnel to Mac Mini port 6530)
- **MJPEG feed**: `<img>` tag pointing at `/api/cameras/house-yard/stream` — no JS needed
- **PTZ controls**: POST to Guardian API — pan/tilt use unit values (1/-1), zoom auto-stops after 500ms
- **Polling**: fast (5s: status, detections, tracks, deterrent), medium (10s: PTZ), slow (60s: summary, effectiveness), glacial (5min: eBird)
- **Offline handling**: graceful degradation when Guardian is down
- **`'use client'` must be line 1** — before file header comments, or Next.js treats the component as a Server Component
- Guardian slug gets `max-w-7xl` container (wider than standard `max-w-4xl`)
- Hero photo suppressed for Guardian slug (live feed replaces it)
- Homepage uses `GuardianHomeBadge` to fetch live status once on mount

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
