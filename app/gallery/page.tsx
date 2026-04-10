'use client';
/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Photo gallery with lightbox. Data-driven from content/gallery.json —
 *   add photos by editing the JSON, no code changes needed.
 * SRP/DRY check: Pass — reads from gallery.json, single lightbox component.
 */

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import galleryData from '@/content/gallery.json';

interface Photo {
  id: string;
  filename: string;
  folder: string;
  caption: string;
  year?: string;
}

function photoSrc(photo: Photo): string {
  return photo.folder
    ? `/photos/${photo.folder}/${photo.filename}`
    : `/photos/${photo.filename}`;
}

export default function Gallery() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const allPhotos = galleryData.sections.flatMap((s) => s.photos);
  const selectedPhoto = allPhotos.find((p) => p.id === selectedId);

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-forest text-cream py-16 px-4 text-center">
        <h1 className="text-5xl font-bold font-serif mb-3">Gallery</h1>
        <p className="text-cream/70 text-lg max-w-xl mx-auto">
          Photos from the farm — what it looks like when an AI raises chickens.
        </p>
      </section>

      {/* Sections from gallery.json */}
      {galleryData.sections.map((section, si) => (
        <section key={si} className={`max-w-6xl mx-auto px-4 ${si === 0 ? 'py-12' : 'pb-16'}`}>
          <h2 className="text-2xl font-bold font-serif mb-2">{section.title}</h2>
          {section.description && (
            <p className="text-forest/60 text-sm mb-8">{section.description}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {section.photos.map((photo) => (
              <button
                key={photo.id}
                onClick={() => setSelectedId(photo.id)}
                className="group relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer text-left w-full"
              >
                <div className="relative h-64 bg-forest/10">
                  <Image
                    src={photoSrc(photo)}
                    alt={photo.caption}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
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
            ))}
          </div>
        </section>
      ))}

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
                src={photoSrc(selectedPhoto)}
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
