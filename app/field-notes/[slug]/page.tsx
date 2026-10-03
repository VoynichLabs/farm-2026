/**
 * Author: Claude Opus 5.5 (prev Claude Opus 4.8; Claude Fable 5; orig Claude Opus 4.6, 12-Apr-2026)
 * Date: 03-Oct-2026 (orig 12-Apr-2026; updated 06-Jul / 16-Jul-2026)
 * PURPOSE: Individual field note detail page. Renders MDX content with
 *   a hero cover image, inline photo gallery, and prev/next navigation.
 *   06-Jul-2026: MDXRemote now runs with remark-gfm so GFM tables render
 *   as tables instead of literal pipe text (same fix as project pages).
 *   06-Jul-2026 (terminal glow-up): cream-era classes converted to the
 *   guardian palette; dead `prose prose-green` replaced with .terminal-prose.
 *   16-Jul-2026 (daylight retheme): converted to the light field-* tokens;
 *   .terminal-prose class kept (its values are now light in globals.css).
 *   03-Oct-2026 (SEO checklist pass): meta description is now the note's own
 *   opening lines (FieldNote.description from lib/content.ts) instead of
 *   "Farm field note — {date}" on every note; canonical tag; BreadcrumbList
 *   JSON-LD (Home › Field Notes › note); and the cover image takes its true
 *   width/height from lib/image-dimensions.ts so the browser reserves the
 *   right space before it loads (was a fixed 1200x800 → CLS 0.153); the
 *   inline photo grid gets the same treatment (was a fixed 600x400).
 * SRP/DRY check: Pass — reuses getFieldNote/getAllFieldNotes from lib/content.ts,
 *   follows same MDXRemote pattern as project pages.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFieldNote, getAllFieldNotes } from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getPublicImageSize } from "@/lib/image-dimensions";
import BreadcrumbJsonLd from "@/app/components/system/BreadcrumbJsonLd";

// GFM (tables, strikethrough, autolinks) — matches the project-page MDX setup.
const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };

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
  const description = note.description || `Farm field note — ${note.date}`;
  return {
    title: note.title,
    description,
    alternates: { canonical: `/field-notes/${slug}` },
    openGraph: {
      title: note.title,
      description,
      ...(note.cover ? { images: [note.cover] } : {}),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: note.title,
      description,
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
  // True ratio so the reserved box matches the drawn one (no layout shift);
  // 1200x800 stays as the fallback when the file can't be read.
  const coverSize = note.cover ? getPublicImageSize(note.cover) : null;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <BreadcrumbJsonLd
        trail={[
          { name: "Field Notes", path: "/field-notes" },
          { name: note.title, path: `/field-notes/${slug}` },
        ]}
      />
      <div className="mb-8">
        <Link href="/field-notes" className="text-field-accent hover:text-field-accent-deep hover:underline text-sm">
          &larr; All Field Notes
        </Link>
      </div>

      {/* Cover image */}
      {note.cover && (
        <div className="mb-8 rounded-xl overflow-hidden border border-field-border bg-field-card">
          <Image
            src={note.cover}
            alt={note.title}
            width={coverSize?.width ?? 1200}
            height={coverSize?.height ?? 800}
            className="w-full h-auto max-h-[75vh] object-contain mx-auto"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="font-mono text-sm text-field-muted">
            {note.date}
          </span>
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-field-accent-soft text-field-accent border border-field-accent-line px-2 py-0.5 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-4xl font-bold font-serif text-field-ink">{note.title}</h1>
      </div>

      {/* MDX content */}
      <section className="terminal-prose max-w-none mb-12">
        <MDXRemote source={note.content} options={mdxOptions} />
      </section>

      {/* Photo gallery */}
      {note.photos.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 font-serif text-field-ink">Photos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.photos.map((photo, i) => {
              const size = getPublicImageSize(photo.src);
              return (
              <figure key={i} className="m-0">
                <div className="rounded-lg overflow-hidden border border-field-border bg-field-card">
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    width={size?.width ?? 600}
                    height={size?.height ?? 400}
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                </div>
                <figcaption className="text-sm text-field-muted mt-2">
                  {photo.caption}
                </figcaption>
              </figure>
              );
            })}
          </div>
        </section>
      )}

      {/* Prev / Next navigation */}
      <nav className="flex justify-between items-center pt-8 border-t border-field-border">
        {prev ? (
          <Link
            href={`/field-notes/${prev.slug}`}
            className="text-field-accent hover:text-field-accent-deep hover:underline text-sm"
          >
            &larr; {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/field-notes/${next.slug}`}
            className="text-field-accent hover:text-field-accent-deep hover:underline text-sm"
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
