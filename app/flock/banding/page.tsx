// Author: Claude Sonnet 4.6 (Bubba)
// Date: 21-Jul-2026
// PURPOSE: Banding methodology page — explains leg-band identification system and lists all named flock members with their assigned bands
// SRP/DRY check: Pass — new page, no existing banding page found
import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_MARKS } from "@/lib/emoji";

export const metadata: Metadata = {
  title: "Banding — The Flock",
  description:
    "How leg-band identification works on Farm 2026: left-leg bands mark our own Ornitharchs, right-leg bands mark purchased birds. Current band assignments and the full named roster.",
};

// Shared specimen-tag chrome — matches /flock's section kickers so the page
// reads as part of the same field guide.
const SPECIMEN_TAG =
  "inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted";

// ---- Section 2 data: confirmed band assignments as of 2026-07-21 ----
// Verbatim from flock-profiles.json (do not re-query). `leg: null` = band
// color/number assigned but the leg is not yet confirmed.
type BandRow = {
  bird: string;
  color: string;
  swatch: string; // tailwind bg-* for the color dot
  number: string;
  leg: "left" | "right" | null;
  ornitharch: boolean;
};

const BANDS: BandRow[] = [
  { bird: "Ingebird", color: "green", swatch: "bg-emerald-500", number: "#2", leg: "left", ornitharch: true },
  { bird: "Robirda", color: "orange", swatch: "bg-orange-500", number: "#1", leg: "right", ornitharch: false },
  { bird: "Birdadotta", color: "orange", swatch: "bg-orange-500", number: "#10", leg: "left", ornitharch: true },
  { bird: "Henriessa", color: "pink", swatch: "bg-pink-400", number: "#8", leg: "left", ornitharch: true },
  { bird: "Henridotta", color: "purple", swatch: "bg-purple-500", number: "#12", leg: null, ornitharch: true },
  { bird: "Birdimir", color: "red", swatch: "bg-red-500", number: "#3", leg: "left", ornitharch: true },
  { bird: "Birdsilla", color: "white", swatch: "bg-white border border-field-border", number: "#3", leg: "left", ornitharch: true },
  { bird: "Bobirda", color: "white", swatch: "bg-white border border-field-border", number: "#6", leg: "right", ornitharch: false },
  { bird: "Birddor", color: "yellow", swatch: "bg-yellow-400", number: "#1", leg: "left", ornitharch: true },
  { bird: "Adelbird", color: "blue", swatch: "bg-sky-500", number: "#7", leg: "left", ornitharch: true },
];

// ---- Section 3 data: the full named roster ----
type RosterBird = { name: string; detail: string };

const ORNITHARCHS: RosterBird[] = [
  { name: "Birddor", detail: "Easter Egger — yellow #1 left" },
  { name: "Birdadotta", detail: "Easter Egger × RIR cross — orange #10 left" },
  { name: "Birdthazar", detail: "Easter Egger lineage — no band yet" },
  { name: "Henriella", detail: "Wyandotte × RIR cross — no band yet" },
  { name: "Birdsilla", detail: "Easter Egger lineage — white #3 left" },
  { name: "Birdimir", detail: "Easter Egger lineage — red #3 left" },
  { name: "Ingebird", detail: "Easter Egger lineage — green #2 left" },
  { name: "Henriessa", detail: "Golden Laced Wyandotte cross / Henrietta line — pink #8 left" },
  { name: "Horstabird", detail: "Easter Egger lineage — no band yet" },
  { name: "Henridotta", detail: "Golden Laced Wyandotte cross / Henrietta line — purple #12, leg unconfirmed" },
  { name: "Adelbird", detail: "Easter Egger lineage — blue #7 left" },
];

const NON_ORNITHARCHS: RosterBird[] = [
  { name: "Birdsula", detail: "Easter Egger" },
  { name: "Birdadonna", detail: "Easter Egger × RIR cross" },
  { name: "Scissor Beak", detail: "Blue Laced Red Wyandotte — mild cross-beak, occludes fine" },
  { name: "Robirda", detail: "Golden Laced Wyandotte — orange #1 right" },
  { name: "Bobirda", detail: "Red/Gold Laced Wyandotte — white #6 right" },
  { name: "Chonkers", detail: "Buff Ranger" },
  { name: "Chonkette", detail: "Buff Ranger" },
  { name: "Ravenessa", detail: "Bantam, breed TBD" },
  { name: "Quasibirdo", detail: "Polish bantam" },
  { name: "Tractor Supply juveniles", detail: "2 remaining — Brahma or Cream Legbar uncertain" },
];

