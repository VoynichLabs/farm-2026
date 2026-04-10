/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Dynamic sitemap for search engine discovery. Includes all static
 *   pages plus dynamic field notes and project pages from content directory.
 * SRP/DRY check: Pass — reuses content loaders from lib/content.ts
 */
import type { MetadataRoute } from "next";
import { getAllFieldNotes, getProjects } from "@/lib/content";

const BASE = "https://farm.markbarney.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const fieldNotes = getAllFieldNotes();
  const projects = getProjects();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/flock`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/projects`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/field-notes`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/gallery`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.6 },
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

  return [...staticPages, ...notePages, ...projectPages];
}
