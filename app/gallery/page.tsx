'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Photo {
  id: string;
  filename: string;
  folder: string;
  caption: string;
  year?: string;
}

const historyPhotos: Photo[] = [
  {
    id: 'boss-chick-1',
    filename: 'boss-chick-1.jpg',
    folder: 'history',
    caption: 'Hand-raising day-old chicks — the first batch, brooder on the kitchen counter.',
    year: 'Earlier years',
  },
  {
    id: 'boss-chick-2',
    filename: 'boss-chick-2.jpg',
    folder: 'history',
    caption: 'Day-old chicks fresh from the hatchery, warm and confused.',
    year: 'Earlier years',
  },
  {
    id: 'boss-chick-3',
    filename: 'boss-chick-3.jpg',
    folder: 'history',
    caption: 'The learning curve: every chick keeper\'s first week.',
    year: 'Earlier years',
  },
  {
    id: 'boss-silkie',
    filename: 'boss-silkie.jpg',
    folder: 'history',
    caption: 'Holding a Silkie from the previous flock — fluffier than they look.',
    year: 'Earlier years',
  },
  {
    id: 'brooder-chicks',
    filename: 'brooder-chicks.jpg',
    folder: 'history',
    caption: 'Brooder setup from a previous year\'s acquisition. The warmth lamp, the heat plate, the chaos.',
    year: 'Earlier years',
  },
  {
    id: 'garden-tilling',
    filename: 'garden-tilling.jpg',
    folder: 'history',
    caption: 'Tilling the main garden plot behind the coop — the chickens follow the tractor row by row.',
    year: 'Earlier years',
  },
  {
    id: 'birdadonna',
    filename: 'birdadonna.jpg',
    folder: 'history',
    caption: 'Birdadonna the day she hatched — April 2, 2025 — in the incubator on the desk. EE × RIR cross. She\'s now a year old and lays blue eggs.',
    year: '2025',
  },
];

const currentPhotos: Photo[] = [
  {
    id: 'birdadette-hatch',
    filename: 'birdadette-fresh-hatch.jpg',
    folder: 'april-2026',
    caption: 'Birdadette on the keyboard moments after hatching — cracked blue eggshell beside her.',
    year: 'April 2026',
  },
  {
    id: 'command-center',
    filename: 'command-center-setup.jpg',
    folder: '',
    caption: 'The command center — chick brooder, Mac Mini running Guardian, Claude Code on the Dell, Pawel supervising.',
    year: 'April 2026',
  },
  {
    id: 'incubator-hatch',
    filename: 'incubator-hatch-day.jpg',
    folder: 'april-2026',
    caption: 'Birdadette among the remaining eggs in the incubator — the only one to make it.',
    year: 'April 2026',
  },
  {
    id: 'turkey-poult',
    filename: 'turkey-poult-in-hand.jpg',
    folder: 'april-2026',
    caption: 'One of three White Broad-Breasted turkey poults — first turkeys on the farm.',
    year: 'April 2026',
  },
  {
    id: 'cackle-arrival',
    filename: 'cackle-hatchery-arrival.jpg',
    folder: 'april-2026',
    caption: 'Reinforcements from Cackle Hatchery — chicks peeking out of their Priority Mail box.',
    year: 'April 2026',
  },
  {
    id: 'chicks-samsung',
    filename: 'chicks-samsung-enrichment.jpg',
    folder: 'april-2026',
    caption: 'Chicks gathered around the Samsung S7 in the brooder — enrichment programming.',
    year: 'April 2026',
  },
  {
    id: 'coop-installed',
    filename: 'universal-pen-installed.jpg',
    folder: 'coop',
    caption: 'The new Producers Pride Universal Poultry Pen with Guardian solar camera on top.',
    year: 'April 2026',
  },
  {
    id: 'backyard-panorama',
    filename: 'backyard-panorama-deck.jpg',
    folder: 'april-2026',
    caption: 'View from the deck — new coop in the clearing, Connecticut woods behind.',
    year: 'April 2026',
  },
  {
    id: 'hawk-shot',
    filename: 'hawk-shot.jpg',
    folder: '',
    caption: 'Hawks over the property — captured by Farm Guardian during patrol.',
    year: 'April 2026',
  },
  {
    id: 'desk-brooder-pawel',
    filename: 'desk-brooder-pawel-claude.jpg',
    folder: 'april-2026',
    caption: 'Pawel the Yorkie supervises the brooder while Claude plans the next Guardian update.',
    year: 'April 2026',
  },
  {
    id: 'flock-group',
    filename: 'flock-group.jpg',
    folder: '',
    caption: 'The whole flock out in the yard — spring 2026.',
    year: '2026',
  },
];

export default function Gallery() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const allPhotos = [...currentPhotos, ...historyPhotos];
  const selectedPhoto = allPhotos.find((p) => p.id === selectedId);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-forest text-cream py-16 px-4 text-center">
        <h1 className="text-5xl font-bold font-serif mb-3">Farm History</h1>
        <p className="text-cream/70 text-lg max-w-xl mx-auto">
          A few years of chickens, chicks, gardens, and Hampton soil.
        </p>
      </section>

      {/* 2026 Current */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold font-serif mb-6">2026 Season</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
          {currentPhotos.map((photo) => (
            <GalleryCard key={photo.id} photo={photo} onSelect={setSelectedId} />
          ))}
        </div>
      </section>

      {/* Farm history */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold font-serif mb-2">How We Got Here</h2>
        <p className="text-forest/60 text-sm mb-8">
          Years of hand-raising chicks, learning the hard way, and building something real.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {historyPhotos.map((photo) => (
            <GalleryCard key={photo.id} photo={photo} onSelect={setSelectedId} />
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {selectedId && selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-96 bg-forest/5">
              <Image
                src={
                  selectedPhoto.folder
                    ? `/photos/${selectedPhoto.folder}/${selectedPhoto.filename}`
                    : `/photos/${selectedPhoto.filename}`
                }
                alt={selectedPhoto.caption}
                fill
                className="object-contain"
              />
            </div>
            <div className="p-6">
              {selectedPhoto.year && (
                <p className="text-xs font-mono text-forest/40 mb-2">{selectedPhoto.year}</p>
              )}
              <p className="text-forest/80 text-base leading-relaxed mb-4">{selectedPhoto.caption}</p>
              <button
                onClick={() => setSelectedId(null)}
                className="bg-forest hover:bg-forest-light text-cream px-5 py-2 rounded text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-forest text-cream/50 text-center py-8 text-sm">
        <p className="font-serif font-bold text-cream/70 mb-1">Farm 2026</p>
        <p>Hampton, CT — <Link href="/" className="hover:text-cream/80">← Back to Farm</Link></p>
      </footer>
    </main>
  );
}

function GalleryCard({
  photo,
  onSelect,
}: {
  photo: Photo;
  onSelect: (id: string) => void;
}) {
  const src = photo.folder
    ? `/photos/${photo.folder}/${photo.filename}`
    : `/photos/${photo.filename}`;

  return (
    <button
      onClick={() => onSelect(photo.id)}
      className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer text-left w-full"
    >
      <div className="relative h-64 bg-forest/10">
        <Image
          src={src}
          alt={photo.caption}
          fill
          className="object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {photo.year && (
            <p className="text-white/60 text-xs font-mono mb-1">{photo.year}</p>
          )}
          <p className="text-white text-sm font-medium line-clamp-2 leading-snug">
            {photo.caption}
          </p>
        </div>
      </div>
    </button>
  );
}
