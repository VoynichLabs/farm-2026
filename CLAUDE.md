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

**Read `docs/FRONTEND-ARCHITECTURE.md` first.** It's the working contract for this codebase — SSoT table, naming rules, how to add a camera/bird/field-note/project, and the "no hardcoded counts, no re-stated data, no SaaS template" rules the 13-Apr-2026 rewrite put in place.

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
| `public/photos/` | All site photos — `april-2026/`, `birds/`, `coop/`, `history/`, `enclosure/`, `guardian-detections/`, plus pipeline-populated `brooder/`, `yard-diary/`, `stories/` |

**Note:** `content/flock.json` is deprecated. `content/flock-profiles.json` is the single source of truth for bird data. `content/gallery.json` and `content/instagram-posts.json` were retired on 2026-04-23 (v1.11.0) — see CHANGELOG for the reasoning.

### Pages

- `/` — Rotating hero (latest strong-tier gem), FarmPulse stats band, Guardian live camera feeds + system panel, latest field note, flock preview, gems rail, projects, Social CTA (IG + FB)
- `/field-notes` — Photo-forward weekly update feed (replaces diary)
- `/field-notes/[slug]` — Individual field note with cover image, MDX content, photo gallery, prev/next nav
- `/flock` — Bird roster (active / In Memoriam sections) + breed reference guide
- `/projects` — Project listing with status badges (planning/active/complete/shelved)
- `/projects/guardian` — **Live dashboard**: camera roster fetched at runtime from Guardian's `/api/cameras` via `lib/guardian-roster.ts`; PTZ controls on the Reolink; MDX project docs below. Rendered by `GuardianDashboard.tsx`. Camera count reflects whatever the backend currently reports — never hardcoded.
- `/projects/[slug]` — MDX project detail with materials table and diary timeline
- `/gallery` — Retired 2026-04-23; now a server-side redirect to `/gallery/gems`. Do not rebuild the hand-curated static archive — the live pipeline surface is the canonical gallery.
- `/gallery/gems` — Live VLM-curated gem archive with camera / activity / individual / date-range filters
- `/yard` — Thrice-daily Reolink yard-diary timelapse stockpile
- `/diary` — Redirects to `/field-notes`
- `/sitemap.xml` — Dynamic sitemap for SEO
- `/robots.txt` — Crawler directives

### Instagram posting (image-hosting side)

The farm's Instagram account **@pawel_and_pawleen** posts via Meta Graph API from the Mac Mini — tokens live in that machine's keychain, **NOT in this repo** and **NOT in any Railway env var**. This repo's only role in that pipeline is **image hosting**.

`public/photos/` is the staging directory for IG source URLs. When Farm Guardian (or a Claude agent on the Mini) wants to post a curated gem, it:

