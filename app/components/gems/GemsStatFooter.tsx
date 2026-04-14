/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Tiny "N gems this week" widget for the site footer. Server
 *   component that calls fetchImageStats(); renders nothing on error,
 *   nothing on zero — never forces the footer into a broken state.
 * SRP/DRY check: Pass — fetching via lib/gems.ts.
 */
import Link from "next/link";
import { fetchImageStats } from "@/lib/gems";

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

export default async function GemsStatFooter() {
  const result = await fetchImageStats({ since: daysAgoIso(7) });
  if (!result.ok) return null;
  const strong = result.data.by_tier.strong;
  if (!strong) return null;

  return (
    <p className="text-cream/60 text-xs">
      <Link href="/gallery/gems" className="hover:underline">
        {strong} gem{strong === 1 ? "" : "s"} in the last 7 days →
      </Link>
    </p>
  );
}
