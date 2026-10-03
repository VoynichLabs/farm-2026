/**
 * Author: Claude Opus 5.5 (prev Claude Opus 4.6)
 * Date: 03-Oct-2026 (orig 09-Apr-2026)
 * PURPOSE: Dynamic sitemap for search engine discovery. Includes all static
 *   pages plus dynamic field notes, project pages, and per-bird pages from
 *   the content directory.
 *   03-Oct-2026 (SEO checklist pass): added /ornitharch and every active
 *   bird's /flock/[slug] page — both were live routes the sitemap never
 *   listed. Birds whose status is not "active" are left out on purpose: per
 *   Boss (v1.31.1, 16-Jul-2026) deceased birds don't surface on the site, so
 *   their pages are not advertised to search engines either. Origin comes
 *   from SITE_URL in lib/seo.ts.
 * SRP/DRY check: Pass — reuses content loaders and birdSlug from
 *   lib/content.ts (the same slug function /flock/[slug] generates from).
 */
import type { MetadataRoute } from "next";
import { getAllFieldNotes, getProjects, getFlockProfiles, birdSlug } from "@/lib/content";
import { SITE_URL as BASE } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const fieldNotes = getAllFieldNotes();
  const projects = getProjects();
  const activeBirds = (getFlockProfiles()?.flock_birds ?? []).filter((b) => b.status === "active");

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/flock`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/flock/banding`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/hatches`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/field-notes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    // /gallery 308-redirects to /gallery/gems — list the live target, not the redirect.
    { url: `${BASE}/gallery/gems`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE}/yard`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.5 },
    { url: `${BASE}/markets`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.4 },
    { url: `${BASE}/ornitharch`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  const notePages: MetadataRoute.Sitemap = fieldNotes.map((note) => ({
    url: `${BASE}/field-notes/${note.slug}`,
    lastModified: new Date(note.date),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const projectPages: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${BASE}/projects/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: p.slug === "guardian" ? 0.9 : 0.6,
  }));

  const birdPages: MetadataRoute.Sitemap = activeBirds.map((b) => ({
    url: `${BASE}/flock/${birdSlug(b.name)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...notePages, ...projectPages, ...birdPages];
}
