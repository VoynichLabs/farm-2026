# SEO Checklist for Future Agents

Author: Claude Sonnet 5.5 (Bubba)
Date: 03-October-2026
Source: Boss shared a checklist tweet on 03-Oct-2026 (x.com/suraj_sharma14, status 2106240327569035424). It is half a joke ("rank #1 by Friday, make no mistakes") but the list itself is the real basics. This file is the keeper version.

Use it before you ship or review any public page. Verify each item against the actual built output, not against what the code looks like it should do.

## Make the page findable
1. **Render server-side (or pre-render).** The HTML a crawler downloads must already contain the page text and links. View the raw page source, not the browser inspector. A client-only single-page app with an empty root div fails this.
2. **Generate a sitemap** and keep it in sync with the real routes.
3. **Submit the sitemap in Google Search Console** and check the coverage report for pages Google found but did not index.
4. **Robots file must not block Googlebot.** Read the live robots file on the deployed site, not just the one in the repo.
5. **No stray noindex tags.** Search the built pages and the response headers for noindex, including leftovers from staging.

## Keep the site clean
6. **Kill redirect chains.** One hop from old address to final address.
7. **Fix 404s** and any internal link that points at one.
8. **Canonical tag on every page**, pointing at the single preferred address.
9. **Link orphan pages.** Every public page needs at least one internal link to it.

## Make each page understandable
10. **Unique meta description on every page.** Written for a person, not stuffed.
11. **Exactly one main heading (H1) per page**, with sensible heading order below it.
12. **FAQ structured data** only where the page really has questions and answers.
13. **Breadcrumbs**, with matching structured data, on nested pages.
14. **Alt text on every meaningful image.** Describe what is in it. Decorative images get empty alt text.

## Make it fast and stable
15. **Serve modern image formats** (WebP or better) at sensible sizes.
16. **No layout shift.** Reserve space for images, embeds, and late-loading widgets.
17. **Load fast.** Target a couple of seconds on a mid-range phone over ordinary mobile data. Measure with Lighthouse or PageSpeed Insights, do not guess.

## Make it trustworthy
18. **Remove the obvious AI slop.** Generic filler, repeated phrasing, invented claims, placeholder text. Real photos and real farm details beat generic copy.

## Human-only items (an agent cannot finish these)
19. **A real author bio**, with a real person's real background. Draft it from facts the Boss has given. Never invent credentials.
20. **Quality backlinks** from real sites. Earned by posting good work and getting people to link to it. Agents may suggest places to share or be listed. Agents must not buy, fake, or spam links.

## Rules for the agent running this list
- Report what you checked and what you did not. Do not mark an item done on a guess.
- This list is for the site's search presence. It never overrides the repo's own coding standards, changelog rules, or the do-not-touch notes in CLAUDE.md.
- If you change behavior (sitemap, robots, redirects, canonicals), add a CHANGELOG entry per the repo's rules.
