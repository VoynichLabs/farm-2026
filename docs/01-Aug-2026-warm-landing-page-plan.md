# 01-Aug-2026 — A Warmer Front Door (landing page redesign)

Author: Claude Sonnet 5
Status: **proposal** — submitted for Boss's review. Not approved, not started. If selected, implementation happens in a separate session with its own preview verification pass before anything ships.

## Why

Right now `/` is a field log for Boss's own benefit and for people who already care about the tech: a monospace ops strip (build version, UTC clock, lat/long), a bird-ID grid, a pipeline status banner, live camera feeds, a raw file-listing-styled index. That's a deliberate, good design for its actual audience — this doc does not propose changing that judgment sitewide.

But the site is about to get a second job: it's going to be the first thing a woman Boss is interested in sees after he says "I have a website you can check out." That's a different audience with a different question. She's not asking "is the YOLO pipeline healthy" — she's asking "what does this guy's life actually look like, and is he someone I'd want to be around." The current homepage answers a question she didn't ask.

The fix isn't a new site or a rebrand — Boss was explicit that the farm content is already good and already fun, and that the landing page specifically should be simple. So the plan is narrow: **recompose what `/` shows, in what order, without touching anything else.** Every technical page, every log-styled surface, the entire rest of the nav — untouched. One route gets warmer; the site's working identity everywhere else survives intact.

And the tone has to hold up regardless of who actually opens the link — a search engine, his mother, a business contact, or a date. So the plan leans on showing rather than telling: no dating-specific copy, no CTA, no contact form. The photos and the plain first-person voice do the entire job. If it reads right to a stranger, it reads right to her too — and it doesn't read as a pitch to anyone.

## Scope

**In:**
- `app/page.tsx` — full recomposition (order, sections, copy). This is the only route that changes.
- New section components under `app/components/home/`, reusing existing data loaders and design tokens — no new palette, no new fonts.
- A small hand-curated content file for the hero/mosaic photo pool.
- Two (or three) new photos of Boss, placed with intent — not a hero-sized headshot, not a bio-page dump.
- The Open Graph / link-preview metadata in `app/layout.tsx` — this is the card iMessage/WhatsApp renders *before* anyone clicks, and right now it says "Live chicken cameras" with a random water-bowl frame. That's the actual first impression and it currently undersells the page it's about to send someone to.
- One nav question flagged for Boss to decide (below) — not pre-decided, because it's sitewide chrome, not landing-page-only.

**Out:**
- Any other route. `/flock`, `/field-notes`, `/projects`, `/gallery/gems`, `/yard`, `/markets`, `/projects/guardian` keep their current field-station voice exactly as-is.
- `SiteNav.tsx` structure/content beyond the flagged open question — no redesign of sitewide chrome.
- Guardian dashboard internals, farm-guardian, the pipeline, Discord/IG/FB automation — zero touchpoints, per the standing rule in `CLAUDE.md`.
- Any contact mechanism (form, email link, "message me"). Deliberately not building this — see Guardrails.
- Full flock roster, breed reference, materials lists, build logs — these stay one click away on their existing pages, not duplicated onto `/`.
- Railway healthcheck (`/api/health`) and the `lib/gems.ts` fetch timeout — untouched, and the new design should if anything reduce SSR risk on `/` (see Architecture).

## Architecture

### Section order for the new `/`

| # | Section | New/Reused | Source |
|---|---|---|---|
| 1 | **Hero** | New `WarmHero.tsx` | Hand-curated pool (see below) |
| 2 | **A Look Around** | New `LookAround.tsx` | Hand-curated pool + a few live strong-tier gems for freshness |
| 3 | **Who's Behind the Fence** | New `AboutMe.tsx` | 1–2 new Boss photos + short first-person paragraph |
| 4 | **The Flock, Briefly** | New `FlockTeaser.tsx` | `getFlockProfiles()` — 3–4 birds, not the full roster |
| 5 | **What I'm Building** | New `WhatImBuilding.tsx` | `getProjects()` — 2–3 project teasers |
| 6 | **Live right now** (Guardian cameras, kept as the dark island) | Reused `GuardianHomeBadge` + `HomeCameraStage`, recaptioned | unchanged data path |
| 7 | **The pipeline story** (`SystemBanner`, moved down) | Reused, unchanged | unchanged |
| 8 | **Freshest From the Yard** (`RecentGemsRail`, relabeled) | Reused | unchanged |
| 9 | **Keep Exploring** | New `KeepExploring.tsx`, replaces the raw `INDEX` block | same link set as today's `DEEPER_LINKS` |
| 10 | Footer | Reused, unchanged | unchanged |

