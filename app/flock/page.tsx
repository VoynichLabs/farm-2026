/**
 * Author: Claude Fable 5 (prev Claude Opus 4.8, 07-Jun-2026)
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
 *   The section leads with the legacy story: both sires (Little Big Red
 *   Junior, his son Whitey Red Legs) and dam Henrietta are gone; the
 *   eleven carry them forward. Counts are derived, never literals.
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
 *   Layout (top → bottom):
 *     1. Terminal hero strip + serif title
 *     2. THE ORNITHARCHS — narrative, founders' memorial strip, cohort wall
 *     3. Incubator panel (conditional)
 *     4. BREEDING LINE panel (second-generation chain)
 *     5. Birdcatraz / Coop / Hens / Roosters roster sections
 *     6. Breed Notes
 *     7. In Memoriam
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
} from "@/lib/content";
import Image from "next/image";
import FlockGemStrip from "@/app/components/flock/FlockGemStrip";
import OrnitharchPortrait, {
  type RotatingPhoto,
} from "@/app/components/flock/OrnitharchPortrait";
import GrowthStrip from "@/app/components/flock/GrowthStrip";
import type { ThenNowPhoto } from "@/app/components/hatches/ThenAndNow";

export const metadata: Metadata = {
  title: "The Flock",
  description:
    "Hatch dates, names, lineage, and losses. The breeding-program record for Farm 2026, Hampton CT — including the eleven Ornitharchs hatched on the farm this year.",
};

const isRooster = (eggColor: string) => eggColor === "N/A (rooster)";

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

// GrowthStrip's data source (E5, docs/16-Jul-2026-birdcatraz-era-refresh-plan.md
// Part E): every dated, showcase-worthy hatch-record photo for one bird, oldest
// first, with the same date/age labels the rotating portrait pool uses above —
// no second date-math or file-matching path. Unlike buildPortraitPool, this
// does NOT fold in the live flock-profile portrait (bird.photo has no date to
// place it in a timeline); it's the hatch record's own photos array only.
// GrowthStrip itself is the single self-suppression point (<2 photos → null).
const buildGrowthPhotos = (bird: FlockBird, record?: HatchRecord): ThenNowPhoto[] => {
  if (!record) return [];
  return record.photos
    .filter((ph) => ph.path && ph.showcase !== false)
    .sort((a, b) => (a.date ?? "9999").localeCompare(b.date ?? "9999"))
    .map((ph) => ({
      src: webPath(ph.path),
      dateLabel: fmtDate(ph.date) || "—",
      ageLabel: throwbackTag(record.hatch_date, ph.date),
      caption: ph.caption,
      alt: ph.caption || `${bird.name}, dated photo`,
    }));
};

export default function FlockPage() {
  const flockData = getFlockProfiles();

  if (!flockData) {
    return (
      <main className="min-h-screen">
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold font-serif text-white mb-4">The Flock</h1>
          <p className="text-guardian-muted">No flock data available.</p>
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

  // Founders — all deceased; offspring counts derived from the records.
  const henriettaChicks = hatchRecords.filter((r) => r.parent_hen === "Henrietta");
  const lbrjChicks = hatchRecords.filter((r) => r.parent_rooster_window?.includes("LBRJ"));
  const whiteyChicks = hatchRecords.filter((r) => r.parent_rooster_window?.includes("Whitey"));
  const founders = [
    {
      bird: deceasedBirds.find((b) => b.name === "Henrietta"),
      role: "DAM",
      legacy: `Dam of ${henriettaChicks.length} — the only brown-egg layer, so every brown-egg chick is hers, and all ${henriettaChicks.length} carry her name. Her last two hatched on June 3rd; she passed peacefully in her sleep two days later.`,
    },
    {
      bird: deceasedBirds.find((b) => b.name === "Little Big Red Junior"),
      role: "SIRE",
      legacy: `Lead rooster; probable sire of ${lbrjChicks.length}. Lost to a predator on April 24th — Horstabird's rust facial feathers confirmed him as her sire six weeks after he was gone.`,
    },
    {
      bird: deceasedBirds.find((b) => b.name === "Whitey Red Legs"),
      role: "SIRE",
      legacy: `Little Big Red Junior's own son; paternity window for the ${whiteyChicks.length} June-clutch chicks. Disappeared without a trace on May 1st.`,
    },
  ].filter((f): f is typeof f & { bird: FlockBird } => Boolean(f.bird));

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
        className="relative min-h-[42vh] flex items-end justify-start bg-cover bg-center bg-no-repeat bg-guardian-card"
        style={{ backgroundImage: "url('/photos/june-2026/morning-flock-IMG_5744.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />

        {/* Instrument strip — terminal palette over the hero photo */}
        <div className="absolute top-0 inset-x-0 z-20 bg-guardian-bg/85 border-b border-guardian-border/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.7rem] uppercase tracking-widest text-guardian-text/80">
            <span className="text-guardian-accent">[ROSTER]</span>
            <span>flock-profiles.json</span>
            <span className="text-guardian-muted">·</span>
            <span>
              {ornitharchCount}<span className="text-guardian-muted"> ornitharchs</span>
            </span>
            <span className="text-guardian-muted">·</span>
            <span>
              {hensCount}<span className="text-guardian-muted"> hens</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-12 pt-20 md:px-16 max-w-4xl">
          <p className="text-guardian-text/70 text-sm font-medium tracking-widest uppercase mb-2">
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
          <p className="mt-4">
            <Link
              href="/hatches"
              className="inline-flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-widest text-guardian-text bg-guardian-bg/70 hover:bg-guardian-bg/90 border border-guardian-border px-3 py-2 rounded transition-colors"
            >
              [HATCHES 2026] →
              <span className="text-guardian-muted normal-case tracking-normal font-sans">
                per-chick records · phenotype log · predictions
              </span>
            </Link>
          </p>
        </div>
      </section>

      {/* THE ORNITHARCHS — the year's headline story. Every bird hatched on
          the farm in 2026, and the founding generation they inherit from. */}
      {ornitharchCount > 0 && (
        <section className="border-b border-guardian-border">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
              [THE ORNITHARCHS] · {ornitharchCount} hatched on the farm · 2026
            </p>
            <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-4">
              The Ornitharchs
            </h2>
            <div className="max-w-3xl space-y-3 text-guardian-text/85 leading-relaxed mb-10">
              <p>
                <em>Ornitharch</em> is what we call any bird that hatched here,
                on the farm, in our incubators, from our flock&apos;s eggs.
                There are {ornitharchCount} of them this year, across four
                clutches — and every one of them is an inheritance, because the
                whole founding generation behind them is gone.
              </p>
              <p>
                Little Big Red Junior sired the spring clutches and was lost to
                a predator in late April. His son Whitey Red Legs covered the
                June clutch, then disappeared without a trace a week after it
                was set. Henrietta — the flock&apos;s only brown-egg layer —
                gave three chicks who carry her name, and died peacefully two
                days after the last of them hatched. The hens who laid the rest
                of these eggs still run the yard.
              </p>
              <p>
                Most of the {ornitharchCount} came out of blue eggs, hatched
                with blue eyes, and — with a little luck — the pullets among
                them will lay blue eggs of their own next spring.
              </p>
            </div>

            {/* Founders' memorial strip */}
            <div className="grid gap-4 md:grid-cols-3 mb-12">
              {founders.map(({ bird, role, legacy }) => (
                <div
                  key={bird.name}
                  className="bg-guardian-card border border-guardian-border rounded-lg overflow-hidden flex flex-col"
                >
                  <div className="relative w-full h-44 bg-guardian-hover/30">
                    {bird.photo && bird.photo_throwback ? (
                      <OrnitharchPortrait
                        photos={[
                          { src: `/photos/${bird.photo}`, tag: "portrait", alt: bird.name },
                          {
                            src: `/photos/${bird.photo_throwback}`,
                            tag: bird.photo_throwback_label ?? "throwback",
                            alt: `${bird.name}, earlier years`,
                          },
                        ]}
                        stagger={2}
                        sizes="(min-width: 768px) 33vw, 100vw"
                      />
                    ) : bird.photo ? (
                      <Image
                        src={`/photos/${bird.photo}`}
                        alt={bird.name}
                        fill
                        sizes="(min-width: 768px) 33vw, 100vw"
                        className="object-cover grayscale-[35%]"
                      />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-1 text-guardian-muted">
                        <span className="text-3xl">🐓</span>
                        <span className="font-mono text-[0.6rem] uppercase tracking-widest">
                          no committed portrait
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 bg-guardian-bg/90 border border-guardian-border text-guardian-text/80 font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded">
                      in memoriam · {role}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col gap-1.5 flex-1">
                    <h3 className="text-lg font-bold font-serif text-white">{bird.name}</h3>
                    <p className="font-mono text-[0.65rem] uppercase tracking-widest text-guardian-muted">
                      {fmtDate(bird.hatch_date) ? `${bird.hatch_date_estimated ? "~" : ""}${fmtDate(bird.hatch_date)} — ` : ""}
                      {fmtDate(bird.deceased_date) ?? "—"}
                    </p>
                    <p className="text-sm text-guardian-text/75 leading-relaxed">{legacy}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cohort walls */}
            {cohorts.map((cohort, ci) => (
              <div key={cohort.clutchId} className="mb-10 last:mb-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4 border-b border-guardian-border/60 pb-2">
                  <span className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent">
                    Cohort {ci + 1} · hatched {cohort.span}
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-widest text-guardian-muted">
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
                className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent hover:text-emerald-300"
              >
                full hatch records → /hatches
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* Incubator — what's in the desk incubator right now. */}
      {incubating.length > 0 && (
        <section className="bg-guardian-bg text-guardian-text border-b border-guardian-border">
          <div className="max-w-6xl mx-auto px-4 py-10">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
              [INCUBATING]
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-white mb-2">
              In the Incubator
            </h2>
            <p className="text-guardian-text/70 text-sm mb-6 max-w-3xl">
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
                    className="bg-guardian-card border border-guardian-border rounded-lg p-5 flex flex-col gap-2"
                  >
                    <h3 className="text-lg font-bold font-serif text-white">
                      {c.label}
                    </h3>
                    <div className="font-mono text-[0.65rem] uppercase tracking-widest text-guardian-text/70 space-y-0.5">
                      {set && (
                        <div>
                          <span className="text-guardian-muted">SET</span>{" "}
                          <span className="text-guardian-text">{set}</span>
                        </div>
                      )}
                      {due && (
                        <div>
                          <span className="text-guardian-muted">DUE</span>{" "}
                          <span className="text-guardian-text">{due}</span>
                        </div>
                      )}
                      {typeof c.egg_count === "number" && (
                        <div>
                          <span className="text-guardian-muted">EGGS</span>{" "}
                          <span className="text-guardian-text">{c.egg_count}</span>
                        </div>
                      )}
                      {c.egg_color && (
                        <div>
                          <span className="text-guardian-muted">COLOR</span>{" "}
                          <span className="text-guardian-text">{c.egg_color}</span>
                        </div>
                      )}
                      {c.dam && (
                        <div>
                          <span className="text-guardian-muted">DAM</span>{" "}
                          <span className="text-guardian-text">{c.dam}</span>
                        </div>
                      )}
                      {c.sire && (
                        <div>
                          <span className="text-guardian-muted">SIRE</span>{" "}
                          <span className="text-guardian-text">{c.sire}</span>
                        </div>
                      )}
                    </div>
                    {c.notes && (
                      <p className="text-xs text-guardian-text/60 pt-2 border-t border-guardian-border/50 mt-1">
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
        <section className="bg-guardian-bg text-guardian-text border-b border-guardian-border">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
              [BREEDING LINE]
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-white mb-2">
              First Second-Generation Hatch
            </h2>
            <p className="text-guardian-text/70 text-sm mb-8 max-w-3xl">
              Birdadotta, hatched 25 April 2026 from a blue egg laid by
              Birdadonna, is the first chick on the farm with both parents
              in the program&apos;s own records.{" "}
              <span className="text-guardian-text/50">
                Birdsula × Little Big Red Junior → Birdadonna → Birdadotta.
              </span>
            </p>

            <div className="grid gap-4 md:grid-cols-4">
              {lineageGenetic.map((b) => {
                const ln = LINEAGE[b.name];
                const isLost = b.status === "deceased";
                const hatchFmt = fmtDate(b.hatch_date);
                const dateStr = isLost
                  ? fmtDate(b.deceased_date) || "—"
                  : hatchFmt
                    ? b.hatch_date_estimated ? `~${hatchFmt}` : hatchFmt
                    : "—";
                const dateLabel = isLost ? "LOST" : "HATCH";
                return (
                  <div
                    key={b.name}
                    className="bg-guardian-card border border-guardian-border rounded-lg overflow-hidden flex flex-col"
                  >
                    <div className="relative w-full h-40 bg-guardian-hover/40">
                      {b.photo ? (
                        <Image
                          src={`/photos/${b.photo}`}
                          alt={b.name}
                          fill
                          sizes="(min-width: 768px) 25vw, 50vw"
                          className={`object-cover ${isLost ? "grayscale opacity-80" : ""}`}
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-3xl text-guardian-muted">
                          🐣
                        </div>
                      )}
                      {isLost && (
                        <div className="absolute top-2 right-2">
                          <span className="bg-guardian-bg/90 text-guardian-text/80 text-[0.6rem] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-guardian-border">
                            in memoriam
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-2 flex-1">
                      <h3 className="text-lg font-bold font-serif text-white">{b.name}</h3>
                      <p className="text-xs text-guardian-text/70">{b.breed}</p>
                      <div className="font-mono text-[0.65rem] uppercase tracking-widest text-guardian-text/60 space-y-0.5 mt-auto pt-2 border-t border-guardian-border/50">
                        <div>
                          <span className="text-guardian-muted">{dateLabel}</span>{" "}
                          <span className="text-guardian-text">{dateStr}</span>
                        </div>
                        {ln?.dam && (
                          <div>
                            <span className="text-guardian-muted">DAM</span>{" "}
                            <span className="text-guardian-text">{ln.dam}</span>
                          </div>
                        )}
                        {ln?.sire && (
                          <div>
                            <span className="text-guardian-muted">SIRE</span>{" "}
                            <span className="text-guardian-text">{ln.sire}</span>
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
            [BIRDCATRAZ]
          </p>
          <h2 className="text-2xl font-bold font-serif text-white mb-2">
            In Birdcatraz
          </h2>
          <p className="text-guardian-text/70 mb-6 text-sm max-w-3xl">
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
            [COOP]
          </p>
          <h2 className="text-2xl font-bold font-serif text-white mb-2">
            Growing Out in the Coop
          </h2>
          <p className="text-guardian-text/70 mb-6 text-sm max-w-3xl">
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
            [LAYING STOCK]
          </p>
          <h2 className="text-2xl font-bold font-serif text-white mb-2">The Hens</h2>
          <p className="text-guardian-text/70 mb-6 text-sm max-w-3xl">
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
            [ROOSTER]
          </p>
          <h2 className="text-2xl font-bold font-serif text-white mb-2">
            {roosters.length === 1 ? "The Rooster" : "The Roosters"}
          </h2>
          <p className="text-guardian-text/70 mb-8 text-sm">
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
      <section className="bg-guardian-card/40 border-y border-guardian-border">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
            [BREEDS]
          </p>
          <h2 className="text-3xl font-bold font-serif text-white mb-2">Breed Notes</h2>
          <p className="text-guardian-text/70 mb-10 max-w-3xl">
            What each breed brings to the flock.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(breeds).map(([breedName, profile]) => (
              <div
                key={breedName}
                className="bg-guardian-card rounded-lg border border-guardian-border border-l-4 border-l-guardian-accent p-6"
              >
                <h3 className="text-xl font-bold font-serif text-white mb-2">{breedName}</h3>
                <p className="text-guardian-text/70 text-sm mb-4 leading-relaxed">{profile.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 text-guardian-text/90">
                  <div>
                    <p className="font-mono font-semibold text-guardian-muted text-xs uppercase tracking-wide mb-1">Egg Color</p>
                    <p>{profile.egg_color}</p>
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-guardian-muted text-xs uppercase tracking-wide mb-1">Annual Eggs</p>
                    <p>{profile.eggs_per_year}</p>
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-guardian-muted text-xs uppercase tracking-wide mb-1">Temperament</p>
                    <p>{profile.temperament}</p>
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-guardian-muted text-xs uppercase tracking-wide mb-1">Cold Hardiness</p>
                    <p>{profile.cold_hardiness}</p>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/25 rounded p-3">
                  <p className="text-sm text-amber-200/90">
                    <span className="font-semibold">💡 </span>
                    {profile.fun_fact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* In Memoriam — operational record, not apologetic sidebar. */}
      {deceasedBirds.length > 0 && (
        <section className="bg-guardian-bg text-guardian-text">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
              [LOST]
            </p>
            <h2 className="text-xl font-bold font-serif text-white mb-1">In Memoriam</h2>
            <p className="text-guardian-text/60 mb-6 text-sm">
              Predator losses are part of the program. The flock rebuilds, the
              record stays.
            </p>
            <ul className="font-mono text-xs space-y-2">
              {deceasedBirds.map((bird, idx) => {
                const lost = fmtDate(bird.deceased_date);
                return (
                  <li
                    key={idx}
                    className="flex flex-wrap gap-x-3 gap-y-1 border-b border-guardian-border/40 pb-2 last:border-b-0"
                  >
                    {lost && (
                      <span className="text-guardian-muted uppercase tracking-widest">
                        {lost}
                      </span>
                    )}
                    <span className="text-white font-sans font-medium">{bird.name}</span>
                    <span className="text-guardian-text/70 font-sans">{bird.breed}</span>
                    {bird.cause_of_death && (
                      <span className="text-guardian-text/50 italic font-sans">
                        {bird.cause_of_death}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-guardian-card border-t border-guardian-border text-guardian-muted text-center py-8 text-sm">
        <p className="font-serif font-bold text-guardian-text/80 mb-1">Farm 2026</p>
        <p>
          Hampton, CT —{" "}
          <Link href="/" className="hover:text-guardian-text">
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
  const growthPhotos = buildGrowthPhotos(bird, record);

  return (
    <div className="bg-guardian-card border border-guardian-border rounded-lg overflow-hidden flex flex-col">
      <div className="relative w-full aspect-[4/5] bg-guardian-hover/30">
        {pool.length > 0 ? (
          <OrnitharchPortrait
            photos={pool}
            stagger={index}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-guardian-muted">
            <span className="text-4xl">🐣</span>
            <span className="font-mono text-[0.65rem] uppercase tracking-widest">
              portrait pending
            </span>
            <span className="text-[0.65rem] max-w-[80%] text-center text-guardian-muted/80">
              photographed, not yet committed to the repo
            </span>
          </div>
        )}
        {henriettaLine && (
          <span className="absolute top-2 left-2 bg-guardian-bg/90 border border-amber-500/40 text-amber-200/90 font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded">
            Henrietta line
          </span>
        )}
        {photoUnconfirmed && (
          <span className="absolute bottom-2 right-2 bg-guardian-bg/90 border border-guardian-border text-guardian-text/70 font-mono text-[0.6rem] uppercase tracking-widest px-2 py-0.5 rounded">
            photo ID unconfirmed
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-baseline gap-2 flex-wrap">
          <h3 className="text-lg font-bold font-serif text-white">{bird.name}</h3>
          {bird.formerly && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-guardian-muted">
              fka {bird.formerly}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {eggColor === "blue" && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-sky-500/15 border border-sky-400/40 text-sky-300 px-2 py-0.5 rounded">
              blue egg
            </span>
          )}
          {eggColor === "brown" && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-amber-500/15 border border-amber-400/40 text-amber-300 px-2 py-0.5 rounded">
              brown egg
            </span>
          )}
          {isRooster(bird.egg_color) && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-guardian-bg border border-guardian-border text-guardian-text/80 px-2 py-0.5 rounded">
              cockerel
            </span>
          )}
        </div>

        <div className="font-mono text-[0.65rem] uppercase tracking-widest text-guardian-text/70 space-y-0.5 pt-2 border-t border-guardian-border/50 mt-auto">
          {hatchStr && (
            <div>
              <span className="text-guardian-muted">HATCH</span>{" "}
              <span className="text-guardian-text">{hatchStr}</span>
            </div>
          )}
          {age && (
            <div>
              <span className="text-guardian-muted">AGE</span>{" "}
              <span className="text-guardian-text">{age}</span>
            </div>
          )}
          <div>
            <span className="text-guardian-muted">DAM</span>{" "}
            <span className="text-guardian-text">{dam ?? "unconfirmed"}</span>
          </div>
          {sire && (
            <div>
              <span className="text-guardian-muted">SIRE</span>{" "}
              <span className="text-guardian-text normal-case">{sire}</span>
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
    <div className="bg-guardian-card rounded-xl border border-guardian-border hover:border-guardian-hover transition-colors overflow-hidden flex flex-col">
      {/* Photo */}
      <div className="relative w-full h-56 bg-guardian-hover/30">
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
            <span className="text-4xl text-guardian-muted">
              {roosterFlag ? "🐓" : "🐣"}
            </span>
            <span className="text-[0.65rem] uppercase tracking-widest text-guardian-muted font-medium">
              Photo coming
            </span>
          </div>
        )}
        {roosterFlag && (
          <div className="absolute top-3 right-3">
            <span className="bg-guardian-bg/90 border border-guardian-border text-guardian-text text-xs font-mono font-bold px-2 py-1 rounded-full">
              ROOSTER
            </span>
          </div>
        )}
      </div>

      {/* Instrument strip — durable facts: hatch, age, lineage. */}
      {instrumentFields.length > 0 && (
        <div className="bg-guardian-bg text-guardian-text font-mono text-[0.65rem] uppercase tracking-widest px-4 py-2 border-y border-guardian-border flex flex-wrap gap-x-3 gap-y-1">
          {instrumentFields.map((f) => (
            <span key={f.label}>
              <span className="text-guardian-muted">{f.label}</span>{" "}
              <span className="text-guardian-text">{f.value}</span>
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
          <h3 className="text-xl font-bold font-serif text-white">{bird.name}</h3>
          {bird.formerly && (
            <span className="font-mono text-[0.6rem] uppercase tracking-widest text-guardian-muted">
              fka {bird.formerly}
            </span>
          )}
        </div>
        <p className="text-sm text-guardian-accent font-medium mb-3">{bird.breed}</p>

        {/* Badges. Age lives in the instrument strip; egg color is the only badge. */}
        <div className="flex flex-wrap gap-2 mb-4">
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
          <p className="text-sm text-guardian-text/70 mb-3 italic">&ldquo;{bird.temperament}&rdquo;</p>
        )}

        {/* Color description */}
        {bird.color_description && (
          <p className="text-xs text-guardian-muted mb-3">{bird.color_description}</p>
        )}

        {/* Notes — first sentence only. */}
        {bird.notes && (
          <p className="text-xs text-guardian-text/60 border-t border-guardian-border/50 pt-3 mt-auto">
            {firstSentence(bird.notes)}
          </p>
        )}

        {/* Breed fun fact */}
        {breedProfile?.fun_fact && (
          <div className="bg-amber-500/10 border border-amber-500/25 rounded p-2.5 mt-3">
            <p className="text-xs text-amber-200/90">💡 {breedProfile.fun_fact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
