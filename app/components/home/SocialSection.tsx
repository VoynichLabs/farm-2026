/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 23-Apr-2026
 * PURPOSE: Homepage social CTA — two side-by-side cards pointing out to
 *   the farm's actual broadcast surfaces: Instagram (@pawel_and_pawleen)
 *   and Facebook (Yorkies App page). This website is NOT a mirror of
 *   those surfaces; the pipeline auto-posts to both from the Mac Mini
 *   (see CLAUDE.md → "Instagram posting" + "Facebook cross-posting").
 *   This block's job is to send interested visitors to the feeds that
 *   actually update multiple times a day.
 *
 *   Replaces the older InstagramSection + InstagramFeed client component
 *   (retired 23-Apr-2026), which hardcoded a stale @markbarney121 handle
 *   and pulled in Instagram's embed.js for a curated-posts feature that
 *   was never populated.
 * SRP/DRY check: Pass — no I/O, no client code, just two external links
 *   inside a section. Pure server component.
 *   See docs/23-Apr-2026-web-presence-tightening-plan.md.
 */
import SectionHeader from "@/app/components/primitives/SectionHeader";

const IG_URL = "https://www.instagram.com/pawel_and_pawleen/";
const FB_URL = "https://www.facebook.com/614607655061302/";

export default function SocialSection() {
  return (
    <section className="bg-cream-dark">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <SectionHeader
          title="Follow the farm"
          subtitle="Daily photos and short video land on Instagram and Facebook — same posts, same captions, your pick of platform."
        />
        <div className="grid gap-5 md:grid-cols-2 mt-8">
          <a
            href={IG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 rounded-2xl border border-forest/15 bg-white hover:border-forest/40 hover:shadow-md transition-all px-6 py-5"
          >
            <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </span>
            <span className="flex-1">
              <p className="font-mono text-[10px] text-forest/50 uppercase tracking-widest">
                Instagram
              </p>
              <p className="font-serif text-xl text-forest group-hover:text-wood transition-colors">
                @pawel_and_pawleen ↗
              </p>
              <p className="text-sm text-forest/60 mt-0.5">
                Daily photos, stories, reels.
              </p>
            </span>
          </a>

          <a
            href={FB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-5 rounded-2xl border border-forest/15 bg-white hover:border-forest/40 hover:shadow-md transition-all px-6 py-5"
          >
            <span className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#1877F2] text-white">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </span>
            <span className="flex-1">
              <p className="font-mono text-[10px] text-forest/50 uppercase tracking-widest">
                Facebook
              </p>
              <p className="font-serif text-xl text-forest group-hover:text-wood transition-colors">
                Yorkies App ↗
              </p>
              <p className="text-sm text-forest/60 mt-0.5">
                Same posts, mirrored for the Facebook audience.
              </p>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