const TURKEYS: RosterBird[] = [
  { name: "White Broad-Breasted", detail: "3 birds" },
  { name: "Bronze Broad-Breasted", detail: "2 birds" },
];

const HISTORICAL: RosterBird[] = [
  { name: "Henrietta", detail: "Golden Laced Wyandotte — the matriarch, Henriessa / Henridotta / Henriella line" },
  { name: "Birdatha", detail: "Rhode Island Red" },
  { name: "Birdgit", detail: "Speckled Sussex" },
  { name: "Little Big Red Junior", detail: "Rhode Island Red" },
  { name: "Whitey Red Legs", detail: "Easter Egger × RIR rooster" },
  { name: "EE hen 2", detail: "Easter Egger" },
  { name: "Black Australorp hen", detail: "" },
];

function LegBadge({ leg }: { leg: "left" | "right" | null }) {
  if (leg === "left")
    return (
      <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-field-accent/10 border border-field-accent-line text-field-accent-deep px-2 py-0.5 rounded">
        left
      </span>
    );
  if (leg === "right")
    return (
      <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-amber-500/10 border border-amber-500/30 text-field-honey-ink px-2 py-0.5 rounded">
        right
      </span>
    );
  return (
    <span className="font-mono text-[0.6rem] uppercase tracking-widest bg-field-bg border border-field-border text-field-muted px-2 py-0.5 rounded">
      unconfirmed
    </span>
  );
}

