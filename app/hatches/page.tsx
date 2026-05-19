/**
 * /hatches — event ledger for every 2026 incubator hatch.
 *
 * Reads from content/hatches/2026/*.md (per-chick source of truth, schema in
 * content/hatches/SCHEMA.md). Each card is a hatch event, not a current-state
 * roster row — /flock is the current-state surface.
 *
 * Layout: terminal hero strip → per-chick cards (newest first) → footer link
 * back to /flock for live state. No 13s in derived counts.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getHatchRecords, type HatchRecord, type HatchObservation } from "@/lib/content";

export const metadata: Metadata = {
  title: "Hatches 2026",
  description:
    "Every chick hatched from the incubator on Farm 2026, Hampton CT — hatch date, parentage, dated phenotype observations, predictions vs outcomes.",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso?: string): string | null => {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`;
};

const firstPhoto = (r: HatchRecord) => r.photos.find((p) => p.path);
const observed = (o: HatchObservation) =>
  (o.observed ?? {}) as Record<string, string | undefined>;

export default function HatchesPage() {
  const records = getHatchRecords("2026");

  return (
    <main className="min-h-screen bg-cream">
      {/* Hero — terminal strip + serif title */}
      <section className="bg-guardian-bg text-guardian-text border-b border-guardian-border">
        <div className="max-w-6xl mx-auto px-4 pt-14 pb-10">
          <p className="font-mono text-[0.7rem] uppercase tracking-widest text-guardian-accent mb-2">
            [HATCHES · 2026]
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-white mb-3">
            What Came Out of an Egg This Year
          </h1>
          <p className="text-guardian-text/70 max-w-3xl text-sm md:text-base leading-relaxed">
            Every 2026 incubator hatch — date, parentage, dated phenotype
            observations, and our predictions against the eventual adult
            outcome. The source of truth is one file per chick in{" "}
            <code className="text-guardian-accent/90">content/hatches/2026/</code>;
            this page renders them newest first. Photos fill in over time.
          </p>
          <div className="mt-6 font-mono text-[0.7rem] uppercase tracking-widest text-guardian-text/70 flex flex-wrap gap-x-4 gap-y-1">
            <span>
              <span className="text-guardian-muted">RECORDS</span>{" "}
              <span className="text-guardian-text">{records.length}</span>
            </span>
            <span className="text-guardian-muted">·</span>
            <span>
              <span className="text-guardian-muted">SCHEMA</span>{" "}
              <span className="text-guardian-text">content/hatches/SCHEMA.md</span>
            </span>
          </div>
        </div>
      </section>

      {/* Records */}
      {records.length === 0 ? (
        <section className="max-w-5xl mx-auto px-4 py-16">
          <p className="text-forest/60">No 2026 hatches recorded yet.</p>
        </section>
      ) : (
        <section className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-2">
          {records.map((r) => (
            <HatchCard key={r.id} record={r} />
          ))}
        </section>
      )}

      {/* Footer */}
      <footer className="bg-forest text-cream/50 text-center py-8 text-sm">
        <p className="font-serif font-bold text-cream/70 mb-1">Farm 2026</p>
        <p>
          Hampton, CT — current roster on{" "}
          <Link href="/flock" className="hover:text-cream/80 underline">
            /flock
          </Link>
          {" · "}
          <Link href="/" className="hover:text-cream/80">
            ← Home
          </Link>
        </p>
      </footer>
    </main>
  );
}

