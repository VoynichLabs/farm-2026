# The Front Porch — a warm landing page for farm.markbarney.net

**Date:** 01-Aug-2026
**Author:** Claude Opus 5 (Bubba)
**Status:** awaiting approval
**Target version:** 1.36.0

---

## The problem in one paragraph

The site is excellent and it is aimed at the wrong person. `/` currently opens with a
six-across monospace grid of hatchling portraits, a pipeline status banner, four live
camera tiles on a dark island, a gem rail, and a `└─`-prefixed file listing. To someone
who already knows what Farm Guardian is, that page is a flex. To a woman who was handed
this link on a first date and opened it on her phone in a parking lot, it reads as a
server dashboard belonging to a man she is not sure she understands yet.

Nothing on that page is wrong. It is in the wrong room. This plan builds a front porch in
front of it and moves the field station one door back — nothing is deleted, nothing is
redesigned, and everything stays exactly one click away.

**The page has one job:** make someone feel the place, understand who lives here, smile
twice, and leave without being asked for anything.

---

## Scope

### In

1. A new `/` — "the Porch." Photo-forward, first-person, warm, mobile-first, ~7 scroll
   beats, no chrome, fully static.
2. Relocation of the current homepage to `/station`, unchanged in content, with every
   inbound reference updated (`SiteNav`, `sitemap.ts`, `lib/llms.ts`, `DEEPER_LINKS`).
3. A route-scoped `metadata` export for `/` so the link preview — the thing that renders
   in iMessage *before* she taps — is warm instead of "Live chicken cameras in Hampton, CT."
4. A new `public/landing/` asset directory holding pre-resized, weight-budgeted imagery.
5. A new `content/porch.json` holding the editorial one-liners for the bird tiles
   (an **overlay** on `content/flock-profiles.json`, same pattern `lib/cameras.ts` uses).
6. An explicit **shot list** — which photos exist, which three need to be taken, framed,
   and where each one lands.
7. The exact copy. Headline, intro, every caption, the closing lines. Written below, not
   deferred to implementation.

### Out — deliberately, and permanently

- **No contact form. No mailto. No "get in touch." No newsletter. No DM widget.** This is
  an architectural constraint, not a style preference — see *The posture* below. The page
  ends with a door left open, not a hand extended.
- **No analytics, pixels, visitor counters, or engagement instrumentation.** Nothing on
  this page counts who looked.
- No changes to the gem lane, the archive lane, `public/photos/` layout, the Guardian
  backend, or any social poster. The pipelines commit to `main` every couple of hours and
  this work does not touch their territory.
- No redesign of `/flock`, `/gallery/gems`, `/markets`, `/yard`, `/field-notes`,
  `/hatches`, or `/projects`. The porch links to them as they are.
- No new dependencies. No animation library, no webfont service (Georgia is already the
  site serif), no CSS framework beyond the Tailwind v4 already installed.
- No dark mode for `/`, and no new palette. The Field Guide tokens are enough.
- **No git-LFS migration or `public/photos/` relocation.** The repo's `.git` is 4.7 GB and
  that is a real problem, but it is a separate job and this plan will not be held hostage
  to it. Flagged, not fixed.

---

## The posture — "I'm not chasing anybody"

This is the requirement most likely to be handled badly, so it is written down as a
constraint rather than a vibe.

A page that ends with a contact form says *please*. A page that ends with social buttons
and a newsletter box says *please, repeatedly*. The whole impression the site builds —
a man with thirteen acres, a hatching season, and somewhere to be at six in the morning —
is undone by one `<form>` at the bottom.

So the close is: a short, self-possessed paragraph, one Instagram link, and nothing else.
No fields, no buttons, no "reach out." If she wants to find him she already has his
number or she can follow the account. That is enough, and the restraint is the message.

The tone target is **content, not aloof.** "I'm not going anywhere" should read as a man
who likes his life, never as a man who has been burned. Every line below was written
against that test, and any line that fails it in review gets cut rather than softened.

---

## Architecture

### Routing

