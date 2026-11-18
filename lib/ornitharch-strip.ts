/**
 * Author: Claude Haiku 5.5 Medium
 * Date: 18-Nov-2026
 * PURPOSE: Builds the front-page film strip data: one row per Ornitharch (a
 *   bird hatched on the farm), each row a run of the best picture from each
 *   day, hatch day to the newest picture. Birds with the most pictures come
 *   first; Birddor (deceased) is always last. Dates, ages, band text and
 *   counts are derived from content/flock-profiles.json at build time. The
 *   only thing typed in here is WHICH pictures to show: the Boss picks one
 *   good frame per day, and that choice is editorial, so it lives in PICKS.
 *   Integration: consumed by app/components/home/OrnitharchStrip.tsx, which
 *   renders on app/page.tsx. Reads content/flock-profiles.json through
 *   getFlockProfiles() from lib/content.ts, and the picture files on disk
 *   under public/photos/ (missing files are reported and skipped).
 *   The 13-day rule from lib/content.ts applies here too: the literal number
 *   13 must never reach the page as an age, so a day-13 label reads "2 weeks".
 * SRP/DRY check: Pass. Reuses getFlockProfiles() and FlockBird/LegBand types
 *   from lib/content.ts; does not re-implement the age tiers (the strip uses
 *   plain "day N" by Boss request, not the week/month tiers).
 *
 * CHANGELOG: 1.46.0 — new front-page film strip (see CHANGELOG.md).
 */
import fs from "node:fs";
import path from "node:path";
import { getFlockProfiles, type FlockBird } from "@/lib/content";

/**
 * Editorial picks: picture files (relative to public/photos/), one per day,
 * in any order. Dates come from the roster photos[] ledger, so a pick that
 * is not in the ledger is reported and dropped. Keep each bird to one frame
 * per calendar day; buildStrips() drops a second frame for the same day and
 * says so.
 */
