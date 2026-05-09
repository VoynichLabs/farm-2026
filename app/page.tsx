/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 10-May-2026
 * PURPOSE: Homepage — leads with the live cameras and recent gem photos,
 *   nothing else. The v1.15.0 nine-section template stack (Hero +
 *   GuardianHomeSection + ImagePipeline + LatestFieldNote +
 *   FlockPreviewStrip + LatestFlockFrames + FarmTopology + ActiveProjects +
 *   SocialSection + SiteFooter) was deleted in v1.16.0 because it didn't
 *   tell a story and broke at desktop width. This page renders:
 *     1. GuardianHomeBadge (online dot + Cams N/M strip)
 *     2. HomeCameraStage (house-yard + s7-cam — the same composition as
 *        /projects/guardian, which is the page Boss asked us to mirror)
 *     3. RecentGemsRail — client-side fetch of recent gems (the
 *        /api/v1/images/gems endpoint takes ~7s for limit=12, well over
 *        the 3s SSR cap in lib/gems.ts; doing this in the browser lets
 *        the page render instantly and the rail populates async)
 *     4. A short nav rail to the deeper pages
 *     5. A small dark footer with the gems-this-week widget
 *   When Guardian is unreachable the camera stage and gems rail render
 *   their own empty/fallback states — the page composition stays
 *   intentional in either case.
 * SRP/DRY check: Pass — composition only. Each sub-piece owns its own
 *   data + empty states. No SSR fetches in this file (the Guardian
 *   round-trips are too slow to block render).
 */
import Link from "next/link";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import HomeCameraStage from "@/app/components/home/HomeCameraStage";
import RecentGemsRail from "@/app/components/home/RecentGemsRail";
import GemsStatFooter from "@/app/components/gems/GemsStatFooter";

const DEEPER_LINKS: { href: string; label: string }[] = [
  { href: "/projects/guardian", label: "Full Guardian dashboard" },
  { href: "/gallery/gems", label: "Gem archive" },
  { href: "/yard", label: "Yard diary" },
  { href: "/flock", label: "The flock" },
  { href: "/field-notes", label: "Field notes" },
  { href: "/projects", label: "Projects" },
];

export default function Home() {
  return (
    <main className="bg-guardian-bg text-guardian-text min-h-screen">
      {/* === LIVE CAMERAS === */}
      <section className="border-b border-guardian-border">
        <GuardianHomeBadge />
        <div className="max-w-6xl mx-auto px-3 pt-3 pb-4">
          <HomeCameraStage />
        </div>
      </section>

      {/* === RECENT GEMS === */}
      <RecentGemsRail />

      {/* === DEEPER LINKS === */}
      <section className="max-w-6xl mx-auto px-3 pb-10">
        <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {DEEPER_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="block rounded border border-guardian-border bg-guardian-card hover:border-emerald-500/60 hover:bg-guardian-hover/40 transition-colors px-4 py-3 text-sm"
              >
                <span className="text-guardian-text">{link.label}</span>
                <span className="text-guardian-muted"> →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* === FOOTER === */}
      <footer className="border-t border-guardian-border bg-guardian-card text-guardian-muted py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-col items-center md:items-start gap-0.5">
            <p className="text-guardian-text">Farm 2026 🦞</p>
            <p>Hampton, CT</p>
            <GemsStatFooter />
          </div>
          <div className="flex gap-4">
            <a
              href="https://www.instagram.com/pawel_and_pawleen/"
              rel="noopener"
              className="hover:text-guardian-text"
            >
              Instagram ↗
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61557234706008"
              rel="noopener"
              className="hover:text-guardian-text"
            >
              Facebook ↗
            </a>
          </div>
          <p>© {new Date().getFullYear()}</p>
        </div>
      </footer>
    </main>
  );
}
