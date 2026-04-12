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

export interface FlockProfiles {
  breeds: Record<string, Breed>;
  flock_birds: FlockBird[];
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
