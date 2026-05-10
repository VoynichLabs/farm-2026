"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 10-May-2026
 * PURPOSE: Homepage gem rail — fetches the 12 most recent gems on mount and
 *   renders them as compact tiles. Client-side instead of SSR because the
 *   Guardian /api/v1/images/gems endpoint takes ~7s for limit=12 (measured
 *   2026-05-09), which blows the 3s SSR AbortSignal cap in lib/gems.ts. SSR
 *   would always render empty; doing the fetch in the browser lets the page
 *   render instantly with a skeleton, then the gems land when the request
 *   resolves. Same approach the camera tiles already use.
 *
 *   Empty + error states render the same fallback copy — from a visitor's
 *   point of view the rail is empty for the same reason. The cameras above
 *   poll independently and stay live regardless.
 *
 *   Caches via the browser's HTTP cache (Guardian's response carries a
 *   Cache-Control header); we don't add Next ISR here because this is a
 *   client component.
 *
 * SRP/DRY check: Pass — composes GemCard (compact variant) over rows from
 *   /api/v1/images/gems. No filtering, no formatting beyond what GemCard
 *   already does. apparent_age_days normalisation is irrelevant here
 *   because GemCardBadges doesn't render that field.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import GemCard from "@/app/components/gems/GemCard";
import type { GemRow } from "@/app/components/guardian/types";
import { GUARDIAN_API } from "@/app/components/guardian/types";

const LIMIT = 12;

interface GemsResponse {
  rows?: GemRow[];
}

export default function RecentGemsRail() {
  const [rows, setRows] = useState<GemRow[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${GUARDIAN_API}/api/v1/images/gems?limit=${LIMIT}`, {
      headers: { accept: "application/json" },
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: GemsResponse) => {
        if (cancelled) return;
        setRows(Array.isArray(data.rows) ? data.rows : []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const showSkeleton = rows === null && !error;
  const showRail = rows !== null && rows.length > 0;
  const showFallback = error || (rows !== null && rows.length === 0);

  return (
    <section className="max-w-7xl mx-auto px-3 py-3 font-mono text-[0.78rem]">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-emerald-400 tracking-wider">
          ▸ RECENT GEMS
        </span>
        <Link
          href="/gallery/gems"
          className="text-emerald-300 hover:text-emerald-200"
        >
          all gems ↗
        </Link>
      </div>
      {showSkeleton && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3"
          aria-label="Loading recent gems"
        >
          {Array.from({ length: LIMIT }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg bg-guardian-card animate-pulse"
            />
          ))}
        </div>
      )}
      {showRail && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          {rows!.map((row, idx) => (
            <GemCard
              key={row.id}
              row={row}
              variant="compact"
              priority={idx < 4}
            />
          ))}
        </div>
      )}
      {showFallback && (
        <p className="text-guardian-muted text-sm font-mono">
          Gem archive is unreachable right now — the cameras above are
          polling independently.
        </p>
      )}
    </section>
  );
}