| Route | Before | After |
|---|---|---|
| `/` | Class-of-2026 grid, SystemBanner, live cameras, gems rail, index, status footer | **The Porch** (new) |
| `/station` | — | The current homepage, moved verbatim |

`app/page.tsx` is replaced; its current body moves to `app/station/page.tsx` with its file
header updated to record the move. Zero content changes to the moved page — this is a
relocation, not a rewrite. Anyone who liked the old front page loses nothing.

### The nav decision

`SiteNav` renders a sticky monospace bar with a UTC clock, lat/long coordinates, and a
build version string. On the porch that bar is a mood-killer in the first 40 pixels — it
announces "software project" before the photograph gets a chance to say anything.

**`/` renders no SiteNav.** `SiteNav` is already a client component reading `usePathname()`
for the `/markets` dark variant; suppression is one guard clause at the top of the
component. Every other route keeps the bar exactly as it is today. Navigation on the porch
is the "doors down" section (beat 7) — warm labels, no `/gallery/gems` path strings. The
wordmark on every other page continues to link to `/`, which now lands on the porch.

The `home` entry in `NAV_LINKS` re-points to `/station` and relabels to `station`, so the
field station stays one click from everywhere.

### Rendering discipline — non-negotiable

The porch is a **server component tree that awaits nothing.** No Guardian fetch, no
`lib/gems.ts` call, no filesystem read beyond `lib/content.ts` loaders that read
`content/` off disk. `/` must render pixel-identically with the Mac Mini powered off and
the Cloudflare tunnel down. This is the same discipline `CLAUDE.md` demands of
`/api/health` and `/markets`, and it matters more here than anywhere: the one page that
must never be slow is the one someone opens once.

Exactly **one** client island is permitted (beat 6, below), it sits below the fold, and it
renders *nothing at all* on failure.

### Components

New directory `app/components/porch/` — one file per beat, single responsibility each,
all server components except the noted island:

| File | Responsibility |
|---|---|
| `PorchHero.tsx` | Full-bleed hero image + headline + place line |
| `PorchIntro.tsx` | The four-sentence first-person paragraph |
| `PorchDayTriptych.tsx` | Morning / noon / evening yard frames + caption |
| `PorchResidents.tsx` | Bird tiles — joins roster to `content/porch.json` |
| `PorchDogs.tsx` | Pawel & Pawleen |
| `PorchHuman.tsx` | The two photographs of Mark + his paragraph |
| `PorchLatest.tsx` | **client island** — last frame the cameras caught; fails to nothing |
| `PorchDoors.tsx` | Warm links into the rest of the site |
| `PorchClose.tsx` | The closing lines + the single Instagram link |
| `PorchReveal.tsx` | **client** — shared fade-up wrapper, honors `prefers-reduced-motion` |

`app/page.tsx` becomes composition only: nine lines of JSX and a `metadata` export.

### Data — how the bird tiles stay honest

Birds die on this farm. A hardcoded tile pointing at a bird who is gone is the single
worst failure this page could have.

So the tiles **derive from `content/flock-profiles.json`** — name, breed, photo path — and
join by name against a new `content/porch.json`:

```json
{
  "residents": [
    { "name": "Birddor",    "line": "Hatched on my desk in April. Was Birdadette until he started crowing." },
    { "name": "Quasibirdo", "line": "Polish bantam. Can't see past his own hairdo. Unbothered by this." }
  ]
}
```

If a name in `porch.json` is missing from the roster, or is no longer `status: "active"`,
**the tile does not render.** No broken image, no stale caption, no "In Memoriam" surprise
on a page meant to be light. If a bird's portrait gets swapped by the Discord ingest
pipeline, the porch shows the new one automatically — same as `/flock`.

This is the `lib/cameras.ts` pattern exactly: the roster is the source of truth, the
overlay carries UI-only editorial. It goes in the SSoT table in
`docs/FRONTEND-ARCHITECTURE.md` described that way, so nobody later "consolidates" the
one-liners into `flock-profiles.json` and pollutes the roster with prose.

### Assets — `public/landing/`

