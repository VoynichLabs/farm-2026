/**
 * Author: Claude Haiku 5.5 Medium
 * Date: 18-Nov-2026
 * PURPOSE: Homepage composition, rebuilt around the Ornitharch film strip
 *   (CHANGELOG 1.46.0). From top to bottom: a screen-reader H1 (the site-wide
 *   SiteNav in layout.tsx carries the navigation, so this page adds none); the
 *   film strip (OrnitharchStrip, one row per bird, hatch to newest picture); the live
 *   camera section (GuardianHomeBadge + HomeCameraStage, kept as the dark
 *   island that polls the Guardian tunnel); and the status footer.
 *   Removed from the homepage: the Class of 2026 portrait grid (replaced by
 *   the strip), SystemBanner, RecentGemsRail and GardenStrip (still in the
 *   repo for other pages). The page carries no typed date: every date and
 *   count is derived from the roster when the page is built.
 *   SEO: canonical "/"; the H1 is screen-reader only; the Guardian origin is
 *   preconnected because the camera section loads from the tunnel.
 *
 * SRP/DRY check: Pass. Composition only. The strip's data comes from
 *   buildStrips() in lib/ornitharch-strip.ts; the camera components own their
 *   own data.
 */
import type { Metadata } from "next";
import { preconnect } from "react-dom";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import HomeCameraStage from "@/app/components/home/HomeCameraStage";
import OrnitharchStrip from "@/app/components/home/OrnitharchStrip";
import GemsStatFooter from "@/app/components/gems/GemsStatFooter";
import { buildStrips } from "@/lib/ornitharch-strip";

// Title and description come from the root layout; this only pins the
// canonical address (set here, not in layout.tsx, so it is not inherited).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// The camera stage and the status badge load from the Guardian tunnel; open
// that connection while the HTML is still arriving.
const GUARDIAN_ORIGIN = "https://guardian.markbarney.net";


export default function Home() {
  preconnect(GUARDIAN_ORIGIN);
  const strips = buildStrips();

  return (
    <main className="min-h-screen bg-field-bg font-sans text-field-ink">
      {/* The page's one H1. Visually hidden: the strip is the visual opening. */}
      <h1 className="sr-only">Mark&apos;s Farm — Hampton, Connecticut</h1>

      {strips ? (
        <OrnitharchStrip data={strips} />
      ) : (
        <p className="mx-auto max-w-7xl px-3 py-6 font-mono text-xs text-field-muted">
          The flock records are unavailable right now.
        </p>
      )}

      {/* Live cameras: a deliberate dark island; the camera surfaces keep the guardian palette. */}
      <section className="border-b border-field-border">
        <div className="mx-auto max-w-7xl px-3 pb-3 pt-4">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.16em] text-field-muted">Live cameras</h2>
          <div className="overflow-hidden rounded-xl border border-field-border bg-guardian-bg p-4">
            <GuardianHomeBadge />
            <div className="pt-2">
              <HomeCameraStage />
            </div>
          </div>
        </div>
      </section>

      {/* Status footer. */}
      <footer className="border-t border-field-border bg-field-card py-2 font-mono text-[0.7rem] text-field-muted">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-0.5 px-3">
          <span>The farm · Hampton, Connecticut</span>
          <span>·</span>
          <GemsStatFooter />
          <span className="ml-auto flex gap-3">
            <a href="https://www.instagram.com/pawel_and_pawleen/" rel="noopener" className="hover:text-field-ink">
              instagram ↗
            </a>
            <a href="https://www.facebook.com/profile.php?id=61557234706008" rel="noopener" className="hover:text-field-ink">
              facebook ↗
            </a>
            <span>© {new Date().getFullYear()}</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
