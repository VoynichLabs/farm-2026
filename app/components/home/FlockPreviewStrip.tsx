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
import Link from "next/link";
import Image from "next/image";
import { getChickAgeLabel } from "@/lib/content";

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
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold font-serif">The Flock</h2>
            <p className="text-forest/60 mt-2">
              Heritage breeds, Easter Eggers, and a brooder full of new arrivals.
            </p>
          </div>
          <Link href="/flock" className="text-wood hover:underline text-sm font-medium">
            Full roster →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {BIRD_TILES.map((bird) => {
            const ageLabel = "hatchDate" in bird ? getChickAgeLabel(bird.hatchDate) : null;
            return (
              <Link href="/flock" key={bird.name} className="group block">
                <div className="relative h-40 rounded-lg overflow-hidden bg-forest/10">
                  <Image
                    src={bird.photo}
                    alt={bird.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {ageLabel && (
                    <div className="absolute top-2 right-2">
                      <span className="bg-amber-500/90 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full">{ageLabel}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm leading-tight">{bird.name}</p>
                    <p className="text-white/70 text-xs">{bird.breed}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