A **new sibling directory**, not a subdirectory of `public/photos/`. `public/photos/` is
pipeline territory — `CLAUDE.md` says don't rename its destination subdirs and don't add
them to any gate. `public/landing/` is hand-curated, human-only, and gets a line in
`CLAUDE.md` saying so, so no future agent or pipeline ever writes into it or tidies it up.

```
public/landing/
  hero-yard-summer.jpg        # 2400px wide, ~280 KB   — the one big image
  og-porch.jpg                # 1200×630, ~120 KB      — the link preview
  mark-in-the-yard.jpg        # 1600px, ~180 KB
  mark-and-silkie.jpg         # 1200px, ~150 KB        — resized from history/boss-silkie.jpg
  pawel-pawleen.jpg           # 1600px, ~180 KB
  hands-eggs.jpg              # 1200px, ~140 KB        (optional 4th shot)
  day/morning.jpg  noon.jpg  evening.jpg   # 1400px, ~140 KB each, top-cropped
```

**Weight budget, stated so it can be tested:** first screen ≤ 400 KB, whole page ≤ 1.5 MB
on a cold mobile load. Today a single unoptimized repo JPEG is ~1.1 MB — eight of those is
9 MB and the entire impression is a white screen and a spinner.

**The split that resolves DRY vs. weight:** anything rendered *large* (hero, triptych, the
human shots) gets a pre-resized copy in `public/landing/`. Anything rendered *small* (the
bird tiles, ~400 px) points at its **roster path** and lets `next/image` optimize it with
a tight `sizes` attribute — so the tiles keep auto-updating from the SSoT and still weigh
nothing. Nothing is duplicated that doesn't need to be.

Image rules: `priority` + `fetchPriority="high"` on the hero **only**; explicit `sizes` on
every `next/image`; a `blurDataURL` on the hero so there is no white flash before paint;
everything below the fold lazy by default.

### Register — how the porch differs from the field station

The codebase already has two visual registers (field station, and the `/markets` terminal).
The porch is a third, and stating its rules prevents it drifting back into the first one:

- **Same tokens.** `--color-field-*`, unchanged. No new palette, no gradients.
- **No monospace anywhere on `/`.** Mono is the field-station voice.
- **No emoji anywhere on `/`.** `lib/emoji.ts` is the field-station vocabulary; the porch
  has captions instead of marks.
- **Serif goes big.** Georgia at fluid `clamp()` sizes for the headline and section leads.
  Body copy at ~1.05 rem with generous leading — this page is read slowly on purpose.
- **Space is the main design element.** Wide margins, big vertical rhythm, one idea per
  screen. The field station is dense because density is its content; the porch is not.
- **Motion: one effect, total.** A slow fade-up as each section enters view
  (`IntersectionObserver`, ~500 ms, 12 px travel), disabled under `prefers-reduced-motion`.
  No parallax, no scroll-jacking, no gradient meshes, no everything-rounded. `CODING_STANDARDS.md`
  calls this "AI slop" and it is the fastest way to make a sincere page look generic.

---

## The page, beat by beat — with the actual copy

### Beat 1 — The view

Full-bleed hero photograph, ~72 vh on mobile, ~86 vh on desktop. Type sits low-left over a
soft bottom gradient scrim. Nothing else on screen. No nav, no buttons, no scroll arrow.

> # This is the yard.
> Hampton, Connecticut. Thirteen and a half acres, one very opinionated flock,
> and two Yorkies who believe they are wolves.

*(On the counts rule: "thirteen and a half acres" and "two Yorkies" are static property
facts, already public in `lib/llms.ts` — not derived data. The standing no-flock-headcount
rule holds absolutely: the porch never says how many birds there are.)*

### Beat 2 — Who's talking

Text only. Paper background. No photograph yet — she should meet the place before she
meets the man.

> I'm Mark. I moved out here and slowly let it take over.
>
> What started as a few chickens is now a flock with names and hatch dates, a spring
> incubator season, turkeys with strong opinions, a garden, and a camera system I built
> because I wanted to know what happens out here when I'm not looking.
>
> Most days start with a walk-through and end with one.
>
> It's quiet, it's more work than it looks, and I like it better than anything else I've done.

### Beat 3 — A day here

