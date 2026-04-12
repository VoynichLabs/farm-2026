/**
 * Author: Claude Opus 4.6
 * Date: 12-Apr-2026
 * PURPOSE: Field Notes feed page — photo-forward weekly farm updates.
 *   Shows latest note as a featured hero, remaining as a card grid.
 *   Replaces the old /diary page.
 * SRP/DRY check: Pass — reuses getAllFieldNotes() from lib/content.ts
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllFieldNotes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Field Notes",
  description: "Weekly updates from the farm — what happened, what hatched, what Claude built.",
};

export default function FieldNotesPage() {
  const notes = getAllFieldNotes();
  const featured = notes[0];
  const rest = notes.slice(1);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-wood hover:underline text-sm">
          &larr; Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold mb-2 font-serif">Field Notes</h1>
      <p className="text-forest-light/60 mb-10">
        Weekly updates from the farm — what happened, what hatched, what broke, what Claude built.
      </p>

      {/* Featured latest note */}
      {featured && (
        <Link href={`/field-notes/${featured.slug}`} className="block group mb-12">
          <article className="relative rounded-2xl overflow-hidden shadow-lg">
            {featured.cover && (
              <Image
                src={featured.cover}
                alt={featured.title}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[65vh] object-contain bg-forest/5 group-hover:scale-[1.02] transition-transform duration-500"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-cream/70 text-sm font-mono">
                  {featured.date}
                </span>
                {featured.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/20 text-cream px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl font-bold text-white font-serif group-hover:text-cream/90 transition-colors">
                {featured.title}
              </h2>
            </div>
          </article>
        </Link>
      )}

      {/* Remaining notes as cards */}
      {rest.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rest.map((note) => (
            <Link
              key={note.slug}
              href={`/field-notes/${note.slug}`}
              className="group block"
            >
              <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {note.cover && (
                  <Image
                    src={note.cover}
                    alt={note.title}
                    width={600}
                    height={300}
                    className="w-full object-cover h-[200px] group-hover:scale-[1.02] transition-transform duration-500"
                  />
                )}
                <div className="p-5">
                  <span className="text-xs font-mono text-forest-light/50">
                    {note.date}
                  </span>
                  <h3 className="text-lg font-bold mt-1 group-hover:text-wood transition-colors">
                    {note.title}
                  </h3>
                  <div className="flex gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-forest-light/60">No field notes yet. Check back soon.</p>
      )}
    </main>
  );
}
