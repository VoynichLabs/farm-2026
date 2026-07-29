/**
 * Author: Claude Sonnet 5 (prev Claude Opus 4.8)
 * Date: 22-Jul-2026
 * PURPOSE: /flock/[slug] — one bird's full aging gallery. Every picture we have
 *   of the bird (from its roster photos[] ledger), full-size, oldest→newest,
 *   each stamped with the date, the bird's age at that photo, and its caption.
 *   The deep-dive view behind the compact GrowthStrip on /flock. Static:
 *   generateStaticParams enumerates every bird by birdSlug(name).
 *
 *   22-Jul-2026 (visual QA remediation): added `revalidate` so the AGE label
 *   (getBirdAgeLabel, computed from `new Date()`) doesn't freeze at
 *   last-build time under static generation — same fix as /flock.
 * SRP/DRY check: Pass — reuses getFlockProfiles / getBirdAgeLabel / birdSlug
 *   and the shared BandChip; page-local logic is layout + date/age labels only.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getFlockProfiles,
  getBirdAgeLabel,
  birdSlug,
  type FlockBird,
  type BirdPhoto,
} from "@/lib/content";
import BandChip from "@/app/components/flock/BandChip";

export const revalidate = 3600;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtDate = (iso?: string): string | null => {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1] || m[2]} ${m[1]}`;
  return iso;
};

// The bird's age at a given photo date: "hatch day", "day 8", "3 wks", "2 mos".
// Undated → "". (Mirrors the throwbackTag labels used on /flock.)
const ageAtPhoto = (hatchISO?: string, photoISO?: string): string => {
  if (!hatchISO || !photoISO) return "";
  const hatch = new Date(`${hatchISO}T00:00:00`).getTime();
  const shot = new Date(`${photoISO}T00:00:00`).getTime();
  if (Number.isNaN(hatch) || Number.isNaN(shot)) return "";
  const days = Math.round((shot - hatch) / 86400000);
  if (days <= 1) return "hatch day";
  if (days < 13) return `day ${days}`;
  if (days < 56) return `${Math.floor(days / 7)} wks`;
  return `${Math.floor(days / 30)} mos`;
};

const findBird = (slug: string): FlockBird | undefined => {
  const flock = getFlockProfiles();
  return flock?.flock_birds.find((b) => birdSlug(b.name) === slug);
};

const sortedPhotos = (bird: FlockBird): BirdPhoto[] =>
  [...(bird.photos ?? [])].sort((a, b) =>
    (a.date ?? "9999-99-99").localeCompare(b.date ?? "9999-99-99"),
  );

export function generateStaticParams() {
  const flock = getFlockProfiles();
  return (flock?.flock_birds ?? []).map((b) => ({ slug: birdSlug(b.name) }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const bird = findBird(slug);
  if (!bird) return { title: "Bird not found" };
  return {
    title: `${bird.name} — aging timeline`,
    description: `Every photo of ${bird.name} (${bird.breed}) over time — the aging record for Farm 2026, Hampton CT.`,
  };
}

export default async function BirdGalleryPage(
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const bird = findBird(slug);
  if (!bird) notFound();

  const photos = sortedPhotos(bird);
  const age = getBirdAgeLabel(bird.hatch_date, bird.hatch_date_estimated);
  const hatchStr = fmtDate(bird.hatch_date);

  return (
    <main className="min-h-screen bg-field-bg text-field-ink">
      <section className="max-w-4xl mx-auto px-4 py-10">
        <Link
          href="/flock"
          className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent hover:text-field-accent-deep"
        >
          ← the flock
        </Link>

        <div className="mt-4 mb-8 border-b border-field-border pb-6">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-field-ink mb-2">
            {bird.name}
          </h1>
          {bird.formerly && (
            <p className="font-mono text-[0.7rem] uppercase tracking-widest text-field-muted mb-2">
              fka {bird.formerly}
            </p>
          )}
          <p className="text-field-accent font-medium mb-3">{bird.breed}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.65rem] uppercase tracking-widest text-field-muted">
            {bird.leg_band && <BandChip band={bird.leg_band} />}
            {hatchStr && <span>hatched {hatchStr}</span>}
            {age && <span>· {age}</span>}
            <span>
              · {photos.length} {photos.length === 1 ? "photo" : "photos"}
            </span>
          </div>
        </div>

        {photos.length === 0 ? (
          <p className="text-field-muted">No photos on file yet — they&apos;ll appear here as they come in.</p>
        ) : (
          <ol className="space-y-10">
            {photos.map((ph, i) => {
              const dateStr = fmtDate(ph.date) ?? "undated";
              const ageStr = ageAtPhoto(bird.hatch_date, ph.date);
              return (
                <li key={ph.file} className="border-b border-field-hairline pb-8 last:border-b-0">
                  <div className="flex items-baseline justify-between gap-3 mb-3 font-mono text-[0.7rem] uppercase tracking-widest">
                    <span className="text-field-accent">{dateStr}</span>
                    {ageStr && <span className="text-field-muted">{ageStr}</span>}
                  </div>
                  <div className="relative w-full h-[70vh] bg-field-wash border border-field-border rounded-lg overflow-hidden">
                    <Image
                      src={`/photos/${ph.file}`}
                      alt={ph.caption || `${bird.name}, ${dateStr}`}
                      fill
                      sizes="(max-width: 896px) 100vw, 896px"
                      className="object-contain"
                      priority={i === 0}
                    />
                  </div>
                  {ph.caption && (
                    <p className="text-sm text-field-muted mt-3 leading-relaxed">{ph.caption}</p>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-12">
          <Link
            href="/flock"
            className="font-mono text-[0.7rem] uppercase tracking-widest text-field-accent hover:text-field-accent-deep"
          >
            ← back to the flock
          </Link>
        </div>
      </section>
    </main>
  );
}
