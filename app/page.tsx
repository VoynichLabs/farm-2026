/**
 * Author: Claude Opus 4.7 (1M context) / Claude Sonnet 4.6
 * Date: 10-May-2026 / updated 20-May-2026
 * PURPOSE: Homepage — terminal / mission-control composition. From top to
 *   bottom: TerminalNav (in layout.tsx), then this page renders:
 *     1. 2026 Hatchlings hero — 5 incubator chicks front and center.
 *     2. SystemBanner — short story strip about the live pipeline.
 *     3. GuardianHomeBadge + HomeCameraStage — live camera feeds.
 *     4. RecentGemsRail — client-side fetch of curated moments.
 *     5. A tight nav rail to the deeper pages, file-listing styled.
 *     6. A short status-line footer.
 *
 * SRP/DRY check: Pass — composition only. Each sub-piece owns its own
 *   data + empty states.
 */
import Image from "next/image";
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
  { href: "/hatches", label: "hatches", hint: "every 2026 incubator hatch — parentage + phenotype log" },
  { href: "/field-notes", label: "field-notes", hint: "weekly farm updates" },
  { href: "/projects", label: "projects", hint: "build logs + materials" },
];

type Chick = {
  name: string;
  breed: string;
  hatch: string;
  ageDays: number;
  photo: string | null;
};

const HATCHLINGS_2026: Chick[] = [
  {
    name: "Birdadette",
    breed: "Easter Egger",
    hatch: "Apr 6",
    ageDays: 44,
    photo: "/photos/may-2026/birdadette-may20-held.jpg",
  },
  {
    name: "Birdadette",
    breed: "Easter Egger",
    hatch: "Apr 6",
    ageDays: 44,
    photo: "/photos/may-2026/birdadette-may20-portrait.jpg",
  },
  {
    name: "Birdadotta",
    breed: "EE × RIR",
    hatch: "Apr 25",
    ageDays: 25,
    photo: "/photos/may-2026/birdadotta-s7-2026-05-18.png",
  },
  {
    name: "Birdthazar",
    breed: "EE (probable cockerel)",
    hatch: "May 16",
    ageDays: 4,
    photo: "/photos/may-2026/birdthazar-day4-portrait.jpg",
  },
  {
    name: "Henriella",
    breed: "Wyandotte × RIR",
    hatch: "May 16",
    ageDays: 4,
    photo: "/photos/may-2026/chick2-day4-portrait.jpg",
  },
  {
    name: 'Chick #3 "Monster Leg"',
    breed: "EE lineage",
    hatch: "May 16",
    ageDays: 4,
    photo: "/photos/may-2026/chick3-day4-portrait.jpg",
  },
];

export default function Home() {
  return (
    <main className="bg-guardian-bg text-guardian-text min-h-screen font-sans">

      {/* === 2026 HATCHLINGS — hero position === */}
      <section className="border-b border-guardian-border">
        <div className="max-w-7xl mx-auto px-3 py-4">
          <div className="text-emerald-400 tracking-wider mb-3 font-mono text-[0.78rem]">
            ▸ 2026 INCUBATOR HATCH — {HATCHLINGS_2026.length} chicks
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {HATCHLINGS_2026.map((chick) => (
              <div key={chick.name} className="flex flex-col gap-1.5">
                {chick.photo ? (
                  <div className="w-full h-56 border border-guardian-border bg-guardian-card/20 flex items-center justify-center overflow-hidden">
                    <Image
                      src={chick.photo}
                      alt={chick.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                    />
                  </div>
                ) : (
                  <div className="w-full h-56 border border-dashed border-guardian-border flex items-center justify-center bg-guardian-card/30">
                    <span className="font-mono text-[0.65rem] text-guardian-muted text-center px-1">
                      photo<br />incoming
                    </span>
                  </div>
                )}
                <div className="font-mono text-[0.72rem] leading-tight">
                  <div className="text-emerald-300">{chick.name}</div>
                  <div className="text-guardian-muted">{chick.breed}</div>
                  <div className="text-guardian-muted">
                    b. {chick.hatch} · {chick.ageDays}d
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