Three yard frames — morning, noon, evening, same day — side by side on desktop, stacked on
mobile. This is the best idea on the page and it is uniquely his: the farm already
photographs itself three times a day, every day, on a timer.

> **The same camera, three times a day, every day.**
> Nothing here is staged. This is just what it looks like.
>
> *see every day of it →* `/yard`

**Two decisions, stated rather than left implicit:**

*Curated, not live.* These are hand-picked frames from one good day, stored in
`public/landing/day/`. The alternative — auto-pulling today's frames — would put a gray
sleeting November noon on the front page, and the whole point of this section is *look how
good it is here*. `/yard` already exists for the honest live stockpile and is linked
directly. Cost: someone swaps three files seasonally, maybe twice a year. Worth it.

*Cropped at the top, not the bottom.* The Reolink watermark and burned-in timestamp sit in
the top ~7% of every frame; crop them out. **Keep** the bottom-right date badge — it is
proof these are real frames from a real day, and removing every trace of the camera would
make an authentic section look staged.

### Beat 4 — The residents

Six bird tiles. Portrait crops, name in serif, one line of copy each. This is where the
page earns its first real laugh, and the names do most of the work.

> **The residents**
> Every bird here has a name. This is a representative sample.

| Bird | Line |
|---|---|
| **Birddor** | Hatched on my desk in April. Was Birdadette until he started crowing. |
| **Chonkers & Chonkette** | Buff Rangers. Named accurately. |
| **Quasibirdo** | Polish bantam. Can't see past his own hairdo. Unbothered by this. |
| **Horstabird** | Named by committee. Regrets nothing. |
| **Henridotta** | Granddaughter of the farm's first Wyandotte. Runs everywhere. |
| **Ravenessa** | Bantam. Also, as of last week, a rooster. We're all adjusting. |

*(Final six subject to who is photogenic and alive at build time — the tiles derive from
the roster, and the Ravenessa line references the confirmed 2026-07-31 reclassification in
the git log. Copy gets one last pass against the roster before ship.)*

Below the grid, one quiet link: *the whole flock, with the breed guide →* `/flock`.

### Beat 5 — The dogs

One landscape photo, one paragraph. This is the warmest, funniest thing in the entire
repository and it is currently buried in a diary file.

> **Pawel and Pawleen**
>
> Two Yorkshire terriers. They have coyote vests — spiked collars, body armor — because
> last May a coyote came into the yard in broad daylight and both of them went straight at
> it. Seven pounds each. They are under the impression that they are much larger, and I've
> decided not to correct them.

### Beat 6 — The human

Now the photographs. Two, and only two. A large portrait and a smaller candid beside it.

> That's me and a silkie who had opinions about being picked up.
>
> I built the camera system, I write the field notes, and I do the six a.m. walk-through
> in whatever the weather is doing. Not for the internet — the internet is just where the
> pictures end up. The rest of this site is the long version, and some of it got away from
> me. There is a page where the chickens pick stocks.

Then the one client island, directly beneath — a single small frame with a soft caption:

> *…and here's the last thing the cameras caught.*

**On the island's risk:** it fetches through `lib/gems.ts` (3 s abort, already enforced) and
on any failure renders `null` — no error state, no skeleton, no empty box. The section
simply is not there and the page reads fine without it. It sits below the fold so a late
mount costs nothing visually. It is included because "he actually built this" landing in
the same breath as a live photograph is the strongest single moment available, and it is
cheap. **If it ever flickers or shifts layout in review, cut it** — the page does not
depend on it.

### Beat 7 — The doors

A short warm list, not a file listing. No path strings, no `└─`, no monospace.

> **If you want to go further in**
> - *The whole flock* — everyone, with names, hatch dates, and a breed guide
> - *The cameras, live* — what's happening out there right now
> - *Field notes* — what happened this week
> - *The chickens' stock picks* — this needs no further explanation

### Beat 8 — The close

Centered, generous whitespace above and below, serif, quiet.

