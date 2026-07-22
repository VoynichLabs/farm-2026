/**
 * Author: Claude Opus 4.8 (1M context)
 * Date: 07-Jun-2026
 * PURPOSE: Server-side content loader for MDX/JSON content. Reads projects, diary entries,
 *   field notes, flock profiles, and materials from the content/ directory using gray-matter.
 *   Field notes are the weekly farm update system (replaces diary for public-facing updates).
 * SRP/DRY check: Pass — all content loading flows through this single module.
 *   getBirdAgeLabel() is the single age authority: it computes a live age label from a
 *   bird's hatch_date (full, partial, or year-only) on every render. Every bird now
 *   carries a hatch_date, so there is no hardcoded "age" string left to go stale —
 *   estimated dates are flagged (hatch_date_estimated) and surfaced as "(est.)".
 */
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const contentDir = path.join(process.cwd(), "content");

export interface Project {
  slug: string;
  title: string;
  status: "planning" | "active" | "complete" | "shelved";
  description: string;
  heroPhoto: string;
  tags: string[];
  startDate: string;
  location: string;
  content: string;
}

export interface DiaryEntry {
  date: string;
  title: string;
  content: string;
  photos: string[];
  projectSlug?: string;
  tags: string[];
}

export interface Material {
  name: string;
  qty: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  notes: string;
  category: string;
  supplier?: string;
}

export interface Breed {
  description: string;
  egg_color: string;
  eggs_per_year: number | string;
  temperament: string;
  cold_hardiness: string;
  typical_lifespan: string;
  fun_fact: string;
}

export interface LegBand {
  color: string;
  number: number | null; // null = unnumbered (e.g. Henrietta's historical purple)
  side?: "left" | "right"; // left = hatched on the farm (an ornitharch)
  confirmed?: boolean;
  confirmed_date?: string;
  note?: string;
}

export interface FlockBird {
  name: string;
  breed: string;
  hatch_date?: string;
  // True when hatch_date is a reasoned estimate (no recorded hatch) rather than
  // an observed date — drives the "~ … (est.)" marker on the live age label.
  hatch_date_estimated?: boolean;
  age_note: string;
  status: string;
  egg_color: string;
  temperament: string;
  color_description: string;
  photo: string | null;
  notes: string;
  location?: string;
  deceased_date?: string;
  cause_of_death?: string;
  // Former name, when a bird was renamed (e.g. Birddor fka Birdadette) —
  // used to join roster entries to hatch records filed under the old name.
  formerly?: string;
  // True for birds hatched on the farm in 2026 — the Ornitharchs.
  ornitharch?: boolean;
  // Numbered leg band — the canonical ID (several birds are near-identical).
  // Left leg = hatched on the farm. Boss-assigned; see /flock/banding.
  leg_band?: LegBand;
  // Optional second frame for memorial/founder tiles (e.g. Henrietta's 2022
  // throwback) — rotated against `photo` with the label as the era chip.
  photo_throwback?: string;
  photo_throwback_label?: string;
}

