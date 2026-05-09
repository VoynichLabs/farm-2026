# Guardian + Homepage Redesign — Execution Plan

**Date:** 09-May-2026  
**Author:** Claude Opus 4.6  
**Status:** Approved — ready to execute  
**Repo:** `VoynichLabs/farm-2026`  
**Context:** Informed by GPT-5.5 Codex's infrastructure makeover plan, Bubba's story/design brief, Bubba's memoir, and a conversation with Mark about what the farm actually is and what the site should show. This document is self-contained — a coding agent in a fresh session should be able to execute it without additional context.

---

## 1. What this is

A focused redesign of the homepage and Guardian page. Not a ground-up rewrite. The existing site has good bones — live camera feeds, gems gallery, field notes, flock roster. The problem is that the current pages bury the interesting story under wrong credits, dead features, and stats noise.

Four things need to happen:

1. **Rebrand** from "Claude built this" to "OpenClaw runs the coordination layer."
2. **Remove the dead weight** — detection stats, deterrent panels, eBird cards, inaccurate FarmPulse numbers.
3. **Show the pipeline** — the camera-to-VLM-to-Discord-to-public journey that's actually impressive and actually running.
4. **Show the farm changing** — this isn't a static system demo. It's a living farm where chicks grow up week to week, new hatches arrive, and the pipeline captures that change. The site should make the dynamism visible.

---

## 2. The real brief (Mark's words)

- The predator detection system is **not running**. It was janky and after-the-fact. It's not the story.
- The story right now is **watching chicks grow up**. The farm changes constantly — a week from now there will be new hatches and birds visibly bigger.
- FarmPulse "Birdadette sightings" are **inaccurate**. The system can't tell which chicken is which. Kill it.
- Mark is a **former game developer**, not a professional agriculturalist. 13.6 acres, "a large garden with a lot of chickens."
- He's used Claude, GPT-5.1 through 5.5, every flavor. The credit belongs to **OpenClaw** as the coordination platform, not to any single model.
- AI tools are his **farm hands**. He's the expert operator. The site should reflect that.
- Mark is the protagonist. Bubba and Larry are supporting cast — his AI farm hands on specific machines — not the headline.

---

## 3. Scope

### In scope

1. **Rebrand all visitor-facing "Claude" references to OpenClaw.**
2. **Delete FarmPulse** — stats confirmed inaccurate, not salvageable.
3. **Delete dead Guardian panels** — detection tracks, deterrent, daily summary, eBird.
4. **Strip detection/alert counters** from `GuardianStatusBar`.
5. **Rework `GuardianHomeSection`** — replace system-internals table with pipeline story.
6. **Rewrite the Guardian project MDX** — OpenClaw + pipeline focus, not predator detection.
7. **Rewrite the homepage hero** — Mark as farmer-operator, OpenClaw as coordination layer.
8. **Add pipeline visualization** — camera → VLM → Discord → public journey.
9. **Add topology indicator** — Mark's machines and cameras, backed by JSON data file.

### Out of scope

- No dedicated `/openclaw-farm-ops` case-study route.
- No new garden section or breeding program callout components.
- No backend Guardian changes.
- No new camera integrations.
- No changes to the gems gallery, flock page, or field notes pages (beyond removing "what Claude built" subtitles).
- No changes to the social posting pipeline.

---

## 4. Architecture — exact file map

### Files to modify (with current state and exact changes)

#### `app/layout.tsx`

**Current** (lines 16–41):
```
title.default: "Farm 2026 — One of the Wonders of Claude's Own Creation"
description: "They say I must be one of the wonders of Claude's own creation. A farm in Hampton, CT — field notes, flock roster, and the AI that watches over the birds."
openGraph.title: "Farm 2026 — One of the Wonders of Claude's Own Creation"
openGraph.description: "A chick hatched on the keyboard. A hawk took Birdgit two days later. By the end of the week there was a sky-watching AI and a brooder full of reinforcements."
twitter.title: "Farm 2026 — One of the Wonders of Claude's Own Creation"
twitter.description: (same as openGraph)
```

**Change to:**
- `title.default`: "Farm 2026 — OpenClaw on the Farm"
- `description`: "A chicken farmer in Hampton, CT using OpenClaw and AI tools to keep the flock safe, the cameras rolling, and the farm diary writing itself."
- `openGraph.title`: "Farm 2026 — OpenClaw on the Farm"
- `openGraph.description`: Keep the Birdadette story — it's true and compelling. Remove any Claude-specific credit if present.
- `twitter.title` and `twitter.description`: Match openGraph.