The logic: warmth and a real face lead; depth and the tech-showcase content (which is genuinely impressive and shouldn't be hidden — "look what this guy built to protect his chickens" is a great signal) follow for anyone who scrolls. Nothing gets deleted from the site, only reordered and re-captioned on this one route. The current "Class of 2026" full-grid-as-hero and the raw `INDEX` file-listing move out of the lead position; the cohort grid's job is better served by `/flock`, which already exists for it.

### Hero + mosaic: hand-curated, not live-pulled

The old `Hero.tsx` (removed in the v1.15.0 OpenClaw rebrand) auto-rotated through the single latest strong-tier gem. That's wrong for this job: the gems pipeline is a detection stream, not a highlight reel, and "most recent" is not the same as "most flattering." A first impression should be curated, not automatic.

Proposed: `content/landing-features.json` — a small hand-picked array (6–10 entries: `{src, alt, caption?}`), pointing at existing photos already in the repo (candidates below) plus whatever new yard/garden shots Boss wants to add. `WarmHero.tsx` picks one per request (or the first, simplest to start); `LookAround.tsx` renders the rest as a mosaic, optionally interleaved with 2–3 live `fetchGems({tier: "strong"})` results for freshness so the section doesn't go stale between Boss's curation passes.

This is a deliberate, documented exception to "data lives in data files, never hand-maintained" — it's the same category as MDX content (rule already in `FRONTEND-ARCHITECTURE.md`: "hand-written documentation is fine when it doesn't drift in between"). A first-impression photo pool is an editorial decision, not a data-sync problem, and Boss should be the one choosing what "look how good this life is" means, not an algorithm.

Candidate pool to seed from (Boss picks the final set — these are starting suggestions from what's already in the repo):
- `public/photos/history/garden-tilling.jpg`, `backyard-panorama-deck.jpg` (april-2026) — yard/garden establishing shots
- `public/photos/june-2026/morning-flock-IMG_5744.jpg`, `white-turkeys-12jun2026.jpg` — flock-in-the-open shots
- Selected `public/photos/stories/*gem*.jpg` frames — the Discord-reaction-filtered lane is already Boss's own "best of" signal; a handful of these are a fast, zero-new-photography way to fill out the mosaic
- Any new golden-hour garden/coop/deck shots Boss wants to add fresh

A real benefit of hand-curated + static images for the hero specifically: **it removes the Guardian-tunnel round trip from the single most latency-sensitive render on the site.** The homepage today already `await`s tunnel fetches during SSR (flagged as a past incident in `CLAUDE.md`'s healthcheck section); a static hero means the most important above-the-fold content for a first-time visitor never depends on the Mac Mini or the Cloudflare tunnel being awake. `RecentGemsRail` and the Guardian sections still do their existing fetches further down the page, unchanged, with the existing timeout/fallback protections intact.

### About Me — placement and a concrete shot list

This is the section that answers "show me one or two good shots of you," placed with intent rather than as a hero-sized headshot: a modest photo (or two) beside 3–5 sentences, first person, same plain-and-specific voice as the field notes (see Voice, below) — not a bio.

**Photo 1 — the "doing something" shot (primary).** Candid, mid-task: fixing coop fencing, scattering feed, kneeling by a hatchling, walking the garden rows. Three-quarter angle is fine — this shot's job is to put a real, in-motion person into the "look how good this life is" story, not to be a portrait. Golden hour or soft overcast light (matches the site's honey/moss palette already in `globals.css` — avoid flash, avoid harsh midday sun, avoid blue-hour cold light). Farm visible in the background.

**Photo 2 — the "here's my face" shot (secondary, recommended).** Relaxed, looking at camera, natural smile, leaning on the coop rail or standing on the deck. This is the one that does the identity work Photo 1 can't — some visitors will want to see a face clearly before reading further. No sunglasses, no other people in frame.

**Photo 3 — optional stretch.** A wide establishing shot, Boss small in frame walking toward the coop with the flock around his feet, morning light. If it's good, it's a strong hero-pool candidate in its own right (scale + warmth in one frame) rather than part of the About block.

Practical notes: shoot at ≥2400px wide so Next/Image has room to serve responsively at multiple breakpoints; provide both a portrait- and landscape-friendly framing if easy, since hero and About-card layouts need different aspect ratios. New files land in a new `public/photos/about/` folder (parallel to the existing `birds/`, `coop/`, `enclosure/` convention), named generically — `about-coop-candid.jpg`, `about-porch-portrait.jpg` — not by first/last name, consistent with the sitewide "no owner name in public files" rule even though that rule's literal scope is code/content, not filenames; a public repo's filenames are just as crawlable.

### The Flock, Briefly / What I'm Building

Both derive live from existing SSoTs (`getFlockProfiles()`, `getProjects()`) rather than hand-typed content, per the DRY rule that's already burned this codebase once (the homepage used to hardcode eight birds inline). `FlockTeaser.tsx` picks a small, fixed-size subset (reuse the existing `FEATURED_ORDER` pattern from today's `page.tsx`, or a new short list) and renders name + one-line personality color pulled from each bird's existing `color_description`/`temperament`-adjacent fields — no new schema needed. `WhatImBuilding.tsx` shows 2–3 projects with their `heroPhoto` and one-line `description`, linking to `/projects` for anyone who wants the materials list and build log.

### Guardian section — kept, recaptioned, not deleted

The live-camera dark island (`GuardianHomeBadge` + `HomeCameraStage`) stays exactly as architected — dark tokens preserved per `FRONTEND-ARCHITECTURE.md`'s "don't finish the retheme by lightening the camera islands" rule. Only the section label changes, from a clinical "Live Cameras" to something that owns the charm of the thing plainly: *he built a camera system to keep an eye on his chickens, and here's what it's watching right now.* That's a better signal in this context than pretending it isn't slightly obsessive engineering — it's a good story, told warmly instead of clinically.

### The link preview matters as much as the page

`app/layout.tsx` currently sets:
- `SITE_TITLE = "Farm 2026 — Live chicken cameras in Hampton, CT"`
- OG image: a portrait 1080×1920 water-bowl gem frame, hosted at the `raw.githubusercontent.com` URL (Railway's standalone build skips most of `public/photos/`, so this is the proven-stable host for social images — any new OG image must follow the same raw-GitHub-URL pattern, not a `/photos/...` path).

When Boss texts the link, this is the card that renders in the message thread *before* anyone taps it — arguably a bigger first impression than the page itself. "Live chicken cameras" undersells what's actually there. Proposed: swap `SITE_TITLE`/`SITE_DESCRIPTION` to something that reads as "a small, well-loved farm" rather than "a surveillance demo," and swap the OG image to a landscape-oriented (1200×630, the correct OG aspect ratio, vs. today's portrait 1080×1920) shot from the new curated hero pool. This is sitewide metadata, not landing-page-only content, so the copy should stay generically warm rather than dating-specific — it has to read fine to literally anyone who receives the link.

### Nav — flagged, not decided

`SiteNav.tsx` renders a UTC clock, lat/long coordinates, and a build-version chip above every page, including `/`. It's good, deliberate identity for the rest of the site and this plan does not propose changing it there. But it is the literal first thing rendered on the warm landing page too, and "──:──:──Z · 41.7558°N 71.9789°W" is not a warm opening note.

Two options, both cheap and reversible, for Boss to choose between when this gets built:
1. **Leave it.** One dense mono strip at the very top, warmth starts immediately below it. Lowest risk, zero new code path.
2. **A "soft mode" nav variant on `/` only** — same precedent already in the codebase as the dark `/markets` variant (`usePathname()`-based branch in `SiteNav.tsx`): drop the clock/coordinates/version chip on `/`, keep the wordmark and links. Slightly more code, slightly more consistent tone on the one route that needs it most.

Recommendation if asked: option 2, because the top strip is the very first thing in the viewport and the whole point of this exercise is that first screen. But this is Boss's call, not a default — it's sitewide chrome, not landing-page content, so it's called out rather than silently decided.

### Voice / copy direction (not final copy)

Same register as the field notes already on the site (`content/field-notes/*.mdx`): plain, first-person, concrete over cliché, comfortable with a little wry humor about the more absurd parts of the operation ("turkeys have opinions about breakfast" beats "I love my animals"). The About Me paragraph should read like a short field note, not a bio — 3–5 sentences, specific details, no résumé framing ("I value hard work and family" energy is exactly wrong here).

Headline direction for the hero (drafts, not final — Boss's voice, not an invented one):
- *"A little farm in Hampton, Connecticut."*
- *"Chickens, turkeys, a garden, and whatever's happening outside my window."*

Mosaic captions follow the existing field-note caption style already visible in the MDX frontmatter (`"The backyard from the deck — moody April sky, bare trees, the coop in the distance"`) — specific, not generic.

## Guardrails / non-goals

1. **No dating-specific copy anywhere in committed content.** No "single," no CTA, no "if this sounds like you." The photos and the plain voice do the entire job; the romantic framing is supplied by Boss in person, not by the site. This also keeps the page reading fine to every other audience who opens it.
2. **No contact mechanism.** No form, no exposed email, no "reach out" link. Consistent with "done chasing anybody" — the site doesn't chase either, and it avoids inviting public solicitation on an indexed page.
3. **No owner full name in new public copy or filenames**, consistent with the existing sitewide rule — first-person voice throughout is enough.
4. **Nothing else on the site changes tone.** This is a one-route change. If it's tempting to "finish the job" and soften `/flock` or `/field-notes` too, that's explicitly out of scope here — a separate, much bigger decision Boss hasn't asked for.
5. **Preserve every existing safety rail:** `/api/health` independence, `AbortSignal.timeout()` in `lib/gems.ts`, hardware-only camera labels, no rendered bird counts, no re-hardcoded data that already lives in `flock-profiles.json`/`getProjects()`.
6. **No SaaS-landing-page tropes** — no giant CTA button, no fake stat bar, no testimonial carousel. `FRONTEND-ARCHITECTURE.md` already calls this out as a standing anti-pattern for the whole site; it applies doubly here, where the whole point is that this isn't a pitch.

## Open questions for Boss

1. Nav soft-mode on `/` — yes/no (see above).
2. Final pick of 6–10 photos for `content/landing-features.json` — starter candidates proposed above, but this is a taste call only Boss can make.
3. Whether the "Live cameras" / pipeline-story sections stay on `/` at all, or move one click deeper to `/projects/guardian` entirely — this plan assumes "keep them, just lower and recaptioned," but if Boss wants `/` to be *only* warm content with zero tech-demo material, that's a smaller page and a different section list.

## TODOs (ordered, for the implementation session)

1. Boss supplies: 2 (+1 optional) new photos per the shot list; final 6–10 picks for the hero/mosaic pool.
2. Add `public/photos/about/` with the supplied portraits (generic filenames, no owner name).
3. Add `content/landing-features.json` (hand-curated pool).
4. Build `WarmHero.tsx`, `LookAround.tsx`, `AboutMe.tsx`, `FlockTeaser.tsx`, `WhatImBuilding.tsx`, `KeepExploring.tsx` under `app/components/home/`, each server components where possible, composing from `lib/content.ts` / `lib/gems.ts` / `lib/gems-format.ts` per existing patterns — no new data-fetching abstractions.
5. Recompose `app/page.tsx` in the order above; reposition and recaption `GuardianHomeBadge`/`HomeCameraStage`/`SystemBanner`/`RecentGemsRail`/`GemsStatFooter`/footer — no logic changes to any of them.
6. Resolve the nav open question; implement the chosen option in `SiteNav.tsx` if soft-mode is picked.
7. Copy pass in Boss's own voice for headline, tagline, About Me paragraph, and mosaic captions.
8. Update `app/layout.tsx` OG image (landscape, raw-GitHub-hosted, from the new curated pool) and `SITE_TITLE`/`SITE_DESCRIPTION`.
9. Accessibility + responsive pass — alt text on every new photo (About Me and hero especially), mobile check at 375px since this link will very likely be opened on a phone first.
10. `npm run lint` && `npm run build` clean; `npm run check:contract` if any Guardian-facing code path was touched (shouldn't be, but confirm).
11. Live preview review on an actual phone before calling it done — this is a first-impression page; a localhost check isn't sufficient confidence for this one.

## Docs/Changelog touchpoints

- `CHANGELOG.md` — new top entry on implementation (SemVer minor, e.g. `1.36.0`), what/why/how, author model.
- `docs/FRONTEND-ARCHITECTURE.md` — the `/` row in the pages table needs a real rewrite regardless of which plan gets picked: it currently still describes the pre-v1.15.0 `Hero`/`FarmPulse` composition, which was removed months ago. Worth fixing in the same pass since the file will already be open.
- `CLAUDE.md` — the `/` bullet under **Pages** has the same staleness; update to match whatever ships.
- This plan doc stays the spec of record for the `/` recomposition.