> **The door's open. That's all it is.**
>
> I'm not going anywhere. This place needs me every morning, and I've found I like being
> needed by it.
>
> If it looks like your kind of quiet — the birds, the dirt, the long green evenings —
> I'd like to meet you.
>
> If it doesn't, I hope you enjoyed the chickens.

Beneath it: `@pawel_and_pawleen` and nothing else. No form. No email. No buttons.

That last line is the whole posture in nine words — warm, self-possessed, gives her an
easy graceful exit, and asks for absolutely nothing. It is the most important sentence on
the page.

---

## The shot list

He offered to take whatever photos are needed. Here is exactly what, framed, and where each
one lands. **Two are already in the repo and are good.** Three are new.

### Already here — no action needed

| # | File | Goes to | Why it works |
|---|---|---|---|
| A | `public/photos/history/boss-silkie.jpg` | **Beat 6, primary** | Genuinely great. Real laugh, blue sky, a white silkie mid-squawk on his shoulder. Reads as warm and completely unposed. Bare trees date it to late winter; the warmth carries it anyway. |
| B | `public/photos/history/boss-chick-1.jpg` | **Beat 6, secondary** | Chick standing on a gloved hand, big honest smile. Good companion to A — same register, different scale. |

### Needed — three photographs

**1. The hero.** `public/landing/hero-yard-summer.jpg` · landscape 16:9 · **highest leverage
photo on the page**

Shot from the deck or the high side of the yard, looking down across Birdcatraz toward the
treeline, in the last hour before sunset. Birds visible but small — they're part of the
landscape, not the subject. Green, long shadows, warm light. **He is not in this photo.**

*Why it must be new:* the repo's only wide landscape is
`april-2026/backyard-panorama-deck.jpg`, which is bare trees and mud in early spring, and
the yard-diary frames are security-camera framed with watermarks. There is currently no
photograph of this property that shows how good it looks in August. That is the single
biggest gap.

**2. Him, working.** `public/landing/mark-in-the-yard.jpg` · landscape or 4:5

Mid-task in the yard in daylight — carrying a water bucket, opening the coop, hands in the
feed bin. Taken by someone else, or on a tripod with a timer. **Not looking at the camera.
Not posed.** Two or three frames is plenty.

*Why:* the two existing shots are both selfies looking into the lens. One photograph of him
inside the life, rather than smiling out of it, does more than five more selfies would.

**3. The dogs.** `public/landing/pawel-pawleen.jpg` · landscape

Both Yorkies together, outdoors, in grass. **Best case: the coyote-vest photo** — the diary
references `IMG_4767` from 26-May-2026 showing both in spiked collars and body armor. If
that file is still on the Mini, it is the shot; nothing else will be as funny. Otherwise a
fresh one of the two of them outside.

### Optional fourth

`public/landing/hands-eggs.jpg` — close crop of his hands holding a few eggs, or a tomato
out of the garden. No face. Ten seconds to take, warm to everyone, and gives beat 3 or 5 a
change of scale if the layout wants one.

### Also needed (no shooting — resizing only)

- Six bird portraits: **pointed at directly from `flock-profiles.json` paths**, optimized
  by `next/image`. Nothing to copy or maintain.
- Three yard-diary frames from one good day → `public/landing/day/`, top-cropped ~7% to
  remove the Reolink watermark and timestamp.

---

## The link preview

This matters more than any single section. He texts the link; the preview card renders
**before she taps.** Right now that card says *"Farm 2026 — Live chicken cameras in
Hampton, CT"* over a description mentioning an "AI pipeline." That is the wrong first
sentence for this audience, and it is the current sitewide default from `app/layout.tsx`.

Fix: a route-level `metadata` export in the new `app/page.tsx`.

```ts
export const metadata: Metadata = {
  title: { absolute: "The farm in Hampton, Connecticut" },
  description:
    "Thirteen and a half acres, a flock with names, two Yorkies in coyote armor, " +
    "and a garden. This is the place.",
  openGraph: { /* title, description, images: [OG_PORCH] */ },
  twitter:   { card: "summary_large_image", /* … */ },
};
```

`title: { absolute: … }` is required to escape the layout's `"%s | Farm 2026"` template —
without it the card reads *"The farm in Hampton, Connecticut | Farm 2026"*. Every other
route keeps the template and its existing SEO identity untouched.

