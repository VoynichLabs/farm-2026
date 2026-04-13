/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Homepage flock-preview strip — reads the bird roster from the
 *   SSoT at content/flock-profiles.json via getFlockProfiles(). Shows the
 *   active birds that have a photo, with hatch-date-derived age badges
 *   where present. Previously this component had an inline 8-bird array
 *   that duplicated data in the JSON; that array is now deleted.
 * SRP/DRY check: Pass — single source for bird data (flock-profiles.json),
 *   single responsibility (render the strip). See
 *   docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md (Phase 3).
 */
import { getFlockProfiles, getChickAgeLabel } from "@/lib/content";
import SectionHeader from "@/app/components/primitives/SectionHeader";
import BirdCard from "@/app/components/primitives/BirdCard";

const MAX_TILES = 8;

export default function FlockPreviewStrip() {
  const flock = getFlockProfiles();
  const birds = (flock?.flock_birds ?? [])
    .filter((b) => b.status === "active" && b.photo)
    .slice(0, MAX_TILES);

  return (
    <section className="bg-cream-dark">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <SectionHeader
          title="The Flock"
          subtitle="Heritage breeds, Easter Eggers, and a brooder full of new arrivals."
          linkHref="/flock"
          linkLabel="Full roster →"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {birds.map((bird) => (
            <BirdCard
              key={bird.name}
              name={bird.name}
              breed={bird.breed}
              photo={`/photos/${bird.photo}`}
              ageLabel={getChickAgeLabel(bird.hatch_date)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