#### `app/components/home/Hero.tsx`

**Current copy** (lines 51–66):
- Tagline (line 55): `"They say I must be one of the wonders of Claude's own creation."`
- Body (lines 62–66): `"My chickens are pets, not livestock. I don't eat them, and I don't want anything else eating them either. This year I asked Claude to help — so we gave an AI eyes, ears, and real tools in the real world."`

**Change to:**
- Tagline: Something that positions Mark as the farmer-operator and OpenClaw as the coordination layer. Direction: "A chicken farmer in Connecticut running his flock with OpenClaw and AI tools." Not corporate. Not "AI-powered farm platform." Warm and specific.
- Body: Something like: "13.6 acres, a large garden with a lot of chickens, and an AI pipeline that never stops watching. Every gem you see behind this text was captured, judged, and curated by the same system that runs the cameras." Keep the farmer-as-protagonist voice.
- **Keep** the rotating gem background logic (fetchGems, HERO_POOL_SIZE, hour-based rotation, fallback image). Only the text changes.
- **Keep** the bottom-right nav links (Farm Guardian, Field Notes, The Flock, Gallery) and Hampton, CT location.

#### `app/components/home/LatestFieldNote.tsx`

**Line 27 — subtitle prop:**
```
subtitle="Weekly updates — what happened, what hatched, what Claude built."
```
**Change to:** `subtitle="Weekly updates — what happened, what hatched, what we built."`

#### `app/components/home/ActiveProjects.tsx`

**Line 36 — subtitle prop:**
```
subtitle="What we're building — and what Claude is building for us."
```
**Change to:** `subtitle="What we're building with OpenClaw and AI tools."`

#### `app/field-notes/page.tsx`

**Line 16 — meta description:**
```
description: "Weekly updates from the farm — what happened, what hatched, what Claude built.",
```
**Change to:** `description: "Weekly updates from the farm — what happened, what hatched, what we built.",`

**Line 34 — body text:**
```
Weekly updates from the farm — what happened, what hatched, what broke, what Claude built.
```
**Change to:** `"Weekly updates from the farm — what happened, what hatched, what broke, what we built."`

#### `app/projects/page.tsx`

**Line 37 — description body:**
```
"Farm Guardian is the flagship — an AI predator detection system protecting the flock with cameras, YOLO, and Claude-built code. Every version built in conversation."
```
**Change to:** Something like: "Farm Guardian is the flagship — a camera system watching the flock with OpenClaw, VLM scoring, and AI tools. The pipeline captures, judges, and curates — the best moments reach Instagram and Facebook."

#### `app/page.tsx`

**Current section order** (lines 28–42):
```
Hero → FarmPulse → GuardianHomeSection → LatestFieldNote → FlockPreviewStrip → LatestFlockFrames → ActiveProjects → SocialSection → SiteFooter
```

**Change to:**
1. Remove `FarmPulse` import and `<FarmPulse />` (line 19, line 32).
2. Add imports for new `ImagePipeline` and `FarmTopology` components.
3. New order: `Hero → GuardianHomeSection → ImagePipeline → LatestFieldNote → FlockPreviewStrip → LatestFlockFrames → FarmTopology → ActiveProjects → SocialSection → SiteFooter`
   - ImagePipeline sits right after the camera feeds so visitors see "here's what we're watching" then "here's what happens to those images."
   - FarmTopology goes before ActiveProjects as a context-setter: "here's the infrastructure" then "here's what we're building with it."
   - Exact ordering is flexible — use judgment.

#### `app/components/home/GuardianHomeSection.tsx`

**Current:** Full system-internals panel (lines 43–91) showing camera device list, streaming mode ("Snapshot polling", "OpenCV — no ffmpeg, no HLS"), hardware specs ("Mac Mini M4 Pro 64GB"), and a pipeline/hardware/alerts summary table. Visitors don't care about any of this.

**Change to:** Strip the right-hand "System" panel and the bottom summary table. Keep the camera stage (`GuardianCameraStage`) and the live status badge (`GuardianHomeBadge`). The section becomes: status badge on top, camera stage filling the width, and a simple link to the full Guardian dashboard. The pipeline story and topology are handled by the two new components, not this one.

Structure after rework:
```
<section className="bg-guardian-bg text-guardian-text">
  <GuardianHomeBadge />
  <div className="max-w-6xl mx-auto px-3 py-3">
    <GuardianCameraStage ... />  {/* full width now */}
    <div>  {/* bottom bar — just the link */}
      <Link href="/projects/guardian">Full Guardian dashboard →</Link>
    </div>
  </div>
</section>
```

