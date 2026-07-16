/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; orig Claude Opus 4.6, edited Claude Opus 4.7 18-Apr-2026)
 * Date: 16-Jul-2026 (orig 14-Apr-2026; 16-Jul: hero + meta copy updated for
 *   the Birdcatraz era — the S7 now watches the compound's water bowl;
 *   16-Jul daylight retheme: guardian palette → light Field Guide tokens,
 *   specimen-tag kicker with the gems page mark from lib/emoji.ts)
 * PURPOSE: Route entry for /gallery/gems — the curated wall of gems
 *   produced by the farm-guardian image pipeline. Parses search params
 *   (filter state lives in the URL) and defers the heavy lifting to
 *   GemsGallery (server) + GemsGalleryClient (client). Sibling gallery
 *   surfaces (curated archive at /gallery, yard-diary stockpile at
 *   /yard) are linked inline below the hero so a visitor can hop
 *   between the three without going back to the nav.
 *   06-Jul-2026 (terminal glow-up): converted to the dark guardian
 *   palette, and the hero copy now states the real curation contract —
 *   the S7 is the camera that feeds this pipeline, and every frame shown
 *   got a human (Boss) reaction in Discord. Backend enforces it via
 *   min_reactions on /api/v1/images/gems.
 * SRP/DRY check: Pass — thin wrapper only.
 */
import type { Metadata } from "next";
import Link from "next/link";
import GemsGallery from "@/app/components/gems/GemsGallery";
import { PAGE_MARKS } from "@/lib/emoji";

export const metadata: Metadata = {
  title: "Gems — Farm Guardian's best frames",
  description:
    "Curated frames from the farm's automated camera pipeline — the flock, hawks, the occasional turkey, and daily life in Birdcatraz. Captions are draft machine descriptions, not polished copy.",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GemsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  return (
    <main className="min-h-screen">
      <section className="bg-field-card border-b border-field-border py-12 px-4 text-center">
        <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-4">
          <span aria-hidden="true" className="mr-1.5">{PAGE_MARKS.gems}</span>Gems
        </span>
        <h1 className="text-4xl font-bold font-serif text-field-ink mb-2">Gems</h1>
        <p className="text-field-muted max-w-2xl mx-auto text-sm">
          The S7 cam — aimed at the big water bowl in Birdcatraz — feeds a
          local VLM that scores every frame; the
          keepers go to Discord, and the Boss reacts to the ones worth
          keeping. Every frame below got that human reaction — the machine
          nominates, a person decides. Captions are machine-drafted and
          unedited.
        </p>
        <nav className="mt-5 flex items-center justify-center gap-3 text-xs font-mono text-field-muted">
          <Link href="/yard" className="hover:text-field-accent-deep transition-colors">
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
