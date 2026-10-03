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

Status key: **pass** · **fixed** (on this branch, verified in build output) · **needs-human** · **not-verified**.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Server-side render | pass | Build route table: every page is static, SSG, or server-rendered; raw HTML of all 92 pages contains the page text and links. |
| 2 | Sitemap in sync with routes | _pending_ | Live sitemap lists 49 URLs but omits `/ornitharch` and all 41 `/flock/[slug]` bird pages. |
| 3 | Sitemap submitted in Search Console | needs-human | No Search Console access from this machine. Boss: submit `https://farm.markbarney.net/sitemap.xml` and read the "Pages" coverage report. |
| 4 | Robots does not block Googlebot | pass | Live `robots.txt`: `User-Agent: *` / `Allow: /` / sitemap line; served 200. |
| 5 | No stray noindex | pass | No `robots` meta and no `X-Robots-Tag` header on any of the 92 pages; no `noindex` in source. |
| 6 | No redirect chains | _pending_ | All old addresses reach the final page in one hop (`http→https`, `/gallery→/gallery/gems`, `/flock/henridotta→/flock/henridot`, `/flock/→/flock`). `/diary→/field-notes` is one hop but a temporary 307, not permanent. |
| 7 | No 404s / broken internal links | pass | 88 unique internal links fetched: zero errors, zero redirecting links. |
| 8 | Canonical on every page | _pending_ | No page on the live site has a canonical tag. |
| 9 | No orphan pages | _pending_ | Seven bird pages have no internal link (all deceased birds: Birdatha, Birdgit, Henrietta, Little Big Red Junior, Whitey Red Legs, EE hen 2, Black Australorp hen). `/flock` never renders deceased birds. |
| 10 | Unique, human meta descriptions | _pending_ | All 37 field notes use "Farm field note — {date}". Three bird pages print the word "null" (Hawk Food, Loud Dumb Bird, White Rooster). |
| 11 | Exactly one H1 | _pending_ | Home page has no H1 at all. `/projects/birdcatraz` and `/projects/chicken-enclosure-2026` have two (page title plus the MDX body's own `#` heading). All other pages: one. |
| 12 | FAQ structured data only where real | pass | No page has a real question-and-answer section and none carries FAQ schema. Correctly absent; nothing added. |
| 13 | Breadcrumbs + structured data on nested pages | _pending_ | Nested pages show a visible "← back" link but carry no BreadcrumbList data; the only JSON-LD sitewide is Person + WebSite. |
| 14 | Alt text on meaningful images | pass | Every `<img>` on all 92 pages has an alt attribute; gem alts are real scene descriptions. |
| 15 | Modern image formats at sensible sizes | _pending_ | Site photos go through the Next.js image optimizer. Gem photos (home rail, `/gallery/gems`) come straight from the camera server as full 1920px JPEGs. |
| 16 | No layout shift | _pending_ | Lighthouse CLS 0 on `/`, `/flock`, `/gallery/gems`, `/yard`; **0.153 on field-note pages** — the cover image reserves a 3:2 box but is capped at 75% of the screen height, so the header below it jumps. Same pattern on project hero images. |
| 17 | Load fast | _pending_ | Lighthouse mobile performance: `/flock` 100, `/gallery/gems` 100, `/yard` 96, `/` 85 (largest paint 4.4 s, page weight ~22 MB), field note 74 (largest paint 5.4 s). |
| 18 | No obvious AI slop | _pending_ | Copy is specific and farm-real. Defects: the literal "null" in three bird descriptions (item 10), and the formulaic field-note descriptions. |
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
