# Guardian Integration Plan

**Date:** 04-Apr-2026
**Goal:** Make Farm Guardian the flagship feature of farm.markbarney.net

## Scope

**In:**
- Guardian feature section on homepage (front and center, after hero)
- `/projects/guardian` MDX project page with full technical content from farm-guardian README
- Live camera feed embed (MJPEG stream from guardian.markbarney.net)
- "Guardian" nav link in layout
- Footer updated with Guardian link
- CHANGELOG.md entry

**Out:**
- No changes to flock data, diary entries, existing project content
- No changes to color scheme, fonts, or design system
- No new dependencies
- No changes to railway.json or deployment config
- No changes to the farm-guardian repo itself

## Architecture

### Reuse
- Existing MDX project system (`lib/content.ts` → `getProject()` / `getProjects()`) — Guardian becomes a new project entry, rendered by the existing `app/projects/[slug]/page.tsx` template
- Existing design tokens (forest, cream, wood, bark) and card patterns
- Existing nav pattern in `app/layout.tsx`

### New code
- `content/projects/guardian/index.mdx` — frontmatter + full MDX content
- `app/page.tsx` — new Guardian feature section inserted between stats bar and flock preview
- `app/layout.tsx` — add "Guardian" nav link

### Live feed approach
- Homepage: embed `<img src="https://guardian.markbarney.net/api/cameras/house-yard/stream">` in the Guardian feature section — continuous MJPEG, no JS required
- Guardian project page: same embed in the MDX content, plus snapshot fallback info
- Status endpoint (`/api/status`) available for future use but not wired up in this pass

## TODOs

1. **Create `content/projects/guardian/index.mdx`**
   - Frontmatter per CLAUDE.md spec (title, slug, status, description, heroPhoto, tags, startDate, location)
   - Full content: problem, solution, hardware, detection pipeline, automated deterrence, PTZ patrol, eBird early warning, intelligence reports, architecture diagram, REST API endpoints
   - Live camera feed embed

2. **Update `app/page.tsx` — add Guardian feature section**
   - Insert after stats bar, before flock preview
   - Shield/security visual concept with forest/wood palette
   - Live camera feed (MJPEG `<img>` tag)
   - 5 capability cards: Detection, Deterrence, Patrol, Early Warning, Reports
   - CTA link to `/projects/guardian`

3. **Update `app/layout.tsx` — add Guardian nav link**
   - Add between "Home" and "Flock" links (or after "Home" — it's the flagship)

4. **Update footer in `app/page.tsx`**
   - Add Guardian link to footer nav

5. **Create `CHANGELOG.md`**
   - Entry for this feature addition

6. **Verify**
   - `npm run build` passes clean
   - Dev server: homepage shows Guardian section with live feed
   - `/projects/guardian` loads with full content
   - Nav has Guardian link
   - All existing pages still work

## Docs/Changelog touchpoints
- New: `CHANGELOG.md`
- Updated: this plan doc (mark TODOs done)