1. Copies the JPEG to `public/photos/<subdir>/<name>.jpg` (convention: `brooder/`, `yard-diary/`, `flock/`, etc.).
2. Commits + pushes.
3. Uses the GitHub raw URL **immediately** as the `image_url` for the IG Graph API call:
   ```
   https://raw.githubusercontent.com/VoynichLabs/farm-2026/main/public/photos/<subdir>/<name>.jpg
   ```
   (IG fetches the image once at container-create time and caches it on Meta's CDN — the raw URL is only touched during ingestion.)

Railway deploy is a fallback, not a blocker: `farm.markbarney.net/photos/...` eventually serves the same file ~2–5 min later, but IG posts don't need to wait for that.

**Why this repo, not `guardian.markbarney.net`?** IG's media fetcher rejects URLs that don't end in `.jpg`/`.png` — Guardian's `/api/v1/images/gems/{id}/image?size=1920` trips the heuristic and fails. Railway-served static assets with clean extensions work. This is the same reason `scripts/yard-diary-capture.py` in farm-guardian commits photos here instead of exposing them through Guardian's tunnel.

**Don't add tokens to this repo.** If a future task asks to add an `IG_ACCESS_TOKEN` env var to Railway, push back — the posting runs on the Mini, not Railway, and the token lives in keychain. Full docs: `~/Documents/GitHub/farm-guardian/docs/19-Apr-2026-instagram-posting-plan.md`.

**Auto-posting is live (as of 2026-04-20).** Farm Guardian's capture-cycle hook (`tools/pipeline/orchestrator.py → _maybe_post_to_ig()`) fires whenever a strong+sharp gem is detected, commits the JPEG into this repo, pushes, and posts to `@pawel_and_pawleen`. That means this repo's `main` branch will grow a steady stream of commits from the Mac Mini — each one adds one file under `public/photos/brooder/` (or yard-diary, coop, flock). Commit messages follow the pattern `public/photos/<subdir>: <gem-id> <short descriptor>`. Do not squash or rewrite these commits — the IG media_id is stable on the URL at that commit's HEAD, so history-rewriting could theoretically break past post URLs if IG ever re-fetches. **End-to-end architecture (what feeds what, where the secrets live, how the pipeline decides what to post):** `~/Documents/GitHub/farm-guardian/docs/HOW_IT_ALL_FITS.md`.

### s7-cam is PORTRAIT (v2.35.2, 2026-04-21)

Gems from the Samsung Galaxy S7 phone camera (`s7-cam` in the Guardian roster) arrive as **1080×1920 portrait JPEGs** as of 2026-04-21. This is a deliberate choice on the farm-guardian side — s7-cam's primary content destination is Instagram stories + reels (native 9:16) and FB stories, so portrait frames fill the 9:16 surface instead of getting center-cropped from a landscape shot. Every camera in the roster still arrives at its native sensor aspect; `s7-cam` is the one that's now portrait-native instead of landscape-native.

**Impact on this repo:** `public/photos/brooder/` (and wherever else s7-cam gems land) will grow portrait JPEGs in the file mix, alongside landscape ones from `house-yard`, `usb-cam`, `gwtc`. The gallery components (`app/gallery/...`, `app/gallery/gems/...`) already handle mixed aspect ratios — Tailwind's `object-cover` on the thumbnail + a lightbox that respects the native dimensions. No frontend work needed. If you see a layout regression where thumbnails look wrong, **don't** blame the portrait s7-cam gems; first check the shared `GemsThumbnail` / `PhotoGrid` component for a new hardcoded aspect ratio.

**Deep dive on how portrait is achieved:** `farm-guardian/docs/skills-s7-adb-operations.md` → "Orientation" section. `farm-guardian/HARDWARE_INVENTORY.md` has the abbreviated version.

### IG engagement automation (separate from posting, 2026-04-23 onward)

There is a parallel automation under `farm-guardian/tools/ig-engage/` that scrolls Instagram as `@pawel_and_pawleen`, likes targeted posts, reacts to friends' stories, and leaves short VLM-written contextual comments on other accounts' content. This is **Boss's substitute for scrolling Instagram himself** — it's not a growth hack, it's a reciprocity-builder for an older, local, bird-and-dog audience.

**Zero frontend impact on this repo.** Heads-up here only so a future farm-2026 agent doesn't duplicate or build a conflicting feature. If asked to "add engagement" to the website — don't; point the requester at `farm-guardian/tools/ig-engage/`. Canonical reference: `~/bubba-workspace/skills/farm-instagram-engage/SKILL.md`. Plan: `farm-guardian/docs/23-Apr-2026-ig-engage-plan.md`. Local announce note: `docs/23-Apr-2026-ig-engage-announce.md`.

### Nextdoor automation (planned 2026-04-23, build in progress)

Same architectural pattern as the IG engagement automation, extended to Boss's Hampton CT Nextdoor neighborhood. Two lanes: inbound engagement (like/comment on neighbors' posts) and outbound cross-posting (one farm-content post per week, Sunday mornings, reaction-gated). Code will live under `farm-guardian/tools/nextdoor/`. **Same zero-frontend-impact rule as IG engagement** — the website doesn't need anything, don't add a Nextdoor embed component or env var. Canonical reference: `~/bubba-workspace/skills/farm-nextdoor-engage/SKILL.md`. Plan: `farm-guardian/docs/23-Apr-2026-nextdoor-plan.md`. Local announce note: `docs/23-Apr-2026-nextdoor-announce.md`.

### Facebook cross-posting (LIVE since 2026-04-21, v2.35.1)

