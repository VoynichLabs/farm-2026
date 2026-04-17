/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 17-Apr-2026
 * PURPOSE: /yard route — daily yard-diary grid. One frame per day pulled
 *   from the Reolink (house-yard) at noon by the farm-guardian launchd
 *   job (~/Library/LaunchAgents/com.voynichlabs.yard-diary-capture.plist),
 *   committed to public/photos/yard-diary/{YYYY-MM-DD}.jpg and served
 *   from Railway's own CDN. No Cloudflare tunnel dependency at view time.
 *   Today's frame is the hero; previous days fall into a reverse-chron
 *   grid. Captures seasonal change — cherry bloom, summer, fall colour,
 *   snow — on a predictable daily cadence.
 * SRP/DRY check: Pass — single responsibility: enumerate daily frames
 *   from disk and render. No API I/O, no client state.
 */
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Yard Diary",
  description:
    "One frame of the yard, every day. Pulled from the Reolink at noon. The seasons roll through the tree line.",
};

interface DiaryEntry {
  date: string;
  src: string;
}

function getEntries(): DiaryEntry[] {
  const diaryDir = path.join(process.cwd(), "public", "photos", "yard-diary");
  if (!fs.existsSync(diaryDir)) return [];
  const files = fs
    .readdirSync(diaryDir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.jpg$/.test(f))
    .sort()
    .reverse();
  return files.map((f) => ({
    date: f.replace(/\.jpg$/, ""),
    src: `/photos/yard-diary/${f}`,
  }));
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function YardDiaryPage() {
  const entries = getEntries();
  const hero = entries[0];
  const rest = entries.slice(1);

  return (
    <main className="min-h-screen bg-cream">
      <section className="max-w-6xl mx-auto px-4 py-12">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-forest mb-3">
            Yard Diary
          </h1>
          <p className="text-forest/70 max-w-2xl">
            One frame of the yard, captured from the Reolink at noon every
            day. The tree line does what tree lines do — bud, bloom, leaf out,
            burn, drop, gather snow. This is the slow-cadence record.
          </p>
        </header>

        {!hero ? (
          <div className="rounded-2xl border border-forest/10 bg-white p-12 text-center text-forest/60">
            No frames captured yet. The first will land today at noon.
          </div>
        ) : (
          <>
            <figure className="mb-12">
              <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden border border-forest/10 shadow-sm">
                <Image
                  src={hero.src}
                  alt={`Yard on ${formatDate(hero.date)}`}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 1152px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-sm text-forest/60 font-serif">
                {formatDate(hero.date)}
              </figcaption>
            </figure>

            {rest.length > 0 && (
              <>
                <h2 className="text-xl font-semibold font-serif text-forest mb-4">
                  Earlier
                </h2>
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {rest.map((entry) => (
                    <li key={entry.date}>
                      <figure>
                        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border border-forest/10">
                          <Image
                            src={entry.src}
                            alt={`Yard on ${formatDate(entry.date)}`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                            className="object-cover"
                          />
                        </div>
                        <figcaption className="mt-2 text-xs text-forest/60 font-serif">
                          {formatDate(entry.date)}
                        </figcaption>
                      </figure>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
