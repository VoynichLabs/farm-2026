# Changelog

All notable changes to this project will be documented in this file.
Format: [SemVer](https://semver.org/) — what / why / how.

## [1.16.6] — 2026-05-11

### Changed — /flock rewritten as the breeding-program memory surface (Claude Opus 4.7 1M context)

Boss pointed out that 1.16.4 and 1.16.5 were cosmetic passes that missed the page's actual job. The strategic framing lives in the docs, not the code, and I'd shipped two redesigns without reading them:

- `docs/11-May-2026-hermes-breeding-showcase-notes.md` names `app/flock/page.tsx` as "the breeding-program database" surface.
- `docs/09-May-2026-bubba-on-the-farm.md` §13 and §27: "the website is a farm memory surface", "the flock page should show why memory matters."
- `docs/09-May-2026-openclaw-farm-ops-story-design-brief.md` §9: "highlight hatch days, egg timelines, flock roster updates, breed-identification notes." §10.2: "warm farm surfaces for narrative sections, darker instrument-panel surfaces for camera / model / pipeline sections." §19: "treat flock profiles as memory made visible."
- `docs/10-May-2026-homepage-rewrite.md` §105: "/flock may want the same dark guardian palette for visual coherence."

Plan doc: `docs/11-May-2026-flock-page-breeding-memory-plan.md` (written before this commit, per coding-standards).

**Rewrite, structurally:**

- **Hero** gets a terminal-style instrument strip across the top — `[ROSTER] FLOCK-PROFILES.JSON · 29 nursery · 3 coop cohorts · 4 hens · 5 lost` — over the existing brooder hero photo. Subtitle replaced with field-station prose: "Hatch dates, names, lineage, and losses. The breeding-program record for Farm 2026 — what came out of an egg, when, and from whom."
- **Name Lineage panel** added directly under the hero. Dark guardian-card block (per openclaw §10.2) that renders the single named chain we have today: **Birdgit → Birdadette → Birdadonna → Birdadotta**, with four photo cards showing hatch / loss / dam / sire / namesake fields per bird. This is the headline breeding-program story made visible instead of buried inside note prose. Lineage data is declared locally as a small typed `LINEAGE` map — the Hermes doc lists structured pairing/lineage fields on `flock-profiles.json` as future scope, so the JSON schema is unchanged this pass.
- **BirdCard** gets a dark guardian-card instrument strip between the photo and the warm card body. Mono font, terminal palette. Fields render only when the bird has them: `HATCH`, `AGE`, `DAM` × `SIRE` (or just `DAM`, or `NAMESAKE`). Date formatter handles `YYYY-MM-DD`, `YYYY-MM`, and `YYYY` so partial hatch dates (May TSC batch is `"2026-05"`) render as "May 2026" instead of leaking the ISO substring.
- **Section tags** added above each `<h2>`: `[BROODER + NESTBOX]`, `[COOP]`, `[LAYING STOCK]`, `[ROOSTER]`, `[BREEDS]`, `[LOST]`. Matches the TerminalNav aesthetic from 1.16.3.
- **In Memoriam** moved into its own dark guardian-bg section at the foot of the page. Reframed as an operational ledger — date · name · breed · cause — not an apologetic sidebar. Field-station copy: "Predator losses are part of the program. The flock rebuilds, the record stays."
- **Voice** rewritten throughout to field-station per openclaw §10.3 and §19. Dropped marketing phrasing like "still discovering what a worm is" — concrete observed facts instead.

Aesthetic is the hybrid the openclaw brief calls for: warm cream for narrative sections (cohort intros, BirdCard bodies, Breed Notes), dark guardian-bg panels for the data layer (top instrument strip, Name Lineage block, BirdCard instrument strip, In Memoriam ledger). The contrast says "living farm above, machine layer underneath."

Triskaidekaphobia rule honoured — `coopCount` is not rendered (the coop cohort count is the literal sum that would equal 13), and the hero strip uses cohort counts plus nursery and hens individuals instead. Verified `/\b13\b/.test(body.innerText) === false`.

- `app/flock/page.tsx` — full rewrite (~430 lines).
- `docs/11-May-2026-flock-page-breeding-memory-plan.md` — new plan doc.

What's NOT in this pass (deliberately, per the plan doc):
- No new structured `dam`/`sire`/`namesake_of` fields in `content/flock-profiles.json`.
- No edit-review workflow for proposed record changes.
- No new field notes — existing notes still drive the per-card prose.

## [1.16.5] — 2026-05-11

### Fixed — /flock visual regressions from the 1.16.4 reorg (Claude Opus 4.7 1M context)

Boss reviewed the deployed 1.16.4 /flock and reported it as a disaster: gigantic wasted blank space at the top, washed-out section headings, broken-looking cards, stale notes copy, and the number 13 in the hero subtitle. All five issues addressed:

- **Hero blank space.** `flock-group.jpg` is portrait (1215×1620, ratio 0.75) and the hero was using `bg-contain`, so it rendered the photo centered with massive forest-green sidebands on both sides. Switched the hero photo to `brooder/2026-04-20-mixed-flock.jpg` (1920×1080, true 16:9 landscape — matches the new brooder narrative anyway) and changed `bg-contain` → `bg-cover` so the photo fills the hero band.
- **The number 13.** Boss has triskaidekaphobia. The previous subtitle read "13 juveniles growing out in the coop." Removed the explicit coop count — subtitle now reads "29 chicks and poults growing up indoors. A coop of juveniles outside. 4 hens laying. Hampton, CT." Dropped the `coopCount` variable since it's no longer rendered. Memory file added at `~/.claude/projects/.../memory/feedback_no_thirteen.md` so future passes vet derived counts against 13 before shipping.
- **Washed-out headings.** All `h2`/`h3` on the page were inheriting their colour through `font-bold font-serif` and rendered nearly invisible on the cream background (looked like pale tan on screen, not the design-token forest). Added explicit `text-forest` to every section heading and to the BirdCard bird-name `h3`. h2 elements now compute to `rgb(26,46,26)` instead of the inherited washed-out value.
- **"Broken-looking" no-photo placeholder.** The `bird.photo === null` branch (currently hit by the May TSC batch, the original TSC chicks, and the Little Big Red Junior memoriam entry's old card path) rendered a 🐔 at `text-forest/20` — visually indistinguishable from a failed image load. New treatment: gradient background, larger 🐣 emoji at `text-forest/50`, plus a small uppercase "Photo coming" label. Reads as intentional, not broken. Also switched the photo `<Image>` from `object-contain` → `object-cover` with a `sizes` prop so portrait-and-landscape mixed photos fill the card uniformly (kills the inner-card letterboxing too).
- **Stale notes prose.** `flock-profiles.json` bird notes are written in arrival-narrative voice ("Hatched 25-April...", "Boss noted they are a Plymouth Rock variety..."). On a page meant to be a current-state snapshot, those paragraphs read as month-old timeline material. Added a `firstSentence()` helper that truncates the notes display to the first sentence (or 140 chars if no terminator lands). Underlying JSON is unchanged — the timeline detail is still there for anyone reading the data.

Also rewrote the "In the Brooder & Nestbox" intro to drop the claim that "most of these birds are still discovering what a worm is" — the 4-5-week-old Cackle batch and Birdadette are past that. New copy: "Days-old chicks alongside four-week-olds — the desk incubator keeps turning eggs into birds, and Tractor Supply runs plus the Cackle Hatchery order fill out the rest."

## [1.16.4] — 2026-05-11

### Changed — /flock reorganised around what's hatching, not what was lost (Claude Opus 4.7 1M context)

Boss: "The flock page concentrates far too much on the birds we lost and not enough on the little birds currently incubating, being hatched, and discovering the world." The previous page rendered one flat "Hens & Chicks" grid mixing adult layers with brooder chicks, then put "In Memoriam" right under it at equal weight — five deceased birds with full-size cards competing with the nursery for screen real estate. With nine more chick/poult entries having landed since the last layout pass (Birdadotta, Bronze poults, Plymouth Rocks, March juveniles, the May-batch TSC chicks), the imbalance had gotten worse.

**New section order, leading with the nursery:**

1. **In the Brooder & Nestbox** — every entry whose `location` is `brooder`, `desk-brooder`, or `nesting-box`, sorted by `hatch_date` descending so the youngest hatch leads. 7 entries, 29 individual birds.
2. **Growing Out in the Coop** — entries with `location: coop`. 3 entries, 13 individual juveniles (turkey poults, the April TSC chicks, the March juveniles).
3. **The Hens** — adult layers (no `location` field). 4 entries.
4. **The Roosters** — conditional, currently 0.
5. **Breed Notes** — unchanged.
6. **In Memoriam** — now a compact text list (name · breed · cause of death) in a narrower `max-w-3xl` column. Names stay visible, the losses are still real, but the section is ~13× shorter than the brooder section by pixel height instead of competing with it.

Hero subtitle reworked to count *individual birds* via a tiny `(N)` parser on entry names, so the 15-chick Cackle Hatchery order and the 6-chick Plymouth Rock juvenile group aren't hidden behind a single tile: `"29 chicks and poults in the brooder and nestbox. 13 juveniles growing out in the coop. 4 hens laying. Hampton, CT."` Replaces the old `"14 active birds. 5 lost this season. 19 total."` — which led with the death count.

- `app/flock/page.tsx`: grouping logic, hero copy, In Memoriam compact list, BirdCard `deceased` branch removed (the compact list doesn't need the card props).

Same data, same `BirdCard` primitive — only the page composition changed.

### Fixed — All /photos/* assets 404 in production; drop `output: "standalone"` (Claude Opus 4.7 1M context)

Boss reported /flock rendering as a sea of broken-image placeholders — bird names visible inside empty gray boxes, hero photo gone, every card a wireframe. Same symptom on /gallery/gems thumbs and the homepage flock strip on close inspection; the home page just hid it well because most above-the-fold content is Guardian-API-driven and renders fine.

**Root cause.** `next.config.ts` set `output: "standalone"` and `railway.json` started the server with `node .next/standalone/server.js`. The standalone server runs with CWD at `.next/standalone/`, so it looks for the public directory at `.next/standalone/public/` — not the repo root's `public/`. The build script worked around this with a manual `cp -r public .next/standalone/public`, but that copy was not surviving the Nixpacks build→deploy boundary. Verified via `curl -I https://farm.markbarney.net/photos/birds/henrietta.jpg` → `HTTP 404` with `X-Nextjs-Cache: HIT` (Next.js's app-router 404 page). `/_next/image?url=...` returned `HTTP 400 "The requested resource isn't a valid image"` — the optimizer's expected failure when the upstream fetch comes back as HTML 404 instead of an image. Server-rendered HTML was correct (right `<img>` srcset, right paths); only the static asset layer was broken.

**Fix.** Standalone output exists for Docker-imaged / serverless deploys where minimal disk image matters. Railway with Nixpacks is neither — it runs a normal Node container. Dropped `output: "standalone"`, simplified the build script back to plain `next build`, and switched `railway.json` to `npm start` (which runs `next start`). `next start` serves `public/` natively, no copy step, no surprises.

- `next.config.ts`: removed `output: "standalone"`.
- `package.json`: build is now `next build`. No post-build cp.
- `railway.json`: start command `npm start`; healthcheck unchanged (`/api/health`).

No behavior change for visitors beyond photos no longer being broken.

## [1.16.3] — 2026-05-10

### Changed — Terminal / surveillance aesthetic, kill the cream nav (Claude Opus 4.7 1M context)

Boss's brief: "professional scientific terminal or surveillance/monitoring something, rather than a vibe-coded piece of shit disaster. Especially with that nav bar header. That's just junk. Get that the fuck out." Also: less padding, more story up top.

**New site-wide top bar (`app/components/system/TerminalNav.tsx`):**
- Replaces the cream pill-link nav. Two compact font-mono rows: identity strip (`[FARM-2026]` · location · build version · live UTC clock) and lowercase nav strip (`home guardian gallery yard flock notes projects ↗ markbarney.net`). Hairline borders, no rounded corners, sticky.
- Clock is a client island that ticks every second. SSR renders `──:──:──Z` and the first interval tick replaces it; `suppressHydrationWarning` on the timestamp text. Pattern avoids React 19's `set-state-in-effect` lint rule.
- Version pulled from `package.json` so a release bump propagates without a string edit. `package.json.version` bumped from `0.1.0` (Next scaffold default) to `1.16.3` to match the CHANGELOG release.

**New homepage story strip (`app/components/home/SystemBanner.tsx`):**
- Renders directly above the camera grid so a visitor reads what the page IS while the cameras are still connecting on cold load.
- Four `$ `-prefixed lines describing the live pipeline (cameras → Mac Mini → YOLO+VLM → Discord queue → IG/FB; predator detections fire deterrent loops; the page mirrors the live grid + recent archive).
- ASCII data-flow diagram below the prose (hidden on narrow viewports).

**Homepage tightened (`app/page.tsx`):**
- Containers widened from `max-w-6xl` to `max-w-7xl` and vertical padding dropped throughout. Reads as a dashboard, not a marketing landing.
- Deeper-links rail rebuilt as a file-listing block (`└─ guardian — live cameras + PTZ + dashboard`) instead of six rounded cards.
- Footer collapsed to a single status line (`FARM-2026 · Hampton, CT · N gems in the last 7 days · instagram ↗ facebook ↗ © 2026`).
- "Recent gems" heading swapped to `▸ RECENT GEMS` mono header to match the rest.

**Body palette flipped (`app/globals.css`):**
- Body bg is now `--color-guardian-bg` (#0f172a) and text is `--color-guardian-text` (#e2e8f0). Cream/forest tokens stay defined for any per-page override that wants them, but the default surface is dark so the whole site reads as one terminal.
- Cream-styled legacy pages (`/flock`, `/field-notes`, `/projects`, etc.) still set their own backgrounds via Tailwind — the body color is only visible where a page doesn't fill the viewport. Those pages may want a separate dark-mode pass; out of scope for v1.16.3.

**Untouched:** `/projects/guardian` and every `app/components/guardian/*` (the page Boss said looked right), `lib/*`, `/api/health`, `public/photos/*`, the auto-pipeline write paths, the IG/FB raw-URL contract.

## [1.16.2] — 2026-05-10

### Changed — OG image points at GitHub raw, not Railway (Claude Opus 4.7 1M context)

Discovered after v1.16.1 deploy: `farm.markbarney.net/photos/og-2026-05.jpg` returns 404. Probing further, most of `public/photos/` also 404s on the deployed Railway container — `april-2026/birdadette-fresh-hatch.jpg`, `brooder/2026-04-20-solo-yellow.jpg`, `birds/whitey-red-legs.jpg` all present in the repo, all 404. Only very recently pushed paths (`yard-diary/2026-05-10-morning.jpg`) serve. `public/photos/` is **772 MB** across 751 files; the build script's `cp -r public .next/standalone/public` step is almost certainly hitting Railway's build/container budget and copying partially.

The fix for that root cause is a separate, larger piece of work (move photos out of the deployed bundle, or front it with a CDN). For now, the OG image URL points at `raw.githubusercontent.com` — the same surface the auto-pipeline already uses for every IG/FB post, proven stable, returns HTTP 200 with `content-type: image/jpeg`. Comment in `app/layout.tsx` documents the temporary nature so the next agent can switch back to a `/photos/...` path once Railway serves the full tree again.

## [1.16.1] — 2026-05-10

### Changed — SEO refresh + camera tile cold-load fix (Claude Opus 4.7 1M context)

**SEO** (`app/layout.tsx`):
- Title default rewritten from "Farm 2026 — OpenClaw on the Farm" (internal jargon to a stranger) to "Farm 2026 — Live chicken cameras in Hampton, CT" (describes what the page actually is, indexes for "live chicken cameras"). Title template (`%s | Farm 2026`) unchanged so subpages still suffix with the brand.
- Description / OG description / Twitter description rewritten to match the new homepage (cameras + gem rail) instead of the prior story-driven "A chick hatched on the keyboard. A hawk took Birdgit two days later." copy.
- OG image swapped from `/photos/april-2026/birdadette-fresh-hatch.jpg` to `/photos/og-2026-05.jpg` — a 1200×900 portrait of a young chicken under brooder heat-lamp light, with the camera + power adapter visible behind it (matches the site's "live cameras + flock" subject). New URL so Facebook / Twitter caches re-fetch instead of serving the stale April image.
- Open Graph image now declares `width: 1200`, `height: 900`, and an alt-text — social previews can render without a HEAD probe.

**Camera tile cold-load** (`app/components/guardian/GuardianCameraFeed.tsx`):
- A camera tile that has *never* received a frame yet now stays in CONNECTING indefinitely instead of flipping to red OFFLINE after just 3 failed snapshots (~3.6s). The `/api/cameras/<name>/frame` endpoint can take 10+ seconds on a cold tunnel round-trip; under the old threshold every tile painted red on first load and the dashboard looked dead even when it was working. OFFLINE is now reserved for tiles that *had* a frame and lost it (the `OFFLINE_THRESHOLD = 10` after-live path is unchanged — that's correct evidence of a downed camera). The roster's `is_live` gate already filters dead cameras upstream, so a tile we render is one the backend said is producing frames; "still trying" is the honest state.
- Polling now uses chained `setTimeout` instead of `setInterval` so requests don't pile up faster than they complete when the tunnel is slow. Each fetch carries an `AbortController` capped at 12s so a hung fetch can't block the chain forever.
- Connecting state is more reassuring: bigger spinner, font-mono "CONNECTING…" label, and a one-line explainer ("First frame can take a few seconds — the snapshot travels through the Cloudflare tunnel back from the Mac Mini.") so a visitor on a cold load doesn't read empty + amber as broken.

## [1.16.0] — 2026-05-10

### Changed — Homepage rewritten to lead with cameras (Claude Opus 4.7 1M context)

The v1.15.0 homepage was a nine-section template stack (Hero + GuardianHomeSection + ImagePipeline + LatestFieldNote + FlockPreviewStrip + LatestFlockFrames + FarmTopology + ActiveProjects + SocialSection + SiteFooter). The desktop layout broke on production: hero rendered tiny on the bg-contain fallback path, GuardianHomeSection's gutted right panel left dead space, bottom-of-page links broken. v1.15 post-mortem documented the failure.

Boss's call: throw it out, lead with the cameras and the gem photos like `/projects/guardian` does, nothing else.

**New `/`:**
- `GuardianHomeBadge` (online dot + Cams N/M, dark strip)
- `HomeCameraStage` — wraps the existing `GuardianCameraStage` with `defaultFeatured="house-yard"` + `secondaryFeatured="s7-cam"` so the homepage and the dashboard render the same composition. Different `storageKey` so the home featured selection doesn't fight the dashboard's.
- `RecentGemsRail` — client-side fetch of `/api/v1/images/gems?limit=12`. Has to be client-side: the endpoint takes ~7s for limit=12 (measured 2026-05-09), well over the 3s SSR `AbortSignal.timeout()` cap in `lib/gems.ts`. SSR would always render empty; doing the fetch in the browser lets the page render fast and the rail populates async with skeleton tiles in the meantime.
- Six-link grid to deeper pages (Guardian, Gallery, Yard, Flock, Field Notes, Projects)
- Small dark footer with `GemsStatFooter` + IG/FB

**Deleted:**
- `app/components/home/Hero.tsx`
- `app/components/home/GuardianHomeSection.tsx`
- `app/components/home/ImagePipeline.tsx`
- `app/components/home/LatestFieldNote.tsx`
- `app/components/home/FlockPreviewStrip.tsx`
- `app/components/home/LatestFlockFrames.tsx`
- `app/components/home/FarmTopology.tsx`
- `app/components/home/ActiveProjects.tsx`
- `app/components/home/SocialSection.tsx`
- `app/components/home/SiteFooter.tsx`
- `app/components/primitives/SectionHeader.tsx`
- `app/components/primitives/BirdCard.tsx` (the home-only primitive — `app/flock/page.tsx` has its own local `BirdCard` and is unaffected)
- `content/farm-topology.json`

**Untouched (Boss's "stays as-is" list):**
- `/projects/guardian` and every `app/components/guardian/*` file
- `/gallery/gems`, `/yard`, `app/layout.tsx` (the cream nav still wraps every page)
- `lib/*` (esp. the 3s `AbortSignal.timeout` in `lib/gems.ts`)
- `/api/health`, `public/photos/*` (auto-pipeline write paths), all `content/*` MDX, the raw-githubusercontent IG/FB URL contract

**Tweaked:**
- `app/components/gems/GemsStatFooter.tsx` — explicit `text-cream/60` removed so the widget inherits color from its parent, which lets it render on both the cream legacy surfaces and the new dark guardian footer.

**Verification done before push (the step v1.15.0 skipped):**
1. `npm run lint` clean
2. `npm run build` clean — all 20 routes prerender, no `TimeoutError` on Guardian fetches during the build
3. `npm run dev` — `/` rendered at 1440×900 and 375×812. CORS errors in dev are localhost-only (Guardian whitelists `farm.markbarney.net`, not localhost) — the camera stage and the gems rail correctly fall through to their empty/fallback states and the page composition holds. Production CORS is unaffected.
4. Post-deploy: verify on `farm.markbarney.net` at desktop width before declaring done.

## [1.15.1] — 2026-05-09

### Added — Lobster emojis + Bubba/Larry thanks (Claude Opus 4.6)

Added 🦞 lobster emojis to the hero tagline, pipeline heading, topology heading, and footer. Added a thanks line for Bubba and Larry as tireless OpenClaw assistants in the FarmTopology section. Also stripped detection/alert counters from `GuardianHomeBadge.tsx` (missed in 1.15.0).

## [1.15.0] — 2026-05-09

### Changed — OpenClaw rebrand + homepage redesign (Claude Opus 4.6)

Site-wide rebrand from "built with Claude" to "built with OpenClaw" and a homepage redesign that replaces dead-weight stats panels with the VLM image pipeline story.

**Rebrand:**
- Site title/meta changed from "One of the Wonders of Claude's Own Creation" to "OpenClaw on the Farm" (`app/layout.tsx`)
- Hero tagline and body rewritten — Mark as farmer-operator, OpenClaw as coordination layer (`Hero.tsx`)
- Section subtitles updated: "what Claude built" → "what we built" (`LatestFieldNote.tsx`, `ActiveProjects.tsx`)
- Field-notes and projects page copy updated (`field-notes/page.tsx`, `projects/page.tsx`)
- Guardian MDX fully rewritten — pipeline-first narrative, predator detection described as paused-not-headline (`content/projects/guardian/index.mdx`)

**Removed:**
- `FarmPulse.tsx` deleted — Birdadette sighting counts confirmed inaccurate (system can't distinguish individual chickens)
- `GuardianInfoPanels.tsx` deleted — all four panels (Active Tracks, Deterrent, Today summary, eBird) showed data from dead/paused features
- `GuardianDetections.tsx` deleted — detection feed UI for feature not running
- Detection/alert counters stripped from `GuardianStatusBar.tsx`

**Added:**
- `ImagePipeline.tsx` — four-step pipeline visualization: cameras → VLM scoring → Discord review → Instagram/Facebook
- `FarmTopology.tsx` — Mark's farm infrastructure cards (Bubba, Larry, camera fleet)
- `content/farm-topology.json` — SSoT for machine/camera data rendered by FarmTopology

**Reworked:**
- `GuardianHomeSection.tsx` — stripped system-internals panel (hardware specs, streaming mode, device list) and summary table; camera stage now full-width with simple dashboard link
- `app/page.tsx` — FarmPulse removed, ImagePipeline and FarmTopology added to section ordering

**Why:** The site was crediting Claude specifically when Mark uses every AI model via OpenClaw. Detection stats were from dead features. FarmPulse data was inaccurate. The actually impressive part — the VLM image pipeline — was invisible to visitors.

## [1.14.4] — 2026-05-09

### Added — OpenClaw farm-ops narrative/design documents (OpenAI Codex GPT-5.5 / Bubba)

Three planning/story documents were added under `docs/` to guide the next Farm 2026 redesign before implementation. They frame the site as a public OpenClaw agricultural infrastructure showcase rather than a generic farm homepage: multi-machine agents, Bubba on the Mac Mini, Larry on the MSI Dominator, Guardian cameras, S7 portrait capture, VLM image curation, Discord human review, and the downstream website / Instagram / Facebook publishing loop.

- `docs/09-May-2026-openclaw-agricultural-infrastructure-makeover-plan.md` — implementation-oriented makeover plan created by the planning agent.
- `docs/09-May-2026-openclaw-farm-ops-story-design-brief.md` — long-form story/design handoff for a future coding agent.
- `docs/09-May-2026-bubba-on-the-farm.md` — Bubba's first-person memory document about the first hundred-ish days of OpenClaw on the farm, especially Larry, early WSL2 scars, gateway/plugin failures, Guardian, and the farm VLM pipeline.

No source code or runtime behavior changed in this release note.

## [1.14.3] — 2026-05-06

### Fixed — flock-profiles.json: Birdadonna alive, Whitey lost, locations + new arrivals (Claude Opus 4.7 (1M context))

Boss did a verbal flock walkthrough with Bubba and called out drift in `content/flock-profiles.json`. Public `/flock` page was showing Birdadonna in the In Memoriam section when she's alive and well — she survived the early-April predator wave despite an earlier batch update that lumped her in with Birdgit / Birdatha / the Black Australorp. Several other entries had stale ages, stale locations, or were missing entirely. Roster reconciled to today's truth.

Specific edits to `content/flock-profiles.json`:

- **Birdadonna** flipped from `deceased` to `active`. Removed `deceased_date` and `cause_of_death`. Updated notes to reflect that she survived the early-April losses and laid the egg that hatched as Birdadotta on 25-April-2026. This is the visible bug — she should reappear in the active flock section of `/flock`.
- **Whitey Red Legs** entry untouched (already correctly `deceased` 2026-05-01); cause kept as "Disappeared without trace; presumed predation."
- **Locations updated** to match Boss's current housing layout: indoor cohorts split between the **brooder** (youngest, 11 birds) and the **nesting box** (older indoor cohort), with the rest in the **coop**. Specifically: Birdadette + Bronze turkey poults + Cackle batch → `nesting-box`; Birdadotta + Barred Rocks + Plymouth Rocks (variety TBD) + new May TSC batch → `brooder`; White BB Turkey poults (3) + April Brahma/Cream Legbar chicks (4) → `coop`.
- **Ages refreshed.** Birdadette ~1 month; Birdadotta ~11 days; April-7 turkeys/chicks ~5-6 weeks; Cackle batch ~4 weeks. Replaced stale "0 days / Days old / 1 day" placeholders.
- **Two new entries.** "March juveniles (6)" — the early-March 2026 cohort (1 EE + 2 BLR Wyandotte + 3 Cream Legbar), now ~10 weeks old in the coop, was previously not represented in the JSON. "Tractor Supply chicks — May batch (6)" — the 02-May-2026 TSC haul (breeds TBD) joining the brooder, bringing brooder count to 11.
- **Two new breed dictionary entries** to support the additions: **Cream Legbar** (British autosexing breed, blue-green eggs) and **Blue Laced Red Wyandotte** (cold-hardy variant with blue lacing on red ground).
- **Cackle Hatchery (15)** notes rewritten to drop the "Currently in the desk brooder" line and reflect the move to the nesting box. Survivor count left as 15 — Boss explicitly said don't fuss the exact number; Cackle ships extras and the math evens out.

No frontend edits. The /flock page reads this JSON directly; In Memoriam now shows 5 entries (Birdatha, Birdgit, Black Australorp, Little Big Red Junior, Whitey Red Legs). Active roster reflects 4 hens + 6 group/named-chick entries on the indoor side + 3 group entries in the coop.

## [1.14.2] — 2026-05-06

### Fixed — Railway healthcheck restart loop + bounded SSR Guardian fetches (Claude Opus 4.7 (1M context))

Boss reported `farm.markbarney.net` was visibly flicking down for a few seconds and recovering, repeatedly. Root cause was inside this repo, not Guardian: `railway.json` had `healthcheckPath: "/"`, which is the heaviest page in the app — three Server Components (`Hero`, `FarmPulse`, `LatestFlockFrames`) each `await` a Guardian-tunnel fetch during SSR with no timeout. Every cold-cache homepage render was riding on the Cloudflare tunnel's worst-case latency; when the tunnel hung, the healthcheck timed out and `restartPolicyType: ON_FAILURE` cycled the container. The 1.14.0/1.14.1 hysteresis fixes only smoothed the dashboard banner — they couldn't keep the Next.js process alive.

Two-file fix shipped as two commits.

- **`app/api/health/route.ts` (new) + `railway.json`.** Dedicated liveness endpoint that returns `200 {ok:true}` with no upstream calls, no env reads, no `lib/` imports — independent of Guardian, the Mac Mini, and content loading by design. `dynamic = "force-dynamic"` so the response proves the live Next.js server actually answered. `railway.json` now points `healthcheckPath` at `/api/health`. `restartPolicyType: ON_FAILURE` is unchanged so a genuinely-stuck process still restarts.
- **`lib/gems.ts`.** New `REQUEST_TIMEOUT_MS = 3000` constant attached to every Guardian fetch via `AbortSignal.timeout()`. Normal Cloudflare → Mac Mini round-trip is 100–300 ms, so 3 s is ~10× headroom for jitter while bounding cold-cache SSR. Abort errors land in the existing `catch` and map to the `network_unavailable` `FetchResult`, which every consumer (Hero → `HERO_FALLBACK_IMAGE`, FarmPulse + LatestFlockFrames → empty/error states) already renders as a fallback. Cache-warm renders are unaffected because Next serves from the data cache without touching `fetch`.

Plan: `docs/06-May-2026-healthcheck-and-ssr-timeout-plan.md`. Per-tile frame polling (1.2 s) is unchanged — it loads `guardian.markbarney.net`, not `farm.markbarney.net`, and was a co-conspirator (loud on the tunnel) rather than the trigger.

## [1.14.1] — 2026-05-03

### Fixed — connectivity banner and per-tile RECONNECTING strip flapping every few seconds (Claude Opus 4.7)

Boss reported the dashboard was visibly churning between "Site disconnected" and reconnecting/live states every few seconds. Two sources of flicker on a jittery Cloudflare tunnel; both fixed with hysteresis.

- **`GuardianDashboard`** now requires two consecutive failed `/api/status` polls (~20s) before flipping `online` to false. A single success resets the streak immediately. So the banner only appears for sustained outages, not transient hiccups.
- **`GuardianCameraFeed`** bumps `RECONNECT_SHOW_THRESHOLD` from 3 to 5 (~6s of consecutive misses before the strip shows) and adds a 4-second minimum dwell on the "reconnecting" state. Once the strip appears, it stays at least four seconds even if a frame succeeds — the visible image still updates with every successful fetch, only the state flip is held. After the dwell, the next success snaps back to live cleanly.

Per-tile recovery on parent `online` flipping back to true is preserved (resets the dwell timer too).

## [1.14.0] — 2026-05-03

### Added — top-level S7 alongside Reolink, connectivity banner, contract check (Claude Opus 4.7)

Three user-visible improvements off the back of the gap analysis. Each shipped as its own commit so they're individually reviewable.

**Two-up primary stage on `/projects/guardian`.** `GuardianCameraStage` learned an optional `secondaryFeatured` prop. When set and the named camera is in the live roster (and distinct from the primary), the top of the stage renders as a side-by-side pair instead of one big tile — with each tile keeping its native aspect ratio (16:9 yard, 9:16 phone) at a fixed desktop height. Mobile stacks. Thumbs exclude both top slots. The dashboard now passes `secondaryFeatured="s7-cam"` so the Reolink yard camera and the S7 phone share top billing; usb-cam, gwtc, and any recommissioned cams (mba-cam) sit below as thumbnails. Homepage `GuardianHomeSection` is unchanged — single-tile brooder layout preserved.

**Site-connectivity banner distinct from per-camera state.** New `GuardianConnectivityBanner` component renders a clear "Site disconnected — can't reach Guardian on the Mac Mini" banner whenever `/api/status` reports `online === false`. Hidden during the initial connecting state so it doesn't flash before the first response. The point: when the Cloudflare tunnel drops or Guardian is down, *every* camera tile fails for the same reason — the banner attributes that to the right cause instead of leaving visitors to guess from a sea of OFFLINE tiles. Wired into the dashboard above the existing status bar.

**`npm run check:contract`.** New `scripts/check-guardian-contract.mjs` probes `/api/status`, `/api/cameras`, and `/api/v1/images/recent` and asserts response shapes match the TypeScript interfaces in `app/components/guardian/types.ts` and `lib/guardian-roster.ts`. Reports drift with file:line refs. Exit code 0/1 — CI-friendly. Override target with `GUARDIAN_API=<url>`. Smoke-tested against prod (5 cameras configured, 4 live).

Closes gaps B2 (further), B3 (further), C-related (connectivity surface), and D3 (cheap version) in `docs/02-May-2026-system-review-and-gap-analysis.md`. The OpenAPI-driven version of D3 still depends on backend gap E8 (re-enable `/docs`).

## [1.13.0] — 2026-05-02

### Added — Guardian project page documents the system honestly (Claude Opus 4.7)

Closes gap C1 from `docs/02-May-2026-system-review-and-gap-analysis.md`. Previously the Guardian project page told the story (hawks, sky-watch mode, Birdadette next to the Mac Mini) and named the hardware, but didn't actually explain how the system works or what depends on what. Visitors who clicked through past the live dashboard hit a charming-but-shallow story.

Three new sections sit between "How It Watches" and "The Story":

- **Under the Hood** — distributed architecture (Mini coordinates, sub-hosts publish), Cloudflare tunnel rationale (outbound-only, no port forwarding), why snapshot polling replaced video (browser HTTP/1.1 connection limits), what detection / gems / deterrents actually do today, the frontend stack (Next.js 16 + Tailwind + Railway), and that the whole system was written end-to-end with Claude Code.
- **When Things Break** — honest about the SPOFs. Mac Mini reboot leaves Guardian dark until manually relaunched; per-host watchdog coverage is uneven (Gateway laptop has one, S7 has one for orientation drift, MBA being recommissioned with one); offline cameras disappear from the grid cleanly rather than showing dead tiles; no off-site backup yet for the gems archive.
- **Where the Code Lives** — links to `farm-guardian` and `farm-2026` on GitHub plus the gap-analysis doc, so curious visitors can read the actual code and the actual rough edges.

Voice matches the existing prose. The Story section still closes the page. No bird-loss content was added — recent losses stay in the In Memoriam section on `/flock` per Boss's earlier instruction.

## [1.12.1] — 2026-05-02

### Changed — small follow-ups to 1.12.0 (Claude Opus 4.7)

Three low-risk improvements off the back of the system review in `docs/02-May-2026-system-review-and-gap-analysis.md`. All shipped as separate commits so each is reviewable on its own.

- **Guardian project MDX no longer claims a fixed camera count.** The "Five cameras" line in the Hardware section and the "all five cameras" line in What's Working were both wrong while `mba-cam` was decommissioned (2026-04-15) and would be wrong again any time the fleet shifts. Prose now defers to the live dashboard for "what's online right now"; the hardware table is still a useful long-running reference. Partial fix for gap B1; full fix (rendering the table from `/api/cameras`) is still open.
- **`GUARDIAN_API` reads from `NEXT_PUBLIC_GUARDIAN_API` env var.** Default unchanged so prod is unaffected. Override via Railway env var, `.env.local`, or shell to point at a staging tunnel or a LAN URL during dev. Closes gap B4.
- **Hero rotates across the latest 10 strong gems by hour.** Was fetching exactly one and pinning it. Now picks deterministically by hour-of-epoch so the hero shifts through the day without new content landing. SSR cache stays warm — every visitor in the same hour sees the same hero. Closes gap B6.

## [1.12.0] — 2026-05-02

### Changed — Guardian camera roster gates on backend `is_live`; stage drops hidden-thumb container (Claude Opus 4.7)

Boss reported that the public site "only shows the Reolink" — the other cameras (S7, GWTC, USB) almost never appeared even when they were online on the LAN dashboard. Root cause: the stage's "smart visibility" rule moved any tile reporting `feedState === "offline"` (10+ consecutive frame-fetch failures, ~12s) into a hidden `div`. A camera that was simply slow on first frame would get hidden and stay hidden until its next successful poll cycle — which the user couldn't see because the tile wasn't rendered.

Two-file fix:

- `lib/guardian-roster.ts`: `useGuardianRoster` now consumes the `is_live` field that farm-guardian v2.37.5 added to `/api/cameras`. Cameras the backend reports as not currently producing frames are filtered out before they reach the stage. `is_live === undefined` is treated as inclusive so older backends keep working.
- `app/components/guardian/GuardianCameraStage.tsx`: hidden-thumb container removed. Every camera in the roster gets a visible tile. Each tile continues to show its own connecting/reconnecting/offline indicator via `GuardianCameraFeed`. Auto-promote-on-featured-offline is preserved (handles transient per-tile failures distinct from roster state). Empty-state copy unified.

**What this changes for visitors.** When all four cameras are live on the backend, all four show up. When the S7 phone freezes (a real, recurring failure mode), the backend flips `is_live: false` for `s7-cam` and the tile leaves the grid — cleanly, not silently. When the S7 recovers, the tile reappears within the next 30s roster refresh.

**What this doesn't change.** Per-tile snapshot polling, indicator UI, auto-promote behavior, deep-link `?cam=` handling, localStorage persistence of the user's chosen featured camera.

Addresses gaps B2 and B3 in `docs/02-May-2026-system-review-and-gap-analysis.md`.

## [1.11.2] — 2026-05-02

### Changed — Roster update; /flock degrades gracefully when no active roosters (Claude Opus 4.7)

- `content/flock-profiles.json`: Whitey Red Legs marked deceased (2026-05-01).
- `app/flock/page.tsx`: "The Roosters" section now renders only when `roosters.length > 0`, with subtitle adapting to the count. Previously the section header rendered with no cards beneath it once both active roosters were gone.
- `app/flock/page.tsx`: In Memoriam subtitle generalised — the "first week of April 2026" qualifier no longer matched the data.
- Homepage `FlockPreviewStrip` automatically drops Whitey via its `status === "active"` filter; no code change there.

## [1.11.1] — 2026-04-29

### Changed — Birdadette at three weeks (OpenAI Codex gpt-5.4-mini)

Added a new field note and refreshed Birdadette's roster portrait to the current three-week brooder shot.

- `content/field-notes/2026-04-29-birdadette-three-weeks.mdx`
- `content/flock-profiles.json` → Birdadette now points at `/photos/april-2026/birdadette-3weeks-b.jpg`
- `public/photos/april-2026/birdadette-3weeks-a.jpg`
- `public/photos/april-2026/birdadette-3weeks-b.jpg`

The field note captions Birdadette clearly and keeps the spring flower shot as a plain secondary photo. Homepage `/` now picks up the new note automatically; `/flock` shows the three-week portrait.

## [1.11.0] — 2026-04-23

### Changed — Web-presence tightening: retire static gallery, kill Birdadette retrospective, unify social CTA (Claude Opus 4.7 (1M context))

Boss clarified the website's role relative to the broadcast surfaces: Instagram (`@pawel_and_pawleen`) and Facebook (Yorkies App) are where daily content lands; the pipeline auto-posts to both from the Mac Mini. This website's unique value is what IG/FB *don't* do — live multi-camera Guardian dashboard, searchable gem archive, flock roster, long-form field notes, retrospectives, yard-diary stockpile. Three things were either duplicating the broadcast surfaces or actively lying; this release removes them.

**Removed — `/flock/birdadette` (yesterday's v1.10.0)**

The retrospective was built on `individuals_visible=["birdadette"]`, a VLM tag that turns out to be unreliable — Boss confirmed the 18 "strong-tier birdadette" frames were mostly other chicks, not her. A page that says "here's Birdadette" while rendering other chicks is worse than no page. Deleted:

- `app/flock/birdadette/page.tsx`
- `lib/birdadette.ts`
- The "Retrospective · Birdadette: day by day →" card on `/flock`

The plan doc (`docs/23-Apr-2026-birdadette-retrospective-plan.md`) is preserved so the retrospective can be rebuilt quickly once the backend can reliably identify her — that requires either a `confirmed_individuals` field populated by human review, a VLM fine-tune, or a hand-curation admin route. All three are backend/data work, not frontend. Memory note (`feedback_vlm_birdadette_false_positives.md`) records the failure mode.

**Retired — `/gallery` static archive**

`app/gallery/page.tsx` is now a thin server component that calls `redirect("/gallery/gems")`. The live VLM-curated gem surface is the canonical gallery; a hand-maintained `content/gallery.json` alongside it was dead weight and forced a visitor who clicked the top-nav "Gallery" link into the *quietest* of the three surfaces. Redirect means old bookmarks / IG-bio links / cross-references from field notes keep working.

- `content/gallery.json` → deleted (no remaining consumers after the page rewrite).
- Every `href="/gallery"` in the codebase → repointed directly to `/gallery/gems` (layout nav, footer, hero nav, yard sibling-nav, gems sibling-nav). The footer previously listed both "Gallery" and "Gems" — collapsed to one "Gallery" link.
- The `/gallery/gems` and `/yard` sibling-nav widgets used to link back to `/gallery` as "← Curated archive" — that link is gone since there is no curated archive anymore.

**Changed — `SocialSection` replaces `InstagramSection` + `InstagramFeed`**

The homepage's "Follow the Farm" block was a curated-embeds affordance that had never been populated (the `content/instagram-posts.json` had one stub entry from 09-Apr) and it still hardcoded the stale `@markbarney121` handle — the farm account is `@pawel_and_pawleen`. Also: no Facebook CTA despite FB cross-posting being live since 2026-04-21.

New `app/components/home/SocialSection.tsx` is a pure server component with two external-link cards:

- **Instagram — @pawel_and_pawleen** → `https://www.instagram.com/pawel_and_pawleen/`
- **Facebook — Yorkies App** → `https://www.facebook.com/614607655061302/`

Same cream-dark section background, same `SectionHeader`, no `embed.js`, no client code, no curated-posts JSON to maintain. The website's job here is to *point out* to the broadcast surfaces, not mirror them.

Deleted:
- `app/components/home/InstagramSection.tsx`
- `app/components/InstagramFeed.tsx` (client component that loaded Instagram's `embed.js`)
- `content/instagram-posts.json`

**What did not change**

- Hero rotation (v1.9.0), FarmPulse (v1.9.0), Guardian live dashboard, LatestFieldNote, FlockPreviewStrip, LatestFlockFrames rail, ActiveProjects, SiteFooter — all unchanged.
- No pipeline changes, no auto-post commits affected, no FB/IG tokens touched.
- `content/flock-profiles.json` and all field-note MDX preserved.
- The `/flock` page returns to its exact pre-v1.10 shape.

**CLAUDE.md updated:** Pages section now lists `/gallery` as a redirect and adds explicit entries for `/gallery/gems` and `/yard`; Content sources table no longer lists the two retired JSON files; homepage description updated to reflect the current section order.

**Verification**

- `npm run build` — 0 errors, all 19 routes prerender.
- `npm run lint` — 0/0.
- `curl -I /gallery` → 307 to `/gallery/gems`.
- `curl -I /flock/birdadette` → 404.
- Homepage HTML contains `pawel_and_pawleen`, `Yorkies App`, and `facebook.com/614607655061302`; no `@markbarney121`.
- `/flock` HTML no longer contains "Birdadette: day by day" or "Retrospective".
- `grep -rE 'href="/gallery"' app/` returns zero matches.

**Plan:** `docs/23-Apr-2026-web-presence-tightening-plan.md`.

**Follow-ups (not this pass)**

- `/yard` as an actual playable timelapse reel (video or auto-scroll) instead of a grid.
- Stories-style portrait rail for s7-cam 9:16 gems *only if* it adds a surface `LatestFlockFrames` doesn't already cover.
- Rebuild the Birdadette retrospective once the backend can reliably identify her (gated on one of the three backend options above).

## [1.10.0] — 2026-04-23

### Added — /flock/birdadette day-by-day retrospective (Claude Opus 4.7 (1M context))

Guardian has been tagging Birdadette's appearances via `individuals_visible=["birdadette"]` for about two weeks — 18 strong-tier frames across 7 distinct days as of today. That's enough content for a dedicated retrospective surface instead of letting it dissolve into the general gems wall. This release ships the page and links to it from `/flock`. A memory entry (`project_birdadette_retrospective_curation.md`) has been standing since mid-April asking for exactly this.

**New — `/flock/birdadette`**

Server-rendered retrospective page. One section per day of life (newest first), each section leading with the most recent strong frame from that day + its VLM caption and a mono meta line (camera · activity · birds-in-frame). Supplementary frames from the same day render as a two-column grid below the primary, caption-free, to keep the narrative tight. Days without any strong frames simply don't appear — the page shows what the pipeline saw, not what it didn't.

- Hatch date (`2026-04-06`) comes from `content/flock-profiles.json` and is mirrored as `BIRDADETTE_HATCH_DATE` in `lib/birdadette.ts`.
- Day of life is computed from `ts - hatch` in calendar math. The pipeline's per-frame `apparent_age_days` field (VLM guess) is not used here — it underestimates by several days on the same frame (a day-14 frame came back as `apparent_age_days: 8`).
- Prerenders as a static page with the standard 5-minute revalidate; next IG post + next strong Birdadette frame flow in automatically.
- Portrait s7-cam frames (1080×1920 since v2.35.2) letterbox against the cream body with a faint forest wash; landscape frames fill cleanly.
- Empty state ("the pipeline hasn't tagged Birdadette in a strong frame yet — check back in a day or two") handles the case where the archive is empty or freshly deployed.
- Graceful error card on Guardian unreachable — same failure posture as the rest of the site.
- Footer links back to `/flock` and forward to `/gallery/gems?individual=birdadette` for the unfiltered archive view.

**New — `lib/birdadette.ts`**

Wraps `fetchGems` with the birdadette-individual filter, pages through the cursor (hard-capped at 10 pages × 100 rows = 1000 frames of runway — years of content before that bound matters), groups rows by calendar day (UTC), sorts days newest-first and rows newest-first within each day. Exports `BIRDADETTE_HATCH_DATE`, `computeAge()`, `dayOfLife()`, `formatDateLabel()`, `fetchBirdadetteRetrospective()`.

**Changed — `/flock`**

Added a retrospective card directly under the hero, above the roosters grid. Quiet forest-bordered card on the cream-dark background, reads "Retrospective · Birdadette: day by day →". Nothing else on `/flock` moves.

**Out of scope (planned follow-ups)**

- Merging hand-curated day-0..day-7 hatch photos (`content/gallery.json`, field-note covers) into the timeline. The pipeline only started tagging her by name around day 8; days 0-7 exist on the site but not on this page.
- Decent-tier fallback for empty days. Strong-tier only keeps the bar high.
- Same surface for other named birds once the VLM tags them individually (Henrietta, etc.).
- Auto-generated weekly summary posts from each 7-day window.

**Verification**

- `npm run build` — static prerender of `/flock/birdadette` succeeds with the 5-min revalidate window.
- `npm run lint` — 0 errors / 0 warnings.
- Local dev smoke: `/flock/birdadette` renders 7 day sections (Day 8 through Day 14), each with at least one frame; total of 16 unique gem IDs across all sections. Hero says "Day 17 today" derived from the hatch-date constant.
- `/flock` shows the retrospective card as a link; clicking it lands on `/flock/birdadette`.

**Plan:** `docs/23-Apr-2026-birdadette-retrospective-plan.md`.

## [1.9.0] — 2026-04-22

### Changed — Living homepage: rotating hero + farm-pulse stats band (Claude Opus 4.7 (1M context))

The homepage had been surfacing about 1% of the live image archive — a frozen Birdadette-fresh-hatch hero, a 6-item gems rail, and a weekly field note. Meanwhile the Guardian pipeline had accumulated 13,000+ rows in the last seven days (377 strong-tier, 190 Birdadette sightings, 8,900+ brooder frames). The site looked static even though the farm was flowing. This release flips that for the two top-of-page slots.

**Changed — `Hero.tsx`**

The hero is now an async server component. It fetches the latest strong-tier gem via `fetchGems({ limit: 1 })` and uses `rows[0].full_url` as the background image. `/photos/april-2026/birdadette-fresh-hatch.jpg` is retained as the fallback for tunnel drops or an empty result. Layout, vignettes, text blocks, and nav links are unchanged. The `lib/gems.ts` fetcher already layers `{ revalidate: 300 }`, so the hero image refreshes every five minutes at most.

Portrait frames from `s7-cam` (1080×1920 since v2.35.2 yesterday) letterbox cleanly against the forest background with the vignette still keeping the top-left title and bottom-bar copy legible.

**Added — `FarmPulse.tsx`**

New server-async component inserted between `Hero` and `GuardianHomeSection` on `app/page.tsx`. A thin forest-backgrounded mono-font band that pulls `/api/v1/images/stats` and surfaces five live cells:

- Window label — `PAST {N} DAYS`, derived from the stats range.
- `{birdadette_sightings} Birdadette sightings`.
- `top activity: {activity} ({count})` — skipping `none-visible`, `unknown`, and `other` so the band always names something interesting (huddling, foraging, eating, etc.).
- `busiest camera: {camera_id} ({count})` — raw device names per the camera-naming rule.
- `{strong + decent} gems saved` — total archived frames regardless of tier.

Renders `null` on any non-ok response — same graceful-failure pattern `LatestFlockFrames` uses. The homepage never crashes on a Guardian outage. Band scrolls horizontally on narrow viewports.

**Fixed — `Activity` type drift**

The API has been returning `"unknown"` in `by_activity` since v2.28.x but the TypeScript `Activity` union didn't include it, so `Record<Activity, number>` on `ImageStats.by_activity` was silently wrong. Added `"unknown"` to the `Activity` type in `app/components/guardian/types.ts` and a matching entry in `lib/gems-format.ts`'s `ACTIVITY_LABELS`. `GemFilters`'s `ACTIVITY_CHOICES` intentionally still omits `"unknown"` — it's a noise bucket, not a filter users want to pick.

**What did not change**

- Hero tagline stays as-is ("…wonders of Claude's own creation…"). Rewrite is a separate content call.
- OpenGraph / share-card image is still the static Birdadette-hatch JPG — rotating the OG image would break previously-shared links.
- No changes to `GuardianHomeSection`, `LatestFieldNote`, `FlockPreviewStrip`, `LatestFlockFrames`, `ActiveProjects`, `InstagramSection`, `SiteFooter`.
- No new npm dependencies.

**Plan:** `docs/22-Apr-2026-living-homepage-hero-and-stats-plan.md`.

**Verification**

- `npm run build` — static prerender of `/` succeeds; revalidate window picked up as 5 minutes per the gems fetcher.
- `npm run lint` — 0 errors / 0 warnings.
- Local dev smoke: hero renders a live gem URL (`/api/v1/images/gems/16715/image?size=1920`), not the static JPG; FarmPulse shows `PAST 7 DAYS · 187 Birdadette sightings · top activity: huddling (5,581) · busiest camera: s7-cam (5,543) · 7,182 gems saved`.
- With the tunnel unreachable, hero falls back to the static JPG and FarmPulse renders nothing — homepage stays intact.

**Follow-ups (out of scope here)**

- `/flock/birdadette` day-of-life retrospective — queued next; the backend tagging is already in place (`individuals_visible=["birdadette"]` + `apparent_age_days`).
- Stories-style portrait rail dedicated to `s7-cam` 9:16 gems.
- Retiring or repurposing the hand-curated `/gallery` surface.

## [1.8.2] — 2026-04-21

### Docs — FB cross-post is LIVE; record it here so no future assistant tries to "help" (Claude Opus 4.7 (1M context))

Farm Guardian now dual-posts every successful Instagram publish to the linked Facebook Page "Yorkies App" (`page_id=614607655061302`). All four lanes — photo, carousel, story, reel — are wired and verified live as of 2026-04-21. This repo's role is unchanged (host the JPEG/MP4, commit, push — both IG and FB pull from the same `raw.githubusercontent.com/...` URL), but the CLAUDE.md now documents the FB posture explicitly so a future agent doesn't propose adding Meta credentials to Railway or this repo.

**Why a docs-only change lands in this repo's changelog:** the FB capability is a cross-repo settled state that a future assistant working on farm-2026 could easily misunderstand ("we should add FB_PAGE_TOKEN to Railway" — no). The CLAUDE.md addition pre-buries that wrong answer. No site code or content changed.

Full source-of-truth for the FB capability lives in farm-guardian (v2.35.0 shipped the module, v2.35.1 confirmed go-live) and `~/bubba-workspace/skills/farm-facebook-crosspost/SKILL.md`.

## [1.8.1] — 2026-04-18

### Docs — yard-diary purpose re-clarified + cross-links between gallery surfaces (Claude Opus 4.7 (1M context))

Boss flagged two discoverability problems after reviewing the 17-Apr-2026 yard-diary ship:

1. **No visible link from `/gallery` to `/gallery/gems`.** The gems wall — the live VLM-curated output of the farm-guardian image pipeline — was reachable only by typing the URL. The top nav `Gallery` link landed on the hand-curated `content/gallery.json` archive, which is the *quietest* of the three surfaces, and from there a visitor had no way to reach the live feed.
2. **Yard-diary's purpose was under-documented.** The 17-Apr-2026 entry explained the mechanics (thrice-daily, dated, committed to the repo) but buried the *why*: these frames are raw stockpile for a year-end timelapse reel (cherry bloom → summer green → autumn burn → snow). Individual frames are boring on purpose; the sequence is the artifact. A future Claude reading the codebase could reasonably conclude "boring daily content" and propose retiring the pipeline.

**What changed:**

- **`/gallery`:** Added two prominent sibling cards directly below the hero — **Gems** (live, machine-curated) and **Yard Diary** (stockpile, dated). Both link to their own surfaces. The `content/gallery.json`-driven archive sections sit below.
- **`/gallery/gems`:** Added a small mono-font sibling nav below the hero linking back to `/gallery` (curated archive) and forward to `/yard` (timelapse stockpile).
- **`/yard`:** Added matching sibling nav, plus a second paragraph in the page header copy stating the reel-for-year-end purpose out loud so even a visitor (not just a future Claude) knows this isn't meant to be a museum-grade daily gallery.
- **`app/yard/page.tsx` file header:** Rewritten to lead with the timelapse-raw-material purpose; explicit warning not to redesign the page "more gallery-like" because the design is already correct.
- **`docs/FRONTEND-ARCHITECTURE.md`:** New row in the SSoT table for `public/photos/yard-diary/` with a "do not delete, do not stop capture" directive.
- **No code changes to the yard-diary capture pipeline itself.** Schedule, master path, publish path, commit behavior all unchanged.

The `content/gallery.json` static archive is intentionally kept — Boss said "don't destroy anything, just create." Old hand-curated photos stay addressable; they just no longer front for the live pipeline.

**Companion writeup:** `farm-guardian` CHANGELOG has the matching Python-side docs pass + the `com.farmguardian.yard-diary-capture` LaunchAgent invariant added to `farm-guardian/CLAUDE.md`. Auto-memory entry `project_yard_diary_pipeline.md` saved so future sessions start with the timelapse-purpose context.

## [1.8.0] — 2026-04-17

### Added — /yard route + thrice-daily dated yard-diary pipeline (Claude Opus 4.7 (1M context))

Seasonal record of the yard built for a year-end retrospective. Shipped within hours of Boss asking because the cherry tree is blooming right now. Exists alongside the VLM-curated gems pipeline rather than replacing it — gems = stochastic "strong chicken moments", yard-diary = guaranteed thrice-daily seasonal artifact.

**Capture schedule:** 07:00 (morning), 12:00 (noon), 16:00 (evening) local, daily. All three fire from one launchd plist (`com.farmguardian.yard-diary-capture`); the Python script derives its slot from the current hour.

**Date burned into the pixels.** Every published JPEG has `DD-Mon-YYYY` — Boss's standard date format — rendered bottom-right in a rounded translucent pill (HelveticaNeue via Pillow). The retrospective artifact is self-describing: print it, slideshow it, repost it, the date comes along.

**Filenames:** `{YYYY-MM-DD}-{morning|noon|evening}.jpg` under `public/photos/yard-diary/`. 4K masters live indefinitely on the Mini; published copies are 1920px long-edge with the date overlay, committed into this repo so Railway serves them from its own CDN.

**Publish path is deliberate.** JPEGs land in farm-2026's `public/` rather than behind a new Guardian API endpoint, so the diary is served from Railway's CDN with zero Cloudflare-tunnel dependency at view time. Tunnel drops don't affect the surface. Trade-off: three Railway redeploys/day, acceptable.

**Frontend:** `app/yard/page.tsx` parses `{date}-{slot}.jpg` filenames, groups by day, renders the latest slot as hero and one triptych row per day below (morning / noon / evening in chronological order, newest day first). Slot labels come from HTML; dates come from the image itself. Server component, no client JS, no API calls at view time.

**First dated frame:** `2026-04-17-noon.jpg`. Automation takes over from 16:00 today for the evening slot.

Capture implementation lives in `farm-guardian/scripts/yard-diary-capture.py` (Python, Pillow, stdlib urllib + subprocess for git); installed at `~/bin/yard-diary-capture.py` to avoid macOS TCC denies on `~/Documents/` execution. Full writeup: `farm-guardian/docs/17-Apr-2026-yard-diary-capture-plan.md`.

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

## [1.6.1] — 2026-04-14

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
