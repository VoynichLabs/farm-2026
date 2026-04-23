/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 22-Apr-2026 (rotating-hero rewrite; originally 13-Apr-2026 by Opus 4.6)
 * PURPOSE: Homepage hero — dark forest canvas with a rotating background
 *   image pulled from Guardian's latest strong-tier gem. Falls back to the
 *   known-good Birdadette-fresh-hatch JPG on tunnel drop or empty result.
 *   Top-left title + tagline, bottom-left body, bottom-right location + nav
 *   links. Vignette gradients keep text legible over any frame (portrait
 *   from s7-cam letterboxes against the forest bg; landscape from the other
 *   cameras centers cleanly).
 * SRP/DRY check: Pass — single responsibility (render the hero). Image
 *   selection is the only new side effect, wrapped in fetchGems which
 *   already handles tunnel drops via its FetchResult type.
 *   See docs/22-Apr-2026-living-homepage-hero-and-stats-plan.md.
 */
import Link from "next/link";
import { fetchGems } from "@/lib/gems";

// Fallback — used when Guardian is unreachable or has no strong gems yet.
// Kept as an asset in this repo so the hero is always renderable.
const HERO_FALLBACK_IMAGE = "/photos/april-2026/birdadette-fresh-hatch.jpg";

export default async function Hero() {
  const result = await fetchGems({ limit: 1 });
  const heroImage =
    result.ok && result.data.rows.length > 0
      ? result.data.rows[0].full_url
      : HERO_FALLBACK_IMAGE;

  return (
    <section
      className="relative min-h-[80vh] bg-contain bg-center bg-no-repeat bg-forest"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      {/* Subtle vignette — heavier at edges, light in center so the bird shows through */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

      {/* Top-left: title + tagline */}
      <div className="absolute top-0 left-0 z-10 px-6 pt-16 md:px-16">
        <h1 className="text-5xl md:text-7xl text-white font-bold font-serif leading-tight">
          Farm 2026
        </h1>
        <p className="text-base md:text-lg text-white/50 italic max-w-sm leading-relaxed mt-2">
          They say I must be one of the wonders of Claude&apos;s own creation.
        </p>
      </div>

      {/* Bottom bar: body text left, location + links right */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-6 pb-6 md:px-16 md:pb-10 flex items-end justify-between gap-8">
        <p className="text-xs md:text-sm text-white/70 leading-relaxed max-w-xs">
          My chickens are pets, not livestock. I don&apos;t eat them, and
          I don&apos;t want anything else eating them either. This year I
          asked Claude to help &mdash; so we gave an AI eyes, ears, and
          real tools in the real world.
        </p>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-white/40 font-mono mb-3">
            Hampton, CT
          </p>
          <div className="flex flex-wrap justify-end gap-3 text-sm">
            <Link
              href="/projects/guardian"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
            >
              Farm Guardian
            </Link>
            <span className="text-white/30">|</span>
            <Link
              href="/field-notes"
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              Field Notes
            </Link>
            <span className="text-white/30">|</span>
            <Link
              href="/flock"
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              The Flock
            </Link>
            <span className="text-white/30">|</span>
            <Link
              href="/gallery/gems"
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              Gallery
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