#### `app/components/guardian/GuardianStatusBar.tsx`

**Current** (lines 56–65): Shows "Detections:" and "Alerts:" counters from `status.detections_today` and `status.alerts_today`.

**Remove** the two detection/alert `<span>` blocks (lines 56–65). Keep: online dot, label, uptime, cameras online, frames processed. These are real and accurate.

#### `app/components/guardian/GuardianDashboard.tsx`

**Current state:** Already stripped of detection-pipeline UI in v1.4.0. Only polls `/api/status` for online indicator. The "Compact cameras-only row" (line 107) still mentions detection stats being removed.

**Changes needed:**
- Verify no residual imports of `GuardianInfoPanels` or `GuardianDetections` (grep confirms: neither is imported here currently — clean).
- Leave as-is. The dashboard orchestrator is already correct.

#### `content/projects/guardian/index.mdx`

**Full rewrite needed.** Current narrative is centered on "Claude built a system" and predator detection. New narrative:

**Frontmatter changes:**
- `description`: Change from detection/deterrent language to: "A multi-camera system running on OpenClaw — watching the flock, scoring frames with VLMs, curating the best moments through Discord to Instagram and Facebook."
- `tags`: Remove `claude`, add `openclaw`, `vlm`, `pipeline`

**Body structure (new):**

1. **What This Is** — Mark built a camera system using OpenClaw and AI tools. Not "Claude built a system." The Mac Mini runs the VLM pipeline — capture, judge, curate, publish. The predator detection system was built but is paused. The headline feature now is the image pipeline: watching chicks grow up.

2. **The Pipeline** — This is the centerpiece. Camera frames → VLM scoring on Mac Mini → Discord as review table (Boss reacts to the best ones) → gems reach Instagram and Facebook. Use farm language: "gems" not "curated artifacts."

3. **The Hardware** — Keep the camera table. It's accurate and useful. Update the intro text to remove Claude references.

4. **How It Watches** — Keep the snapshot-polling explanation. Remove "Claude built" language. Replace with "built with AI tools" / "built with OpenClaw."

5. **What's Running / What's Paused** — Honest disclosure. Running: camera feeds, VLM pipeline, social posting. Paused: YOLO detection, automated deterrents. Keep the same frank tone the current MDX has.

6. **Under the Hood** — Keep the technical architecture section. Replace the final paragraph ("The whole thing — both the backend that runs the cameras and this website — was written end-to-end with Claude Code") with OpenClaw attribution.

7. **Where the Code Lives** — Keep the repo links. Replace "Both were written end-to-end with Claude Code" with "Built with OpenClaw and AI tools."

8. **The Story** — Keep the Birdgit narrative. It's true and sets the emotional context. Replace "Within hours, Claude built sky-watch mode" with "Within hours, sky-watch mode was built" or "Mark built sky-watch mode" depending on accuracy.

### Files to create

#### `app/components/home/ImagePipeline.tsx`

**Purpose:** Visual story of the image journey from camera to public.

**Four steps, farm language:**
1. "Cameras see the birds." — Icon/visual of camera + live frame count or camera names.
2. "Mac Mini judges the frames." — VLM scoring. Mention Bubba by name as the Mac Mini agent.
3. "Discord becomes the review table." — Boss reacts to the best gems. Human in the loop.
4. "The best moments reach the public." — Instagram (@pawel_and_pawleen) + Facebook (Yorkies App).

**Design direction:**
- Use Guardian dark palette (`bg-guardian-bg`, `text-guardian-text`, `border-guardian-border`) — the contrast between farm-cream sections and dark-system sections tells the story.
- Horizontal flow on desktop, vertical on mobile.
- Not a corporate flowchart. Feel like a story map — warm labels, farm iconography.
- No fake metrics or animated counters. If live data is available (gems count, etc.), use it; otherwise static labels are fine.
- Component should be a Server Component if it fetches data, or a simple client component if purely visual.

