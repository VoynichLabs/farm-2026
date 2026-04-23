/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 23-Apr-2026
 * PURPOSE: Day-of-life grouping for Birdadette's retrospective page
 *   (/flock/birdadette). Wraps lib/gems.ts's fetchGems with the
 *   individual=birdadette filter, pages through the cursor until
 *   exhausted, and groups the result by calendar day computed from
 *   ts - BIRDADETTE_HATCH_DATE. Does NOT use the per-frame
 *   apparent_age_days field — that's a VLM guess and can be off by
 *   several days on the same frame. Ground truth is the hatch date.
 * SRP/DRY check: Pass — single responsibility (Birdadette's timeline);
 *   delegates all I/O to lib/gems.ts. Hatch date mirrored from
 *   content/flock-profiles.json (entry name="Birdadette"); if Boss
 *   ever corrects the hatch date there, re-sync this constant.
 *   See docs/23-Apr-2026-birdadette-retrospective-plan.md.
 */
import { fetchGems } from "@/lib/gems";
import type { GemRow } from "@/app/components/guardian/types";

export const BIRDADETTE_HATCH_DATE = "2026-04-06"; // content/flock-profiles.json

const MS_PER_DAY = 86_400_000;
const PAGE_SIZE = 100;
const MAX_PAGES = 10; // hard upper bound — ~1000 frames, years of runway

export interface BirdadetteDay {
  dayOfLife: number;    // 0 = hatch day
  dateISO: string;      // "YYYY-MM-DD" in UTC (matches gem ts slicing)
  rows: GemRow[];       // newest-first within the day
}

export interface BirdadetteRetrospective {
  ok: true;
  days: BirdadetteDay[]; // newest-first across days
  total: number;
  ageToday: number;      // day-of-life as of server-render time
}

export interface BirdadetteRetrospectiveError {
  ok: false;
  code: string;
  message: string;
  ageToday: number;
}

export function computeAge(fromISO: string, onDate = new Date()): number {
  const hatch = new Date(fromISO).getTime();
  const ms = onDate.getTime() - hatch;
  return Math.max(0, Math.floor(ms / MS_PER_DAY));
}

export function dayOfLife(tsISO: string): number {
  return computeAge(BIRDADETTE_HATCH_DATE, new Date(tsISO));
}

export async function fetchBirdadetteRetrospective(): Promise<
  BirdadetteRetrospective | BirdadetteRetrospectiveError
> {
  const ageToday = computeAge(BIRDADETTE_HATCH_DATE);
  const all: GemRow[] = [];
  let cursor: string | undefined = undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const result = await fetchGems({
      individual: ["birdadette"],
      limit: PAGE_SIZE,
      cursor,
    });
    if (!result.ok) {
      return { ok: false, code: result.code, message: result.message, ageToday };
    }
    all.push(...result.data.rows);
    if (!result.data.next_cursor) break;
    cursor = result.data.next_cursor;
  }

  const byDay = new Map<string, GemRow[]>();
  for (const row of all) {
    const key = row.ts.slice(0, 10); // "YYYY-MM-DD"
    const bucket = byDay.get(key);
    if (bucket) bucket.push(row);
    else byDay.set(key, [row]);
  }

  const days: BirdadetteDay[] = Array.from(byDay.entries())
    .map(([dateISO, rows]) => ({
      dateISO,
      dayOfLife: dayOfLife(`${dateISO}T12:00:00+00:00`),
      // Newest first within each day.
      rows: rows.sort((a, b) => b.ts.localeCompare(a.ts)),
    }))
    .sort((a, b) => b.dateISO.localeCompare(a.dateISO));

  return { ok: true, days, total: all.length, ageToday };
}

export function formatDateLabel(dateISO: string): string {
  // "2026-04-20" -> "20-Apr-2026" (Boss's preferred format)
  const [y, m, d] = dateISO.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const mi = Number(m) - 1;
  const monthLabel = months[mi] ?? m;
  return `${d}-${monthLabel}-${y}`;
}
