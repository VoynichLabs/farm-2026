/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 17-Apr-2026 (purpose re-clarified 18-Apr-2026)
 * PURPOSE: /yard route — secondary browse surface for the yard-diary
 *   stockpile. Frames are captured by farm-guardian's
 *   yard-diary-capture.py at 07:00 / 12:00 / 16:00 local and committed
 *   into public/photos/yard-diary/ as
 *   {YYYY-MM-DD}-{morning|noon|evening}.jpg. Each JPEG has the date
 *   (DD-Mon-YYYY, Boss's standard format) burned into the image itself
 *   so the final artifact reads as self-describing — no reliance on
 *   HTML captions, alt text, or any runtime metadata that could get
 *   stripped when the image is reused (print, slideshow, reel).
 *
 *   *** PRIMARY PURPOSE IS NOT THIS PAGE ***
 *   The yard-diary exists to produce a YEAR-END TIMELAPSE REEL
 *   (cherry bloom → summer green → autumn burn → snow). The /yard
 *   page is a secondary affordance so the stockpile is browsable,
 *   not the reason the stockpile exists. Individual frames are boring
 *   on purpose. Do not redesign this page to make the frames look
 *   more "gallery-like" — they are already correct. See
 *   farm-guardian/docs/17-Apr-2026-yard-diary-capture-plan.md and the
 *   auto-memory entry project_yard_diary_pipeline.md for the why.
 *
 *   Layout: latest frame as hero, then one row per day with up to three
 *   thumbs (morning / noon / evening) in chronological slot order, most
 *   recent date first. The whole thing is a server component — no
 *   client JS, no API calls at view time, no Cloudflare tunnel
 *   dependency. Railway serves the JPEGs from its own CDN and
 *   re-prerenders the page on each daily commit.
 * SRP/DRY check: Pass — single responsibility: enumerate frames from
 *   disk and render grouped by day. No I/O beyond readdirSync.
 */
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yard Diary",
  description:
    "Three frames of the yard every day — morning, noon, evening. Pulled from the Reolink. The seasons roll through the tree line.",
};

type Slot = "morning" | "noon" | "evening";
const SLOT_ORDER: readonly Slot[] = ["morning", "noon", "evening"] as const;
const SLOT_LABEL: Record<Slot, string> = {
  morning: "Morning",
  noon: "Noon",
  evening: "Evening",
};

interface Frame {
  date: string; // YYYY-MM-DD
  slot: Slot;
  src: string;
}

interface DayGroup {
  date: string;
  frames: Frame[]; // ordered morning → noon → evening
}

function readFrames(): Frame[] {
  const dir = path.join(process.cwd(), "public", "photos", "yard-diary");
  if (!fs.existsSync(dir)) return [];
  const pattern = /^(\d{4}-\d{2}-\d{2})-(morning|noon|evening)\.jpg$/;
  return fs
    .readdirSync(dir)
    .flatMap((f) => {
      const m = pattern.exec(f);
      if (!m) return [];
      return [
        {
          date: m[1],
          slot: m[2] as Slot,
          src: `/photos/yard-diary/${f}`,
        },
      ];
    });
}

function groupByDay(frames: Frame[]): DayGroup[] {
  const byDate = new Map<string, Frame[]>();
  for (const f of frames) {
    const bucket = byDate.get(f.date) ?? [];
    bucket.push(f);
    byDate.set(f.date, bucket);
  }
  const groups: DayGroup[] = [];
  for (const [date, bucket] of byDate) {
    bucket.sort(
      (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot),
    );
    groups.push({ date, frames: bucket });
  }
  groups.sort((a, b) => (a.date < b.date ? 1 : -1));
  return groups;
}

function latestFrame(groups: DayGroup[]): Frame | undefined {
  const today = groups[0];
  if (!today) return undefined;
  return today.frames[today.frames.length - 1];
}

function formatBossDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");
}

export default function YardDiaryPage() {
  const frames = readFrames();
  const groups = groupByDay(frames);
  const hero = latestFrame(groups);

  return (
    <main className="min-h-screen bg-cream">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-forest mb-3">
            Yard Diary
          </h1>
          <p className="text-forest/70 max-w-2xl mb-3">
            Three frames of the yard every day — morning, noon, evening —
            pulled from the Reolink. One long seasonal record: tree line
            budding, cherry blossoms, summer green, autumn burn, snow.
          </p>
          <p className="text-forest/55 max-w-2xl text-sm italic">
            These frames are stockpile for a year-end timelapse reel. The
            date is burned into each image so it survives any re-crop,
            re-share, or re-render. Individual frames are a little boring
            on purpose — the sequence is the artifact.
          </p>
          <nav className="mt-5 flex items-center gap-3 text-xs font-mono text-forest/60">
            <Link href="/gallery/gems" className="hover:text-forest transition-colors">
              Live gems →
            </Link>
          </nav>
        </header>

        {!hero ? (
          <div className="rounded-2xl border border-forest/10 bg-white p-12 text-center text-forest/60">
            No frames captured yet.
          </div>
        ) : (
          <>
            <figure className="mb-12">
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-forest/10 shadow-sm">
                <Image
                  src={hero.src}
                  alt={`Yard on ${formatBossDate(hero.date)}, ${SLOT_LABEL[hero.slot]}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1152px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-sm text-forest/60 font-serif">
                {formatBossDate(hero.date)} · {SLOT_LABEL[hero.slot]}
              </figcaption>
            </figure>

            <ol className="space-y-10">
              {groups.map((day) => (
                <li key={day.date}>
                  <h2 className="text-lg font-semibold font-serif text-forest mb-3">
                    {formatBossDate(day.date)}
                  </h2>
                  <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {day.frames.map((frame) => (
                      <li key={frame.slot}>
                        <figure>
                          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-forest/10">
                            <Image
                              src={frame.src}
                              alt={`Yard on ${formatBossDate(frame.date)}, ${SLOT_LABEL[frame.slot]}`}
                              fill
                              sizes="(max-width: 640px) 100vw, 33vw"
                              className="object-cover"
                            />
                          </div>
                          <figcaption className="mt-1.5 text-xs text-forest/60 font-serif tracking-wide">
                            {SLOT_LABEL[frame.slot]}
                          </figcaption>
                        </figure>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </main>
  );
}