**Image host decision:** use `https://farm.markbarney.net/landing/og-porch.jpg`, not the
`raw.githubusercontent.com` workaround `layout.tsx` currently uses. That workaround dates
from the `output: "standalone"` bug (fixed in v1.16.x — see CHANGELOG line ~528); verified
**2026-08-01** by curl that `/photos/history/boss-chick-1.jpg`,
`/photos/birds/henrietta.jpg`, and a July carousel gem all return `200` from
farm.markbarney.net today. Keep the raw-GitHub URL documented as a fallback, and if the
Facebook Sharing Debugger reports a fetch failure, switch and note why. Updating the stale
comment in `layout.tsx` is a small follow-up, not part of this work.

**Verification is not optional here:** run the Facebook Sharing Debugger, and send the link
to an actual iPhone and look at the bubble. A link preview that renders wrong is a first
impression that never recovers.

---

## Rules this breaks — please sign off explicitly

1. **`docs/FRONTEND-ARCHITECTURE.md` rule 4 — "No owner name in public files."**
   A first-person introduction violates this by definition. Requesting a **route-scoped
   exemption** for `/` and `app/components/porch/*`, using the `/markets` precedent (that
   page carries an explicit, documented, route-scoped exemption from the aesthetic rules).
   Supporting precedent: `app/layout.tsx` already publishes `"name": "Mark Barney"` in
   JSON-LD, and `lib/llms.ts` opens with *"Mark Barney's hobby chicken farm."* The rule's
   real intent — no owner name scattered through camera configs and component chrome —
   is untouched. **Boss should approve this, not discover it.**

2. **No flock headcount** — still holds, absolutely. Warm copy badly wants "about thirty
   chickens." Every line above was checked against this and none of them carries a count.
   Reviewers should check it again before ship.

3. **New component directory** `app/components/porch/` — consistent with the existing
   `home/`, `guardian/`, `gems/`, `flock/` convention. Noted, not controversial.

4. **`docs/FRONTEND-ARCHITECTURE.md` gains a "Registers" section** naming the three visual
   registers (field station / porch / terminal) and their rules, so the porch doesn't drift
   back into monospace in six months.

**One privacy note, briefly:** this page pairs a face, a first name, and a town. All three
are already public on this site and in the JSON-LD, so the delta is small — but the porch
should not add anything more precise than "Hampton, Connecticut." Conveniently, suppressing
`SiteNav` on `/` also removes the coordinate string from the front page (those coordinates
are town-center and approximate, per the component's own header, but they don't belong on
this page regardless).

---

## TODOs

### Phase 0 — approvals (blocking; no code until these three land)
1. Rule-4 route exemption approved.
2. Shot list approved; photos 1–3 taken and dropped anywhere on the Mini.
3. Closing copy (beat 8) approved — it is the most personal text on the site and it should
   be in his voice, not mine. Edit freely.

### Phase 1 — relocation (ships independently; low risk)
4. `git mv` the current homepage body → `app/station/page.tsx`; update file header to record
   the move and the date. No content changes.
5. `SiteNav`: suppress on `/`; re-point the `home` entry to `/station`, relabel `station`.
6. `app/sitemap.ts`: add `/station` (priority 0.7). `/` stays 1.0.
7. `lib/llms.ts`: describe `/` as the personal introduction and `/station` as the live index.
   **Public facts only — that file is world-readable and crawled; nothing about dating goes
   in it.**
8. *Verify:* `npm run build`, then every route in `sitemap.ts` returns 200 locally,
   `/station` renders identically to today's `/`.

### Phase 2 — assets
9. Resize + crop into `public/landing/` per the tree above; hit the per-file KB targets.
10. Generate `og-porch.jpg` at exactly 1200×630.
11. Generate the hero `blurDataURL`.
12. *Verify:* `du -sh public/landing/` — total under ~1.5 MB. If it isn't, re-compress.

### Phase 3 — the porch
13. `content/porch.json` + the roster-join loader in `lib/content.ts` (with the
    missing/inactive-bird skip).
