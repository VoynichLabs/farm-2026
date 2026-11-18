/**
 * Author: Claude Haiku 5.5 Medium
 * Date: 18-Nov-2026
 * PURPOSE: Front-page film strip. One row per Ornitharch: a bird's name, sex,
 *   band and breed on the left; a run of its best picture per day in the
 *   middle (each labelled with its day count and date, the newest outlined
 *   in amber); and picture count, first and newest picture on the right.
 *   Server component: all data comes from buildStrips() at build time, so it
 *   ships no client JavaScript. On a wide screen each row is one line of
 *   pictures; on a phone the pictures wrap into a grid, so nothing scrolls
 *   sideways. The strip keeps its own dark palette (a self-contained surface,
 *   like /markets), so it does not use the sitewide field tokens.
 *   Integration: rendered by app/page.tsx; data from lib/ornitharch-strip.ts.
 * SRP/DRY check: Pass. Layout only; the data and every label come from
 *   buildStrips(). The section heading year is derived too, not typed.
 */
import Image from "next/image";
import type { StripBird, StripData } from "@/lib/ornitharch-strip";

const AMBER = "text-[#e0a83a]";
const MUTED = "text-[#9a9b8b]";
const INK = "text-[#e6e4d8]";

function BirdRow({ bird }: { bird: StripBird }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#232820] py-3 md:flex-row md:items-start md:gap-4">
      <div className="flex shrink-0 flex-col gap-0.5 md:w-48">
        <div className={`text-[15px] font-semibold ${AMBER}`}>{bird.name}</div>
        {bird.sex ? <div className={INK}>{bird.sex}</div> : null}
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-[#3a3f33]"
            style={{ backgroundColor: bird.bandColour }}
          />
          <span className={INK}>{bird.bandText}</span>
        </div>
        <div className={MUTED}>hatched {bird.hatchedText}</div>
        <div className={MUTED}>{bird.breed}</div>
      </div>

      <div className="min-w-0 flex-1 border border-[#1d2119] bg-[#050604] p-1.5">
        <ul className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:flex md:flex-nowrap">
          {bird.pictures.map((pic) => (
            <li
              key={pic.src}
              className="flex min-w-0 flex-col gap-1 md:max-w-[132px] md:flex-1"
            >
              <div
                className="relative aspect-[4/5] w-full overflow-hidden bg-[#10130e]"
                style={{ outline: pic.newest ? "1px solid #e0a83a" : undefined, outlineOffset: "-1px" }}
              >
                <Image
                  src={pic.src}
                  alt={`${bird.name}, ${pic.dayLabel}, ${pic.shortDate}${pic.withOthers ? ", with other birds" : ""}`}
                  fill
                  sizes="(max-width: 640px) 25vw, (max-width: 768px) 17vw, 132px"
                  className="object-cover object-[50%_30%]"
                />
                {pic.withOthers ? (
                  <span className="absolute left-1 top-1 bg-[#0a0c09] px-1 py-0.5 text-[9px] leading-none text-[#e0a83a] ring-1 ring-[#3a3f33]">
                    WITH OTHERS
                  </span>
                ) : null}
              </div>
              <div className="text-[10px] leading-tight">
                <div className={pic.newest ? AMBER : INK}>{pic.dayLabel}</div>
                <div className={MUTED}>{pic.shortDate}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className={`flex shrink-0 flex-col gap-1.5 ${MUTED} md:w-40`}>
        <div>
          PICTURES <span className={`font-semibold ${INK}`}>{bird.pictures.length}</span>
        </div>
        <div>
          FIRST PICTURE
          <div className={INK}>{bird.firstText}</div>
        </div>
        <div>
          NEWEST PICTURE
          <div className={INK}>{bird.newestText}</div>
        </div>
      </div>
    </div>
  );
}

export default function OrnitharchStrip({ data }: { data: StripData }) {
  return (
    <section
      aria-labelledby="ornitharch-strip-heading"
      className="bg-[#0a0c09] px-4 py-6 font-mono text-xs text-[#e6e4d8]"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-1 pb-3">
          <h2 id="ornitharch-strip-heading" className="text-sm font-semibold tracking-[0.06em]">
            THE {data.classYear} HATCH, PICTURE BY PICTURE
          </h2>
          <p className={MUTED}>
            Each row runs from the oldest picture on the left to the newest on the right. The line under
            each picture says which day of the bird&apos;s life it was taken. Day 0 is hatch day.
          </p>
        </div>

        <div className="border-t border-[#232820]">
          {data.birds.map((bird) => (
            <BirdRow key={bird.name} bird={bird} />
          ))}
        </div>

        <p className={`border-b border-[#232820] py-2 ${MUTED}`}>
          Pictures tagged WITH OTHERS show more than one bird. The amber outline marks the newest picture
          in each row.
        </p>
      </div>
    </section>
  );
}
