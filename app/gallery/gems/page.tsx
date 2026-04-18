/**
 * Author: Claude Opus 4.6 (1M context), edited by Claude Opus 4.7 18-Apr-2026
 * Date: 14-Apr-2026 (edited 18-Apr-2026 to add sibling-gallery nav)
 * PURPOSE: Route entry for /gallery/gems — the curated wall of gems
 *   produced by the farm-guardian image pipeline. Parses search params
 *   (filter state lives in the URL) and defers the heavy lifting to
 *   GemsGallery (server) + GemsGalleryClient (client). Sibling gallery
 *   surfaces (curated archive at /gallery, yard-diary stockpile at
 *   /yard) are linked inline below the hero so a visitor can hop
 *   between the three without going back to the nav.
 * SRP/DRY check: Pass — thin wrapper only.
 */
import type { Metadata } from "next";
import Link from "next/link";
import GemsGallery from "@/app/components/gems/GemsGallery";

export const metadata: Metadata = {
  title: "Gems — Farm Guardian's best frames",
  description:
    "Curated frames from the farm's automated camera pipeline — chicks, hawks, adult hens, and the daily life of the flock. Captions are draft machine descriptions, not polished copy.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-cream">
      <section className="bg-forest text-cream py-12 px-4 text-center">
        <h1 className="text-4xl font-bold font-serif mb-2">Gems</h1>
        <p className="text-cream/70 max-w-2xl mx-auto text-sm">
          The farm&rsquo;s multi-camera pipeline scores every frame and keeps the
          best ones indefinitely. Everything below is one of those frames.
          Captions are machine-drafted and unedited.
        </p>
        <nav className="mt-5 flex items-center justify-center gap-3 text-xs font-mono text-cream/60">
          <Link href="/gallery" className="hover:text-cream transition-colors">
            ← Curated archive
          </Link>
          <span className="text-cream/30">·</span>
          <Link href="/yard" className="hover:text-cream transition-colors">
            Yard diary (timelapse stockpile) →
          </Link>
        </nav>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10">
        <GemsGallery searchParams={params} />
      </section>
    </main>
  );
}
