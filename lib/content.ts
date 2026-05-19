/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Server-side content loader for MDX/JSON content. Reads projects, diary entries,
 *   field notes, flock profiles, and materials from the content/ directory using gray-matter.
 *   Field notes are the weekly farm update system (replaces diary for public-facing updates).
 * SRP/DRY check: Pass — all content loading flows through this single module.
 *   getChickAgeLabel() computes dynamic age from hatch_date for chick entries.
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

export interface FlockBird {
  name: string;
  breed: string;
  age: string;
  hatch_date?: string;
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
}

/**
 * Compute a human-readable age label from a hatch date.
 * Days 0–13 → "Day X", 14–55 → "X weeks", 56+ → "X months".
 * Returns null if no hatch_date is provided.
 */
export function getChickAgeLabel(hatchDate?: string): string | null {
  if (!hatchDate) return null;
  const hatch = new Date(hatchDate + "T00:00:00");
  const now = new Date();
  const days = Math.floor((now.getTime() - hatch.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days <= 13) return `Day ${days}`;
  const weeks = Math.floor(days / 7);
  if (days <= 55) return `${weeks} week${weeks !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `${months} month${months !== 1 ? "s" : ""}`;
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
        photos: Array.isArray(data.photos) ? data.photos : [],
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
