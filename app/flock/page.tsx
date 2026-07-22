/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; prev Claude Opus 4.8, 07-Jun-2026)
 * Date: 16-Jul-2026
 * PURPOSE: /flock — the breeding-program memory surface. Per
 *   docs/11-May-2026-hermes-breeding-showcase-notes.md, the openclaw brief
 *   (docs/09-May-2026-openclaw-farm-ops-story-design-brief.md §9, §10, §17.4,
 *   §19), the bubba doc (docs/09-May-2026-bubba-on-the-farm.md §13, §27),
 *   docs/11-May-2026-flock-page-breeding-memory-plan.md, and
 *   docs/06-Jul-2026-terminal-glowup-plan.md.
 *
 *   06-Jul-2026 (terminal glow-up): page converted to the sitewide dark
 *   guardian palette (the cream-era body classes were unreadable after
 *   v1.16.3 flipped the global body dark). New lead section: THE
 *   ORNITHARCHS — every bird hatched on the farm this year, grouped by
 *   clutch, each tile joining flock-profiles.json (identity/photo/status)
 *   with content/hatches/2026/*.md frontmatter (parentage SSoT: parent_hen,
 *   parent_rooster_window, parentage_confidence, egg_color, clutch_id).
 *   Counts are derived, never literals.
 *   Birdadette is now Birddor (cockerel); the old "named after Birdgit"
 *   claim was Boss-corrected as false and no longer renders anywhere.
 *
 *   16-Jul-2026 (Birdcatraz-era refresh): the flock is grown and moved
 *   outdoors — the brooder/nestbox "nursery" grouping is replaced by a
 *   single Birdcatraz section (location === "birdcatraz", the fenced
 *   compound holding the coop + turkey pen). The rendered nursery count
 *   is gone (no-counts rule); the stale "EE hen 1" lookups now match the
 *   roster's "Birdsula"; hero photo swapped to a grown-flock frame.
 *
 *   16-Jul-2026 (E5, docs/16-Jul-2026-birdcatraz-era-refresh-plan.md Part E):
 *   each OrnitharchTile now renders a GrowthStrip — every dated,
 *   showcase-worthy hatch-record photo for that bird, oldest to newest,
 *   generalizing ThenAndNow.tsx's fixed two-photo comparison. Built by the
 *   new page-local buildGrowthPhotos() from the same hatchRecords/recordFor()
 *   data OrnitharchTile's portrait pool already uses — no second lookup
 *   path, no new lib/content.ts loader. Self-suppresses below two photos
 *   (most June/July hatches have only one committed so far).
 *
 *   16-Jul-2026 (daylight retheme): converted from the dark terminal
 *   palette to the light Field Guide tokens (field-*) per
 *   docs/16-Jul-2026-daylight-retheme-plan.md — styling only, zero copy
 *   changes. Bracketed kickers became specimen tags (emoji from
 *   lib/emoji.ts SSoT: page mark on the hero strip, STATUS.egg on the
 *   incubator); photo-overlay chips and gradients stay dark-on-photo.
 *
 *   16-Jul-2026 (memorial removal, per Boss): the In Memoriam section,
 *   founders' memorial strip, loss narrative paragraph, and the
 *   in-memoriam/LOST markers on breeding-line tiles are removed. Roster
 *   data files are untouched; parentage (DAM/SIRE) records still render —
 *   they're records, not eulogy. Don't reintroduce loss storytelling.
 *
 *   22-Jul-2026 (leg-band chips): each bird card (OrnitharchTile + BirdCard)
 *   now renders a BandChip when the roster entry has a leg_band — a colored
 *   swatch + "color #N · L/R" so you can eyeball who's who at a glance. The
 *   band is the canonical ID (near-identical birds like Henridotta ≈ Ingebird
 *   are told apart by it); left leg = farm-hatched. Data is flock-profiles.json
 *   leg_band; the dedicated assignments page stays at /flock/banding.
 *
 *   Layout (top → bottom):
 *     1. Terminal hero strip + serif title
 *     2. THE ORNITHARCHS — narrative + cohort wall
 *     3. Incubator panel (conditional)
 *     4. BREEDING LINE panel (second-generation chain)
 *     5. Birdcatraz / Coop / Hens / Roosters roster sections
 *     6. Breed Notes
 *
 * SRP/DRY check: Pass — page composes BirdCard + OrnitharchTile primitives
 *   against getFlockProfiles() + getHatchRecords() (lib/content.ts). Ages
 *   come solely from getBirdAgeLabel(hatch_date) computed live. The
 *   triskaidekaphobia rule (memory/feedback_no_thirteen.md) is honoured —
 *   no derived count equal to 13 is ever rendered.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  getFlockProfiles,
  getBirdAgeLabel,
  getHatchRecords,
  type IncubatorClutch,
  type HatchRecord,
  type FlockBird,
  type LegBand,
} from "@/lib/content";
import Image from "next/image";
import FlockGemStrip from "@/app/components/flock/FlockGemStrip";
import OrnitharchPortrait, {
  type RotatingPhoto,
} from "@/app/components/flock/OrnitharchPortrait";
import GrowthStrip from "@/app/components/flock/GrowthStrip";
import type { ThenNowPhoto } from "@/app/components/hatches/ThenAndNow";
import { PAGE_MARKS, STATUS } from "@/lib/emoji";

export const metadata: Metadata = {
  title: "The Flock",
  description:
    "Hatch dates, names, lineage, and losses. The breeding-program record for Farm 2026, Hampton CT — including the eleven Ornitharchs hatched on the farm this year.",
};

const isRooster = (eggColor: string) => eggColor === "N/A (rooster)";

// Specimen-tag kicker chrome — the Field Guide replacement for the old
// bracketed terminal kickers (16-Jul-2026 daylight retheme). Shared string
// so every section header on the page renders identically.
const SPECIMEN_TAG =
  "inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted";

// "Turkey poults (3)" → 3. Lets hero stats count birds, not roster entries.
const individualCount = (name: string): number => {
  const m = name.match(/\((\d+)\)\s*$/);
  return m ? parseInt(m[1], 10) : 1;
};

// The whole grown flock lives in Birdcatraz — the outdoor fenced compound
// holding the coop and the turkey pen. Location values are roster data.
const BIRDCATRAZ_LOCATION = "birdcatraz";

const hatchSortDesc = (a: { hatch_date?: string }, b: { hatch_date?: string }) => {
  if (!a.hatch_date && !b.hatch_date) return 0;
  if (!a.hatch_date) return 1;
  if (!b.hatch_date) return -1;
  return b.hatch_date.localeCompare(a.hatch_date);
};

// First sentence (or first ~140 chars) of a notes blob. Keeps the card a
// current-state snapshot rather than an arrival-narrative timeline.
const firstSentence = (s: string): string => {
  const m = s.match(/^[^.!?]+[.!?]/);
  if (m) return m[0];
  return s.length > 140 ? s.slice(0, 140).trimEnd() + "…" : s;
};

// Local lineage map for the BREEDING LINE panel. The Hermes doc lists
// structured pairing/lineage fields on flock-profiles.json as future scope;
// the ornitharch wall reads parentage straight from hatch-record frontmatter,
// so this map only covers the pre-2026 generation the records don't reach.
type LineageInfo = {
  dam?: string;
  sire?: string;
};
const LINEAGE: Record<string, LineageInfo> = {
  Birdadonna: {
    dam: "Birdsula",
    sire: "Little Big Red Junior",
  },
  Birdadotta: {
    dam: "Birdadonna",
    // Sire window on Birdadotta lives in her hatch record.
  },
};

// Formatted "YYYY-MM-DD" → "25 Apr 2026", "YYYY-MM" → "Apr 2026", "YYYY" → "2026".
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso?: string): string | null => {
  if (!iso) return null;
  const full = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (full) {
    const mo = MONTHS[parseInt(full[2], 10) - 1] || full[2];
    return `${parseInt(full[3], 10)} ${mo} ${full[1]}`;
  }
  const ym = iso.match(/^(\d{4})-(\d{2})/);
  if (ym) {
    const mo = MONTHS[parseInt(ym[2], 10) - 1] || ym[2];
    return `${mo} ${ym[1]}`;
  }
  const y = iso.match(/^(\d{4})$/);
  if (y) return y[1];
  return iso;
};

// Same-month date span for a cohort header: "16 May 2026" or "2–4 Jun 2026".
const fmtSpan = (isoA: string, isoB: string): string => {
  if (isoA === isoB) return fmtDate(isoA) ?? isoA;
  const a = fmtDate(isoA) ?? isoA;
  const b = fmtDate(isoB) ?? isoB;
  const [dayA, ...restA] = a.split(" ");
  const [dayB, ...restB] = b.split(" ");
  if (restA.join(" ") === restB.join(" ")) return `${dayA}–${dayB} ${restA.join(" ")}`;
  return `${a} – ${b}`;
};

// The hatch records keep the honest hedge in the sire field
// ("Whitey Red Legs (NI-clutch paternity window)"); compress the
// boilerplate for tile display without dropping the uncertainty.
const shortSire = (w?: string): string | null =>
  w ? w.replace(" (NI-clutch paternity window)", " (window)") : null;

// repo-relative "public/photos/..." → web "/photos/..." (same convention as
// /hatches). Hatch-record photo paths are stored repo-relative.
const webPath = (p: string) => `/${p.replace(/^public\//, "")}`;

// Short age-at-photo chip for a throwback frame: "hatch day", "day 8",
// "3 wks", "2 mos". Undated frames read "throwback". The literal "day 13"
// is skipped (triskaidekaphobia rule) — it renders as "2 wks" instead.
const throwbackTag = (hatchISO?: string, photoISO?: string): string => {
  if (!hatchISO || !photoISO) return "throwback";
  const hatch = new Date(`${hatchISO}T00:00:00`).getTime();
  const shot = new Date(`${photoISO}T00:00:00`).getTime();
  if (Number.isNaN(hatch) || Number.isNaN(shot)) return "throwback";
  const days = Math.round((shot - hatch) / 86400000);
  if (days <= 1) return "hatch day";
  if (days < 13) return `day ${days}`;
  if (days < 56) return `${Math.floor(days / 7)} wks`;
  return `${Math.floor(days / 30)} mos`;
};

// A bird's rotating pool: current portrait first, then its hatch-record
// throwbacks in chronological order. Record entries flagged showcase:false
// (equipment shots, thermometers) stay out of the rotation; the current
// portrait is deduped out of the throwback list by src.
const buildPortraitPool = (bird: FlockBird, record?: HatchRecord): RotatingPhoto[] => {
  const pool: RotatingPhoto[] = [];
  const age = getBirdAgeLabel(bird.hatch_date, bird.hatch_date_estimated);
  if (bird.photo) {
    pool.push({
      src: `/photos/${bird.photo}`,
      tag: age ? `now · ${age}` : "now",
      alt: bird.name,
    });
  }
  const throwbacks = (record?.photos ?? [])
    .filter((ph) => ph.path && ph.showcase !== false)
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .map((ph) => ({
      src: webPath(ph.path),
      tag: throwbackTag(record?.hatch_date, ph.date),
      alt: ph.caption || `${bird.name}, younger`,
    }))
    .filter((ph) => !pool.some((existing) => existing.src === ph.src));
  return [...pool, ...throwbacks];
};

// GrowthStrip's data source: the bird's accumulating photos[] ledger — every
// picture we have of it, oldest first, undated last, with live age-at-photo
// labels. Works for EVERY bird (not just ornitharchs with a hatch record):
// the ledger lives on the roster entry and is grown append-only by the ingest
// pipeline + backfilled from hatch records and committed files. GrowthStrip
// itself is the single self-suppression point (<2 photos → null).
const buildBirdGrowthPhotos = (bird: FlockBird): ThenNowPhoto[] => {
  return [...(bird.photos ?? [])]
    .sort((a, b) => (a.date ?? "9999-99-99").localeCompare(b.date ?? "9999-99-99"))
    .map((ph) => ({
      src: `/photos/${ph.file}`,
      dateLabel: ph.date ? fmtDate(ph.date) || "—" : "undated",
      ageLabel: ph.date ? throwbackTag(bird.hatch_date, ph.date) : "",
      caption: ph.caption ?? "",
      alt: ph.caption || `${bird.name}, dated photo`,
    }));
};

export default function FlockPage() {
  const flockData = getFlockProfiles();

  if (!flockData) {
    return (
      <main className="min-h-screen">
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold font-serif text-field-ink mb-4">The Flock</h1>
          <p className="text-field-muted">No flock data available.</p>
        </section>
      </main>
    );
  }

  const birds = flockData.flock_birds || [];
  const breeds = flockData.breeds || {};

  const activeBirds = birds.filter((b) => b.status === "active");
  const deceasedBirds = birds.filter((b) => b.status === "deceased");

  const birdcatrazBirds = activeBirds
    .filter((b) => b.location === BIRDCATRAZ_LOCATION)
    .sort(hatchSortDesc);
  const coopGrowing = activeBirds
    .filter((b) => b.location === "coop")
    .sort(hatchSortDesc);
  const adultHens = activeBirds.filter(
    (b) => !b.location && !isRooster(b.egg_color)
  );
  const roosters = activeBirds.filter((b) => isRooster(b.egg_color));

  const hensCount = adultHens.reduce((n, b) => n + individualCount(b.name), 0);

  // ---- THE ORNITHARCHS ----
  // Identity/photo/status from flock-profiles.json (ornitharch flag);
  // parentage + egg color + clutch from the per-chick hatch records.
  // Joined by name, tolerating the Birddor rename via `formerly`.
  const hatchRecords = getHatchRecords("2026").filter((r) => r.name);
  const recordFor = (b: FlockBird): HatchRecord | undefined =>
    hatchRecords.find((r) => r.name === b.name || r.name === b.formerly);
  const ornitharchs = birds.filter((b) => b.ornitharch);
  const ornitharchCount = ornitharchs.length;

  // Cohorts = clutches, ordered by earliest hatch date.
  const clutchOrder: string[] = [];
  for (const r of [...hatchRecords].sort((a, b) => a.hatch_date.localeCompare(b.hatch_date))) {
    const c = r.clutch_id ?? "unknown";
    if (!clutchOrder.includes(c)) clutchOrder.push(c);
  }
  const cohorts = clutchOrder
    .map((clutchId) => {
      const members = ornitharchs
        .filter((b) => recordFor(b)?.clutch_id === clutchId)
        .sort((a, b) => (a.hatch_date ?? "").localeCompare(b.hatch_date ?? ""));
      const dates = members.map((b) => b.hatch_date ?? "").filter(Boolean).sort();
      return { clutchId, members, span: dates.length ? fmtSpan(dates[0], dates[dates.length - 1]) : "" };
    })
    .filter((c) => c.members.length > 0);

  // For the lineage panel: the genetic chain — Birdsula (fka "EE hen 1") ×
  // Little Big Red Junior → Birdadonna → Birdadotta — runs through these four.
  const lineageGenetic = [
    activeBirds.find((b) => b.name === "Birdsula"),
    deceasedBirds.find((b) => b.name === "Little Big Red Junior"),
    activeBirds.find((b) => b.name === "Birdadonna"),
    activeBirds.find((b) => b.name === "Birdadotta"),
  ].filter((b): b is NonNullable<typeof b> => Boolean(b));

  const incubating: IncubatorClutch[] = flockData.incubating ?? [];

  const getBreedProfile = (breedName: string) => {
    if (breeds[breedName]) return breeds[breedName];
    const baseBreed = breedName.split(" (")[0];
    if (breeds[baseBreed]) return breeds[baseBreed];
    if (breedName.includes("×") || breedName.toLowerCase().includes("cross")) {
      return breeds["Easter Egger × Rhode Island Red Cross"];
    }
    return null;
  };

  return (
    <main className="min-h-screen">
      {/* Hero — terminal strip on top, photo band below. */}
      <section
        className="relative min-h-[42vh] flex items-end justify-start bg-cover bg-center bg-no-repeat bg-field-card"
        style={{ backgroundImage: "url('/photos/june-2026/morning-flock-IMG_5744.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />

        {/* Instrument strip — dark-on-photo overlay over the hero photo */}
        <div className="absolute top-0 inset-x-0 z-20 bg-black/60 border-b border-white/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.7rem] uppercase tracking-widest text-white/80">
            <span className={SPECIMEN_TAG}>
              <span aria-hidden="true" className="mr-1.5">{PAGE_MARKS.flock}</span>Roster
            </span>
            <span>flock-profiles.json</span>
            <span className="text-white/50">·</span>
            <span>
              {ornitharchCount}<span className="text-white/60"> ornitharchs</span>
            </span>
            <span className="text-white/50">·</span>
            <span>
              {hensCount}<span className="text-white/60"> hens</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-12 pt-20 md:px-16 max-w-4xl">
          <p className="text-white/70 text-sm font-medium tracking-widest uppercase mb-2">
            Farm 2026 · Hampton, CT
          </p>
          <h1 className="text-5xl md:text-6xl text-white font-bold font-serif mb-3">
            The Flock
          </h1>
          <p className="text-lg text-white/85 max-w-2xl">
            Hatch dates, names, lineage, and losses. The breeding-program
            record for Farm 2026 — what came out of an egg, when, and from
            whom.
          </p>
          <p className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/hatches"
              className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-white bg-black/60 hover:bg-black/80 border border-white/25 px-3 py-2 rounded transition-colors"
            >
              [HATCHES 2026] →
              <span className="text-white/60 normal-case tracking-normal font-sans">
                per-chick records · phenotype log · predictions
              </span>
            </Link>
            <Link
              href="/flock/banding"
              className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-white bg-black/60 hover:bg-black/80 border border-white/25 px-3 py-2 rounded transition-colors"
            >
              [BANDING] →
              <span className="text-white/60 normal-case tracking-normal font-sans">
                leg-band ID system · assignments · roster
              </span>
            </Link>
          </p>
        </div>
      </section>

      {/* THE ORNITHARCHS — the year's headline story. Every bird hatched on
          the farm in 2026, and the founding generation they inherit from. */}
      {ornitharchCount > 0 && (
        <section className="border-b border-field-border">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <p className="mb-2">
              <span className={SPECIMEN_TAG}>
                The Ornitharchs · {ornitharchCount} hatched on the farm · 2026
              </span>
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-field-ink mb-4">
              The Ornitharchs
            </h2>
            <div className="max-w-3xl space-y-3 text-field-muted leading-relaxed mb-10">
              <p>
                <em>Ornitharch</em> is what we call any bird that hatched here,
                on the farm, in our incubators, from our flock&apos;s eggs.
                There are {ornitharchCount} of them this year, across four
                clutches.
              </p>
              <p>
                Most of the {ornitharchCount} came out of blue eggs, hatched
                with blue eyes, and — with a little luck — the pullets among
                them will lay blue eggs of their own next spring.
              </p>
            </div>

            {/* Cohort walls */}
            {cohorts.map((cohort, ci) => (
              <div key={cohort.clutchId} className="mb-10 last:mb-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4 border-b border-field-hairline pb-2">
                  <span className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent">
                    Cohort {ci + 1} · hatched {cohort.span}
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-field-muted">
                    clutch {cohort.clutchId} · {cohort.members.length}{" "}
                    {cohort.members.length === 1 ? "bird" : "birds"}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {cohort.members.map((bird, bi) => (
                    <OrnitharchTile
                      key={bird.name}
                      bird={bird}
                      record={recordFor(bird)}
                      index={ci * 3 + bi}
                    />
                  ))}
                </div>
              </div>
            ))}

            <p className="mt-10">
              <Link
                href="/hatches"
                className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent hover:text-field-accent-deep"
              >
                full hatch records → /hatches
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Incubator — what's in the desk incubator right now. */}
      {incubating.length > 0 && (
        <section className="bg-field-bg text-field-ink border-b border-field-border">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <p className="mb-2">
              <span className={SPECIMEN_TAG}>
                <span aria-hidden="true" className="mr-1.5">{STATUS.egg}</span>Incubating
              </span>
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-field-ink mb-2">
              In the Incubator
            </h2>
            <p className="text-field-muted text-sm mb-6 max-w-3xl">
              Eggs currently set on Boss&apos;s desk. Twenty-one days at
              99.6°F and 65–70% humidity is the chicken target; turkey
              clutches run twenty-eight.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {incubating.map((c, idx) => {
                const set = fmtDate(c.set_date);
                const due = fmtDate(c.expected_hatch);
                return (
                  <div
                    key={idx}
                    className="bg-field-card border border-field-border rounded-lg p-5 flex flex-col gap-2"
                  >
                    <h3 className="text-lg font-bold font-serif text-field-ink">
                      {c.label}
                    </h3>
                    <div className="font-mono text-[0.65rem] uppercase tracking-widest text-field-muted space-y-0.5">
                      {set && (
                        <div>
                          <span className="text-field-muted">SET</span>{" "}
                          <span className="text-field-ink">{set}</span>
                        </div>
                      )}
                      {due && (
                        <div>
                          <span className="text-field-muted">DUE</span>{" "}
                          <span className="text-field-ink">{due}</span>
                        </div>
                      )}
                      {typeof c.egg_count === "number" && (
                        <div>
                          <span className="text-field-muted">EGGS</span>{" "}
                          <span className="text-field-ink">{c.egg_count}</span>
                        </div>
                      )}
                      {c.egg_color && (
                        <div>
                          <span className="text-field-muted">COLOR</span>{" "}
                          <span className="text-field-ink">{c.egg_color}</span>
                        </div>
                      )}
                      {c.dam && (
                        <div>
                          <span className="text-field-muted">DAM</span>{" "}
                          <span className="text-field-ink">{c.dam}</span>
                        </div>
                      )}
                      {c.sire && (
                        <div>
                          <span className="text-field-muted">SIRE</span>{" "}
                          <span className="text-field-ink">{c.sire}</span>
                        </div>
                      )}
                    </div>
                    {c.notes && (
                      <p className="text-xs text-field-muted pt-2 border-t border-field-hairline mt-1">
                        {c.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Breeding lineage — the genetic chain through the program. */}
      {lineageGenetic.length > 0 && (
        <section className="bg-field-bg text-field-ink border-b border-field-border">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <p className="mb-2">
              <span className={SPECIMEN_TAG}>Breeding Line</span>
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-field-ink mb-2">
              First Second-Generation Hatch
            </h2>
            <p className="text-field-muted text-sm mb-8 max-w-3xl">
              Birdadotta, hatched 25 April 2026 from a blue egg laid by
              Birdadonna, is the first chick on the farm with both parents
              in the program&apos;s own records.{" "}
              <span className="text-field-muted">
                Birdsula × Little Big Red Junior → Birdadonna → Birdadotta.
              </span>
            </p>

            <div className="grid gap-4 md:grid-cols-4">
              {lineageGenetic.map((b) => {
                const ln = LINEAGE[b.name];
                const hatchFmt = fmtDate(b.hatch_date);
                const dateStr = hatchFmt
                  ? b.hatch_date_estimated ? `~${hatchFmt}` : hatchFmt
                  : "—";
                const dateLabel = "HATCH";
                return (
                  <div
                    key={b.name}
                    className="bg-field-card border border-field-border rounded-lg overflow-hidden flex flex-col"
                  >
                    <div className="relative w-full h-40 bg-field-wash">
                      {b.photo ? (
                        <Image
                          src={`/photos/${b.photo}`}
                          alt={b.name}
                          fill
                          sizes="(min-width: 768px) 25vw, 50vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-3xl text-field-muted">
                          🐣
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="text-lg font-bold font-serif text-field-ink">{b.name}</h3>
                      <p className="text-xs text-field-muted">{b.breed}</p>
                      <div className="font-mono text-[0.65rem] uppercase tracking-widest text-field-muted space-y-0.5 mt-auto pt-2 border-t border-field-hairline">
                        <div>
                          <span className="text-field-muted">{dateLabel}</span>{" "}
                          <span className="text-field-ink">{dateStr}</span>
                        </div>
                        {ln?.dam && (
                          <div>
                            <span className="text-field-muted">DAM</span>{" "}
                            <span className="text-field-ink">{ln.dam}</span>
                          </div>
                        )}
                        {ln?.sire && (
                          <div>
                            <span className="text-field-muted">SIRE</span>{" "}
                            <span className="text-field-ink">{ln.sire}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Birdcatraz — the whole grown flock, newest hatch first. */}
      {birdcatrazBirds.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-8">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>Birdcatraz</span>
          </p>
          <h2 className="text-2xl font-bold font-serif text-field-ink mb-2">
            In Birdcatraz
          </h2>
          <p className="text-field-muted mb-6 text-sm max-w-3xl">
            The luxurious poultry penitentiary — a fenced outdoor compound
            holding the coop, the turkey pen, and the big water bowl. The
            whole 2026 class lives here now, newest hatch at the top. Every
            frame below was scored by the VLM pipeline against the cameras
            watching the compound.
          </p>
          <FlockGemStrip
            scenes={["birdcatraz", "brooder", "nesting-box"]}
            label="LIVE FROM BIRDCATRAZ"
            limit={12}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {birdcatrazBirds.map((bird, idx) => (
              <BirdCard
                key={idx}
                bird={bird}
                breedProfile={getBreedProfile(bird.breed)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Growing out in the coop */}
      {coopGrowing.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>Coop</span>
          </p>
          <h2 className="text-2xl font-bold font-serif text-field-ink mb-2">
            Growing Out in the Coop
          </h2>
          <p className="text-field-muted mb-6 text-sm max-w-3xl">
            Out of the brooder, into the coop run. Not yet laying. Sorting
            out roosting order and what to do with daylight.
          </p>
          <FlockGemStrip
            scenes={["coop"]}
            label="LIVE FROM THE COOP RUN"
            limit={12}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coopGrowing.map((bird, idx) => (
              <BirdCard
                key={idx}
                bird={bird}
                breedProfile={getBreedProfile(bird.breed)}
              />
            ))}
          </div>
        </section>
      )}

      {/* The hens */}
      {adultHens.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>Laying Stock</span>
          </p>
          <h2 className="text-2xl font-bold font-serif text-field-ink mb-2">The Hens</h2>
          <p className="text-field-muted mb-6 text-sm max-w-3xl">
            The breeding stock. Easter Eggers, a Wyandotte, and the
            yearling that hatched on Boss&apos;s desk last spring.
          </p>
          <FlockGemStrip
            scenes={["yard"]}
            label="LIVE FROM THE YARD"
            limit={8}
            emptyHint="The Reolink stays focused on predator detection; yard-scene gems are sparse."
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adultHens.map((bird, idx) => (
              <BirdCard
                key={idx}
                bird={bird}
                breedProfile={getBreedProfile(bird.breed)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Roosters — conditional */}
      {roosters.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>Rooster</span>
          </p>
          <h2 className="text-2xl font-bold font-serif text-field-ink mb-2">
            {roosters.length === 1 ? "The Rooster" : "The Roosters"}
          </h2>
          <p className="text-field-muted mb-8 text-sm">
            {roosters.length === 1 ? "Runs the yard." : `${roosters.length} run the yard.`}
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {roosters.map((bird, idx) => (
              <BirdCard
                key={idx}
                bird={bird}
                breedProfile={getBreedProfile(bird.breed)}
                isRooster
              />
            ))}
          </div>
        </section>
      )}

      {/* Breed reference guide */}
      <section className="bg-field-wash border-y border-field-border">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>Breeds</span>
          </p>
          <h2 className="text-3xl font-bold font-serif text-field-ink mb-2">Breed Notes</h2>
          <p className="text-field-muted mb-10 max-w-3xl">
            What each breed brings to the flock.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(breeds).map(([breedName, profile]) => (
              <div
                key={breedName}
                className="bg-field-card rounded-lg border border-field-border border-l-4 border-l-field-accent p-6"
              >
                <h3 className="text-xl font-bold font-serif text-field-ink mb-2">{breedName}</h3>
                <p className="text-field-muted text-sm mb-4 leading-relaxed">{profile.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 text-field-ink">
                  <div>
                    <p className="font-mono font-semibold text-field-muted text-xs uppercase tracking-wide mb-1">Egg Color</p>
                    <p>{profile.egg_color}</p>
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-field-muted text-xs uppercase tracking-wide mb-1">Annual Eggs</p>
                    <p>{profile.eggs_per_year}</p>
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-field-muted text-xs uppercase tracking-wide mb-1">Temperament</p>
                    <p>{profile.temperament}</p>
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-field-muted text-xs uppercase tracking-wide mb-1">Cold Hardiness</p>
                    <p>{profile.cold_hardiness}</p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/25 rounded p-3">
                  <p className="text-sm text-field-honey-ink">
                    <span className="font-semibold">💡 </span>
                    {profile.fun_fact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-field-card border-t border-field-border text-field-muted text-center py-8 text-sm">
        <p className="font-serif font-bold text-field-muted mb-1">Farm 2026</p>
        <p>
          Hampton, CT —{" "}
          <Link href="/" className="hover:text-field-ink">
            ← Back to Farm
          </Link>
        </p>
      </footer>
    </main>
  );
}

interface BreedProfile {
  description: string;
  egg_color: string;
  eggs_per_year: number | string;
  temperament: string;
  cold_hardiness: string;
  typical_lifespan: string;
  fun_fact: string;
}

// Leg-band color → a real swatch color. Inline style (not a Tailwind class)
// so the dynamic band color survives Tailwind's purge. White gets a near-white
// fill so it's still visible on the light card; unknown colors fall back grey.
const BAND_HEX: Record<string, string> = {
  yellow: "#eab308",
  orange: "#f97316",
  white: "#fafafa",
  red: "#dc2626",
  green: "#16a34a",
  pink: "#ec4899",
  purple: "#9333ea",
  blue: "#2563eb",
};

// Compact leg-band chip: colored dot + "color #N · L/R". The band is the
// canonical bird ID — near-identical birds (Henridotta ≈ Ingebird) are told
// apart by it, and left leg = hatched on the farm.
function BandChip({ band }: { band: LegBand }) {
  const hex = BAND_HEX[(band.color ?? "").toLowerCase()] ?? "#9ca3af";
  const num = band.number != null ? `#${band.number}` : "";
  const side = band.side ? band.side[0].toUpperCase() : "";
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest bg-field-bg border border-field-border text-field-muted px-2 py-0.5 rounded"
      title={`${band.color} band ${num}${band.side ? ` · ${band.side} leg` : ""}`}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-full border border-black/25"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      {band.color} {num}
      {side ? ` · ${side}` : ""}
    </span>
  );
}

/**
 * One ornitharch on the cohort wall. Identity/photo from the roster entry,
 * parentage/egg color from the hatch record. Portraits render tall
 * (aspect-[4/5], object-cover) so the zoomed-in shots fill the frame.
 */
function OrnitharchTile({
  bird,
  record,
  index = 0,
}: {
  bird: FlockBird;
  record?: HatchRecord;
  index?: number;
}) {
  const age = getBirdAgeLabel(bird.hatch_date, bird.hatch_date_estimated);
  const hatchStr = fmtDate(bird.hatch_date);
  const eggColor = record?.egg_color?.toLowerCase();
  const dam = record?.parent_hen || null;
  const sire = shortSire(record?.parent_rooster_window);
  const henriettaLine = dam === "Henrietta";
  // Filename convention: pipeline commits low-confidence IDs with a
  // "-suspected-" marker. Surface that honestly instead of hiding it.
  const photoUnconfirmed = bird.photo?.includes("suspected") ?? false;
  const pool = buildPortraitPool(bird, record);
  const growthPhotos = buildBirdGrowthPhotos(bird);

  return (
    <div className="bg-field-card border border-field-border rounded-lg overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[4/5] bg-field-wash">
        {pool.length > 0 ? (
          <OrnitharchPortrait
            photos={pool}
            stagger={index}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-field-muted">
            <span className="text-4xl">🐣</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-widest">
              portrait pending
            </span>
            <span className="text-[0.65rem] max-w-[80%] text-center text-field-muted">
              photographed, not yet committed to the repo
            </span>
          </div>
        )}
        {henriettaLine && (
          <span className="absolute top-2 left-2 bg-black/60 border border-amber-500/40 text-amber-200/90 font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded">
            Henrietta line
          </span>
        )}
        {photoUnconfirmed && (
          <span className="absolute bottom-2 right-2 bg-black/60 border border-white/25 text-white/80 font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded">
            photo ID unconfirmed
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-lg font-bold font-serif text-field-ink">{bird.name}</h3>
          {bird.formerly && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-field-muted">
              fka {bird.formerly}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {bird.leg_band && <BandChip band={bird.leg_band} />}
          {eggColor === "blue" && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-sky-500/15 border border-sky-400/40 text-sky-700 px-2 py-0.5 rounded">
              blue egg
            </span>
          )}
          {eggColor === "brown" && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-amber-500/15 border border-amber-400/40 text-field-honey-ink px-2 py-0.5 rounded">
              brown egg
            </span>
          )}
          {isRooster(bird.egg_color) && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-field-bg border border-field-border text-field-muted px-2 py-0.5 rounded">
              cockerel
            </span>
          )}
        </div>

        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-field-muted space-y-0.5 pt-2 border-t border-field-hairline mt-auto">
          {hatchStr && (
            <div>
              <span className="text-field-muted">HATCH</span>{" "}
              <span className="text-field-ink">{hatchStr}</span>
            </div>
          )}
          {age && (
            <div>
              <span className="text-field-muted">AGE</span>{" "}
              <span className="text-field-ink">{age}</span>
            </div>
          )}
          <div>
            <span className="text-field-muted">DAM</span>{" "}
            <span className="text-field-ink">{dam ?? "unconfirmed"}</span>
          </div>
          {sire && (
            <div>
              <span className="text-field-muted">SIRE</span>{" "}
              <span className="text-field-ink normal-case">{sire}</span>
            </div>
          )}
        </div>

        {/* Growth strip — every dated hatch-record photo, oldest to newest.
            Self-suppresses below two photos (most June/July hatches so far). */}
        <GrowthStrip name={bird.name} photos={growthPhotos} />
      </div>
    </div>
  );
}

function BirdCard({
  bird,
  breedProfile,
  isRooster: roosterFlag,
}: {
  bird: FlockBird;
  breedProfile: BreedProfile | null;
  isRooster?: boolean;
}) {
  const eggColorBadgeColors: Record<string, string> = {
    "Brown to dark brown": "bg-amber-700 text-white",
    Brown: "bg-amber-700 text-white",
    "Brown (large)": "bg-amber-700 text-white",
    "Tan to light brown": "bg-yellow-600 text-white",
    "Blue, green, or pink (highly variable)": "bg-sky-500 text-white",
    "Blue or green": "bg-sky-500 text-white",
    Blue: "bg-sky-500 text-white",
    "N/A (rooster)": "bg-gray-400 text-white",
  };

  const hatchStr = fmtDate(bird.hatch_date);
  // Live age computed from hatch_date — the single source of truth.
  const dynamicAge = getBirdAgeLabel(bird.hatch_date, bird.hatch_date_estimated);
  // Aging timeline from the bird's own photo ledger (self-suppresses below 2).
  const growthPhotos = buildBirdGrowthPhotos(bird);

  const instrumentFields: Array<{ label: string; value: string }> = [];
  if (hatchStr)
    instrumentFields.push({
      label: "HATCH",
      value: bird.hatch_date_estimated ? `~${hatchStr}` : hatchStr,
    });
  if (dynamicAge) instrumentFields.push({ label: "AGE", value: dynamicAge });
  const ln = LINEAGE[bird.name];
  if (ln?.dam && ln?.sire)
    instrumentFields.push({ label: "PAIR", value: `${ln.dam} × ${ln.sire}` });
  else if (ln?.dam) instrumentFields.push({ label: "DAM", value: ln.dam });

  return (
    <div className="bg-field-card rounded-xl border border-field-border hover:border-field-accent-line transition-colors overflow-hidden flex flex-col">
      {/* Photo */}
      <div className="relative w-full h-56 bg-field-wash">
        {bird.photo ? (
          <Image
            src={`/photos/${bird.photo}`}
            alt={bird.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <span className="text-4xl text-field-muted">
              {roosterFlag ? "🐓" : "🐣"}
            </span>
            <span className="text-[0.65rem] uppercase tracking-widest text-field-muted font-medium">
              Photo coming
            </span>
          </div>
        )}
        {roosterFlag && (
          <div className="absolute top-3 right-3">
            <span className="bg-black/60 border border-white/25 text-white text-xs font-mono font-bold px-2 py-1 rounded-full">
              ROOSTER
            </span>
          </div>
        )}
      </div>

      {/* Instrument strip — durable facts: hatch, age, lineage. */}
      {instrumentFields.length > 0 && (
        <div className="bg-field-bg text-field-ink font-mono text-[0.65rem] uppercase tracking-widest px-4 py-2 border-y border-field-border flex flex-wrap gap-x-3 gap-y-1">
          {instrumentFields.map((f) => (
            <span key={f.label}>
              <span className="text-field-muted">{f.label}</span>{" "}
              <span className="text-field-ink">{f.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <h3 className="text-xl font-bold font-serif text-field-ink">{bird.name}</h3>
          {bird.formerly && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-field-muted">
              fka {bird.formerly}
            </span>
          )}
        </div>
        <p className="text-sm text-field-accent font-medium mb-3">{bird.breed}</p>

        {/* Badges. Age lives in the instrument strip; egg color is the only badge. */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bird.leg_band && <BandChip band={bird.leg_band} />}
          {bird.egg_color !== "N/A (rooster)" && (
            <span
              className={`inline-block text-xs px-2 py-1 rounded ${eggColorBadgeColors[bird.egg_color] || "bg-gray-500 text-white"}`}
            >
              {bird.egg_color} eggs
            </span>
          )}
        </div>

        {/* Personality */}
        {bird.temperament && (
          <p className="text-sm text-field-muted mb-3 italic">&ldquo;{bird.temperament}&rdquo;</p>
        )}

        {/* Color description */}
        {bird.color_description && (
          <p className="text-xs text-field-muted mb-3">{bird.color_description}</p>
        )}

        {/* Notes — first sentence only. */}
        {bird.notes && (
          <p className="text-xs text-field-muted border-t border-field-hairline pt-3 mt-auto">
            {firstSentence(bird.notes)}
          </p>
        )}

        {/* Breed fun fact */}
        {breedProfile?.fun_fact && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded p-2.5 mt-3">
            <p className="text-xs text-field-honey-ink">💡 {breedProfile.fun_fact}</p>
          </div>
        )}

        {/* Aging timeline — every photo we have of this bird, oldest to newest.
            Self-suppresses below two photos. */}
        <div className="mt-3">
          <GrowthStrip name={bird.name} photos={growthPhotos} />
        </div>
      </div>
    </div>
  );
}
