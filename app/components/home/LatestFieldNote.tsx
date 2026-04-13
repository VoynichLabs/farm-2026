/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: "Latest from the Farm" homepage block — featured most-recent field
 *   note (large cover + overlay title/tags) plus two smaller recent cards.
 *   Pulls data from getAllFieldNotes(). Extracted from app/page.tsx during
 *   Phase 1 of the frontend SRP/DRY rewrite.
 * SRP/DRY check: Pass — one responsibility (render the latest-notes block),
 *   data via single content loader. See docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md.
 */
import Link from "next/link";
import Image from "next/image";
import { getAllFieldNotes } from "@/lib/content";

export default function LatestFieldNote() {
  const fieldNotes = getAllFieldNotes();
  const latestNote = fieldNotes[0];
  const recentNotes = fieldNotes.slice(0, 3);

  if (!latestNote) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold font-serif">Latest from the Farm</h2>
          <p className="text-forest/60 mt-2">Weekly updates — what happened, what hatched, what Claude built.</p>
        </div>
        <Link href="/field-notes" className="text-wood hover:underline text-sm font-medium">
          All field notes →
        </Link>
      </div>

      {/* Featured note */}
      <Link href={`/field-notes/${latestNote.slug}`} className="block group mb-8">
        <article className="relative rounded-xl overflow-hidden shadow-lg">
          {latestNote.cover && (
            <Image
              src={latestNote.cover}
              alt={latestNote.title}
              width={1200}
              height={500}
              className="w-full h-auto max-h-[60vh] object-contain bg-forest/5 group-hover:scale-[1.02] transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <span className="text-cream/60 text-sm font-mono">{latestNote.date}</span>
            <h3 className="text-2xl md:text-3xl font-bold text-white font-serif mt-1 group-hover:text-cream/90 transition-colors">
              {latestNote.title}
            </h3>
            <div className="flex gap-2 mt-3">
              {latestNote.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-xs bg-white/20 text-cream px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      </Link>

      {/* Recent notes grid */}
      {recentNotes.length > 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recentNotes.slice(1).map((note) => (
            <Link key={note.slug} href={`/field-notes/${note.slug}`} className="group block">
              <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {note.cover && (
                  <Image
                    src={note.cover}
                    alt={note.title}
                    width={600}
                    height={250}
                    className="w-full object-cover h-[180px] group-hover:scale-[1.02] transition-transform duration-500"
                  />
                )}
                <div className="p-5">
                  <span className="text-xs font-mono text-forest-light/50">{note.date}</span>
                  <h4 className="text-lg font-bold mt-1 group-hover:text-wood transition-colors">{note.title}</h4>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