const PICKS: Record<string, string[]> = {
  Birdadotta: [
    "may-2026/birdadotta-s7-2026-05-18.png",
    "birds/IMG_6271-birdadotta-23jun2026.jpg",
    "birds/input-IMG_0633-birdadotta-black-rust-27oct2026.jpg",
  ],
  Birdsilla: [
    "may-2026/chick3-day4-portrait.jpg",
    "birds/IMG_4940-birdsilla-crop-28may2026.jpg",
    "birds/IMG_6262-birdthazar-birdsilla-23jun2026.jpg",
    "birds/henriella-birdsilla-birdthazar-16jul2026.jpg",
    "birds/IMG_7556-birdsilla-21jul2026.jpg",
    "birds/IMG_9843-birdsilla-brown-stands-15sep2026.jpg",
    "birds/input-IMG_0938-birdsilla-brown-perches-16nov2026.jpg",
  ],
  Birdthazar: [
    "may-2026/birdthazar-day4-portrait.jpg",
    "birds/IMG_6268-birdthazar-23jun2026.jpg",
    "birds/henriella-birdsilla-birdthazar-16jul2026.jpg",
    "birds/IMG_9857-birdthazar-brown-red-15sep2026.jpg",
  ],
  Henriello: [
    "may-2026/chick2-day4-portrait.jpg",
    "birds/IMG_6283-henriella-23jun2026.jpg",
    "birds/henriella-birdsilla-birdthazar-16jul2026.jpg",
    "birds/IMG_7791-henriella-large-adult-23jul2026.jpg",
  ],
  Birdimir: [
    "birds/IMG_5089-birdimir-hatch-02jun2026.jpg",
    "birds/IMG_6233-birdimir-juvenile-22jun2026.jpg",
    "birds/7543bc8a99af2856a2e7344c32e30ee603b9fc7fccadaf3157a3b3ccf6bed5d1-birdimir-white-chicken-15aug2026.png",
    "birds/IMG_9586-birdimir-white-black-06sep2026.jpg",
    "birds/s7-cam-gem-birdimir-white-black-19sep2026.jpg",
    "birds/input-IMG_0205-birdimir-white-black-03oct2026.jpg",
    "birds/input-IMG_0862-birdimir-white-dark-12nov2026.jpg",
    "birds/input-IMG_0937-birdimir-white-black-16nov2026.jpg",
  ],
  Ingebird: [
    "june-2026/june-clutch-six-IMG_5307.jpg",
    "birds/IMG_6227-ingebird-suspected-22jun2026.jpg",
    "birds/ingebird-17jul2026.jpg",
    "birds/IMG_7718-ingebird-black-white-21jul2026.jpg",
    "birds/ingebird-crop-ingebird-black-white-07sep2026.jpg",
    "birds/image-ingebird-henriessa-henridot-speckled-hens-19sep2026.png",
  ],
  Henridot: [
    "june-2026/june-clutch-six-IMG_5307.jpg",
    "birds/henridotta-17jul2026.jpg",
    "birds/IMG_7713-henridotta-purpleband12-21jul2026.jpg",
    // The 29-Jul wing-spread frame is the Boss's pick for this day.
    "birds/IMG_8044-henridotta-wings-flapping-29jul2026.jpg",
    "birds/IMG_8951-henridotta-black-white-17aug2026.jpg",
    "birds/IMG_8946-henridotta-black-white-22aug2026.jpg",
    "birds/IMG_9142-henridotta-speckled-adult-26aug2026.jpg",
    "birds/IMG_9520-henridotta-black-white-04sep2026.jpg",
    "birds/s7-cam-gem-henridotta-black-white-07sep2026.jpg",
    "birds/IMG_9883-henridot-speckled-chicken-16sep2026.jpg",
    "birds/image-ingebird-henriessa-henridot-speckled-hens-19sep2026.png",
    "birds/IMG_0480-henridot-speckled-perches-21oct2026.jpg",
  ],
  Henriessa: [
    "june-2026/june-clutch-six-IMG_5307.jpg",
    "birds/henriessa-17jul2026.jpg",
    "birds/IMG_7655-henriessa-silver-21jul2026.jpg",
    "birds/IMG_8649-henriessa-grey-speckled-10aug2026.jpg",
    "birds/henriessa_crop-henriessa-speckled-grey-02sep2026.jpg",
    "birds/IMG_9846-henriessa-speckled-grey-15sep2026.jpg",
    "birds/image-ingebird-henriessa-henridot-speckled-hens-19sep2026.png",
    "birds/input-IMG_0932-henriessa-speckled-grey-16nov2026.jpg",
  ],
  Horstabird: [
    "june-2026/horstabird-IMG_5171.jpg",
    "birds/IMG_7644-horstabird-21jul2026.jpg",
    "birds/285ccb73cc290621e91de5bea116638a5bb4dba7fe34745db1803727a613a0d2-horstabird-brown-black-08aug2026.jpg",
    "birds/input-IMG_0838-horstabird-brown-reddish-08nov2026.jpg",
  ],
  Adelbird: [
    "june-2026/adelbird-IMG_5184.jpg",
    "birds/IMG_7731-adelbird-dark-speckled-21jul2026.jpg",
    "birds/5431f4deeadd9a70b4299d8306348963d204182e68d05146b23015ff4f536029-adelbird-black-white-08aug2026.jpg",
    "birds/IMG_9150-adelbird-black-white-26aug2026.jpg",
    "birds/IMG_9516-adelbird-speckled-adult-04sep2026.jpg",
    "birds/s7-cam-gem-adelbird-speckled-adult-19sep2026.jpg",
    "birds/input-IMG_0444-adelbird-speckled-red-19oct2026.jpg",
    "birds/input-IMG_0631-adelbird-speckled-perches-27oct2026.jpg",
    "birds/input-IMG_0828-adelbird-rust-black-08nov2026.jpg",
    "birds/input-IMG_0929-adelbird-speckled-perches-16nov2026.jpg",
  ],
  Birddor: [
    "april-2026/birdadette-fresh-hatch.jpg",
    "april-2026/birdadette-day8-keyboard.jpg",
    "april-2026/birdadette-3weeks-b.jpg",
    "may-2026/birdadette-may20-portrait.jpg",
    "birds/IMG_5849-birdadette-23jun2026.jpg",
    "birds/IMG_9160-birddor-golden-brown-26aug2026.png",
    "birds/IMG_9640-birddor-copper-grey-07sep2026.jpg",
  ],
};