function HatchCard({ record: r }: { record: HatchRecord }) {
  const photo = firstPhoto(r);
  const hatch = fmtDate(r.hatch_date);
  const set = fmtDate(r.egg_set_date);
  const displayName = r.name && r.name.length > 0 ? r.name : "(unnamed)";

  // Newest observation first for the panel
  const observations = [...r.phenotype_observations].reverse();

  return (
    <article className="bg-white rounded-xl shadow-md overflow-hidden border border-cream-dark flex flex-col">
      {/* Photo or placeholder */}
      <div className="relative w-full h-64 bg-forest/10">
        {photo?.path ? (
          <Image
            src={`/${photo.path.replace(/^public\//, "")}`}
            alt={photo.caption || displayName}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-forest/15 to-forest/5">
            <span className="text-5xl text-forest/50">🐣</span>
            <span className="text-[0.65rem] uppercase tracking-widest text-forest/50 font-medium">
              Photo pending
            </span>
          </div>
        )}
      </div>

      {/* Instrument strip — durable facts */}
      <div className="bg-guardian-bg text-guardian-text font-mono text-[0.65rem] uppercase tracking-widest px-4 py-2 border-y border-guardian-border flex flex-wrap gap-x-3 gap-y-1">
        {hatch && (
          <span>
            <span className="text-guardian-muted">HATCH</span>{" "}
            <span className="text-guardian-text">{hatch}</span>
            {r.hatch_time && (
              <span className="text-guardian-text/70"> · {r.hatch_time}</span>
            )}
          </span>
        )}
        {r.incubator && (
          <span>
            <span className="text-guardian-muted">INC</span>{" "}
            <span className="text-guardian-text">{r.incubator}</span>
          </span>
        )}
        {set && (
          <span>
            <span className="text-guardian-muted">SET</span>{" "}
            <span className="text-guardian-text">{set}</span>
          </span>
        )}
        {r.egg_color && (
          <span>
            <span className="text-guardian-muted">EGG</span>{" "}
            <span className="text-guardian-text">{r.egg_color}</span>
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div>
          <h2 className="text-2xl font-bold font-serif text-forest">{displayName}</h2>
          {r.breed && <p className="text-sm text-wood font-medium">{r.breed}</p>}
          <p className="text-[0.7rem] font-mono uppercase tracking-widest text-forest/40 mt-1">
            id · {r.id}
          </p>
        </div>

        {/* Parentage */}
        {(r.parent_hen || r.parent_rooster_window) && (
          <div className="text-xs text-forest/70 border-l-2 border-wood/40 pl-3">
            {r.parent_hen && (
              <p>
                <span className="font-mono uppercase tracking-widest text-forest/50 text-[0.65rem]">
                  dam
                </span>{" "}
                {r.parent_hen}
              </p>
            )}
            {r.parent_rooster_window && (
              <p>
                <span className="font-mono uppercase tracking-widest text-forest/50 text-[0.65rem]">
                  sire
                </span>{" "}
                {r.parent_rooster_window}
              </p>
            )}
            {r.parentage_confidence && (
              <p className="text-forest/50 mt-0.5">
                <span className="font-mono uppercase tracking-widest text-[0.65rem]">
                  confidence
                </span>{" "}
                {r.parentage_confidence}
              </p>
            )}
          </div>
        )}

        {/* Lifecycle summary if grown, otherwise nothing — keep card a snapshot */}
        {r.lifecycle_summary && (
          <p className="text-sm text-forest/80 italic">{r.lifecycle_summary}</p>
        )}

        {/* Phenotype observations — collapsed to most recent + one older */}
        {observations.length > 0 && (
          <details className="text-xs text-forest/70 mt-1">
            <summary className="cursor-pointer font-mono uppercase tracking-widest text-[0.65rem] text-forest/50 hover:text-forest/80">
              phenotype observations ({observations.length})
            </summary>
            <ol className="mt-2 space-y-3 border-l border-cream-dark pl-3">
              {observations.map((o, i) => {
                const obs = observed(o);
                return (
                  <li key={i}>
                    <p className="font-mono uppercase tracking-widest text-[0.65rem] text-forest/50">
                      {fmtDate(o.date)}
                      {typeof o.age_days === "number" && (
                        <span className="text-forest/40"> · day {o.age_days}</span>
                      )}
                    </p>
                    {obs.down_color && (
                      <p>
                        <span className="text-forest/50">down · </span>
                        {obs.down_color}
                      </p>
                    )}
                    {obs.markings && (
                      <p>
                        <span className="text-forest/50">markings · </span>
                        {obs.markings}
                      </p>
                    )}
                    {obs.distinguishing_features && (
                      <p>
                        <span className="text-forest/50">features · </span>
                        {obs.distinguishing_features}
                      </p>
                    )}
                    {obs.sex && obs.sex !== "unknown" && (
                      <p>
                        <span className="text-forest/50">sex · </span>
                        {String(obs.sex)}
                      </p>
                    )}
                    {o.prediction?.expected_sex && (
                      <p className="text-forest/60 italic">
                        <span className="text-forest/40">prediction · </span>
                        {o.prediction.expected_sex}
                        {o.prediction.confidence && ` (${o.prediction.confidence})`}
                        {o.prediction.reasoning && ` — ${o.prediction.reasoning}`}
                      </p>
                    )}
                    {o.notes && <p className="text-forest/60">{o.notes}</p>}
                  </li>
                );
              })}
            </ol>
          </details>
        )}

        {/* Lifecycle status pill */}
        {r.lifecycle?.current_location && (
          <p className="mt-auto pt-3 border-t border-cream-dark">
            <span className="inline-block text-[0.65rem] font-mono uppercase tracking-widest bg-forest/10 text-forest px-2 py-1 rounded">
              {r.lifecycle.current_location}
            </span>
          </p>
        )}
      </div>
    </article>
  );
}
