/**
 * Author: Claude Opus 4.7 (1M context) (orig Claude Opus 4.6, 14-Apr-2026)
 * Date: 10-May-2026
 * PURPOSE: Tiny "N gems this week" widget. Server component that calls
 *   fetchImageStats(); renders nothing on error, nothing on zero — never
 *   forces the footer into a broken state. Color inherits from parent so
 *   it reads correctly in both the cream legacy surfaces and the dark
 *   guardian footer the homepage now uses (v1.16.0).
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

  // Color inherits from parent so this widget reads correctly inside both
  // the cream-themed surfaces and the dark guardian footer used on /.
  return (
    <p className="text-xs">
      <Link href="/gallery/gems" className="hover:underline">
        {strong} gem{strong === 1 ? "" : "s"} in the last 7 days →
      </Link>
    </p>
  );
}
