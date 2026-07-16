/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; orig Claude Opus 4.6, 12-Apr-2026)
 * Date: 16-Jul-2026
 * PURPOSE: Field Notes feed page — photo-forward weekly farm updates.
 *   Shows latest note as a featured hero, remaining as a card grid.
 *   Replaces the old /diary page. 16-Jul-2026 (daylight retheme):
 *   converted from the dark guardian palette to the light Field Guide
 *   tokens (field-*); page kicker carries the notes page mark from
 *   lib/emoji.ts. Styling-only conversion — copy unchanged.
 * SRP/DRY check: Pass — reuses getAllFieldNotes() from lib/content.ts,
 *   emoji from lib/emoji.ts SSoT.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllFieldNotes } from "@/lib/content";
import { PAGE_MARKS } from "@/lib/emoji";

export const metadata: Metadata = {
  title: "Field Notes",
  description: "Weekly updates from the farm — what happened, what hatched, what we built.",
};

export default function FieldNotesPage() {
  const notes = getAllFieldNotes();
  const featured = notes[0];
  const rest = notes.slice(1);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-field-accent hover:text-field-accent-deep hover:underline text-sm">
          &larr; Home
        </Link>
      </div>

      <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-4">
        <span aria-hidden="true" className="mr-1.5">{PAGE_MARKS.notes}</span>Field Notes
      </span>
      <h1 className="text-4xl font-bold text-field-ink mb-2 font-serif">Field Notes</h1>
      <p className="text-field-muted mb-10">
        Weekly updates from the farm — what happened, what hatched, what broke, what we built.
      </p>

      {/* Featured latest note */}
      {featured && (
        <Link href={`/field-notes/${featured.slug}`} className="block group mb-12">
          <article className="relative rounded-2xl overflow-hidden border border-field-border">
            {featured.cover && (
              <Image
                src={featured.cover}
                alt={featured.title}
                width={1200}
                height={600}
                className="w-full h-auto max-h-[65vh] object-contain bg-field-card group-hover:scale-[1.02] transition-transform duration-500"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-white/80 text-sm font-mono">
                  {featured.date}
                </span>
                {featured.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-white/15 text-white/90 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-3xl font-bold text-white font-serif group-hover:text-field-accent-soft transition-colors">
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
              <article className="bg-field-card rounded-xl border border-field-border hover:border-field-accent-line transition-colors overflow-hidden">
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
                  <span className="text-xs font-mono text-field-muted">
                    {note.date}
                  </span>
                  <h3 className="text-lg font-bold text-field-ink mt-1 group-hover:text-field-accent-deep transition-colors">
                    {note.title}
                  </h3>
                  <div className="flex gap-1 mt-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-field-accent-soft text-field-accent border border-field-accent-line px-2 py-0.5 rounded"
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
        <p className="text-field-muted">No field notes yet. Check back soon.</p>
      )}
    </main>
  );
}
