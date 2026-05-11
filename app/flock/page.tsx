/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 2026-05-11
 * PURPOSE: /flock — current-state flock roster + breed reference guide.
 *   Data source is content/flock-profiles.json via lib/content. Active birds
 *   are grouped by where they live RIGHT NOW (brooder & nestbox → coop
 *   growing-out → adult hens → roosters) so visitors land on what's actively
 *   happening on the farm — chicks hatching, poults growing, the desk
 *   incubator turning eggs into birds. Adult hens come after the brooder
 *   sections, not before, because the story this page tells is "the flock is
 *   rebuilding." In Memoriam moves to a compact text-only tail; it stays
 *   visible (the losses are real and named) but no longer competes with the
 *   nursery for visual weight.
 *   2026-05-11 (Claude Opus 4.7 1M): reorganised by location, individual-bird
 *   count surfaced in hero, deceased section compressed to a small list. Was
 *   previously a flat "Hens & Chicks" grid with In Memoriam as a peer.
 * SRP/DRY check: Pass — pure composition of BirdCard primitives against
 *   flock-profiles data. Group filtering is local, derived from the same
 *   `location` field used by the brooder pipeline on the Guardian side.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getFlockProfiles, getChickAgeLabel } from "@/lib/content";
import Image from "next/image";

export const metadata: Metadata = {
  title: "The Flock",
  description: "What's in the brooder, what's growing out in the coop, and which hens are laying. Hampton, CT.",
};

const isRooster = (eggColor: string) => eggColor === "N/A (rooster)";

// "Turkey poults (3)" → 3; bare names → 1. Lets the hero stat count birds, not
// roster entries, which would otherwise hide the 15-chick Cackle order behind a
// single tile.
const individualCount = (name: string): number => {
  const m = name.match(/\((\d+)\)\s*$/);
  return m ? parseInt(m[1], 10) : 1;
};

const BROODER_LOCATIONS = new Set(["brooder", "desk-brooder", "nesting-box"]);

// First sentence of a notes blob, or the first ~140 chars if no sentence
// terminator lands cleanly. Keeps the card a snapshot, not a timeline.
const firstSentence = (s: string): string => {
  const m = s.match(/^[^.!?]+[.!?]/);
  if (m) return m[0];
  return s.length > 140 ? s.slice(0, 140).trimEnd() + "…" : s;
};

const hatchSortDesc = (a: { hatch_date?: string }, b: { hatch_date?: string }) => {
  // Newest hatch first; entries with no hatch_date fall to the end.
  if (!a.hatch_date && !b.hatch_date) return 0;
  if (!a.hatch_date) return 1;
  if (!b.hatch_date) return -1;
  return b.hatch_date.localeCompare(a.hatch_date);
};

export default function FlockPage() {
  const flockData = getFlockProfiles();

  if (!flockData) {
    return (
      <main className="min-h-screen bg-cream">
        <section className="max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold font-serif mb-4">The Flock</h1>
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
      {/* Hero — leads with what's hatching now, not what was lost */}
      <section
        className="relative min-h-[45vh] flex items-end justify-start bg-cover bg-center bg-no-repeat bg-forest"
        style={{ backgroundImage: "url('/photos/brooder/2026-04-20-mixed-flock.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/30" />
        <div className="relative z-10 px-6 pb-12 md:px-16 max-w-4xl">
          <p className="text-cream/70 text-sm font-medium tracking-widest uppercase mb-2">
            Farm 2026
          </p>
          <h1 className="text-5xl md:text-6xl text-white font-bold font-serif mb-3">
            The Flock
          </h1>
          <p className="text-lg text-white/80">
            {nurseryCount} chicks and poults growing up indoors. A coop of
            juveniles outside. {hensCount} hens laying. Hampton, CT.
          </p>
        </div>
      </section>

      {/* Nursery — the centre of the story right now */}
      {nursery.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 pt-16 pb-8">
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">
            In the Brooder &amp; Nestbox
          </h2>
          <p className="text-forest/70 mb-8 text-sm">
            Newest hatches first. Days-old chicks alongside four-week-olds —
            the desk incubator keeps turning eggs into birds, and Tractor
            Supply runs plus the Cackle Hatchery order fill out the rest.
          </p>
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

      {/* Coop growing-out — juveniles that have left the brooder */}
      {coopGrowing.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">
            Growing Out in the Coop
          </h2>
          <p className="text-forest/70 mb-8 text-sm">
            Out of the brooder, into the coop run. Not yet laying, but figuring
            out the pecking order and the roosting bars.
          </p>
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

      {/* Adult hens */}
      {adultHens.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
          <h2 className="text-2xl font-bold font-serif text-forest mb-2">The Hens</h2>
          <p className="text-forest/70 mb-8 text-sm">
            The laying core of the flock — Wyandotte, Easter Eggers, and the
            yearling that hatched on Boss&apos;s desk a year ago.
          </p>
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

      {/* Roosters — only when at least one is on the property */}
      {roosters.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
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
          <h2 className="text-3xl font-bold font-serif text-forest mb-2">Breed Notes</h2>
          <p className="text-forest/70 mb-10">
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

      {/* In Memoriam — compact, last section before the footer. Named, but not
          competing with the brooder for screen real estate. */}
      {deceasedBirds.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-lg font-bold font-serif mb-1 text-forest/70">In Memoriam</h2>
          <p className="text-forest/50 mb-4 text-xs">
            Lost this season. The flock rebuilds.
          </p>
          <ul className="text-sm text-forest/70 space-y-1">
            {deceasedBirds.map((bird, idx) => (
              <li key={idx} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{bird.name}</span>
                <span className="text-forest/50">·</span>
                <span>{bird.breed}</span>
                {bird.cause_of_death && (
                  <>
                    <span className="text-forest/50">·</span>
                    <span className="text-forest/50 italic">{bird.cause_of_death}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-forest text-cream/50 text-center py-8 text-sm">
        <p className="font-serif font-bold text-cream/70 mb-1">Farm 2026</p>
        <p>Hampton, CT — <Link href="/" className="hover:text-cream/80">← Back to Farm</Link></p>
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
            <span className="text-4xl text-forest/50">{roosterFlag ? "🐓" : "🐣"}</span>
            <span className="text-[0.65rem] uppercase tracking-widest text-forest/50 font-medium">
              Photo coming
            </span>
          </div>
        )}
        {roosterFlag && (
          <div className="absolute top-3 right-3">
            <span className="bg-forest text-cream text-xs font-bold px-2 py-1 rounded-full">ROOSTER</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-bold font-serif text-forest mb-0.5">{bird.name}</h3>
        <p className="text-sm text-wood font-medium mb-3">{bird.breed}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(() => {
            const dynamicAge = getChickAgeLabel(bird.hatch_date);
            return dynamicAge ? (
              <span className="inline-block text-xs bg-amber-500 text-white font-semibold px-2 py-1 rounded">
                {dynamicAge}
              </span>
            ) : (
              <span className="inline-block text-xs bg-forest/10 text-forest px-2 py-1 rounded">
                {bird.age}
              </span>
            );
          })()}
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

        {/* Notes — first sentence only; the JSON's full prose is provenance
            material that tends to go stale fast. Truncate to keep the card a
            current-state snapshot, not a timeline. */}
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
