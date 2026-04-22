/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 22-Apr-2026
 * PURPOSE: Farm-pulse stats band — thin mono-font strip under the hero
 *   that surfaces live numbers from Guardian's /api/v1/images/stats
 *   (default 7-day window). Makes the homepage feel alive by showing
 *   Birdadette sightings, top activity, busiest camera, total gems
 *   saved. Silently renders null on tunnel drop so the homepage never
 *   crashes on a Guardian outage — same failure mode as
 *   LatestFlockFrames.
 * SRP/DRY check: Pass — fetches via lib/gems.ts (shared I/O layer);
 *   no layout primitives duplicated. Top-activity / top-camera helpers
 *   inlined because they're used nowhere else yet (per architecture
 *   doc's "third duplicate" threshold). See
 *   docs/22-Apr-2026-living-homepage-hero-and-stats-plan.md.
 */
import { fetchImageStats } from "@/lib/gems";
import type { ImageStats, Activity } from "@/app/components/guardian/types";

// Activities that don't tell a story — skip them when picking the top bucket.
const BORING_ACTIVITIES: ReadonlySet<Activity> = new Set([
  "none-visible",
  "unknown",
  "other",
]);

function topActivity(by_activity: ImageStats["by_activity"]): { name: Activity; count: number } | null {
  const entries = (Object.entries(by_activity) as Array<[Activity, number]>)
    .filter(([name, count]) => count > 0 && !BORING_ACTIVITIES.has(name));
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { name: entries[0][0], count: entries[0][1] };
}

function topCamera(by_camera: ImageStats["by_camera"]): { name: string; count: number } | null {
  const entries = Object.entries(by_camera).filter(([, count]) => count > 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return { name: entries[0][0], count: entries[0][1] };
}

function windowLabel(range: ImageStats["range"]): string {
  const since = new Date(range.since);
  const until = new Date(range.until);
  const days = Math.round((until.getTime() - since.getTime()) / 86_400_000);
  if (!Number.isFinite(days) || days <= 0) return "PAST 7 DAYS";
  if (days === 1) return "PAST 24 HOURS";
  return `PAST ${days} DAYS`;
}

export default async function FarmPulse() {
  const result = await fetchImageStats();
  if (!result.ok) return null;

  const stats = result.data;
  const activity = topActivity(stats.by_activity);
  const camera = topCamera(stats.by_camera);
  const totalGems = stats.by_tier.strong + stats.by_tier.decent;

  const cells: string[] = [windowLabel(stats.range)];
  if (stats.birdadette_sightings > 0) {
    cells.push(`${stats.birdadette_sightings.toLocaleString()} Birdadette sightings`);
  }
  if (activity) {
    cells.push(`top activity: ${activity.name} (${activity.count.toLocaleString()})`);
  }
  if (camera) {
    cells.push(`busiest camera: ${camera.name} (${camera.count.toLocaleString()})`);
  }
  if (totalGems > 0) {
    cells.push(`${totalGems.toLocaleString()} gems saved`);
  }

  // Bail if there's literally nothing to say (new deployment, empty DB).
  if (cells.length < 2) return null;

  return (
    <section
      aria-label="Farm pulse — recent pipeline stats"
      className="bg-forest text-cream/80 border-y border-cream/10"
    >
      <div className="max-w-6xl mx-auto px-4 py-3 overflow-x-auto">
        <ul className="flex items-center gap-3 whitespace-nowrap font-mono text-[11px] md:text-xs tracking-wide">
          {cells.map((cell, i) => (
            <li key={i} className="flex items-center gap-3">
              {i === 0 ? (
                <span className="text-cream/60 uppercase">{cell}</span>
              ) : (
                <span>{cell}</span>
              )}
              {i < cells.length - 1 ? <span className="text-cream/30">·</span> : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
