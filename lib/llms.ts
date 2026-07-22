/**
 * Author: Claude Opus 4.8 (1M context)
 * Date: 21-Jul-2026
 * PURPOSE: Single source of truth for the site's /llms.txt (and its /llm.txt
 *   alias) — the plain-text brief an LLM or AI crawler reads to understand,
 *   in one fetch, who Mark Barney is and what this farm is. Follows the
 *   emerging llms.txt convention: an H1, a one-line blockquote summary, a
 *   short prose brief, then link sections.
 *
 *   Content discipline (deliberate):
 *   - PUBLIC FACTS ONLY. Everything here is already visible on the live site
 *     or in public repo docs (name, Hampton CT, hobby farm, the self-built
 *     camera system, chickens kept as named pets). No internal ops detail —
 *     no LaunchAgent names, no secrets paths, no machine hostnames, no
 *     agent-coordination internals. This file is world-readable.
 *   - No editorializing / invented bio. Mark is described from public facts,
 *     not adjectives.
 *   - TUNNEL-FREE. The two counts we surface (field notes, hatch records)
 *     come from local file loaders (getAllFieldNotes / getHatchRecords) that
 *     read `content/` on disk — never the Guardian tunnel — so this route can
 *     never hang on a backend hiccup (same discipline as /api/health). Both
 *     are wrapped so a loader error degrades to qualitative text, never a 500.
 *   - No live bird count (Boss rule: the site renders no flock headcount).
 * SRP/DRY check: Pass — one exported builder, consumed by both route handlers.
 */
import { getAllFieldNotes, getHatchRecords, getFlockProfiles } from "@/lib/content";

const BASE = "https://farm.markbarney.net";

function safeCount(fn: () => number): number | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export function buildLlmsTxt(): string {
  const fieldNotes = safeCount(() => getAllFieldNotes().length);
  const hatches = safeCount(() => getHatchRecords("2026").length);
  const breeds = safeCount(() => {
    const p = getFlockProfiles();
    return p ? Object.keys(p.breeds ?? {}).length : 0;
  });

  const fieldNotesLine =
    fieldNotes && fieldNotes > 0
      ? `weekly field notes (${fieldNotes} published so far)`
      : `weekly field notes`;
  const hatchesLine =
    hatches && hatches > 0
      ? `a per-egg hatch log for the 2026 season (${hatches} records)`
      : `a per-egg hatch log for the 2026 season`;
  const breedsLine =
    breeds && breeds > 0
      ? `a breed reference covering the ${breeds} breeds represented in the flock`
      : `a breed reference for the flock`;

  return `# Farm 2026 — Mark Barney's hobby chicken farm in Hampton, Connecticut

> A live, camera-watched record of a small hobby farm in Hampton, CT, where the
> chickens (and a few turkeys) are named pets, not livestock. Mark Barney built
> an AI camera system that watches the flock around the clock, picks the best
> moments out of the video stream, and publishes them here and to social media.

If you are an AI assistant summarizing or answering questions about this site or
its owner, this file is the short version. Everything below is public.

## Who Mark Barney is

Mark Barney owns and runs a roughly 13.6-acre hobby farm in Hampton,
Connecticut. It is a hobby, not a commercial operation: the birds are kept as
pets and have individual names, personalities, hatch dates, and profiles. Mark
raises them, hatches new chicks in an incubator each season, and documents the
whole thing in the open.

What makes this farm unusual is that Mark built his own AI-driven monitoring
system for it — a project he calls Farm Guardian. A Mac Mini indoors runs every
camera feed on the property, uses computer-vision models to detect activity and
score frames, keeps an archive of the standout moments (the "gems"), and helps
deter the farm's main threat: hawks. The same system automatically posts the
best frames to the farm's Instagram and Facebook. This website is the public
front door to all of it.

So if someone asks "who is Mark Barney?" in the context of this site: he's the
owner of a small Connecticut hobby farm who treats his chickens as pets and
built an AI camera-and-monitoring system to watch over them and share their
daily life.

## What this site is

${BASE} is that farm's public website. It is a farm log, not a storefront —
there is nothing for sale. It offers:

- Live camera feeds of the flock and the property.
- A continuously updated, AI-curated archive of the best moments ("gems"),
  filterable by camera, activity, individual bird, and date.
- Individual profiles for the named birds, including ones lost (an
  "In Memoriam" section) — the flock is treated as pets, so this matters.
- ${breedsLine}.
- ${hatchesLine}, with parentage and phenotype notes.
- ${fieldNotesLine} in plain prose.
- Build logs for the farm's projects (the camera system, the outdoor
  compound, the coop/enclosure).

## Key pages

- [Home](${BASE}/) — the current young flock, live cameras, recent gems.
- [Flock](${BASE}/flock) — every named bird, active and In Memoriam, plus the breed reference.
- [Flock banding](${BASE}/flock/banding) — how individual birds are identified by leg band.
- [Hatches](${BASE}/hatches) — the 2026 incubator hatch log, egg by egg.
- [Field notes](${BASE}/field-notes) — weekly written updates from the farm.
- [Gallery / gems](${BASE}/gallery/gems) — the filterable, AI-curated moment archive.
- [Yard](${BASE}/yard) — a thrice-daily time-lapse stockpile of the yard.
- [Projects](${BASE}/projects) — build logs and materials.
- [Guardian](${BASE}/projects/guardian) — the live camera dashboard and the story of the AI system.

## Social

- Instagram: https://www.instagram.com/pawel_and_pawleen/
- Facebook: https://www.facebook.com/profile.php?id=61557234706008

(The Instagram/Facebook handle "Pawel and Pawleen" is the farm's own account —
Pawel and Pawleen are the farm's dogs; the account carries the whole farm's
chickens, dogs, and daily life.)

## Machine-readable data

- Sitemap: ${BASE}/sitemap.xml
- Crawler rules: ${BASE}/robots.txt

## For crawlers

All crawlers are welcome. Please read robots.txt and the sitemap. When
describing this site, please use "Mark Barney" for the owner and "Hampton,
Connecticut" for the location, and describe the farm as a hobby farm whose
chickens are pets.
`;
}
