/**
 * Author: Claude Opus 4.8 (1M context)
 * Date: 22-Jun-2026
 * PURPOSE: ThenAndNow — a tasteful "then → now" comparison block for a single
 *   hatch, rendered as a featured pair at the top of /hatches. It sets a
 *   chick's hatch-day photo beside its most recent photo, each tagged with the
 *   date and age, so the phenotype-calibration purpose of the hatch ledger
 *   (down-color → adult-plumage) is legible at a glance for one worked
 *   example. Currently wired to Birdimir (first chick of the June NI clutch).
 *
 *   Purely presentational: the /hatches page selects the record, strips the
 *   `public/` image-path prefix (same convention as HatchCard), formats the
 *   dates with its own fmtDate, and passes plain props in. This component owns
 *   layout only — no data fetching, no date math, no record lookup.
 *
 *   Calm-farm palette per docs/FRONTEND-ARCHITECTURE.md: cream card, forest
 *   serif heading, guardian-bg instrument strips for the durable facts. This
 *   is the narrative layer, not the maximalist /markets surface.
 *
 * SRP/DRY check: Pass — single responsibility (render one then/now pair).
 *   Reuses the page's fmtDate (no third date-format copy) and the existing
 *   guardian/cream design tokens. No new primitive extracted: this is one
 *   composite section with a single consumer, not a repeated pattern.
 */
import Image from "next/image";

export interface ThenNowPhoto {
  /** Web path, `public/` already stripped (e.g. "/photos/birds/foo.jpg"). */
  src: string;
  /** Human-formatted date, e.g. "2 Jun 2026". */
  dateLabel: string;
  /** Age framing, e.g. "Hatch day" or "Day 20". */
  ageLabel: string;
  /** Descriptive caption for this frame. */
  caption: string;
  /** Alt text for the image. */
  alt: string;
}

interface ThenAndNowProps {
  /** Subject name, e.g. "Birdimir". */
  name: string;
  /** One-line framing prose beneath the heading. */
  framing: string;
  then: ThenNowPhoto;
  now: ThenNowPhoto;
}

function Frame({ photo, tag }: { photo: ThenNowPhoto; tag: "THEN" | "NOW" }) {
  return (
    <figure className="bg-white rounded-xl shadow-md overflow-hidden border border-cream-dark flex flex-col">
      <div className="relative w-full aspect-[4/5] bg-forest/10">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(min-width: 768px) 40vw, 100vw"
          className="object-cover"
        />
        <span className="absolute top-3 left-3 font-mono text-[0.62rem] uppercase tracking-widest bg-guardian-bg/85 text-guardian-accent px-2 py-0.5 rounded border border-guardian-border/60 backdrop-blur-sm">
          {tag}
        </span>
      </div>

      {/* Instrument strip — durable facts (date · age), terminal palette. */}
      <div className="bg-guardian-bg text-guardian-text font-mono text-[0.65rem] uppercase tracking-widest px-4 py-2 border-y border-guardian-border flex flex-wrap gap-x-3 gap-y-1">
        <span>
          <span className="text-guardian-muted">DATE</span>{" "}
          <span className="text-guardian-text">{photo.dateLabel}</span>
        </span>
        <span>
          <span className="text-guardian-muted">AGE</span>{" "}
          <span className="text-guardian-text">{photo.ageLabel}</span>
        </span>
      </div>

      <figcaption className="p-4 text-sm text-forest/70 leading-relaxed">
        {photo.caption}
      </figcaption>
    </figure>
  );
}

export default function ThenAndNow({ name, framing, then, now }: ThenAndNowProps) {
  return (
    <section className="max-w-6xl mx-auto px-4 pt-12 pb-4">
      <p className="font-mono text-[0.7rem] uppercase tracking-widest text-forest/60 mb-2">
        [THEN &rarr; NOW]
      </p>
      <h2 className="text-2xl md:text-3xl font-bold font-serif text-forest mb-2">
        {name}, Hatch Day to {now.ageLabel}
      </h2>
      <p className="text-forest/70 text-sm mb-8 max-w-3xl leading-relaxed">{framing}</p>

      {/* Two frames with a center connector. The connector collapses out of the
          flow on narrow screens; the frames stack. */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
        <Frame photo={then} tag="THEN" />
        <div
          aria-hidden
          className="hidden md:flex items-center justify-center font-mono text-2xl text-wood"
        >
          &rarr;
        </div>
        <Frame photo={now} tag="NOW" />
      </div>
    </section>
  );
}
