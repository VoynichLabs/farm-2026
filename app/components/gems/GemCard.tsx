/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Single gem tile — responsive thumbnail with overlay badges in
 *   compact mode, or a stacked card with caption in default mode. Accepts
 *   an onOpen callback so the lightbox owner (GemsGalleryClient) controls
 *   modal state. No fetching, no state.
 * SRP/DRY check: Pass — GemCardBadges handles pills; GemCaption handles
 *   caption; lib/gems-format.ts handles label strings.
 */
import Link from "next/link";
import type { GemRow } from "@/app/components/guardian/types";
import GemCardBadges from "./GemCardBadges";
import GemCaption from "./GemCaption";

export type GemCardVariant = "default" | "compact";

interface Props {
  row: GemRow;
  variant?: GemCardVariant;
  onOpen?: (id: number) => void;
  priority?: boolean;
}

export default function GemCard({ row, variant = "default", onOpen, priority = false }: Props) {
  const compact = variant === "compact";
  const thumbAlt = row.caption_draft;

  if (compact) {
    // When onOpen is provided (in the gallery) the tile opens a lightbox;
    // otherwise (homepage rail) it deep-links to the gallery.
    const inner = (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={row.thumb_url}
          alt={thumbAlt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <GemCardBadges row={row} compact />
        </div>
      </>
    );
    const shared =
      "group relative block aspect-[4/3] w-full overflow-hidden rounded-lg bg-cream-dark shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-wood";
    if (onOpen) {
      return (
        <button
          type="button"
          onClick={() => onOpen(row.id)}
          className={shared}
          aria-label={`Open gem: ${thumbAlt}`}
        >
          {inner}
        </button>
      );
    }
    return (
      <Link href="/gallery/gems" className={shared} aria-label={`See gems — ${thumbAlt}`}>
        {inner}
      </Link>
    );
  }

  return (
    <article className="group overflow-hidden rounded-xl bg-cream shadow-sm hover:shadow-md transition-shadow">
      <button
        type="button"
        onClick={() => onOpen?.(row.id)}
        className="block w-full focus:outline-none focus:ring-2 focus:ring-wood"
        aria-label={`Open gem: ${thumbAlt}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.thumb_url}
            alt={thumbAlt}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      </button>
      <div className="space-y-2 p-3">
        <GemCardBadges row={row} />
        <GemCaption caption={row.caption_draft} clipLines={2} />
      </div>
    </article>
  );
}
