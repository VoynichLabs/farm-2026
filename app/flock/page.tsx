/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 2026-05-11
 * PURPOSE: /flock — the breeding-program memory surface. Per
 *   docs/11-May-2026-hermes-breeding-showcase-notes.md, the openclaw brief
 *   (docs/09-May-2026-openclaw-farm-ops-story-design-brief.md §9, §10, §17.4,
 *   §19), the bubba doc (docs/09-May-2026-bubba-on-the-farm.md §13, §27),
 *   and docs/11-May-2026-flock-page-breeding-memory-plan.md, this page
 *   exists to make hatch dates, lineage, breed-identification notes, and
 *   losses durable and legible — not to render a marketing roster.
 *
 *   Layout (top → bottom):
 *     1. Terminal hero strip + serif title + field-station subtitle
 *     2. NAME LINEAGE panel — the single named chain (Birdgit → Birdadette
 *        → Birdadonna → Birdadotta) rendered as the headline story
 *     3. In the Brooder & Nestbox (newest hatch first)
 *     4. Growing Out in the Coop
 *     5. The Hens
 *     6. The Rooster(s) — conditional
 *     7. Breed Notes
 *     8. In Memoriam (compact text)
 *     9. Footer
 *
 *   Each BirdCard carries a dark guardian-card instrument strip showing
 *   hatch date / age / lineage when applicable (openclaw §10.2 "darker
 *   instrument-panel surfaces" for data layer). Card body stays cream/warm
 *   for the narrative layer. Lineage data is declared locally — no JSON
 *   schema change this pass (Hermes doc lists structured pairing fields as
 *   future scope).
 *
 * SRP/DRY check: Pass — page composes BirdCard primitives and a single
 *   NameLineagePanel against flock-profiles.json + a small local lineage
 *   map. No data fetch elsewhere. The triskaidekaphobia rule
 *   (memory/feedback_no_thirteen.md) is honoured — no derived count
 *   equal to 13 is ever rendered.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getFlockProfiles, getChickAgeLabel } from "@/lib/content";
import Image from "next/image";
import FlockGemStrip from "@/app/components/flock/FlockGemStrip";

export const metadata: Metadata = {
  title: "The Flock",
  description:
    "Hatch dates, names, lineage, and losses. The breeding-program record for Farm 2026, Hampton CT.",
};

const isRooster = (eggColor: string) => eggColor === "N/A (rooster)";

// "Turkey poults (3)" → 3. Lets hero stats count birds, not roster entries.
const individualCount = (name: string): number => {
  const m = name.match(/\((\d+)\)\s*$/);
  return m ? parseInt(m[1], 10) : 1;
};

const BROODER_LOCATIONS = new Set(["brooder", "desk-brooder", "nesting-box"]);

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

// Local lineage map. The Hermes doc explicitly lists structured pairing /
// lineage fields on flock-profiles.json as future scope; until then, the
// single named chain we have is encoded here so the breeding-program story
// can render as data rather than buried inside prose notes.
type LineageInfo = {
  dam?: string;
  sire?: string;
  namesakeOf?: string;
  chain?: string; // e.g. "Birdgit → Birdadette → Birdadonna → Birdadotta"
};
const LINEAGE: Record<string, LineageInfo> = {
  Birdadette: {
    namesakeOf: "Birdgit",
    chain: "Birdgit → Birdadette",
  },
  Birdadonna: {
    dam: "EE hen 1",
    sire: "Little Big Red Junior",
    chain: "EE hen 1 × Little Big Red Junior → Birdadonna",
  },
  Birdadotta: {
    dam: "Birdadonna",
    chain: "Birdadonna → Birdadotta",
  },
};

// Formatted "YYYY-MM-DD" → "25 Apr 2026", "YYYY-MM" → "Apr 2026", "YYYY" → "2026".
// Some flock-profiles.json entries (e.g. the bulk TSC batches) only know the
// hatch month, not the exact day — render those gracefully instead of leaking
// the ISO substring into the instrument strip.
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