// Birds shown on the strip. Birddor is the only deceased bird; he is listed last.
export const LAST_BIRD = "Birddor";

export interface StripPicture {
  src: string; // web path, e.g. "/photos/birds/IMG_7713-....jpg"
  date: string; // "YYYY-MM-DD"
  dayLabel: string; // "day 23", or "2 weeks" at 13 days (see header)
  shortDate: string; // "18 May"
  withOthers: boolean; // a group picture showing more than one bird
  newest: boolean; // the last frame in the row
}

export interface StripBird {
  name: string;
  sex: string; // "hen" | "rooster" | "" when not on file
  hatchedText: string; // "25 Apr"
  breed: string; // plain words, e.g. "Easter Egger and Rhode Island Red"
  bandText: string; // "orange band, number 10"
  bandColour: string; // hex, for the band dot
  deceased: boolean;
  pictures: StripPicture[];
  firstText: string; // "18 May, day 23"
  newestText: string;
}

export interface StripData {
  birds: StripBird[];
  pictureCount: number; // unique pictures across all rows
  newestDate: string; // "YYYY-MM-DD"
  classYear: number; // the year of the earliest hatch
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MS_PER_DAY = 86400000;
const BAND_COLOURS: Record<string, string> = {
  yellow: "#e3b341",
  orange: "#e8833a",
  red: "#d9534f",
  purple: "#9b7bd1",
  pink: "#e07bb0",
  white: "#e8e8e0",
  green: "#5fae5a",
  blue: "#4a9fe0",
};
const UNKNOWN_BAND_COLOUR = "#555555";

// "2026-06-03" -> whole days since 1970, so differences are exact (no time zone drift).
function dayNumber(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / MS_PER_DAY;
}

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}`;
}

// Day count from hatch day (day 0). A 13 never reaches the page.
function dayLabel(days: number): string {
  if (days === 13) return "2 weeks";
  return `day ${days}`;
}

function plainBreed(breed: string): string {
  return breed
    .replace(/\s*\([^)]*\)/g, "") // drop parentheticals such as "(cross TBD)"
    .replace(/\blineage\b/gi, "")
    .replace(/\bRIR\b/g, "Rhode Island Red")
    .replace(/\s*×\s*/g, " and ")
    .replace(/\s+cross\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// The live band if there is one; otherwise the lost band from the history.
function bandText(bird: FlockBird): { text: string; colour: string } {
  const live = bird.leg_band;
  if (live) {
    const number = live.number == null ? "number not on file" : `number ${live.number}`;
    return { text: `${live.color} band, ${number}`, colour: BAND_COLOURS[live.color] ?? UNKNOWN_BAND_COLOUR };
  }
  const lost = (bird.leg_band_history ?? []).find((b) => b.status === "lost");
  if (lost) {
    const number = lost.number == null ? "number not on file" : `number ${lost.number}`;
    const when = lost.lost_date ? `, lost ${shortDate(lost.lost_date)}` : ", lost";
    return { text: `${lost.color} band, ${number}${when}`, colour: BAND_COLOURS[lost.color] ?? UNKNOWN_BAND_COLOUR };
  }
  return { text: "no band on record", colour: UNKNOWN_BAND_COLOUR };
}

// Pictures showing more than one bird. Listed by hand because the roster does
// not record it; shown with a WITH OTHERS tag on the strip.
const GROUP_PICTURES = new Set([
  "june-2026/june-clutch-six-IMG_5307.jpg",
  "birds/IMG_6262-birdthazar-birdsilla-23jun2026.jpg",
  "birds/henriella-birdsilla-birdthazar-16jul2026.jpg",
  "birds/image-ingebird-henriessa-henridot-speckled-hens-19sep2026.png",
]);

// Maps each ledger file to its roster date.
function ledgerIndex(birds: FlockBird[]): Map<string, { date: string }> {
  const index = new Map<string, { date: string }>();
  for (const bird of birds) {
    for (const photo of bird.photos ?? []) {
      if (photo.date && !index.has(photo.file)) index.set(photo.file, { date: photo.date });
    }
  }
  return index;
}

/**
 * Builds the strip data. Pure apart from reading the roster and checking that
 * picture files exist on disk; the page calls it once at build time.
 */
export function buildStrips(): StripData | null {
  const flock = getFlockProfiles();
  if (!flock) return null;
  const all = flock.flock_birds;
  const ledger = ledgerIndex(all);
  const byName = new Map(all.map((b) => [b.name, b]));

  const rows: StripBird[] = [];
  const seenFiles = new Set<string>();
  let newestDate = "";
  let classYear = Infinity;

  for (const [name, files] of Object.entries(PICKS)) {
    const bird = byName.get(name);
    if (!bird || !bird.hatch_date) {
      console.warn(`[ornitharch-strip] no roster entry with a hatch date for ${name}; row skipped`);
      continue;
    }
    const hatch = bird.hatch_date;
    classYear = Math.min(classYear, Number(hatch.slice(0, 4)));

    const seenDays = new Set<string>();
    const picked: { file: string; date: string }[] = [];
    for (const file of files) {
      const entry = ledger.get(file);
      const exists = fs.existsSync(path.join(process.cwd(), "public", "photos", file));
      if (!entry || !exists) {
        console.warn(`[ornitharch-strip] ${name}: ${file} is not in the roster ledger or on disk; skipped`);
        continue;
      }
      if (seenDays.has(entry.date)) {
        console.warn(`[ornitharch-strip] ${name}: a second frame on ${entry.date} dropped (${file})`);
        continue;
      }
      seenDays.add(entry.date);
      picked.push({ file, date: entry.date });
    }
    picked.sort((a, b) => a.date.localeCompare(b.date));
    if (picked.length === 0) continue;

    const pictures: StripPicture[] = picked.map((p, i) => {
      seenFiles.add(p.file);
      const days = dayNumber(p.date) - dayNumber(hatch);
      return {
        src: `/photos/${p.file}`,
        date: p.date,
        dayLabel: dayLabel(days),
        shortDate: shortDate(p.date),
        withOthers: GROUP_PICTURES.has(p.file),
        newest: i === picked.length - 1,
      };
    });
    const first = picked[0];
    const last = picked[picked.length - 1];
    if (last.date > newestDate) newestDate = last.date;
    const band = bandText(bird);
    rows.push({
      name,
      sex: bird.sex ?? "",
      hatchedText: shortDate(hatch),
      breed: plainBreed(bird.breed),
      bandText: band.text,
      bandColour: band.colour,
      deceased: bird.status === "deceased",
      pictures,
      firstText: `${shortDate(first.date)}, ${dayLabel(dayNumber(first.date) - dayNumber(hatch))}`,
      newestText: `${shortDate(last.date)}, ${dayLabel(dayNumber(last.date) - dayNumber(hatch))}`,
    });
  }

  // Most pictures first; the deceased bird last; ties keep roster order.
  rows.sort((a, b) => {
    if (a.deceased !== b.deceased) return a.deceased ? 1 : -1;
    return b.pictures.length - a.pictures.length;
  });

  return {
    birds: rows,
    pictureCount: seenFiles.size,
    newestDate,
    classYear: Number.isFinite(classYear) ? classYear : new Date().getFullYear(),
  };
}