// Turn a whole-day count into the human age tier:
//   0–13   → "Day X"
//   14–55  → "X weeks"
//   56–364 → "X months"   (30-day months)
//   365+   → "Y years[ M months]"  (365-day years, remainder in 30-day months)
// 30/365 approximations are intentional — they keep the farm's casual age
// language ("2 months", "1 year 2 months") rather than drifting into exact
// calendar arithmetic the registry never speaks.
//
// Triskaidekaphobia rule (Boss has it — see FlockGemStrip + CHANGELOG): the
// literal "13" must never reach the DOM. A 13-day-old bird is shown as
// "2 weeks" (one day early) instead of "Day 13". No higher tier can produce a
// 13 — weeks cap at 7 (≤55 days), months at 12 (≤364 days), and no farm bird
// comes near 13 years — so "Day 13" is the only reachable 13 to suppress.
function formatBirdAge(days: number): string {
  if (days === 13) return "2 weeks";
  if (days <= 13) return `Day ${days}`;
  if (days <= 55) {
    const weeks = Math.floor(days / 7);
    return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} month${months !== 1 ? "s" : ""}`;
  }
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  const yearPart = `${years} year${years !== 1 ? "s" : ""}`;
  if (months === 0) return yearPart;
  return `${yearPart} ${months} month${months !== 1 ? "s" : ""}`;
}

/**
 * The single source of truth for a bird's age: compute a live, human-readable
 * label from its hatch date against the system clock on every render. This is
 * what keeps the flock registry from ever showing a stale hardcoded "age".
 *
 * Accepts three date precisions, mirroring what flock-profiles.json records:
 *   - "YYYY-MM-DD" (exact)        → precise label, e.g. "2 months"
 *   - "YYYY-MM"    (month known)  → anchored to mid-month, prefixed "~"
 *   - "YYYY"       (year known)   → anchored to mid-year, prefixed "~"
 * The "~" prefix marks a label derived from an approximate hatch date so the
 * imprecision is visible rather than implied.
 *
 * `estimated` (the bird's hatch_date_estimated flag) marks a hatch date that was
 * reasoned out rather than observed — e.g. an adult hen with only a fuzzy "over
 * 2 years", or a store-bought cohort dated from its purchase day. An estimated
 * date is inherently approximate, so it is always prefixed "~" and suffixed
 * " (est.)" → "~2 years 2 months (est.)" — keeping the guess honest on the card.
 *
 * Returns null only when there is genuinely no usable date (absent, malformed,
 * or in the future). Every bird in the registry now carries a hatch_date, so in
 * practice the null branch is only the safety net for a future date-less entry.
 */
export function getBirdAgeLabel(hatchDate?: string, estimated?: boolean): string | null {
  if (!hatchDate) return null;

  let hatch: Date;
  let approximate = false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(hatchDate)) {
    hatch = new Date(`${hatchDate}T00:00:00`);
  } else if (/^\d{4}-\d{2}$/.test(hatchDate)) {
    // Month known but not the day — anchor to the middle of the month.
    hatch = new Date(`${hatchDate}-15T00:00:00`);
    approximate = true;
  } else if (/^\d{4}$/.test(hatchDate)) {
    // Only the year is known — anchor to mid-year.
    hatch = new Date(`${hatchDate}-07-01T00:00:00`);
    approximate = true;
  } else {
    return null;
  }
  if (Number.isNaN(hatch.getTime())) return null;

  const now = new Date();
  const days = Math.floor((now.getTime() - hatch.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;

  // An estimated hatch date is approximate by definition — show the "~" too.
  if (estimated) approximate = true;
  const label = formatBirdAge(days);
  const prefixed = approximate ? `~${label}` : label;
  return estimated ? `${prefixed} (est.)` : prefixed;
}

export interface IncubatorClutch {
  label: string;             // e.g. "Clutch #3 (May 2026)"
  set_date: string;          // ISO date the egg(s) went into the incubator
  expected_hatch?: string;   // ISO date — usually set_date + 21 days for chickens
  egg_count?: number;
  dam?: string;              // hen name when known
  sire?: string;             // rooster name when known
  egg_color?: string;        // helps tag the cohort visually
  notes?: string;            // short field-station note
}

export interface FlockProfiles {
  breeds: Record<string, Breed>;
  flock_birds: FlockBird[];
  incubating?: IncubatorClutch[];
}

export interface FieldNote {
  slug: string;
  title: string;
  date: string;
  cover: string;
  photos: { src: string; caption: string }[];
  tags: string[];
  content: string;
}

export function getProjects(): Project[] {
  const projectsDir = path.join(contentDir, "projects");
  if (!fs.existsSync(projectsDir)) return [];

  return fs
    .readdirSync(projectsDir)
    .filter((slug) =>
      fs.existsSync(path.join(projectsDir, slug, "index.mdx"))
    )
    .map((slug) => getProject(slug)!)
    .filter(Boolean);
}

export function getProject(slug: string): Project | null {
  const filePath = path.join(contentDir, "projects", slug, "index.mdx");
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    status: data.status ?? "planning",
    description: data.description ?? "",
    heroPhoto: data.heroPhoto ?? "",
    tags: data.tags ?? [],
    startDate: data.startDate ?? "",
    location: data.location ?? "",
    content,
  };
}

export function getProjectEntries(slug: string): DiaryEntry[] {
  const entriesDir = path.join(contentDir, "projects", slug, "entries");
  if (!fs.existsSync(entriesDir)) return [];

  return fs
    .readdirSync(entriesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(entriesDir, f), "utf-8");
      const { data, content } = matter(raw);
      return {
        date: data.date ?? f.replace(".mdx", ""),
        title: data.title ?? "",
        content,
        photos: data.photos ?? [],
        projectSlug: data.project ?? slug,
        tags: data.tags ?? [],
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getProjectMaterials(slug: string): Material[] {
  const materialsPath = path.join(
    contentDir,
    "projects",
    slug,
    "materials.json"
  );
  if (!fs.existsSync(materialsPath)) return [];

  return JSON.parse(fs.readFileSync(materialsPath, "utf-8"));
}

export function getProjectDrawings(slug: string): string[] {
  const drawingsDir = path.join(contentDir, "projects", slug, "drawings");
  if (!fs.existsSync(drawingsDir)) return [];

  return fs
    .readdirSync(drawingsDir)
    .filter((f) => /\.(png|jpg|jpeg|svg)$/i.test(f))
    .map((f) => `/content/projects/${slug}/drawings/${f}`);
}

export function getAllDiaryEntries(): DiaryEntry[] {
  const entries: DiaryEntry[] = [];

  // Collect from all projects
  const projectsDir = path.join(contentDir, "projects");
  if (fs.existsSync(projectsDir)) {
    for (const slug of fs.readdirSync(projectsDir)) {
      entries.push(...getProjectEntries(slug));
    }
  }

  // Collect from /content/diary
  const diaryDir = path.join(contentDir, "diary");
  if (fs.existsSync(diaryDir)) {
    for (const f of fs.readdirSync(diaryDir).filter((f) => f.endsWith(".mdx"))) {
      const raw = fs.readFileSync(path.join(diaryDir, f), "utf-8");
      const { data, content } = matter(raw);
      entries.push({
        date: data.date ?? f.replace(".mdx", ""),
        title: data.title ?? "",
        content,
        photos: data.photos ?? [],
        projectSlug: data.project,
        tags: data.tags ?? [],
      });
    }
  }

  return entries.sort((a, b) => b.date.localeCompare(a.date));
}

export function getFlockProfiles(): FlockProfiles | null {
  const flockPath = path.join(contentDir, "flock-profiles.json");
  if (!fs.existsSync(flockPath)) return null;

  return JSON.parse(fs.readFileSync(flockPath, "utf-8"));
}

export function getAllFieldNotes(): FieldNote[] {
  const notesDir = path.join(contentDir, "field-notes");
  if (!fs.existsSync(notesDir)) return [];

  return fs
    .readdirSync(notesDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(notesDir, f), "utf-8");
      const { data, content } = matter(raw);
      const slug = f.replace(".mdx", "");
      return {
        slug,
        title: data.title ?? slug,
        date: data.date ?? slug.slice(0, 10),
        cover: data.cover ?? "",
        photos: data.photos ?? [],
        tags: data.tags ?? [],
        content,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

// =============================================================
// Hatch records — per-chick SoT from content/hatches/<year>/*.md
// Schema: content/hatches/SCHEMA.md
// =============================================================

export interface HatchPhoto {
  path: string;
  confidence: string;
  caption: string;
  /** ISO date the photo was taken, when known — drives the age tag
   *  ("hatch day", "day 8", "wk 3") on rotating portrait tiles. */
  date?: string;
  /** false = documentary shot (equipment, thermometer, group context) that
   *  belongs in the hatch record but not in a bird's portrait rotation. */
  showcase?: boolean;
}

export interface HatchObservation {
  date: string;
  age_days?: number;
  observed?: Record<string, unknown>;
  prediction?: {
    expected_adult_plumage?: string;
    expected_sex?: string;
    confidence?: string;
    reasoning?: string;
  };
  notes?: string;
}

export interface HatchAdultOutcome {
  date_reached_adult?: string;
  actual_plumage?: string;
  actual_sex?: string;
  prediction_review?: Array<{
    observation_date?: string;
    plumage_match?: string;
    sex_match?: string | boolean;
    notes?: string;
  }>;
}

export interface HatchLifecycle {
  named_date?: string;
  moved_to_brooder_date?: string;
  moved_to_coop_date?: string;
  current_location?: string;
  lost_date?: string;
  lost_cause?: string;
}

export interface HatchRecord {
  id: string;
  clutch_id?: string;
  egg_id?: string;
  hatch_date: string;
  hatch_time?: string;
  incubator: string;
  egg_set_date?: string;
  egg_color?: string;
  breed?: string;
  parent_hen?: string;
  parent_rooster_window?: string;
  parentage_confidence?: string;
  name?: string;
  status?: string;
  photos: HatchPhoto[];
  evidence: string[];
  phenotype_observations: HatchObservation[];
  adult_outcome?: HatchAdultOutcome;
  lifecycle?: HatchLifecycle;
  lifecycle_summary?: string;
  body: string;     // free-text markdown body
  filename: string; // for stable links / debugging
  year: string;
}

// YAML auto-parses 2026-04-06 into a Date. Normalize back to "YYYY-MM-DD"
// so downstream code (and the type signature) can rely on strings.
const toISODate = (v: unknown): string => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
};

const normalizeObservation = (o: unknown): HatchObservation => {
  const obs = (o ?? {}) as Record<string, unknown>;
  const observedRaw = (obs.observed ?? {}) as Record<string, unknown>;
  const observedNorm: Record<string, unknown> = {};
  for (const [k, val] of Object.entries(observedRaw)) {
    observedNorm[k] = val instanceof Date ? val.toISOString().slice(0, 10) : val;
  }
  return {
    date: toISODate(obs.date),
    age_days: typeof obs.age_days === "number" ? obs.age_days : undefined,
    observed: observedNorm,
    prediction: obs.prediction as HatchObservation["prediction"],
    notes: obs.notes ? String(obs.notes) : undefined,
  };
};

const normalizeLifecycle = (lc: unknown): HatchLifecycle | undefined => {
  if (!lc || typeof lc !== "object") return undefined;
  const l = lc as Record<string, unknown>;
  return {
    named_date: l.named_date ? toISODate(l.named_date) : undefined,
    moved_to_brooder_date: l.moved_to_brooder_date ? toISODate(l.moved_to_brooder_date) : undefined,
    moved_to_coop_date: l.moved_to_coop_date ? toISODate(l.moved_to_coop_date) : undefined,
    current_location: l.current_location ? String(l.current_location) : undefined,
    lost_date: l.lost_date ? toISODate(l.lost_date) : undefined,
    lost_cause: l.lost_cause ? String(l.lost_cause) : undefined,
  };
};

export function getHatchRecords(year: string = "2026"): HatchRecord[] {
  const dir = path.join(contentDir, "hatches", year);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((filename) => {
      const raw = fs.readFileSync(path.join(dir, filename), "utf-8");
      const { data, content } = matter(raw);
      return {
        id: data.id ?? filename.replace(/\.md$/, ""),
        clutch_id: data.clutch_id ? String(data.clutch_id) : undefined,
        egg_id: data.egg_id ? String(data.egg_id) : undefined,
        hatch_date: toISODate(data.hatch_date),
        hatch_time: data.hatch_time ? String(data.hatch_time) : undefined,
        incubator: data.incubator ? String(data.incubator) : "",
        egg_set_date: data.egg_set_date ? toISODate(data.egg_set_date) : undefined,
        egg_color: data.egg_color ? String(data.egg_color) : undefined,
        breed: data.breed ? String(data.breed) : undefined,
        parent_hen: data.parent_hen ? String(data.parent_hen) : undefined,
        parent_rooster_window: data.parent_rooster_window
          ? String(data.parent_rooster_window)
          : undefined,
        parentage_confidence: data.parentage_confidence
          ? String(data.parentage_confidence)
          : undefined,
        name: data.name ? String(data.name) : undefined,
        status: data.status ? String(data.status) : undefined,
        // Photo entries may carry a `date:` (YAML parses it into a Date —
        // normalize back to "YYYY-MM-DD") and an optional `showcase: false`.
        photos: Array.isArray(data.photos)
          ? data.photos.map((ph: Record<string, unknown>) => ({
              path: ph.path ? String(ph.path) : "",
              confidence: ph.confidence ? String(ph.confidence) : "",
              caption: ph.caption ? String(ph.caption) : "",
              date: ph.date ? toISODate(ph.date) : undefined,
              showcase: ph.showcase === false ? false : undefined,
            }))
          : [],
        evidence: Array.isArray(data.evidence) ? data.evidence.map(String) : [],
        phenotype_observations: Array.isArray(data.phenotype_observations)
          ? data.phenotype_observations.map(normalizeObservation)
          : [],
        adult_outcome: data.adult_outcome,
        lifecycle: normalizeLifecycle(data.lifecycle),
        lifecycle_summary: data.lifecycle_summary
          ? String(data.lifecycle_summary)
          : undefined,
        body: content,
        filename,
        year,
      } as HatchRecord;
    })
    .sort((a, b) => b.id.localeCompare(a.id)); // newest first by id (YYYY-MM-DD-NN)
}

export function getFieldNote(slug: string): FieldNote | null {
  const filePath = path.join(contentDir, "field-notes", `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    date: data.date ?? slug.slice(0, 10),
    cover: data.cover ?? "",
    photos: data.photos ?? [],
    tags: data.tags ?? [],
    content,
  };
}
