/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Homepage rail — horizontal scroll strip of 6 recent
 *   pipeline-scored frames (strong + decent tier), with a "See all →"
 *   link to /gallery/gems. Reuses GemsGrid (rail variant) + GemCard
 *   (compact variant) so there's no visual drift between the rail and
 *   the gallery.
 * SRP/DRY check: Pass — fetching via lib/gems.ts; rendering via
 *   the shared gems components; no new primitives introduced here.
 */
import { fetchRecent } from "@/lib/gems";
import SectionHeader from "@/app/components/primitives/SectionHeader";
import GemCard from "@/app/components/gems/GemCard";
import GemsGrid from "@/app/components/gems/GemsGrid";

export default async function LatestFlockFrames() {
  const result = await fetchRecent({ limit: 6, tier: ["strong", "decent"] });

  // Silently skip the section on error — homepage should never crash
  // because of a tunnel drop; live feeds + other sections still work.
  if (!result.ok || result.data.rows.length === 0) {
    return null;
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <SectionHeader
        title="Latest from the Flock"
        subtitle="Auto-curated frames from the farm's cameras. Draft captions are machine-written."
        linkHref="/gallery/gems"
        linkLabel="See all gems →"
      />
      <GemsGrid
        rows={result.data.rows}
        variant="rail"
        renderItem={(row) => <GemCard row={row} variant="compact" />}
      />
    </section>
  );
}
