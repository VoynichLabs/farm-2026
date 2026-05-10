/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 10-May-2026
 * PURPOSE: Homepage — terminal / mission-control composition. From top to
 *   bottom: TerminalNav (in layout.tsx), then this page renders:
 *     1. SystemBanner — short story strip: how the live grid below is
 *        produced (cameras → Mac Mini → YOLO+VLM → Discord queue → IG/FB,
 *        plus the archive lane). Goes first so a visitor reads what the
 *        page IS while the cameras are still connecting.
 *     2. GuardianHomeBadge + HomeCameraStage — same camera composition
 *        as /projects/guardian (house-yard primary, s7-cam secondary),
 *        the surface Boss said looked right.
 *     3. RecentGemsRail — client-side fetch of /api/v1/images/gems
 *        (server endpoint takes ~7s, would always blow the 3s SSR cap).
 *     4. A tight nav rail to the deeper pages, file-listing styled.
 *     5. A short status-line footer.
 *
 *   v1.16.3 redesign (10-May-2026): tightened all containers from
 *   max-w-6xl to max-w-7xl, dropped vertical padding throughout,
 *   replaced the rounded "card" deeper-link tiles with a dense
 *   file-listing block, and inlined a status-line footer instead of
 *   the centered three-column block. Goal is a surveillance-dashboard
 *   reading rhythm, not a marketing landing page.
 *
 * SRP/DRY check: Pass — composition only. Each sub-piece owns its own
 *   data + empty states.
 */
import Link from "next/link";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import HomeCameraStage from "@/app/components/home/HomeCameraStage";
import RecentGemsRail from "@/app/components/home/RecentGemsRail";
import SystemBanner from "@/app/components/home/SystemBanner";
import GemsStatFooter from "@/app/components/gems/GemsStatFooter";

const DEEPER_LINKS: { href: string; label: string; hint: string }[] = [
  { href: "/projects/guardian", label: "guardian", hint: "live cameras + PTZ + dashboard" },
  { href: "/gallery/gems", label: "gallery/gems", hint: "filterable archive of curated gems" },
  { href: "/yard", label: "yard", hint: "thrice-daily Reolink stockpile" },
  { href: "/flock", label: "flock", hint: "active birds + breed reference + In Memoriam" },
  { href: "/field-notes", label: "field-notes", hint: "weekly farm updates" },
  { href: "/projects", label: "projects", hint: "build logs + materials" },
];

export default function Home() {
  return (
    <main className="bg-guardian-bg text-guardian-text min-h-screen font-sans">
      {/* === STORY ABOUT THE LIVE PIPELINE === */}
      <SystemBanner />

      {/* === LIVE CAMERAS === */}
      <section className="border-b border-guardian-border">
        <GuardianHomeBadge />
        <div className="max-w-7xl mx-auto px-3 pt-2 pb-3">
          <HomeCameraStage />
        </div>
      </section>

      {/* === RECENT GEMS === */}
      <RecentGemsRail />

      {/* === DEEPER PAGES, file-listing styled === */}
      <section className="max-w-7xl mx-auto px-3 py-4 border-t border-guardian-border font-mono text-[0.78rem]">
        <div className="text-emerald-400 tracking-wider mb-1.5">▸ INDEX</div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
          {DEEPER_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-baseline gap-2 py-1 hover:bg-guardian-card/60 px-1 -mx-1"
              >
                <span className="text-guardian-muted select-none">└─</span>
                <span className="text-emerald-300 group-hover:text-emerald-200">
                  {link.label}
                </span>
                <span className="text-guardian-muted truncate">
                  — {link.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* === STATUS-LINE FOOTER === */}
      <footer className="border-t border-guardian-border bg-guardian-card text-guardian-muted py-2 font-mono text-[0.7rem]">
        <div className="max-w-7xl mx-auto px-3 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-guardian-text/80">FARM-2026</span>
          <span>·</span>
          <span>Hampton, CT</span>
          <span>·</span>
          <GemsStatFooter />
          <span className="ml-auto flex gap-3">
            <a
              href="https://www.instagram.com/pawel_and_pawleen/"
              rel="noopener"
              className="hover:text-guardian-text"
            >
              instagram ↗
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61557234706008"
              rel="noopener"
              className="hover:text-guardian-text"
            >
              facebook ↗
            </a>
            <span>© {new Date().getFullYear()}</span>
          </span>
        </div>
      </footer>
    </main>
  );
}