Every successful IG post also dual-posts to the linked Facebook Page **"Yorkies App"** (`page_id=614607655061302`). **All four lanes — photo, carousel, story, reel — are wired and verified live.** FB re-uses the exact same `raw.githubusercontent.com/VoynichLabs/farm-2026/main/public/photos/...` URLs IG already accepted, so this repo's role is unchanged: host the JPEG/MP4, commit, push, and both platforms pull from the same URL.

**Don't do anything differently in this repo for FB.** No new directories, no new URL scheme, no new commits. The only thing FB adds is that each pushed photo now lands on two social surfaces instead of one.

**Token posture (so no future agent tries to "help" by adding anything to Railway):**

- **Tokens live on the Mac Mini**, not in this repo, not in Railway. Same rule as IG.
- **Full publish permissions are granted** on a non-expiring Page token: `pages_manage_posts` + dependencies + full IG suite. Nothing to enable, nothing to review.
- **Don't add `FB_PAGE_TOKEN`, `LONG_LIVED_PAGE_TOKEN`, or any Meta credential to this repo or Railway env vars.** Publishing runs from the Mini.
- If a future task claims FB cross-post needs new permissions or a new Meta app config, **it doesn't** — push back and point at `~/bubba-workspace/skills/farm-facebook-crosspost/SKILL.md` or `~/Documents/GitHub/farm-guardian/CHANGELOG.md` v2.35.1. The capability is settled; don't let the next assistant hallucinate a recipe.

**Where the FB post lands:** photos go to the Page feed, stories to the 24h Page stories surface, reels post as a Page "Video" (visually identical to a reel, skips Meta's resumable-upload dance for our 5-15MB clips — acceptable tradeoff, documented as such). Carousels render as FB photo-grid posts. Captions, hashtags, and image URLs are identical to the IG post.

**Deep dive:** `~/bubba-workspace/skills/farm-facebook-crosspost/SKILL.md`. Source: `~/Documents/GitHub/farm-guardian/tools/pipeline/fb_poster.py`.

**Separate follow-up (not wired yet):** `content/instagram-posts.json` currently embeds `@markbarney121` only. After the first few @pawel_and_pawleen posts land, consider adding those to the embed list on the homepage.

### Guardian integration

The Guardian page (`/projects/guardian`) is a live interactive dashboard, not a static MDX page. Key architecture:

- **Client components** in `app/components/guardian/` — `GuardianDashboard` (orchestrator), `GuardianStatusBar`, `GuardianCameraFeed`, `GuardianCameraStage`, `GuardianDetections`, `GuardianInfoPanels`, `GuardianHomeBadge`, `types.ts`
- **API base**: `https://guardian.markbarney.net` (Cloudflare tunnel to Mac Mini port 6530)
- **Camera roster is DATA, not a static list.** `lib/guardian-roster.ts` (`useGuardianRoster()`) fetches Guardian's `/api/cameras` every 30s; whatever the backend returns is what the site renders. Adding a camera to Guardian's `config.json` makes it appear on the site within 30s. Unplugging one makes it show an offline indicator, then disappear on the next roster refresh. Camera names are device-based, not location-based. `lib/cameras.ts` holds an *optional* UI metadata overlay (pretty label, short label, aspect ratio) keyed by camera name — if a camera appears in the backend but has no overlay entry, it renders with sensible defaults. The overlay is also used by the historical gem filter chips in `/gallery/gems`.
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

## Multi-Machine Claude Orchestration

Boss has Claude Code installed on multiple machines on the farm LAN (Mac Mini "Bubba", MacBook Air at `192.168.0.50`, GWTC laptop, Larry's MSI). When a task needs hands on a specific box — granting a TCC permission, running a GUI app, reading a file you can't `scp`, anything where being-on-that-box matters — **don't ask Boss to copy-paste your prompt into a session he's sitting in front of**. Spawn a fresh headless Claude on the target machine over SSH:

```bash
ssh -i ~/.ssh/id_ed25519 markb@192.168.0.50 'c -p "Self-contained task description. The remote Claude has no context from your conversation."'
```

`c` is the standard alias on every farm machine for `claude --dangerously-skip-permissions`. `-p` is print mode (non-interactive). Output comes back as the SSH command's stdout.

Full orchestration guide and per-machine quick-reference table is in `farm-guardian/CLAUDE.md` under "Multi-Machine Claude Orchestration". Don't re-document it here — read it there.

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
