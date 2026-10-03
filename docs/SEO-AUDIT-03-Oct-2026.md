# SEO Audit — 03-Oct-2026

Author: Claude Opus 5.5 (Bubba sub-agent)
Date: 03-October-2026
Checklist: [`docs/SEO-CHECKLIST.md`](SEO-CHECKLIST.md)
Branch: `seo-checklist-pass` (off `main` at the checklist commit)

## How this was checked

- **Live site:** fetched the live `robots.txt` and `sitemap.xml` from farm.markbarney.net, then fetched the raw HTML (no browser, no JavaScript) of every sitemap URL plus every `/flock/[slug]` page, `/ornitharch` and `/gallery/gems` — 92 pages. For each: status, title, meta description, canonical, robots meta and `X-Robots-Tag` header, H1 count and heading order, every `<img>` and its alt, JSON-LD types, and every internal link.
- **Internal links:** every internal link found on those pages (88 unique) was fetched; any non-200 or any redirect was recorded.
- **Redirects:** old addresses (`http://`, `/gallery`, `/diary`, trailing slash, renamed-bird slug) followed hop by hop.
- **Speed:** Lighthouse 12, mobile emulation, run locally against the live site (PageSpeed Insights' shared API quota was exhausted). Pages: `/`, `/flock`, `/gallery/gems`, `/yard`, newest field note.
- **Fixes:** verified in the production build output of this branch (`next build`, then the prerendered HTML in `.next/server/app/` and the generated `sitemap.xml`), because the live site still runs `main` until the Boss merges and Railway deploys.

## Results

Status key: **pass** · **fixed** (on this branch, verified in build output — the live site changes only after merge and deploy) · **needs-human** · **not-verified**.

Summary: 6 pass, 8 fixed, 6 need the Boss (Search Console, deceased-bird pages, gem image sizes, homepage speed, author bio, backlinks). Nothing left not-verified.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Server-side render | pass | Build route table: every page is static, SSG, or server-rendered; raw HTML of all 92 pages contains the page text and links. |
| 2 | Sitemap in sync with routes | fixed | Live sitemap omitted `/ornitharch` and all bird pages. Built sitemap now has 84 URLs incl. `/ornitharch` and exactly the 34 bird pages `/flock` links to (33 living birds plus Birddor, who stays on the farm-hatched wall); the other seven deceased birds are left out per Boss rule (v1.31.1). |
| 3 | Sitemap submitted in Search Console | needs-human | No Search Console access from this machine. Boss: submit `https://farm.markbarney.net/sitemap.xml` and read the "Pages" coverage report. |
| 4 | Robots does not block Googlebot | pass | Live `robots.txt`: `User-Agent: *` / `Allow: /` / sitemap line; served 200. |
| 5 | No stray noindex | pass | No `robots` meta and no `X-Robots-Tag` header on any of the 92 pages; no `noindex` in source. |
| 6 | No redirect chains | fixed | Every old address already reached its page in one hop. `/diary→/field-notes` was a temporary 307; now a permanent 308 (checked on the built server). |
| 7 | No 404s / broken internal links | pass | 88 unique internal links fetched: zero errors, zero redirecting links. |
| 8 | Canonical on every page | fixed | Live: no canonical anywhere. Build: all 91 audited pages carry a canonical equal to their own address. |
| 9 | No orphan pages | needs-human | Every other page is linked. The seven unlinked pages are deceased birds (Birdatha, Birdgit, Henrietta, Little Big Red Junior, Whitey Red Legs, EE hen 2, Black Australorp hen); v1.31.1 removed them from `/flock` on purpose. Boss to decide: leave them reachable by address only (current), or stop generating them. Not added to the sitemap or linked. |
| 10 | Unique, human meta descriptions | fixed | Field notes now use their own opening lines (37 of 37 unique); the three "(null)" bird descriptions are clean. Zero duplicate descriptions across the build. |
| 11 | Exactly one H1 | fixed | Build: every audited page has exactly one H1. Home gained a screen-reader-only H1 plus section h2s (screenshot-compared, unchanged look); project MDX `#` headings render as h2. |
| 12 | FAQ structured data only where real | pass | No page has a real question-and-answer section and none carries FAQ schema. Correctly absent; nothing added. |
| 13 | Breadcrumbs + structured data on nested pages | fixed | BreadcrumbList JSON-LD (Home › section › page) on all field notes, bird pages, banding and project pages, matching each page's visible "← back" link. |
| 14 | Alt text on meaningful images | pass | Every `<img>` on all 92 pages has an alt attribute; gem alts are real scene descriptions. |
| 15 | Modern image formats at sensible sizes | needs-human | Site photos are served as WebP/AVIF at fitted sizes via the Next.js optimizer. Gem photos (home rail, `/gallery/gems`) are full 1920px JPEGs from farm-guardian, which only offers 1920, full or a 270px thumb. Fix belongs in farm-guardian (add a mid-size WebP), then point `GemCard` at it. |
| 16 | No layout shift | fixed | Covers, photo grids and project heroes now reserve their true size. Re-measured on the build: CLS 0 on the newest field note (was 0.153) and on `/projects/birdcatraz`. Other pages already 0. |
| 17 | Load fast | needs-human | Mobile Lighthouse (live): `/flock` 100, `/gallery/gems` 100, `/yard` 96, `/` 85, field note 74. The field note's slow paint was mostly the layout fix above plus a large cover; the homepage's ~22 MB is the gem photos in item 15. Added a preconnect to the Guardian tunnel. Real fix for `/` needs the farm-guardian change. Re-measure after deploy. |
| 18 | No obvious AI slop | fixed | Copy is specific and farm-real. Fixed the literal "(null)" in three descriptions, the boilerplate field-note descriptions, and a stale homepage hint promising an "In Memoriam" section that no longer exists. |
| 19 | Real author bio | needs-human | See "What the Boss needs to supply" below. |
| 20 | Quality backlinks | needs-human | See below. |

## What the Boss needs to supply

**Item 3 — Search Console.** Add or open the `farm.markbarney.net` property, submit the sitemap, and after a few days read the "Pages" report for anything "Discovered/Crawled — currently not indexed".

**Item 19 — author bio.** The site has a Person record (name, Hampton CT, links to markbarney.net, Instagram and Facebook) but no human-readable bio page or byline. Facts needed, in the Boss's own words, nothing invented:
- One or two sentences on who he is and what he does for a living (or whether that should stay off this site).
- How long he has kept birds, and how the farm started.
- Whether the bio should name Bubba / Farm Guardian as his own build, and how he wants that described.
- A photo of himself he is happy to publish (or a decision that there is none).
- Where the bio should live (an About page, or the footer of field notes).

**Item 20 — backlinks.** Only the Boss can earn these. Candidates worth his time, none of them paid or automated: the Instagram and Facebook profiles already linked (add the site URL to each bio if not there), markbarney.net linking down to the farm site, local Hampton/Windham County groups or the town newsletter, poultry forums (BackYardChickens) where the hatch records and banding guide are genuinely useful, and a write-up of Farm Guardian on a hobbyist or open-source AI forum that links back to `/projects/guardian`.

## Out of scope but observed

Lighthouse accessibility flagged low colour contrast, small tap targets, and a label/name mismatch on several pages. Not on this checklist; left alone.
