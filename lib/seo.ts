/**
 * Author: Claude Opus 5.5 (Bubba sub-agent)
 * Date: 03-Oct-2026
 * PURPOSE: Shared search-engine helpers, added in the SEO checklist pass
 *   (docs/SEO-CHECKLIST.md, audit in docs/SEO-AUDIT-03-Oct-2026.md).
 *   - SITE_URL: the one preferred origin. Canonical tags are written as
 *     relative paths in each route's `alternates.canonical` and resolved
 *     against `metadataBase` in app/layout.tsx; JSON-LD needs absolute URLs,
 *     so it builds them from this constant.
 *   - breadcrumbJsonLd(): schema.org BreadcrumbList for nested pages
 *     (field note, bird, banding, project). Rendered by
 *     app/components/system/BreadcrumbJsonLd.tsx. The trail always starts at
 *     Home and ends at the current page, matching the visible "← back" link
 *     each of those pages already shows.
 * SRP/DRY check: Pass — searched lib/ and app/ first; the origin string was
 *   repeated in layout.tsx, sitemap.ts and llms.ts and there was no breadcrumb
 *   or canonical helper anywhere. sitemap.ts now imports SITE_URL from here.
 */

export const SITE_URL = "https://farm.markbarney.net";

export interface Crumb {
  name: string;
  // Site-relative path, e.g. "/flock" — "/" is Home.
  path: string;
}

export function breadcrumbJsonLd(trail: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: crumb.path === "/" ? SITE_URL : `${SITE_URL}${crumb.path}`,
    })),
  };
}
