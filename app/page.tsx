/**
 * Author: Claude Fable 5 (prev Claude Opus 4.7 / Claude Sonnet 4.6 / Claude Opus 4.8)
 * Date: 16-Jul-2026 (orig 10-May-2026; updated 20-May / 22-Jun / 06-Jul-2026)
 * PURPOSE: Homepage — terminal / mission-control composition. From top to
 *   bottom: TerminalNav (in layout.tsx), then this page renders:
 *     1. Class of 2026 hero — the birds hatched/raised this spring, newest
 *        hatch first, now grown and living in Birdcatraz (the outdoor
 *        fenced compound holding the coop + turkey pen).
 *     2. SystemBanner — short story strip about the live pipeline.
 *     3. GuardianHomeBadge + HomeCameraStage — live camera feeds.
 *     4. RecentGemsRail — client-side fetch of curated moments.
 *     5. A tight nav rail to the deeper pages, file-listing styled.
 *     6. A short status-line footer.
 *
 *   Ages are computed live from each bird's hatch_date via getBirdAgeLabel
 *   (the age SSoT established in CHANGELOG 1.18.0) — there is no hardcoded
 *   day count to drift, and no bird count is rendered (Boss rule).
 *   16-Jul-2026 (Birdcatraz-era refresh): header de-chickified, day-4
 *   brooder portraits swapped for current grown-bird frames where one
 *   exists in the repo.
 *
 * SRP/DRY check: Pass — composition only. Each sub-piece owns its own
 *   data + empty states. Age uses the shared getBirdAgeLabel helper rather
 *   than a re-implemented date math.
 */
import Image from "next/image";
import Link from "next/link";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import HomeCameraStage from "@/app/components/home/HomeCameraStage";
import RecentGemsRail from "@/app/components/home/RecentGemsRail";
import SystemBanner from "@/app/components/home/SystemBanner";
import GemsStatFooter from "@/app/components/gems/GemsStatFooter";
import { getBirdAgeLabel } from "@/lib/content";

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
  hatch: string; // short display label, e.g. "Jun 2"
  hatchISO: string; // age source of truth — live age derived from this date
  photo: string | null;
};

// Newest hatch first. Age is never stored here — only the hatch date — so the
// "b. {date} · {age}" line is computed live on every render and can't go stale
// (the bug CHANGELOG 1.18.0 fixed for /flock). Two Birddor frames are kept
// intentionally (held throwback + current portrait). No count is derived or
// rendered — this is a portrait wall, not a dashboard.
const HATCHLINGS_2026: Chick[] = [
  {
    name: "Birdimir",
    breed: "EE lineage",
    hatch: "Jun 2",
    hatchISO: "2026-06-02",
    photo: "/photos/birds/IMG_6233-birdimir-juvenile-22jun2026.jpg",
  },
  {
    name: "Birdthazar",
    breed: "EE (probable cockerel)",
    hatch: "May 16",
    hatchISO: "2026-05-16",
    photo: "/photos/birds/IMG_6268-birdthazar-23jun2026.jpg",
  },
  {
    name: "Henriella",
    breed: "Wyandotte × RIR",
    hatch: "May 16",
    hatchISO: "2026-05-16",
    photo: "/photos/birds/IMG_6292-henriella-23jun2026.jpg",
  },
  {
    name: 'Birdsilla "Monster Leg"',
    breed: "EE lineage",
    hatch: "May 16",
    hatchISO: "2026-05-16",
    photo: "/photos/birds/IMG_4940-birdsilla-perch-28may2026.jpg",
  },
  {
    name: "Birdadotta",
    breed: "EE × RIR",
    hatch: "Apr 25",
    hatchISO: "2026-04-25",
    photo: "/photos/birds/IMG_6271-birdadotta-23jun2026.jpg",
  },
  {
    name: "Birddor",
    breed: "Easter Egger (cockerel)",
    hatch: "Apr 6",
    hatchISO: "2026-04-06",
    photo: "/photos/may-2026/birdadette-may20-held.jpg",
  },
  {
    name: "Birddor",
    breed: "Easter Egger (cockerel)",
    hatch: "Apr 6",
    hatchISO: "2026-04-06",
    photo: "/photos/birds/IMG_5849-birdadette-23jun2026.jpg",
  },
];

export default function Home() {
  return (
    <main className="bg-guardian-bg text-guardian-text min-h-screen font-sans">

      {/* === THE CLASS OF 2026 — hero position === */}
      <section className="border-b border-guardian-border">
        <div className="max-w-7xl mx-auto px-3 py-4">
          <div className="text-emerald-400 tracking-wider mb-3 font-mono text-[0.78rem]">
            ▸ THE CLASS OF 2026 — hatched this spring, ruling Birdcatraz now
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {HATCHLINGS_2026.map((chick, idx) => (
              <div key={`${chick.name}-${idx}`} className="flex flex-col gap-1.5">
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
                    b. {chick.hatch} · {getBirdAgeLabel(chick.hatchISO)}
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
