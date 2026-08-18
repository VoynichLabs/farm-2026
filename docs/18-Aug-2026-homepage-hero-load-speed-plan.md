# 18-Aug-2026 — Homepage hero load speed (Class of 2026 row)

**Trigger:** Boss, on `farm.markbarney.net` (the homepage): *"The pictures at the top
of the Ornitharchs should be loading instantly. What the hell is going on?"* Plus, in
the same session: the clock must read Eastern, Ingebird's tile must use an early
frame rather than the in-hand one, it must look and load well on mobile, and the
version goes to 1.40.0.

## Scope

**In:**

- The Class of 2026 row on `/` — the six tiles at the top of the page.
- `SiteNav`'s clock (UTC → Eastern).
- Ingebird's `photo` field in the roster.
- Version bump + changelog.

**Out:**

- `/flock`'s Ornitharch cohort wall. Measured, found healthy (images start at
  ~194ms on a warm cache), and it is not the page Boss was looking at. Left alone.
- The `sizes` strings. Checked against the grid at all three breakpoints and
  already correct — see "What was checked and left alone."
- The 794 KB `/flock` document and its 167 lazy thumbs. Real, but a different
  page and a different problem; not folded into a bug fix for the homepage.

## Diagnosis (measured, not assumed)

Chrome DevTools trace against production, cold-cache reload, 1440×820 then
390×844 mobile emulation:

| Signal | Value |
|---|---|
| TTFB | 88 ms |
| FCP | 208 ms |
| First hero image *queued* | 166 ms — after HTML parse, not during |
| Hero images complete | 203–230 ms |
| `loading` on all six hero tiles | `lazy` |
| `fetchPriority` on all six | `auto` |

Chrome's own `LCPDiscovery` insight fired unprompted on `farm.markbarney.net/`:
*"make the LCP image discoverable from the HTML immediately, and avoiding
lazy-loading."*

**Root cause:** `next/image` lazy-loads by default. Nothing in the Class of 2026
row opted out, so the six tiles at the very top of the page were emitted
`loading="lazy"`, assigned Low priority, and not queued until after layout. On a
warm desktop cache that cost ~170ms and hid. On a phone on a slow connection,
Low priority queued behind the JS bundle is precisely the visible lag reported.

**A measurement trap worth recording:** the first pass at this used the in-app
Browser pane and produced a first-image start of 1827ms. That number was an
artifact — `document.visibilityState` was `hidden` for that pane, and a hidden
tab does not paint and defers lazy images indefinitely (zero `paint` entries,
zero image requests even after 4s). Any lazy-loading measurement taken there is
meaningless. Use the chrome-devtools MCP, which drives a genuinely visible tab.

## Changes

1. **`app/page.tsx`** — `priority={idx < FIRST_ROW_PRIORITY}` on the Class of
   2026 `<Image>`, `FIRST_ROW_PRIORITY = 6`.

   Six covers both ends of the responsive range: one full row at
   `lg:grid-cols-6`, and at `grid-cols-2` on a phone the three stacked rows
   (~700px against an ~800px viewport) that fill the first screen. Tile 7+ stays
   lazy, so no mobile bandwidth is spent preloading below-the-fold birds.

2. **`app/components/system/SiteNav.tsx`** — `formatUtc` → `formatEastern`,
   built on `Intl.DateTimeFormat` pinned to `America/New_York` with
   `hourCycle: "h23"`. The zone carries the EST/EDT rule, so this does not drift
   an hour twice a year, and the suffix is read back out of the formatter rather
   than hardcoded. Placeholder moves `──:──:──Z` → `──:──:── ET`.

3. **`content/flock-profiles.json`** — Ingebird's `photo` → the day-20 rail
   frame. Her true hatch-day photo (IMG_5141) is cited in the hatch record but
   was never committed (`path: ""`), so this is the earliest frame in the repo.
   All three frames stay in her `photos[]` ledger.

4. **`package.json`** — 1.37.0 → **1.40.0**.

## Decisions worth flagging

- **1.40.0, not 1.4.0.** Boss said "up to 1.4". Under SemVer `1.4.0` sorts
  *below* the current `1.37.0`, which would be a regression; `1.40.0` is the
  forward reading and matches the colloquial one.
- **Ingebird's photo is a shared SSoT.** `photo` is read by both the homepage and
  `/flock` — deliberately unified on 22-Jul-2026 after a hardcoded homepage array
  drifted out of sync. Adding a homepage-only override would have re-introduced
  exactly that drift, so the single field was changed instead. Knock-on: `/flock`'s
  "photo ID unconfirmed" badge keys off `suspected` in the filename and now shows
  on her tile. That is accurate for this frame and was left rather than
  special-cased.

## What was checked and left alone

- **`sizes`** — `(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw` against
  `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`. Correct at all three breakpoints;
  a 1440px viewport selects the 256w variant for a 194px tile.
- **Mobile layout** — screenshotted at 390×844. The `h-56` + `object-contain`
  tiles fill their frames without letterboxing. No layout change needed; the
  complaint was load, not look.
- **Image optimizer** — cold optimize measured at 220–490ms TTFB, warm at ~85ms,
  on a `cache-control: public, max-age=14400`. Fine; not the bottleneck.

## Verification

- `npx eslint app/page.tsx app/components/system/SiteNav.tsx` → clean.
- `npm run build` → passes.
- Built HTML: six `<link rel="preload" as="image">`, first six `<img>` no longer
  carry `loading="lazy"`, tiles 7+ unchanged.
- Local mobile screenshot: `v1.40.0`, `22:40:22 EDT`, Ingebird on her chick frame.
- **Production re-measure after the Railway deploy lands** — the same cold-cache
  chrome-devtools trace, comparing first-image queue time against the 166ms
  baseline above.
