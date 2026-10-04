/**
 * Author: Claude Opus 5.5 (Bubba sub-agent)
 * Date: 03-Oct-2026
 * PURPOSE: Emits a schema.org BreadcrumbList as JSON-LD for a nested page, so
 *   search results can show "Mark's Farm › The Flock › Birddor" instead of a
 *   bare URL. Invisible — the visible breadcrumb on these pages is the existing
 *   "← the flock" / "← All Field Notes" link, which names the same parent.
 *   Same inline <script type="application/ld+json"> pattern as the Person +
 *   WebSite graph in app/layout.tsx. Server component, no client JS.
 * SRP/DRY check: Pass — data shape comes from breadcrumbJsonLd() in lib/seo.ts;
 *   this file only renders it.
 */
import { breadcrumbJsonLd, type Crumb } from "@/lib/seo";

export default function BreadcrumbJsonLd({ trail }: { trail: Crumb[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(trail)) }}
    />
  );
}
