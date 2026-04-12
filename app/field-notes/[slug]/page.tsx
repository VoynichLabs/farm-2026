/**
 * Author: Claude Opus 4.6
 * Date: 12-Apr-2026
 * PURPOSE: Individual field note detail page. Renders MDX content with
 *   a hero cover image, inline photo gallery, and prev/next navigation.
 * SRP/DRY check: Pass — reuses getFieldNote/getAllFieldNotes from lib/content.ts,
 *   follows same MDXRemote pattern as project pages.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFieldNote, getAllFieldNotes } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";

export function generateStaticParams() {
  return getAllFieldNotes().map((n) => ({ slug: n.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = getFieldNote(slug);
  if (!note) return {};
  return {
    title: note.title,
    description: `Farm field note — ${note.date}`,
    openGraph: {
      title: note.title,
      description: `Farm field note — ${note.date}`,
      ...(note.cover ? { images: [note.cover] } : {}),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description: `Farm field note — ${note.date}`,
      ...(note.cover ? { images: [note.cover] } : {}),
    },
  };
}

export default async function FieldNotePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const note = getFieldNote(slug);
  if (!note) notFound();

  const allNotes = getAllFieldNotes();
  const idx = allNotes.findIndex((n) => n.slug === slug);
  const prev = idx < allNotes.length - 1 ? allNotes[idx + 1] : null;
  const next = idx > 0 ? allNotes[idx - 1] : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/field-notes" className="text-wood hover:underline text-sm">
          &larr; All Field Notes
        </Link>
      </div>

      {/* Cover image */}
      {note.cover && (
        <div className="mb-8 rounded-xl overflow-hidden shadow-lg bg-forest/5">
          <Image
            src={note.cover}
            alt={note.title}
            width={1200}
            height={800}
            className="w-full h-auto max-h-[75vh] object-contain mx-auto"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-sm text-forest-light/60">
            {note.date}
          </span>
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold font-serif">{note.title}</h1>
      </div>

      {/* MDX content */}
      <section className="prose prose-green max-w-none mb-12">
        <MDXRemote source={note.content} />
      </section>

      {/* Photo gallery */}
      {note.photos.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 font-serif">Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.photos.map((photo, i) => (
              <figure key={i} className="m-0">
                <div className="rounded-lg overflow-hidden bg-forest/5">
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    width={600}
                    height={400}
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                </div>
                <figcaption className="text-sm text-forest-light/60 mt-2">
                  {photo.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Prev / Next navigation */}
      <nav className="flex justify-between items-center pt-8 border-t border-forest/10">
        {prev ? (
          <Link
            href={`/field-notes/${prev.slug}`}
            className="text-wood hover:underline text-sm"
          >
            &larr; {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/field-notes/${next.slug}`}
            className="text-wood hover:underline text-sm"
          >
            {next.title} &rarr;
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