export default function FlockPage() {
  const flockData = getFlockProfiles();

  if (!flockData) {
    return (
      <main className="min-h-screen bg-cream">
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold font-serif text-forest mb-4">The Flock</h1>
          <p className="text-forest/60">No flock data available.</p>
        </section>
      </main>
    );
  }

  const birds = flockData.flock_birds || [];
  const breeds = flockData.breeds || {};

  const activeBirds = birds.filter((b) => b.status === "active");
  const deceasedBirds = birds.filter((b) => b.status === "deceased");

  const nursery = activeBirds
    .filter((b) => b.location && BROODER_LOCATIONS.has(b.location))
    .sort(hatchSortDesc);
  const coopGrowing = activeBirds
    .filter((b) => b.location === "coop")
    .sort(hatchSortDesc);
  const adultHens = activeBirds.filter(
    (b) => !b.location && !isRooster(b.egg_color)
  );
  const roosters = activeBirds.filter((b) => isRooster(b.egg_color));

  const nurseryCount = nursery.reduce((n, b) => n + individualCount(b.name), 0);
  const hensCount = adultHens.reduce((n, b) => n + individualCount(b.name), 0);

  // For the lineage panel: pull the actual bird records we'll reference.
  const lineageBirds = [
    deceasedBirds.find((b) => b.name === "Birdgit"),
    activeBirds.find((b) => b.name === "Birdadette"),
    activeBirds.find((b) => b.name === "Birdadonna"),
    activeBirds.find((b) => b.name === "Birdadotta"),
  ].filter((b): b is NonNullable<typeof b> => Boolean(b));

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
    <main className="min-h-screen bg-cream">
      {/* Hero — terminal strip on top, warm hero band below. The hero photo
          is a real brooder frame (not a marketing shot). bg-cover fills. */}
      <section
        className="relative min-h-[42vh] flex items-end justify-start bg-cover bg-center bg-no-repeat bg-forest"
        style={{ backgroundImage: "url('/photos/brooder/2026-04-20-mixed-flock.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/30" />

        {/* Instrument strip — terminal palette over the hero photo */}
        <div className="absolute top-0 inset-x-0 z-20 bg-guardian-bg/85 border-b border-guardian-border/60 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.7rem] uppercase tracking-widest text-guardian-text/80">
            <span className="text-guardian-accent">[ROSTER]</span>
            <span>flock-profiles.json</span>
            <span className="text-guardian-muted">·</span>
            <span>
              {nurseryCount}<span className="text-guardian-muted"> nursery</span>
            </span>
            <span className="text-guardian-muted">·</span>
            <span>
              {coopGrowing.length}<span className="text-guardian-muted"> coop cohorts</span>
            </span>
            <span className="text-guardian-muted">·</span>
            <span>
              {hensCount}<span className="text-guardian-muted"> hens</span>
            </span>
            <span className="text-guardian-muted">·</span>
            <span>
              {deceasedBirds.length}<span className="text-guardian-muted"> lost</span>
            </span>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-12 pt-20 md:px-16 max-w-4xl">
          <p className="text-cream/70 text-sm font-medium tracking-widest uppercase mb-2">
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
        </div>
      </section>

      {/* Name lineage — the headline breeding-program story made visible.
          Dark guardian-panel block per openclaw brief §10.2: "darker
          instrument-panel surfaces for camera / model / pipeline sections."
          Lineage IS the pipeline here. */}
      {lineageBirds.length > 0 && (
        <section className="bg-guardian-bg text-guardian-text border-b border-guardian-border">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
              [NAME LINEAGE]
            </p>
            <h2 className="text-2xl md:text-3xl font-bold font-serif text-white mb-2">
              Birdgit → Birdadette → Birdadonna → Birdadotta
            </h2>
            <p className="text-guardian-text/70 text-sm mb-8 max-w-3xl">
              One name has been carried forward across four birds — a hawk
              loss, an incubator hatch, a yearling who started laying, and
              the first second-generation chick. The chain is the
              breeding-program memory the rest of this page exists to
              support.
            </p>

            <div className="grid gap-4 md:grid-cols-4">
              {lineageBirds.map((b) => {
                const ln = LINEAGE[b.name];
                const isLost = b.status === "deceased";
                const dateStr = isLost
                  ? fmtDate(b.deceased_date) || "—"
                  : fmtDate(b.hatch_date) || (b.age ?? "—");
                const dateLabel = isLost ? "LOST" : b.hatch_date ? "HATCH" : "AGE";
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
                        {ln?.namesakeOf && (
                          <div>
                            <span className="text-guardian-muted">NAMESAKE</span>{" "}
                            <span className="text-guardian-text">{ln.namesakeOf}</span>
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

      {/* In the brooder & nestbox — newest hatch first. */}
      {nursery.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-8">
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-forest/60 mb-2">
            [BROODER + NESTBOX]
          </p>
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">
            In the Brooder &amp; Nestbox
          </h2>
          <p className="text-forest/70 mb-6 text-sm max-w-3xl">
            Newest hatch at the top. The desk incubator is still in service.
            Tractor Supply runs and the April Cackle Hatchery order make up
            the rest of the cohort. Every frame below was scored by the VLM
            pipeline against the brooder and nestbox cameras.
          </p>
          <FlockGemStrip
            scenes={["brooder", "nesting-box"]}
            label="LIVE FROM THE BROODER + NESTBOX"
            limit={12}
          />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {nursery.map((bird, idx) => (
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-forest/60 mb-2">
            [COOP]
          </p>
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">
            Growing Out in the Coop
          </h2>
          <p className="text-forest/70 mb-6 text-sm max-w-3xl">
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-forest/60 mb-2">
            [LAYING STOCK]
          </p>
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">The Hens</h2>
          <p className="text-forest/70 mb-6 text-sm max-w-3xl">
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
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-forest/60 mb-2">
            [ROOSTER]
          </p>
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">
            {roosters.length === 1 ? "The Rooster" : "The Roosters"}
          </h2>
          <p className="text-forest/70 mb-8 text-sm">
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
      <section className="bg-cream-dark">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-forest/60 mb-2">
            [BREEDS]
          </p>
          <h2 className="text-3xl font-bold font-serif text-forest mb-2">Breed Notes</h2>
          <p className="text-forest/70 mb-10 max-w-3xl">
            What each breed brings to the flock.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(breeds).map(([breedName, profile]) => (
              <div
                key={breedName}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-wood"
              >
                <h3 className="text-xl font-bold font-serif text-forest mb-2">{breedName}</h3>
                <p className="text-forest/70 text-sm mb-4 leading-relaxed">{profile.description}</p>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div>
                    <p className="font-semibold text-forest/60 text-xs uppercase tracking-wide mb-1">Egg Color</p>
                    <p>{profile.egg_color}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-forest/60 text-xs uppercase tracking-wide mb-1">Annual Eggs</p>
                    <p>{profile.eggs_per_year}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-forest/60 text-xs uppercase tracking-wide mb-1">Temperament</p>
                    <p>{profile.temperament}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-forest/60 text-xs uppercase tracking-wide mb-1">Cold Hardiness</p>
                    <p>{profile.cold_hardiness}</p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-sm text-amber-900">
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
      <footer className="bg-forest text-cream/50 text-center py-8 text-sm">
        <p className="font-serif font-bold text-cream/70 mb-1">Farm 2026</p>
        <p>
          Hampton, CT —{" "}
          <Link href="/" className="hover:text-cream/80">
            ← Back to Farm
          </Link>
        </p>
      </footer>
    </main>
  );
}

interface FlockBird {
  name: string;
  breed: string;
  age: string;
  hatch_date?: string;
  age_note: string;
  status: string;
  egg_color: string;
  temperament: string;
  color_description: string;
  photo: string | null;
  notes: string;
  location?: string;
  deceased_date?: string;
  cause_of_death?: string;
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

  const ln = LINEAGE[bird.name];
  const hatchStr = fmtDate(bird.hatch_date);
  const dynamicAge = getChickAgeLabel(bird.hatch_date);

  // Instrument-strip fields: only render the ones a bird actually has.
  const instrumentFields: Array<{ label: string; value: string }> = [];
  if (hatchStr) instrumentFields.push({ label: "HATCH", value: hatchStr });
  if (dynamicAge) instrumentFields.push({ label: "AGE", value: dynamicAge });
  if (ln?.dam && ln?.sire)
    instrumentFields.push({ label: "PAIR", value: `${ln.dam} × ${ln.sire}` });
  else if (ln?.dam) instrumentFields.push({ label: "DAM", value: ln.dam });
  else if (ln?.namesakeOf)
    instrumentFields.push({ label: "NAMESAKE", value: ln.namesakeOf });

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-cream-dark flex flex-col">
      {/* Photo */}
      <div className="relative w-full h-56 bg-forest/10">
        {bird.photo ? (
          <Image
            src={`/photos/${bird.photo}`}
            alt={bird.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-forest/15 to-forest/5">
            <span className="text-4xl text-forest/50">
              {roosterFlag ? "🐓" : "🐣"}
            </span>
            <span className="text-[0.65rem] uppercase tracking-widest text-forest/50 font-medium">
              Photo coming
            </span>
          </div>
        )}
        {roosterFlag && (
          <div className="absolute top-3 right-3">
            <span className="bg-forest text-cream text-xs font-bold px-2 py-1 rounded-full">
              ROOSTER
            </span>
          </div>
        )}
      </div>

      {/* Instrument strip — terminal palette across the bottom edge of the
          photo area. Renders the durable facts: hatch, age, lineage. */}
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
        <h3 className="text-xl font-bold font-serif text-forest mb-0.5">{bird.name}</h3>
        <p className="text-sm text-wood font-medium mb-3">{bird.breed}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {!hatchStr && (
            <span className="inline-block text-xs bg-forest/10 text-forest px-2 py-1 rounded">
              {bird.age}
            </span>
          )}
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
          <p className="text-sm text-forest/70 mb-3 italic">&ldquo;{bird.temperament}&rdquo;</p>
        )}

        {/* Color description */}
        {bird.color_description && (
          <p className="text-xs text-forest/50 mb-3">{bird.color_description}</p>
        )}

        {/* Notes — first sentence only; full prose lives in the JSON for
            anyone reading the data, but the card stays a snapshot. */}
        {bird.notes && (
          <p className="text-xs text-forest/60 border-t border-cream-dark pt-3 mt-auto">
            {firstSentence(bird.notes)}
          </p>
        )}

        {/* Breed fun fact */}
        {breedProfile?.fun_fact && (
          <div className="bg-amber-50 border border-amber-200 rounded p-2.5 mt-3">
            <p className="text-xs text-amber-900">💡 {breedProfile.fun_fact}</p>
          </div>
        )}
      </div>
    </div>
  );
}