function RosterList({ birds }: { birds: RosterBird[] }) {
  return (
    <ul className="divide-y divide-field-hairline border border-field-border rounded-lg bg-field-card overflow-hidden">
      {birds.map((b) => (
        <li key={b.name} className="px-4 py-2.5 flex flex-wrap items-baseline gap-x-3">
          <span className="font-serif font-bold text-field-ink">{b.name}</span>
          {b.detail && (
            <span className="text-sm text-field-muted">{b.detail}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function BandingPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="border-b border-field-border bg-field-wash">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <p className="mb-3">
            <span className={SPECIMEN_TAG}>
              <span aria-hidden="true" className="mr-1.5">
                {PAGE_MARKS.flock}
              </span>
              Banding · Identification
            </span>
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-field-ink mb-4">
            The Banding System
          </h1>
          <p className="text-lg text-field-muted max-w-2xl leading-relaxed">
            Colored leg bands are how we tell one hen from her near-identical
            sister at a glance — and, more importantly, how we tell our own
            birds from the ones we bought.
          </p>
          <p className="mt-4">
            <Link
              href="/flock"
              className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent hover:text-field-accent-deep"
            >
              ← back to the flock
            </Link>
          </p>
        </div>
      </section>

      {/* Section 1 — Methodology */}
      <section className="border-b border-field-border">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>How It Works</span>
          </p>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-field-ink mb-6">
            Reading a Band
          </h2>

          <div className="max-w-3xl space-y-4 text-field-muted leading-relaxed mb-8">
            <p>
              Every banded bird wears a plastic colored leg band as its
              individual ID. Each band is a unique <em>color + number</em>{" "}
              combination — green #2 is one bird and only one bird — and every
              assignment is confirmed with a date. The records live in{" "}
              <code className="font-mono text-[0.85em] bg-field-card border border-field-border rounded px-1.5 py-0.5 text-field-ink">
                flock-profiles.json
              </code>
              .
            </p>
            <p>
              The <strong className="text-field-ink">leg</strong> the band is
              on carries meaning all by itself:
            </p>
          </div>

          {/* The two-leg rule */}
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <div className="bg-field-card border border-field-border border-l-4 border-l-field-accent rounded-lg p-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-widest text-field-accent-deep mb-2">
                Left leg
              </p>
              <h3 className="text-lg font-bold font-serif text-field-ink mb-1">
                Ornitharchs
              </h3>
              <p className="text-sm text-field-muted leading-relaxed">
                Our founder breeding flock — birds from our own breeding
                program, hatched here on the farm. A band on the{" "}
                <strong className="text-field-ink">left</strong> leg means the
                bird is one of ours.
              </p>
            </div>
            <div className="bg-field-card border border-field-border border-l-4 border-l-amber-500 rounded-lg p-5">
              <p className="font-mono text-[0.66rem] uppercase tracking-widest text-field-honey-ink mb-2">
                Right leg
              </p>
              <h3 className="text-lg font-bold font-serif text-field-ink mb-1">
                Non-ornitharchs
              </h3>
              <p className="text-sm text-field-muted leading-relaxed">
                Purchased birds — anything not out of our breeding program. A
                band on the <strong className="text-field-ink">right</strong>{" "}
                leg is the at-a-glance tell: right leg = not from our line.
              </p>
            </div>
          </div>

          <p className="text-sm text-field-muted max-w-3xl leading-relaxed">
            So a field ID is two reads: <em>which leg</em> tells you whether
            the bird is a founder or a purchase, and{" "}
            <em>which color and number</em> tells you exactly who she is.
          </p>
        </div>
      </section>

      {/* Section 2 — Current band assignments */}
      <section className="border-b border-field-border bg-field-bg">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>Current Assignments · 21 Jul 2026</span>
          </p>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-field-ink mb-6">
            Confirmed Bands
          </h2>

          <div className="overflow-x-auto border border-field-border rounded-lg bg-field-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="font-mono text-[0.62rem] uppercase tracking-widest text-field-muted border-b border-field-border bg-field-wash">
                  <th className="px-4 py-3 font-semibold">Bird</th>
                  <th className="px-4 py-3 font-semibold">Band</th>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Leg</th>
                  <th className="px-4 py-3 font-semibold">Ornitharch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-field-hairline">
                {BANDS.map((b) => (
                  <tr key={`${b.bird}-${b.color}-${b.number}`} className="hover:bg-field-wash/60">
                    <td className="px-4 py-3 font-serif font-bold text-field-ink">
                      {b.bird}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-sm text-field-ink">
                        <span
                          aria-hidden="true"
                          className={`inline-block w-3.5 h-3.5 rounded-full ${b.swatch}`}
                        />
                        <span className="capitalize">{b.color}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-field-ink">
                      {b.number}
                    </td>
                    <td className="px-4 py-3">
                      <LegBadge leg={b.leg} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {b.ornitharch ? (
                        <span className="text-field-accent-deep font-medium">yes</span>
                      ) : (
                        <span className="text-field-muted">no</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-field-muted max-w-3xl">
            Every left-leg band above belongs to an Ornitharch; every right-leg
            band (Robirda, Bobirda) belongs to a purchased bird — the rule
            holds. Henridotta&apos;s purple #12 is assigned but her leg is not
            yet confirmed.
          </p>
        </div>
      </section>

      {/* Section 3 — Full named roster */}
      <section className="border-b border-field-border">
        <div className="max-w-5xl mx-auto px-4 py-14">
          <p className="mb-2">
            <span className={SPECIMEN_TAG}>The Roster</span>
          </p>
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-field-ink mb-2">
            Every Named Bird
          </h2>
          <p className="text-field-muted text-sm mb-10 max-w-3xl leading-relaxed">
            Not every bird is banded, but every named individual is on the
            books. Turkeys run separate from the chickens; the historical
            section is the birds no longer with the flock.
          </p>

          <div className="space-y-10">
            <div>
              <h3 className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent mb-3 border-b border-field-hairline pb-2">
                Ornitharchs · our breeding flock
              </h3>
              <RosterList birds={ORNITHARCHS} />
            </div>

            <div>
              <h3 className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent mb-3 border-b border-field-hairline pb-2">
                Other active named birds · non-ornitharchs
              </h3>
              <RosterList birds={NON_ORNITHARCHS} />
            </div>

            <div>
              <h3 className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent mb-3 border-b border-field-hairline pb-2">
                Turkeys · separate from the chickens
              </h3>
              <RosterList birds={TURKEYS} />
            </div>

            <div>
              <h3 className="font-mono text-[0.7rem] uppercase tracking-widest text-field-muted mb-3 border-b border-field-hairline pb-2">
                Deceased · historical
              </h3>
              <RosterList birds={HISTORICAL} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-field-card border-t border-field-border text-field-muted text-center py-8 text-sm">
        <p className="font-serif font-bold text-field-muted mb-1">Farm 2026</p>
        <p>
          Hampton, CT —{" "}
          <Link href="/flock" className="hover:text-field-ink">
            ← Back to the Flock
          </Link>
        </p>
      </footer>
    </main>
  );
}
