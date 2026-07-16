/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5)
 * Date: 16-Jul-2026
 * PURPOSE: GrowthStrip — a horizontally-scrollable N-photo growth timeline
 *   for one bird, generalizing ThenAndNow.tsx's fixed two-photo (hatch-day
 *   vs latest) comparison into every dated, showcase-worthy photo a hatch
 *   record has. Rendered inside each ornitharch's profile tile on /flock
 *   (app/flock/page.tsx: OrnitharchTile), which resolves the bird's hatch
 *   record, filters/sorts its photos, and builds the date/age labels via
 *   its existing fmtDate/throwbackTag helpers before passing plain props
 *   in — this component stays presentation-only, same division of labor
 *   ThenAndNow already established.
 *
 *   Visual language is deliberately borrowed from ThenAndNow's inner Frame
 *   sub-component (shared card/border/accent tokens,
 *   rounded-xl corners, object-cover images, a DATE/AGE instrument-strip
 *   footer) so a bird with 3+ dated photos reads as the same design system
 *   as the Birdimir then/now feature, not a new one. The scroll-rail CSS
 *   idiom (overflow-x-auto + snap-x snap-mandatory + snap-start items) is
 *   likewise reused from the established rail pattern in
 *   app/components/gems/GemsGrid.tsx rather than invented fresh — that
 *   component isn't reused directly because it's typed to GemRow[], not
 *   the ThenNowPhoto[] shape this strip needs.
 *
 *   Self-suppresses (renders null) below two photos, mirroring ThenAndNow's
 *   philosophy exactly: most June/July hatches only have one committed
 *   photo so far, and an empty render here is correct, not a bug.
 *
 *   16-Jul-2026 (daylight retheme): converted to the light Field Guide
 *   palette (field-* tokens); the [GROWTH] kicker became a specimen tag
 *   with the STATUS.growing mark from lib/emoji.ts. Styling only.
 *
 * SRP/DRY check: Pass — reuses ThenNowPhoto from ThenAndNow.tsx (no
 *   redefined photo-prop shape) and lays out only what it's given; no data
 *   fetching, no date math, no record lookup, no filesystem access here.
 *   app/flock/page.tsx already loads every hatch record and resolves the
 *   per-bird record for the OrnitharchTile portrait pool (getHatchRecords
 *   + recordFor) — this component builds on that existing pipeline via a
 *   page-local transform (buildGrowthPhotos, mirroring hatches/page.tsx's
 *   buildThenNow) instead of adding a second lib/content.ts loader that
 *   would re-read and re-match the same files by a different key.
 */
import Image from "next/image";
import type { ThenNowPhoto } from "@/app/components/hatches/ThenAndNow";
import { STATUS } from "@/lib/emoji";

interface GrowthStripProps {
  /** Subject name, e.g. "Birdimir". Used only as an alt-text fallback. */
  name: string;
  photos: ThenNowPhoto[];
}

export default function GrowthStrip({ name, photos }: GrowthStripProps) {
  // Mirrors ThenAndNow: fewer than two frames means there's no arc to show
  // yet, so render nothing rather than a single lonely tile.
  if (photos.length < 2) return null;

  return (
    <div className="pt-3">
      <p className="mb-2">
        <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted">
          <span aria-hidden="true" className="mr-1.5">{STATUS.growing}</span>Growth
        </span>
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2.5 snap-x snap-mandatory">
          {photos.map((photo) => (
            <figure
              key={photo.src}
              className="snap-start flex-shrink-0 w-28 bg-field-card rounded-xl overflow-hidden border border-field-border flex flex-col"
            >
              <div className="relative w-full aspect-[4/5] bg-field-wash">
                <Image
                  src={photo.src}
                  alt={photo.alt || `${name}, dated photo`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </div>
              {/* Instrument strip — same DATE/AGE footer language as
                  ThenAndNow's Frame, condensed for a compact tile. */}
              <figcaption className="bg-field-bg text-field-ink font-mono text-[0.55rem] uppercase tracking-widest px-1.5 py-1 border-t border-field-border flex flex-col gap-0.5">
                <span className="text-field-ink truncate">{photo.dateLabel}</span>
                <span className="text-field-muted truncate">{photo.ageLabel}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
