/**
 * Author: Claude Opus 5
 * Date: 07-Aug-2026
 * PURPOSE: Homepage "From the Garden" strip. Surfaces the most recent
 *   field note tagged `garden` — its cover as a wide hero plus a row of
 *   tiles drawn from that note's `photos[]` frontmatter — and links
 *   through to the full note.
 *
 *   Everything here DERIVES from the note's frontmatter via
 *   getAllFieldNotes(): the title, the hero, the tiles, and their
 *   captions. There is no hardcoded photo path and no count in the copy,
 *   so publishing a newer garden-tagged note re-points this section with
 *   no code change (FRONTEND-ARCHITECTURE rules 1 and 2).
 *
 *   Renders nothing at all when no garden-tagged note exists, so the
 *   homepage degrades cleanly rather than showing an empty frame.
 *
 *   Emoji mark comes from lib/emoji.ts (GARDEN.pumpkins) — the SSoT
 *   vocabulary, leading a text label and aria-hidden, per the theme rules.
 *
 * SRP/DRY check: Pass — one responsibility (render the latest garden note
 *   as a homepage section). Reuses getAllFieldNotes() rather than reading
 *   the filesystem again, and the existing field-card/kicker markup from
 *   app/page.tsx rather than inventing a new section chrome.
 */
import Image from "next/image";
import Link from "next/link";
import { getAllFieldNotes } from "@/lib/content";
import { GARDEN } from "@/lib/emoji";

// How many tiles sit beside the hero. Purely a layout ceiling — the note
// decides what exists; this only decides how many of them fit on one row.
const TILE_LIMIT = 6;

export default function GardenStrip() {
  const note = getAllFieldNotes()
    .filter((n) => n.tags?.includes("garden"))
    .sort((a, z) => z.date.localeCompare(a.date))[0];

  if (!note) return null;

  // The cover is already the hero, so don't repeat it in the tile row.
  const tiles = note.photos
    .filter((photo) => photo.src !== note.cover)
    .slice(0, TILE_LIMIT);

  return (
    <section className="border-b border-field-border">
      <div className="max-w-7xl mx-auto px-3 py-4">
        <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-3">
          <span aria-hidden="true" className="mr-1.5">
            {GARDEN.pumpkins}
          </span>
          From the Garden
        </span>

        {/* Hero band on top, tile row beneath. Deliberately NOT a two-column
            hero-beside-tiles layout: the two columns can't agree on a height
            (fixed hero leaves dead space under it; a stretching hero blows the
            section up past 1700px), and stacking sidesteps that entirely. */}
        <Link
          href={`/field-notes/${note.slug}`}
          className="group block mb-4"
        >
          <div className="w-full h-64 sm:h-80 lg:h-[26rem] border border-field-border bg-field-wash overflow-hidden">
            <Image
              src={note.cover}
              alt={note.title}
              width={1500}
              height={2000}
              className="w-full h-full object-cover transition-opacity group-hover:opacity-90"
              sizes="100vw"
              priority={false}
            />
          </div>
          <div className="font-mono text-[0.72rem] leading-tight mt-1.5">
            <div className="text-field-accent group-hover:text-field-accent-deep">
              {note.title}
            </div>
            <div className="text-field-muted">
              {note.date} · read the field note →
            </div>
          </div>
        </Link>

        {/* Tiles — the rest of the note's photos, one row on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tiles.map((photo) => (
            <figure key={photo.src} className="flex flex-col gap-1">
              <div className="w-full h-32 sm:h-36 border border-field-border bg-field-wash overflow-hidden">
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  width={750}
                  height={1000}
                  className="w-full h-full object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                />
              </div>
              <figcaption className="font-mono text-[0.66rem] leading-tight text-field-muted">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