**Tone anti-patterns (from Bubba's brief):**
- No "curated artifacts" — say "gems"
- No "intelligent visual processing" — say "the Mac Mini judges the frames"
- No "stakeholder engagement" — say "Boss reacts on Discord"
- No SaaS gradients or meaningless metric cards

#### `app/components/home/FarmTopology.tsx`

**Purpose:** Show Mark's farm infrastructure — who lives where and what they do.

**Data source:** Read from `content/farm-topology.json` (new file, see below). Do NOT hardcode machine data in TSX — codebase SSoT discipline requires data in data files.

**Content (three nodes):**
1. **Bubba** — Mac Mini M4 Pro in the house. Runs the VLM pipeline, serves the Guardian API, archives gems, pushes to Cloudflare tunnel. Mark's primary AI farm hand.
2. **Larry** — MSI Dominator near the coop. Runs gateway camera services, provides compute near the birds.
3. **Cameras** — house-yard (Reolink 4K PTZ), s7-cam (Samsung Galaxy S7), usb-cam, mba-cam, gwtc. The fleet that watches the flock.

**Design direction:**
- Small, warm, not an enterprise network diagram.
- A few cards on farm-cream background (`bg-cream`), each with machine name, role, and location.
- Mark is the operator sitting above all of this — not shown as a card, but framed as the one running it all. Maybe a section header like "Mark's Farm Infrastructure" or "The Machines."
- Cards should use `--color-wood` / `--color-forest` accents, not guardian-dark palette (this is the farm layer, not the system layer).

#### `content/farm-topology.json`

**Purpose:** SSoT for machine/camera data rendered by `FarmTopology.tsx`.

**Structure:**
```json
{
  "machines": [
    {
      "name": "Bubba",
      "hardware": "Mac Mini M4 Pro, 64GB",
      "location": "In the house, next to the brooder",
      "role": "Runs the VLM pipeline, serves Guardian API, archives gems, pushes to Cloudflare tunnel",
      "agent": "OpenClaw agent — Mark's primary AI farm hand"
    },
    {
      "name": "Larry",
      "hardware": "MSI Dominator laptop",
      "location": "Near the coop",
      "role": "Gateway camera services, compute near the birds",
      "agent": "OpenClaw agent — handles coop-side operations"
    }
  ],
  "cameras": [
    { "name": "house-yard", "hardware": "Reolink E1 Outdoor Pro", "capabilities": "4K PTZ, spotlight, siren" },
    { "name": "s7-cam", "hardware": "Samsung Galaxy S7", "capabilities": "Portrait 1080×1920, IP Webcam app" },
    { "name": "usb-cam", "hardware": "USB webcam on Mac Mini", "capabilities": "1920×1080 AVFoundation" },
    { "name": "mba-cam", "hardware": "MacBook Air 2013 FaceTime HD", "capabilities": "720p via ffmpeg + MediaMTX" },
    { "name": "gwtc", "hardware": "Gateway laptop webcam", "capabilities": "720p via ffmpeg + MediaMTX" }
  ]
}
```

### Files to delete

| File | Reason | Verify not imported |
|------|--------|---------------------|
| `app/components/guardian/GuardianInfoPanels.tsx` | All four panels (Tracks, Deterrent, Summary, eBird) show data from dead features | Not imported anywhere — confirmed by grep |
| `app/components/guardian/GuardianDetections.tsx` | Detection feed UI for feature that's not running | Not imported anywhere — confirmed by grep |
| `app/components/home/FarmPulse.tsx` | Stats confirmed inaccurate (Birdadette sightings, etc.) | Imported only in `app/page.tsx` line 19 — remove import + usage |

### Types cleanup in `app/components/guardian/types.ts`

The following types are retained per the file's own comment ("retained for future reuse") but are now dead code since GuardianInfoPanels and GuardianDetections are deleted:
- `Detection`
- `DeterrentStatus`
- `ActiveTrack`
- `DailySummary`
- `DeterrentEffectiveness`
- `EBirdSighting`

**Decision:** Leave them. They map to real Guardian API endpoints that still exist on the backend. If someone reactivates detection, these types are correct. The types file comment already documents they're retained intentionally. Don't create unnecessary backend/frontend sync risk by deleting them.

The `GuardianStatus` interface has `detections_today` and `alerts_today` fields. Leave those too — they come from the real API response. `GuardianStatusBar` just won't render them anymore.

### Existing components to keep as-is

- `GuardianCameraFeed.tsx` — live snapshot polling is the core proof
- `GuardianCameraStage.tsx` — camera selection/promotion works well
- `GuardianPTZPanel.tsx` — PTZ controls are real and useful
- `GuardianHomeBadge.tsx` — system connectivity indicator
- `GuardianConnectivityBanner.tsx` — offline handling
- `Hero.tsx` gem rotation logic — just rewriting copy, keeping the background behavior
- `SiteFooter.tsx` — already cleaned up, no Claude credit
- `FlockPreviewStrip.tsx`, `LatestFlockFrames.tsx` — working fine
- `SocialSection.tsx` — IG/FB CTA works

---

## 5. Copy direction

### Hero tone

**Not this:** "AI-powered agricultural monitoring platform." / "Smart farm infrastructure."  
**This:** "A chicken farmer in Connecticut using OpenClaw and AI tools to keep the flock safe, the cameras rolling, and the farm diary writing itself."

Mark is the protagonist. He's a former game developer running a hobby farm. AI tools are his farm hands. The site should read like his — specific, warm, unpretentious, honest about what works and what's broken.

### Section subtitles

Replace "what Claude built" / "what Claude is building for us" with language that references the operating loop without crediting a single model. Examples:
- "What's happening on the farm"
- "What we're building with AI"
- "What we built this week"

### Pipeline labels (from Bubba's story brief — these are good)

- "Cameras see the birds."
- "Mac Mini judges the frames."
- "Discord becomes the review table."
- "The best moments reach the public."

Farm language, not enterprise language. "Gems" not "curated artifacts."

### Guardian MDX tone

The narrative shifts from "Claude built this system" to "Mark built this system using OpenClaw and AI tools." The VLM pipeline is the headline — not predator detection (which is honestly paused). Keep the frank "when things break" section. Keep the Birdgit story — it's the emotional hook and it's true.

---

## 6. Visual direction

- **Farm colors** as the base (cream, forest, wood) — `--color-cream`, `--color-forest`, `--color-wood` from `globals.css`.
- **Guardian dark palette** for pipeline/system sections (`--color-guardian-bg`, `--color-guardian-card`, etc.) — the contrast tells the story: living farm above, machine layer underneath.
- **No** SaaS gradients, fake dashboards, meaningless metric cards, animated counters showing made-up numbers.
- Pipeline visualization should feel like a **story map**, not a flowchart.
- **Real farm imagery leads.** The cameras and birds are the proof. The rotating hero gem and the live camera feeds are the most impressive things on the site — don't bury them.

---

## 7. TODOs (ordered)

### Phase 1: Rebrand (5 files, independent of other phases)

1. **`app/layout.tsx`** — Update `title.default`, `description`, `openGraph.title`, `openGraph.description`, `twitter.title`, `twitter.description`. Remove all "Claude's own creation" language. Use "OpenClaw on the Farm."
2. **`app/components/home/Hero.tsx`** — Rewrite tagline (line 55) and body text (lines 62–66). Keep gem rotation logic, nav links, and layout unchanged.
3. **`app/components/home/LatestFieldNote.tsx`** — Change subtitle at line 27 from "what Claude built" to "what we built."
4. **`app/components/home/ActiveProjects.tsx`** — Change subtitle at line 36 from "what Claude is building for us" to "What we're building with OpenClaw and AI tools."
5. **`app/field-notes/page.tsx`** — Update meta description (line 16) and body text (line 34): "what Claude built" → "what we built."
6. **`app/projects/page.tsx`** — Rewrite description paragraph (line 37): remove "Claude-built code" and predator-detection framing, replace with pipeline/OpenClaw language.
7. **`content/projects/guardian/index.mdx`** — Full rewrite per section 4 above. This is the biggest copy task.

### Phase 2: Remove dead weight (3 deletions + 2 edits)

8. **Delete `app/components/guardian/GuardianInfoPanels.tsx`.**
9. **Delete `app/components/guardian/GuardianDetections.tsx`.**
10. **Delete `app/components/home/FarmPulse.tsx`** and remove its import + usage from `app/page.tsx` (lines 19 and 32).
11. **`app/components/guardian/GuardianStatusBar.tsx`** — Remove the "Detections" and "Alerts" counter spans (lines 56–65). Keep uptime, cameras, frames.
12. **Verify `app/components/guardian/GuardianDashboard.tsx`** — Confirm no lingering imports of deleted components. It should already be clean (v1.4.0 strip).

### Phase 3: Build the pipeline story (3 new files + 1 rework + 1 composition update)

13. **Create `content/farm-topology.json`** — Machine and camera data per the schema in section 4.
14. **Create `app/components/home/ImagePipeline.tsx`** — Four-step pipeline visualization per spec in section 4.
15. **Create `app/components/home/FarmTopology.tsx`** — Mark's infrastructure cards, reads from `farm-topology.json`.
16. **Rework `app/components/home/GuardianHomeSection.tsx`** — Strip system-internals panel and summary table. Keep camera stage full-width + dashboard link.
17. **Update `app/page.tsx`** — Remove FarmPulse, add ImagePipeline and FarmTopology imports, reorder sections.

### Phase 4: Verify and document

18. **`npm run lint`** — Fix any issues.
19. **`npm run build`** — Must pass. No TypeScript errors, no broken imports.
20. **Dev server manual check** — `npm run dev`, open homepage and Guardian page. Check:
    - Hero shows rotating gem, new copy, no Claude references.
    - No FarmPulse band under hero.
    - Camera feeds still load and rotate.
    - ImagePipeline section renders the four-step story.
    - FarmTopology shows machine cards.
    - Guardian dashboard page still works (status bar, cameras, PTZ).
    - No detection/alert counters visible.
    - Responsive: check at mobile width.
21. **Privacy scan** — grep for private IPs (`192.168.`), tokens, credentials. None should be on public pages.
22. **Update `CHANGELOG.md`** — New version entry. What: OpenClaw rebrand, FarmPulse removal, detection stats removal, pipeline visualization, topology display. Why: site was crediting wrong model and showing dead feature data.
23. **Update `docs/FRONTEND-ARCHITECTURE.md`** — Add `ImagePipeline.tsx`, `FarmTopology.tsx`, and `farm-topology.json` to the SSoT table if they become durable components.

---

## 8. What I'm borrowing from the other docs

**From the Codex plan (`docs/09-May-2026-openclaw-agricultural-infrastructure-makeover-plan.md`):** The OpenClaw rebranding scope, the topology idea, the content guardrails (no private IPs, no overclaiming, no fake metrics).

**From Bubba's story brief (`docs/09-May-2026-openclaw-farm-ops-story-design-brief.md`):** The tone ("field station meets chicken yard"), the pipeline labels, the anti-patterns list, the visual direction (farm surfaces for narrative, dark panels for system sections), the insistence that the design reveals the operating system that's already there.

**From Bubba's memoir (`docs/09-May-2026-bubba-on-the-farm.md`):** The cast descriptions (Bubba, Larry, S7), the timeline proving this system accumulated over months of real use, the honest framing of breakage and repair.

**What I'm not borrowing:** The dedicated case-study route, the 7+ new components, the garden/breeding callout sections, the 1000-line repetitive brief format, the blog-pitch outline. The site doesn't need new surface area. It needs the existing surfaces to tell the right story.

---

## 9. Acceptance criteria

- A visitor understands within 10 seconds that this is a farmer using OpenClaw/AI as farm infrastructure.
- No visitor-facing reference to "Claude" as the builder. OpenClaw is the credited platform.
- The VLM image pipeline (camera → judgment → curation → publication) is visually understandable.
- Mark reads as the protagonist — expert operator using AI farm hands. Bubba and Larry appear as named machines with clear roles, not mascots.
- All detection/deterrent/eBird stats panels are gone from public-facing pages.
- FarmPulse is gone. No inaccurate stats on public pages.
- `GuardianStatusBar` shows uptime/cameras/frames but no detection or alert counters.
- The Guardian page leads with live camera feeds and pipeline story, not monitoring dashboard data.
- `npm run lint` and `npm run build` pass.
- No private addresses, tokens, IPs, or credentials on public pages.
- The site still feels warm, specific, and unpretentious — not like an enterprise SaaS landing page.

---

## 10. Codebase conventions the executing agent must follow

These are from `CLAUDE.md` and `docs/FRONTEND-ARCHITECTURE.md`:

- **File headers required** on every TS/JS file created or modified: `Author`, `Date`, `PURPOSE`, `SRP/DRY check`.
- **`'use client'` must be line 1** for client components — before the file header comment block. Next.js treats anything else as a Server Component.
- **No hardcoded counts.** Camera counts, bird counts, etc. come from data sources, never literal numbers in TSX.
- **No private IPs** on public pages (192.168.x.x, 10.x.x.x).
- **Design tokens** are in `app/globals.css` — use CSS variables (`--color-forest`, `--color-cream`, `--color-wood`, `--color-guardian-*`), not raw hex values.
- **Content data lives in `content/`** — that's where `farm-topology.json` goes, matching the pattern of `flock-profiles.json`.
- **Commit messages:** Don't commit unless asked. When asked, descriptive message + `Co-Authored-By` line.
- **CHANGELOG.md** must be updated for any behavior change (SemVer, what/why/how, model name).
