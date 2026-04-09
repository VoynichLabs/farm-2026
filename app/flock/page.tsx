import Link from "next/link";
import { getFlockProfiles } from "@/lib/content";
import Image from "next/image";

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

const getEggColorClass = (eggColor: string): string => {
  return eggColorBadgeColors[eggColor] || "bg-gray-500 text-white";
};

const isRooster = (eggColor: string) => eggColor === "N/A (rooster)";

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
  const hens = activeBirds.filter((b) => !isRooster(b.egg_color));
  const roosters = activeBirds.filter((b) => isRooster(b.egg_color));

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
      {/* Hero section */}
      <section
        className="relative min-h-[45vh] flex items-end justify-start bg-cover bg-center"
        style={{ backgroundImage: "url('/photos/flock-group.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 px-6 pb-12 md:px-16 max-w-4xl">
          <p className="text-cream/70 text-sm font-medium tracking-widest uppercase mb-2">
            Farm 2026
          </p>
          <h1 className="text-5xl md:text-6xl text-white font-bold font-serif mb-3">
            The Flock
          </h1>
          <p className="text-lg text-white/80">
            {activeBirds.length} active birds. {deceasedBirds.length} lost this season. {birds.length} total. Hampton, CT.
          </p>
        </div>
      </section>

      {/* Roosters section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <h2 className="text-2xl font-bold font-serif mb-2">The Roosters</h2>
        <p className="text-forest/60 mb-8 text-sm">These two run the yard.</p>
        <div className="grid gap-6 md:grid-cols-2">
          {roosters.map((bird, idx) => (
            <BirdCard key={idx} bird={bird} breedProfile={getBreedProfile(bird.breed)} isRooster />
          ))}
        </div>
      </section>

      {/* Hens section */}
      <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <h2 className="text-2xl font-bold font-serif mb-2">The Hens &amp; Chicks</h2>
        <p className="text-forest/60 mb-8 text-sm">Heritage breeds, Easter Eggers, one desk-hatched chick, turkey poults, and Cackle Hatchery reinforcements.</p>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hens.map((bird, idx) => (
            <BirdCard key={idx} bird={bird} breedProfile={getBreedProfile(bird.breed)} />
          ))}
        </div>
      </section>

      {/* In Memoriam */}
      {deceasedBirds.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-8 pb-16">
          <h2 className="text-2xl font-bold font-serif mb-2">In Memoriam</h2>
          <p className="text-forest/60 mb-8 text-sm">Lost in the first week of April 2026. The flock rebuilds, but they're remembered.</p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deceasedBirds.map((bird, idx) => (
              <BirdCard key={idx} bird={bird} breedProfile={getBreedProfile(bird.breed)} deceased />
            ))}
          </div>
        </section>
      )}

      {/* Breed reference guide */}
      <section className="bg-cream-dark">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold font-serif mb-2">Breed Notes</h2>
          <p className="text-forest/60 mb-10">
            What each breed brings to the flock.
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(breeds).map(([breedName, profile]) => (
              <div
                key={breedName}
                className="bg-white rounded-lg shadow p-6 border-l-4 border-wood"
              >
                <h3 className="text-xl font-bold font-serif mb-2">{breedName}</h3>
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
  age_note: string;
  status: string;
  egg_color: string;
  temperament: string;
  color_description: string;
  photo: string | null;
  notes: string;
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
  deceased,
}: {
  bird: FlockBird;
  breedProfile: BreedProfile | null;
  isRooster?: boolean;
  deceased?: boolean;
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
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-cream-dark flex flex-col ${deceased ? "opacity-75" : ""}`}>
      {/* Photo */}
      <div className="relative w-full h-56 bg-forest/10">
        {bird.photo ? (
          <Image
            src={`/photos/${bird.photo}`}
            alt={bird.name}
            fill
            className={`object-contain ${deceased ? "grayscale" : ""}`}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-5xl text-forest/20">
            {roosterFlag ? "🐓" : "🐔"}
          </div>
        )}
        {roosterFlag && !deceased && (
          <div className="absolute top-3 right-3">
            <span className="bg-forest text-cream text-xs font-bold px-2 py-1 rounded-full">ROOSTER</span>
          </div>
        )}
        {deceased && (
          <div className="absolute top-3 right-3">
            <span className="bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded-full">IN MEMORIAM</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-bold font-serif mb-0.5">{bird.name}</h3>
        <p className="text-sm text-wood font-medium mb-3">{bird.breed}</p>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="inline-block text-xs bg-forest/10 text-forest px-2 py-1 rounded">
            {bird.age}
          </span>
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
          <p className="text-sm text-forest/70 mb-3 italic">"{bird.temperament}"</p>
        )}

        {/* Color description */}
        {bird.color_description && (
          <p className="text-xs text-forest/50 mb-3">{bird.color_description}</p>
        )}

        {/* Notes */}
        {bird.notes && (
          <p className="text-xs text-forest/60 border-t border-cream-dark pt-3 mt-auto">{bird.notes}</p>
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
