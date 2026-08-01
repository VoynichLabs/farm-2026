# 01-Aug-2026 — Landing Page Re-imagining Plan

**Author:** Claude Fable 5
**Status:** Proposed — awaiting Boss approval. Implementation happens in a separate session.

## The brief, in one paragraph

The landing page becomes Boss's primary personal introduction — the link he sends when he says *"I have a website you can check out to see the stuff I'm into."* It's the better extension of a Hinge profile: instead of six photos of him, it's the yard, the plants, the birds, the dogs, the live cameras — the whole absurdly good life out in Hampton — with one or two good shots of him woven in. The energy is **"look how perfect it is out here, and why it's hard to pull me away"** — confident and warm, zero chase. If she likes what she sees, the door's open. The site never says any of this out loud; it just *is* a place worth wanting to visit.

## Why the current homepage doesn't do this

Today's `/` is a systems dashboard wearing a field-guide skin: a mono-font bird grid with hatch metadata, a pipeline story banner, a dark camera island, a `└─`-styled file listing, and a status-line footer. It's genuinely charming **to an engineer**. To a woman opening the link on her phone from a text message, the first screen says "this person built a monitoring system" before it says "this person built a *life*." We flip that order. Nothing gets deleted — the nerdy surfaces are one of the best parts of the story — but they move from *lead* to *reveal*.

## Scope

**In:**
- Full redesign of `app/page.tsx` (composition + all-new/reworked `app/components/home/` pieces).
- Two placed photo slots for Boss (shot list below; he provides the photos).
- A small hand-curated "place" photo set (yard, plants, gardens) under `public/photos/`.
- Copy: short, first-person, warm. Written with Boss, not invented for him.
- Mobile-first pass — the primary viewing context is a phone, from a text.

**Out:**
- Every other route (`/flock`, `/gallery/gems`, `/projects/guardian`, `/yard`, `/field-notes`, `/markets`, etc.) — untouched.
- The Field Guide token palette — kept as-is; it's already warm paper + moss + honey and is exactly the right material.
- Guardian polling architecture, `lib/gems.ts` 3s timeout, healthcheck — untouched (per CLAUDE.md hard rules).
- Social pipelines and their destination dirs — untouched.
- No new deps, no template kits, no AI-slop gradients.

## The page, top to bottom

Seven sections. Each one earns its scroll; total page is *shorter* than today's, not longer.

### 1. Hero — the place, full-bleed
One hand-picked landscape photo of the property at its best (golden hour over the yard, birds ranging, garden in frame). Not the rotating gem — a *chosen* image that always looks perfect. Over it, a serif headline and one quiet line, e.g. site name + "A few acres in Hampton, Connecticut. Chickens, turkeys, two Yorkies, a garden, and the cameras that watch it all." A small live-status pip ("cameras are live right now ↓") teases the reveal without leading with it. Falls back gracefully if we later choose to layer the latest strong gem behind it — v1 is static and fast.

### 2. Hi, I'm Mark — **photo slot #1**
The only above-the-fold shot of Boss. Portrait-orientation photo left (mobile: top), 3–4 first-person sentences right: who he is, what this place is, why he's here. Tone: understated, a little funny, no résumé. This is the Hinge-profile upgrade moment — one good photo, real words, then the site immediately goes back to showing rather than telling.

