/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Homepage flock-preview strip — 8 representative bird tiles with an
 *   optional age badge when a hatch date is present. Phase 1 keeps the
 *   inline array verbatim from app/page.tsx (Phase 3 will replace it with
 *   getFlockProfiles() and derive the tile set from the SSoT).
 * SRP/DRY check: Pass in Phase 1 (extraction-only); will improve in Phase 3
 *   when this component starts reading from content/flock-profiles.json.
 *   See docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md.
 */
import { getChickAgeLabel } from "@/lib/content";
import SectionHeader from "@/app/components/primitives/SectionHeader";
import BirdCard from "@/app/components/primitives/BirdCard";

const BIRD_TILES = [
  { photo: "/photos/april-2026/birdadette-fresh-hatch.jpg", name: "Birdadette", breed: "Easter Egger — hatched Apr 6", hatchDate: "2026-04-06" },
  { photo: "/photos/birds/henrietta.jpg", name: "Henrietta", breed: "Golden Laced Wyandotte" },
  { photo: "/photos/birds/whitey-red-legs.jpg", name: "Whitey Red Legs", breed: "EE × RIR Rooster" },
  { photo: "/photos/birds/ee-hen-1.jpg", name: "EE Hen 1", breed: "Easter Egger" },
  { photo: "/photos/birds/ee-hen-2.jpg", name: "EE Hen 2", breed: "Easter Egger" },
  { photo: "/photos/april-2026/turkey-poult-in-hand.jpg", name: "Turkey Poults (3)", breed: "White Broad-Breasted", hatchDate: "2026-03-31" },
  { photo: "/photos/april-2026/cackle-hatchery-arrival.jpg", name: "New Arrivals (15)", breed: "Cackle Hatchery specials", hatchDate: "2026-04-08" },
  { photo: "/photos/april-2026/chicks-samsung-enrichment.jpg", name: "Enrichment Hour", breed: "Chicks watching the Samsung" },
];

export default function FlockPreviewStrip() {
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
          {BIRD_TILES.map((bird) => (
            <BirdCard
              key={bird.name}
              name={bird.name}
              breed={bird.breed}
              photo={bird.photo}
              ageLabel={"hatchDate" in bird ? getChickAgeLabel(bird.hatchDate) : null}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
