"use client";
/**
 * Author: Claude Sonnet 5 (prev Claude Opus 4.8; prev Claude Fable 5)
 * Date: 22-Jul-2026
 * PURPOSE: Rotating portrait for one bird tile on /flock — cycles through a
 *   pool of frames (current portrait + dated throwbacks from the bird's
 *   hatch record) with a mono age-tag chip ("now · 3 months", "hatch day",
 *   "day 8"). This is the "rotating pictures + throwbacks" surface Boss
 *   asked for on 06-Jul-2026: the wall breathes instead of freezing on one
 *   frame, and every rotation walks the bird back to the day it hatched.
 *
 *   Hydration safety: SSR and first client render always show photos[0]
 *   (the current portrait); rotation starts after mount via a staggered
 *   setTimeout so neighboring tiles don't blink in sync (same pattern as
 *   the /markets FloorCams rotator). setState happens inside the interval
 *   callback, not the effect body. Pools of one photo render static — no
 *   timers, no chip animation.
 *
 *   Cross-cut: the previous frame stays mounted underneath while the new
 *   frame fades in via the `orn-fade` keyframe (globals.css), so a swap
 *   never flashes the dark container background. The flock page has no
 *   per-second re-render (unlike /markets), so a CSS animation is safe.
 *
 *   16-Jul-2026 (daylight retheme): converted to the light Field Guide
 *   palette — styling only; the age-tag chip stays dark-on-photo
 *   (bg-black/60) per the photo-overlay rule. No copy or logic changes.
 *
 *   22-Jul-2026 (visual QA remediation): default intervalMs raised 6500 →
 *   10000 and the orn-fade cross-fade (globals.css) lengthened 700ms → 900ms
 *   — the cycle read as flashing/too fast to comfortably view a frame before
 *   it changed again.
 *
 * SRP/DRY check: Pass — presentation-only client island; the pool (paths,
 *   tags, alts) is assembled server-side in app/flock/page.tsx from the
 *   hatch-record SSoT. No fetching, no date math here.
 */
import Image from "next/image";
import { useEffect, useState } from "react";

export interface RotatingPhoto {
  /** Web path, e.g. "/photos/birds/IMG_5849-birdadette-23jun2026.jpg". */
  src: string;
  /** Short age/era chip text, e.g. "now · 3 months", "hatch day", "day 8". */
  tag: string;
  alt: string;
}

interface Props {
  photos: RotatingPhoto[];
  /** Tile position on the wall — staggers rotation start. */
  stagger?: number;
  /** next/image `sizes` for the caller's layout. */
  sizes: string;
  /** Milliseconds per frame. */
  intervalMs?: number;
}

export default function OrnitharchPortrait({
  photos,
  stagger = 0,
  sizes,
  intervalMs = 10000,
}: Props) {
  // Current + previous index advance together so the outgoing frame can
  // stay mounted under the cross-fade (state, not a ref — reading a ref
  // during render trips react-hooks/refs and can tear under concurrency).
  const [frame, setFrame] = useState({ idx: 0, prev: 0 });

  useEffect(() => {
    if (photos.length < 2) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    // Stagger start so the wall reads as alive, not synchronized.
    const kickoff = setTimeout(() => {
      interval = setInterval(() => {
        setFrame((f) => ({ idx: (f.idx + 1) % photos.length, prev: f.idx }));
      }, intervalMs);
    }, (stagger % 5) * 1300);
    return () => {
      clearTimeout(kickoff);
      if (interval) clearInterval(interval);
    };
  }, [photos.length, intervalMs, stagger]);

  const current = photos[frame.idx];
  const prev = photos[frame.prev];
  if (!current) return null;

  return (
    <>
      {/* Previous frame stays underneath during the cross-cut. */}
      {prev && prev.src !== current.src && (
        <Image
          src={prev.src}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="object-cover"
        />
      )}
      <Image
        key={current.src}
        src={current.src}
        alt={current.alt}
        fill
        sizes={sizes}
        className="object-cover orn-fade"
      />
      <span className="absolute bottom-2 left-2 bg-black/60 border border-white/25 text-white font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-sm">
        {current.tag}
      </span>
    </>
  );
}