### 3. The residents
Warm editorial cards, not a data grid: Pawel & Pawleen (the Yorkies, with the IG handle as a wink), then a featured handful of birds **derived live from `content/flock-profiles.json`** (reusing the existing `FEATURED_ORDER` + ornitharch derivation from today's page — no hardcoded counts, no drift; that logic moves into the new `Residents` component). Names and one personality line each; hatch-date metadata demoted to the `/flock` page. Card links → `/flock`.

### 4. The place
A 5–7 image mosaic: garden beds, plants, the coop build, Birdcatraz, seasonal shots — pulled from existing `public/photos/` curated dirs plus a small new `public/photos/place/` set Boss picks. Captions in the field-note voice. One line of copy max. Links → `/field-notes` and `/projects`.

### 5. Live, right now
The existing `HomeCameraStage` + `GuardianHomeBadge` dark island, kept intact (dark island rule preserved) but *reframed*: instead of "Live Cameras" system labeling, warm copy on the light paper above it — "These are live. The birds don't know they're famous." This is the page's genuine differentiator — nobody else's intro link has live chickens — and it lands far harder as a mid-page reveal than as an opening dashboard. All polling behavior unchanged.

### 6. Life here, weekly
Latest field note (cover + title + date, via existing `lib/content.ts` loaders) beside a slimmed `RecentGemsRail`. Proof the place is alive and documented, and the on-ramp to the deep content.

### 7. Come find the rest — **photo slot #2** + footer
A candid closing shot of Boss *in* the life (landscape, mid-task, not posed at camera), one low-key closing line — no CTA, no ask; the confident non-chase ending. Below it, the current file-listing index rail survives here, restyled smaller — it's genuinely charming as a "for the curious" footer, wrong as primary nav. Status-line footer with IG/FB links stays.

## Shot list for Boss (the two photo slots)

| Slot | Shot | Orientation | Direction |
|---|---|---|---|
| #2 intro | Boss outdoors on the property, holding/feeding a bird or with the Yorkies, warm light, relaxed — looking at the animal or mid-laugh, not stiff at camera | Portrait (4:5) | This is the "oh, he's real" photo. Golden hour. No sunglasses. |
| #7 closing | Boss mid-task — watering, carrying feed, walking the yard with dogs trailing — shot from a slight distance | Landscape (3:2) | Candid energy; the life doing the talking. |
| (optional spare) | A second option for each of the above so we can pick in-session | — | More choices, same slots. |

Drop them in `public/photos/mark/` (new dir, outside all pipeline destinations — no collision risk).

## Architecture

- **`app/page.tsx`** — stays a Server Component composition shell only (SRP as today).
- **New in `app/components/home/`:** `LandingHero.tsx`, `MeetMark.tsx`, `Residents.tsx`, `PlaceMosaic.tsx`, `LiveNow.tsx` (thin warm-framed wrapper composing the untouched `GuardianHomeBadge` + `HomeCameraStage`), `LatestNote.tsx`, `ClosingShot.tsx`.
- **Reused, unmodified:** `HomeCameraStage`, `GuardianHomeBadge`, `RecentGemsRail` (slimmed via props if trivial, else as-is), `GemsStatFooter`, `lib/content.ts`, `lib/gems.ts`, `lib/emoji.ts`, `getBirdAgeLabel`.
- **Moved, not lost:** the Class of 2026 hatch-metadata grid's derivation logic lives on inside `Residents`; `SystemBanner`'s pipeline story gets one line in section 5 with a link to `/projects/guardian` (full banner retired from `/`, component kept for reuse elsewhere if wanted).
- **Design system:** Field Guide tokens only. Bigger Georgia serif display sizes, more whitespace, real photo captions; mono reserved for small accents and the footer index. Emoji per `lib/emoji.ts` SSoT only.
- **Performance:** hero image statically imported + `priority`; all Guardian fetches stay behind existing timeouts/fallbacks; nothing new blocks SSR. Page must render beautifully with the tunnel down (section 5 shows its existing offline state).
- **Mobile-first:** designed at 390px first; sections stack; mosaic becomes a swipeable strip.

## TODOs (implementation session)

1. Boss picks/provides: hero landscape, the two Mark shots, 5–7 place photos → commit under `public/photos/mark/` + `public/photos/place/`.
2. Draft the ~10 sentences of site copy with Boss (intro, resident one-liners, section lines, closing line).
3. Build sections 1→7 as components above; rewrite `app/page.tsx` composition.
4. Slim the index rail into the footer zone; retire `SystemBanner` from `/`.
5. Mobile pass at 390px; dark-island contrast check; `npm run lint` + `npm run build`.
6. Verify in browser preview: tunnel-up and tunnel-down renders, LCP on hero, live cameras still poll.
7. Boss reviews on his actual phone before anything ships.

## Docs / Changelog touchpoints

- `CHANGELOG.md` — minor version bump on ship (what/why/how, author model).
- `docs/FRONTEND-ARCHITECTURE.md` — homepage section map + new components; note `photos/mark/` + `photos/place/` as hand-curated (non-pipeline) dirs.
- `CLAUDE.md` — one-line homepage description update under Pages.
