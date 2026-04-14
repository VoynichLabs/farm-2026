/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Pure layout component — takes a list of gem rows and a render
 *   callback and arranges the tiles. Two variants: "gallery" (responsive
 *   CSS grid) and "rail" (horizontal scroll strip for the homepage).
 *   Does NOT know how to fetch, filter, or style a tile. Callers pass in
 *   whichever GemCard variant they want.
 * SRP/DRY check: Pass — one responsibility (layout). Reused by
 *   GemsGallery, GemsGalleryClient, and LatestFlockFrames.
 */
import type { ReactNode } from "react";
import type { GemRow } from "@/app/components/guardian/types";

export type GemsGridVariant = "gallery" | "rail";

interface Props {
  rows: GemRow[];
  variant?: GemsGridVariant;
  renderItem: (row: GemRow, index: number) => ReactNode;
}

export default function GemsGrid({ rows, variant = "gallery", renderItem }: Props) {
  if (variant === "rail") {
    return (
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex gap-3 snap-x snap-mandatory">
          {rows.map((row, i) => (
            <div
              key={row.id}
              className="w-[70vw] max-w-[280px] flex-shrink-0 snap-start"
            >
              {renderItem(row, i)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((row, i) => renderItem(row, i))}
    </div>
  );
}