14. `PorchReveal.tsx` (client, reduced-motion aware) — built first, everything wraps it.
15. Beats 1–5 and 7–8 as server components, top to bottom.
16. `PorchLatest.tsx` — the one island. Must render `null` on every failure path.
17. `app/page.tsx` — composition + `metadata` export.
18. File headers on every new `.tsx` per `CLAUDE.md`.

### Phase 4 — verification (the part that decides whether this was worth doing)
19. `npm run lint` and `npm run build` clean.
20. Dev server via the Browser pane; screenshot every beat at **375×812** first, desktop
    second. Mobile is the real target.
21. **Tunnel-down test:** point the island at an unreachable host and confirm `/` renders
    perfectly with no gap, no error, no shifted layout. This is the failure mode that
    matters.
22. Lighthouse mobile: **LCP < 2.5 s, CLS ≈ 0.** The hero is the LCP element and must have
    `priority` and reserved dimensions.
23. `prefers-reduced-motion: reduce` — all fade-ups off, nothing broken.
24. Link preview: Facebook Sharing Debugger **and** a real iMessage bubble on a real phone.
25. Read the whole page aloud on a phone, cold. If any line sounds like it is trying, cut it.

### Phase 5 — docs
26. `CHANGELOG.md` → `[1.36.0]` (minor: new route + relocated route, no data-shape change).
27. `docs/FRONTEND-ARCHITECTURE.md` → Registers section; rule-4 exemption; `/station` and
    `/` in the pages table; `content/porch.json` and `public/landing/` in the SSoT table,
    described as overlay + hand-curated.
28. `CLAUDE.md` → updated Pages list, and an explicit line that **`public/landing/` is
    hand-curated and not pipeline territory** — no poster, no LaunchAgent, and no future
    agent writes into it or "cleans it up."

---

## Docs / changelog touchpoints

| File | Change |
|---|---|
| `CHANGELOG.md` | New `[1.36.0]` top entry — what, why, how, author |
| `docs/FRONTEND-ARCHITECTURE.md` | Registers section; rule-4 route exemption; pages table; SSoT table rows for `content/porch.json` + `public/landing/` |
| `CLAUDE.md` | Pages list (`/` porch, `/station` index); `public/landing/` marked hand-curated / off-limits to pipelines |
| `lib/llms.ts` | Route descriptions for `/` and `/station` — public facts only |
| `app/layout.tsx` | Untouched by this plan; its stale standalone-era OG comment is a flagged follow-up |

---

## Risks

| Risk | Mitigation |
|---|---|
| Hero photo never gets taken; page ships on a bare-trees April panorama | Phase 0 blocks on it. The hero is 60% of the impression — shipping without it wastes the work. |
| Page weight kills the first impression on a phone | Explicit KB budget, pre-resized `public/landing/`, Lighthouse gate in Phase 4 |
| Tunnel hiccup degrades `/` | `/` awaits nothing server-side; one island that fails to `null`; explicitly tested in step 21 |
| Copy reads as trying too hard | Step 25 — read aloud, cold, on a phone. Cut anything that sounds like effort. |
| A featured bird dies between builds | Tiles derive from the roster and skip non-active birds automatically |
| A pipeline commit lands mid-work | Docs-only and porch-only files; `git pull --rebase` before every push; pipelines never touch `app/` or `public/landing/` |
| The porch drifts back to monospace later | The Registers section in FRONTEND-ARCHITECTURE exists to prevent exactly this |

---

## Why this shape and not another

A single scrolling page rather than a multi-page microsite, because the audience gives it
sixty to ninety seconds on a phone and every click is a chance to leave.

The place first and the man sixth, because he asked for it that way and he's right — by the
time she reaches his face she has already decided she likes where he lives, and the
photograph confirms a good feeling instead of carrying one.

The existing site untouched behind it, because the depth is the point. A landing page that
is *only* charming is a Hinge profile. A landing page with thirteen acres of real work
visible one click behind it is something else, and the something-else is the entire
advantage here.

And no form at the bottom, because a man who is done chasing doesn't put a form at the
bottom.
