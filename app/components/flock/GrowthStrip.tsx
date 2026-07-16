/**
 * Author: Claude Fable 5
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
 *   sub-component (guardian-card/guardian-border/guardian-accent tokens,
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
      <p className="font-mono text-[0.6rem] uppercase tracking-widest text-guardian-accent mb-2">
        [GROWTH]
      </p>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-2.5 snap-x snap-mandatory">
          {photos.map((photo) => (
            <figure
              key={photo.src}
              className="snap-start flex-shrink-0 w-28 bg-guardian-card rounded-xl overflow-hidden border border-guardian-border flex flex-col"
            >
              <div className="relative w-full aspect-[4/5] bg-guardian-hover/30">
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
              <figcaption className="bg-guardian-bg text-guardian-text font-mono text-[0.55rem] uppercase tracking-widest px-1.5 py-1 border-t border-guardian-border flex flex-col gap-0.5">
                <span className="text-guardian-text truncate">{photo.dateLabel}</span>
                <span className="text-guardian-muted truncate">{photo.ageLabel}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
