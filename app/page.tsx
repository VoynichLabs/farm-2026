/**
 * Author: Claude Opus 5 (prev Claude Opus 4.8 / Claude Fable 5 / Claude Opus 4.7 / Claude Sonnet 4.6)
 * Date: 18-Aug-2026 (orig 10-May-2026; updated 20-May / 22-Jun / 06-Jul / 22-Jul / 18-Aug-2026)
 *   18-Aug-2026: the Class of 2026 row's first six tiles now carry
 *   next/image `priority` — they are the top of the page and were being
 *   lazy-loaded, so the browser deferred them until after layout.
 *   22-Jul-2026: Class of 2026 grid now DERIVES from flock-profiles.json
 *   (ornitharchs), not a hardcoded array — so new bird portraits committed to
 *   the roster show on the front page automatically instead of silently
 *   drifting out of sync (they never appeared here before this).
 * PURPOSE: Homepage composition. 16-Jul-2026 daylight retheme: converted to
 *   the light Field Guide (field-*) tokens, styling only; the live-camera
 *   surfaces (GuardianHomeBadge + HomeCameraStage) are kept as a
 *   self-contained dark island. From top to
 *   bottom: SiteNav (in layout.tsx), then this page renders:
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
import { getBirdAgeLabel, getFlockProfiles } from "@/lib/content";
import { PAGE_MARKS, STATUS } from "@/lib/emoji";

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

// The Class of 2026 IS the roster's ornitharchs (the birds hatched on the farm
// this spring). We derive this list LIVE from content/flock-profiles.json so the
// front page always shows each bird's CURRENT portrait — the exact same photo
// /flock shows. This used to be a hardcoded array whose photo paths silently
// drifted out of sync with the roster (why new bird photos never appeared on the
// homepage). Deriving fixes that at the root: update a bird's photo once and it
// shows everywhere. Newest hatch first; age is computed live from hatch_date
// (never stored) so it can't stale. No count is rendered — Boss rule.
function shortBreed(breed: string): string {
  // Compact the roster's long breed strings into a card label.
  return breed
    .replace(/\s*\([^)]*\)/g, "") // drop parentheticals like "(cross TBD)"
    .replace(/Easter Egger/gi, "EE")
    .trim();
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatHatch(iso: string): string {
  // "2026-06-02" -> "Jun 2"
  const [, m, d] = iso.split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1]} ${d ?? ""}`.trim();
}

// Boss-set featured order for the front page hero row — these five lead,
// in this exact order, regardless of hatch date. Everyone else follows,
// newest hatch first, same as before this override existed.
const FEATURED_ORDER = ["Birddor", "Henridotta", "Birdimir", "Ingebird", "Horstabird"];

// How many Class-of-2026 tiles get next/image `priority` (eager + preload).
// Six is one full row at the widest breakpoint (lg:grid-cols-6) and, at
// grid-cols-2 on a phone, the three stacked rows that fill the first screen —
// so the same number is correct at both ends and nothing below the fold gets
// preloaded. See the Image below for why this matters.
const FIRST_ROW_PRIORITY = 6;

function getClassOf2026(): Chick[] {
  const flock = getFlockProfiles();
  if (!flock) return [];
  return flock.flock_birds
    .filter((b) => b.ornitharch && b.hatch_date)
    .map((b) => ({
      name: b.name,
      breed: shortBreed(b.breed),
      hatch: formatHatch(b.hatch_date as string),
      hatchISO: b.hatch_date as string,
      photo: b.photo ? `/photos/${b.photo}` : null,
    }))
    .sort((a, z) => z.hatchISO.localeCompare(a.hatchISO)) // newest hatch first
    .sort((a, z) => {
      const ai = FEATURED_ORDER.indexOf(a.name);
      const zi = FEATURED_ORDER.indexOf(z.name);
      if (ai === -1 && zi === -1) return 0; // preserve newest-first order below
      if (ai === -1) return 1;
      if (zi === -1) return -1;
      return ai - zi;
    });
}

export default function Home() {
  const hatchlings = getClassOf2026();
  return (
    <main className="bg-field-bg text-field-ink min-h-screen font-sans">

      {/* === THE CLASS OF 2026 — hero position === */}
      <section className="border-b border-field-border">
        <div className="max-w-7xl mx-auto px-3 py-4">
          <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-3">
            <span aria-hidden="true" className="mr-1.5">{PAGE_MARKS.home}</span>THE CLASS OF 2026 — hatched this spring, ruling Birdcatraz now
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {hatchlings.map((chick, idx) => (
              <div key={`${chick.name}-${idx}`} className="flex flex-col gap-1.5">
                {chick.photo ? (
                  <div className="w-full h-56 border border-field-border bg-field-wash flex items-center justify-center overflow-hidden">
                    <Image
                      src={chick.photo}
                      alt={chick.name}
                      width={400}
                      height={500}
                      className="w-full h-full object-contain"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
                      // The Class of 2026 row is the top of the homepage — the
                      // first thing in the viewport on every device. Without
                      // this, next/image emits loading="lazy" on all of them,
                      // so Chrome assigns Low priority and does not even queue
                      // the fetch until after layout (measured 18-Aug-2026:
                      // Chrome's own LCPDiscovery insight flagged the row).
                      // `priority` emits loading="eager" + fetchpriority="high"
                      // + a <link rel="preload"> in <head>, so the preload
                      // scanner starts the fetch while the HTML is still
                      // parsing. FIRST_ROW_PRIORITY covers a full row at every
                      // breakpoint (6-across desktop, and the 2-across mobile
                      // stack, whose three rows all sit within the first
                      // screen). Tile 7+ stays lazy — that's below the fold
                      // everywhere and shouldn't spend a mobile's bandwidth.
                      priority={idx < FIRST_ROW_PRIORITY}
                    />
                  </div>
                ) : (
                  <div className="w-full h-56 border border-dashed border-field-border flex items-center justify-center bg-field-wash">
                    <span className="font-mono text-[0.65rem] text-field-muted text-center px-1">
                      photo<br />incoming
                    </span>
                  </div>
                )}
                <div className="font-mono text-[0.72rem] leading-tight">
                  <div className="text-field-accent">{chick.name}</div>
                  <div className="text-field-muted">{chick.breed}</div>
                  <div className="text-field-muted">
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

      {/* === LIVE CAMERAS — deliberate dark island; camera surfaces keep the guardian palette === */}
      <section className="border-b border-field-border">
        <div className="max-w-7xl mx-auto px-3 pt-4 pb-3">
          <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-3">
            <span aria-hidden="true" className="mr-1.5">{STATUS.live}</span>Live Cameras
          </span>
          <div className="rounded-xl overflow-hidden bg-guardian-bg border border-field-border p-4">
            <GuardianHomeBadge />
            <div className="pt-2">
              <HomeCameraStage />
            </div>
          </div>
        </div>
      </section>

      {/* === RECENT GEMS === */}
      <RecentGemsRail />

      {/* === DEEPER PAGES, file-listing styled === */}
      <section className="max-w-7xl mx-auto px-3 py-4 border-t border-field-border font-mono text-[0.78rem]">
        <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-1.5">
          INDEX
        </span>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5">
          {DEEPER_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="group flex items-baseline gap-2 py-1 hover:bg-field-wash px-1 -mx-1"
              >
                <span className="text-field-muted select-none">└─</span>
                <span className="text-field-accent group-hover:text-field-accent-deep">
                  {link.label}
                </span>
                <span className="text-field-muted truncate">
                  — {link.hint}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* === STATUS-LINE FOOTER === */}
      <footer className="border-t border-field-border bg-field-card text-field-muted py-2 font-mono text-[0.7rem]">
        <div className="max-w-7xl mx-auto px-3 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-field-muted">FARM-2026</span>
          <span>·</span>
          <span>Hampton, CT</span>
          <span>·</span>
          <GemsStatFooter />
          <span className="ml-auto flex gap-3">
            <a
              href="https://www.instagram.com/pawel_and_pawleen/"
              rel="noopener"
              className="hover:text-field-ink"
            >
              instagram ↗
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61557234706008"
              rel="noopener"
              className="hover:text-field-ink"
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
