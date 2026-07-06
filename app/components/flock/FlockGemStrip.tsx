"use client";
/**
 * Author: Claude Fable 5 (orig Claude Opus 4.7)
 * Date: 06-Jul-2026 (orig 2026-05-11) — guardian palette (terminal glow-up)
 * PURPOSE: Per-cohort gem rail for /flock — fetches recent VLM-curated frames
 *   from guardian.markbarney.net filtered by scene(s), renders them as a
 *   12-tile grid, shows the total cohort gem count, and links to the full
 *   /gallery/gems with the same filter applied. Surfaces the ~4,600+ photos
 *   the VLM pipeline has been curating since early April so the breeding
 *   program is visibly backed by evidence — not just a roster card with one
 *   hand-curated photo per bird.
 *
 *   Client-side fetch (not SSR) for the same reason RecentGemsRail is —
 *   Guardian's /api/v1/images/gems endpoint can take several seconds for
 *   12-row pulls, which exceeds the 3s SSR AbortSignal cap in lib/gems.ts.
 *   Page renders instantly with skeletons; gems land when the request
 *   resolves. Graceful empty/error fallback so a tunnel hiccup doesn't break
 *   the page.
 *
 *   Triskaidekaphobia rule: total counts are rendered as-is from the API.
 *   Caller is responsible for choosing a scene set whose total cannot equal
 *   13. As of 2026-05-11 the live counts are 1819 / 2149 / 635 / 4624 — all
 *   safe — and the `coop yard combined` view is the closest miss at 648.
 *
 * SRP/DRY check: Pass — composes GemCard (compact variant) over a scene-
 *   filtered slice of the gem archive. No new types, no duplicate fetcher
 *   (uses the same Guardian endpoint as RecentGemsRail).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import GemCard from "@/app/components/gems/GemCard";
import type { GemRow } from "@/app/components/guardian/types";
import { GUARDIAN_API } from "@/app/components/guardian/types";

interface GemsResponse {
  rows?: GemRow[];
  total_estimate?: number;
}

interface Props {
  /** Scene(s) to filter by. Multiple scenes produce an OR filter on the API side. */
  scenes: string[];
  /** Label rendered at the top-left of the strip, terminal-style. */
  label: string;
  /** How many tiles to show. Default 12. */
  limit?: number;
  /** Optional camera filter (e.g. "s7-cam" for nestbox only). */
  cameras?: string[];
  /** Extra label suffix when the strip is empty (helps clarify why). */
  emptyHint?: string;
}

export default function FlockGemStrip({
  scenes,
  label,
  limit = 12,
  cameras,
  emptyHint,
}: Props) {
  const [rows, setRows] = useState<GemRow[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [error, setError] = useState(false);

  // Build the query once per param set.
  const queryString = (() => {
    const params = new URLSearchParams();
    scenes.forEach((s) => params.append("scene", s));
    cameras?.forEach((c) => params.append("camera", c));
    params.set("limit", String(limit));
    return params.toString();
  })();

  // Same query without limit, for the "view all" deep-link into /gallery/gems.
  const galleryLinkQs = (() => {
    const params = new URLSearchParams();
    scenes.forEach((s) => params.append("scene", s));
    cameras?.forEach((c) => params.append("camera", c));
    return params.toString();
  })();

  useEffect(() => {
    let cancelled = false;
    fetch(`${GUARDIAN_API}/api/v1/images/gems?${queryString}`, {
      headers: { accept: "application/json" },
    })
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))
      )
      .then((data: GemsResponse) => {
        if (cancelled) return;
        setRows(Array.isArray(data.rows) ? data.rows : []);
        if (typeof data.total_estimate === "number") setTotal(data.total_estimate);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  const showSkeleton = rows === null && !error;
  const showGrid = rows !== null && rows.length > 0;
  const showFallback = error || (rows !== null && rows.length === 0);

  return (
    <div className="mb-8">
      <div className="flex items-baseline justify-between mb-3 font-mono text-[0.7rem] uppercase tracking-widest">
        <span className="text-guardian-text/70">
          <span className="text-guardian-accent">▸</span> {label}
          {/* Suppress count display when total === 13 — triskaidekaphobia
              rule, per memory/feedback_no_thirteen.md. Strip still renders;
              just no "13 frames archived" string in the DOM. */}
          {total !== null && total > 0 && total !== 13 && (
            <span className="text-guardian-muted normal-case ml-2">
              {total.toLocaleString()} frame{total === 1 ? "" : "s"} archived
            </span>
          )}
        </span>
        <Link
          href={`/gallery/gems${galleryLinkQs ? `?${galleryLinkQs}` : ""}`}
          className="text-guardian-accent hover:text-emerald-300"
        >
          browse all ↗
        </Link>
      </div>

      {showSkeleton && (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3"
          aria-label="Loading recent gems"
        >
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg bg-guardian-card animate-pulse"
            />
          ))}
        </div>
      )}

      {showGrid && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
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
        <p className="text-guardian-muted text-xs font-mono">
          Gem archive is unreachable right now.
          {emptyHint ? ` ${emptyHint}` : ""}
        </p>
      )}
    </div>
  );
}
