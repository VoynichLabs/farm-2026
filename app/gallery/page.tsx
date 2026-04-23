/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 23-Apr-2026
 * PURPOSE: /gallery is retired as a standalone surface. It used to render the
 *   hand-curated content/gallery.json archive, but that archive is redundant
 *   next to the live VLM-curated /gallery/gems and the /yard timelapse
 *   stockpile. This file issues a permanent redirect to /gallery/gems so
 *   old bookmarks, IG bio links, and cross-references from field notes
 *   continue to work.
 *
 *   Every href="/gallery" in the codebase has been repointed directly to
 *   /gallery/gems during this retirement; this redirect is the safety net
 *   for external links.
 * SRP/DRY check: Pass — one responsibility (redirect). See
 *   docs/23-Apr-2026-web-presence-tightening-plan.md.
 */
import { redirect } from "next/navigation";

export default function GalleryRedirect(): never {
  redirect("/gallery/gems");
}
