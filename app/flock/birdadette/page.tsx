/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 23-Apr-2026
 * PURPOSE: /flock/birdadette — day-by-day retrospective assembled from
 *   strong-tier gems the pipeline has tagged with individuals_visible
 *   containing "birdadette". Each day section leads with the newest
 *   frame from that day + its VLM caption, followed by a two-col row
 *   of supplementary frames from the same day (no captions, to keep
 *   the narrative tight). Days without strong frames are simply
 *   skipped — retrospective shows what the pipeline saw, not what it
 *   didn't. Links back to /flock and forward to the unfiltered
 *   /gallery/gems?individual=birdadette for the full archive view.
 * SRP/DRY check: Pass — data access in lib/birdadette.ts; no custom
 *   I/O here. A small inline DaySection component is defined for
 *   this page only; extraction is deferred until a second retrospective
 *   surface needs it (per architecture doc's third-duplicate rule).
 *   See docs/23-Apr-2026-birdadette-retrospective-plan.md.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  fetchBirdadetteRetrospective,
  formatDateLabel,
  BIRDADETTE_HATCH_DATE,
} from "@/lib/birdadette";
import type { GemRow } from "@/app/components/guardian/types";
import { activityLabel, cameraLabel } from "@/lib/gems-format";

export const metadata: Metadata = {
  title: "Birdadette — day by day",
  description:
    "Every strong-tier frame the farm's camera pipeline has tagged of Birdadette, grouped by day of life. Easter Egger chick, hatched 6-Apr-2026 in an incubator.",
};

function DaySection({ day }: { day: { dayOfLife: number; dateISO: string; rows: GemRow[] } }) {
  const [primary, ...rest] = day.rows;
  return (
    <section className="py-10 border-t border-forest/10 first:border-t-0">
      <header className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-2xl md:text-3xl text-forest">
          Day {day.dayOfLife}
        </h2>
        <p className="font-mono text-xs text-forest/50 uppercase tracking-wide">
          {formatDateLabel(day.dateISO)}
        </p>
      </header>

      <figure className="mb-3">
        {/* Native aspect preserved. Portrait s7-cam frames letterbox
            against the cream page; landscape frames fill. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primary.full_url}
          alt={primary.caption_draft}
          className="w-full h-auto max-h-[70vh] object-contain bg-forest/5 rounded-sm"
          loading="lazy"
        />
        <figcaption className="mt-3 text-forest/80 leading-relaxed italic">
          <span className="font-mono text-xs text-forest/40 not-italic mr-2 uppercase">
            draft:
          </span>
          {primary.caption_draft}
        </figcaption>
        <p className="mt-2 font-mono text-xs text-forest/50">
          {cameraLabel(primary.camera_id)} · {activityLabel(primary.activity)} ·{" "}
          {primary.bird_count} bird{primary.bird_count === 1 ? "" : "s"} in frame
        </p>
      </figure>

      {rest.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 mt-4">
          {rest.slice(0, 4).map((row) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={row.id}
              src={row.full_url}
              alt={row.caption_draft}
              className="w-full h-auto max-h-[40vh] object-contain bg-forest/5 rounded-sm"
              loading="lazy"
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default async function BirdadettePage() {
  const result = await fetchBirdadetteRetrospective();

  return (
    <main className="min-h-screen bg-cream">
      <section className="bg-forest text-cream py-14 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs text-cream/50 uppercase tracking-wide mb-2">
            Flock · retrospective
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold mb-3">
            Birdadette
          </h1>
          <p className="text-cream/70 text-sm md:text-base leading-relaxed max-w-xl">
            Easter Egger chick, hatched {formatDateLabel(BIRDADETTE_HATCH_DATE)} in an
            incubator on the desk. Day {result.ageToday} today. Third generation on the
            farm — named after her mother&apos;s mother, Birdgit.
          </p>
          <p className="mt-4 text-cream/50 text-xs md:text-sm leading-relaxed max-w-xl">
            Every frame below was auto-tagged by the camera pipeline&rsquo;s vision model
            as containing her. Strong-tier only, grouped by calendar day, newest first.
            Captions are machine-drafted.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        {!result.ok ? (
          <div className="py-12 text-center">
            <p className="text-forest/60">
              Couldn&rsquo;t reach Guardian to load the retrospective right now.
            </p>
            <p className="mt-2 font-mono text-xs text-forest/40">
              {result.code}: {result.message}
            </p>
          </div>
        ) : result.days.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-forest/60">
              The pipeline hasn&rsquo;t tagged Birdadette in a strong frame yet —
              check back in a day or two.
            </p>
          </div>
        ) : (
          result.days.map((day) => <DaySection key={day.dateISO} day={day} />)
        )}

        <footer className="mt-12 pt-8 border-t border-forest/10 flex items-center justify-between gap-4 text-sm">
          <Link href="/flock" className="text-forest/70 hover:text-forest underline underline-offset-4">
            ← Back to the flock
          </Link>
          <Link
            href="/gallery/gems?individual=birdadette"
            className="text-forest/50 hover:text-forest/80 underline underline-offset-4 font-mono text-xs"
          >
            Full archive (unfiltered) →
          </Link>
        </footer>
      </section>
    </main>
  );
}
