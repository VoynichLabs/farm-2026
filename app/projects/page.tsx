/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; page predates the header rule)
 * Date: 16-Jul-2026
 * PURPOSE: /projects listing — status-badged project cards + "why we build"
 *   context band. 16-Jul-2026 (daylight retheme): converted from the dark
 *   guardian palette to the light Field Guide tokens (field-*); page kicker
 *   carries the projects page mark from lib/emoji.ts. Styling-only
 *   conversion — copy unchanged; solid status badge chips kept as-is.
 * SRP/DRY check: Pass — data via getProjects() (lib/content.ts); no
 *   duplicated project metadata. Emoji from lib/emoji.ts SSoT.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getProjects } from "@/lib/content";
import { PAGE_MARKS } from "@/lib/emoji";

export const metadata: Metadata = {
  title: "Projects",
  description: "Farm Guardian AI predator detection and other 2026 farm projects.",
};

const statusColors: Record<string, string> = {
  planning: "bg-yellow-600",
  active: "bg-green-700",
  complete: "bg-blue-600",
  shelved: "bg-slate-500",
};

const statusLabels: Record<string, string> = {
  planning: "Planning",
  active: "In Progress",
  complete: "Complete",
  shelved: "Shelved",
};

export default function ProjectsPage() {
  const projects = getProjects();

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="bg-field-card border-b border-field-border py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <span className="inline-block font-mono text-[0.66rem] tracking-[0.16em] uppercase border border-field-border bg-field-card px-2.5 py-1 text-field-muted mb-3">
            <span aria-hidden="true" className="mr-1.5">{PAGE_MARKS.projects}</span>PROJECTS · Farm 2026
          </span>
          <h1 className="text-5xl font-bold font-serif text-field-ink mb-4">2026 Projects</h1>
          <p className="text-field-muted text-lg max-w-2xl">
            Farm Guardian is the flagship — a camera system watching the flock with OpenClaw, VLM scoring, and AI tools. The pipeline captures, judges, and curates the best moments for Instagram and Facebook.
          </p>
        </div>
      </section>

      {/* Projects grid */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="block bg-field-card rounded-xl border border-field-border hover:border-field-accent-line transition-colors overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`${statusColors[p.status] ?? "bg-gray-500"} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                  >
                    {statusLabels[p.status] ?? p.status}
                  </span>
                  <span className="text-sm text-field-muted">{p.location}</span>
                </div>
                <h2 className="text-2xl font-bold font-serif text-field-ink mb-3 group-hover:text-field-accent-deep transition-colors">{p.title}</h2>
                <p className="text-field-muted leading-relaxed mb-4">{p.description}</p>
                <p className="text-xs text-field-muted font-mono">Started {p.startDate}</p>

                <div className="mt-6 flex items-center gap-2 text-field-accent text-sm font-medium">
                  <span>View project details</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-field-muted text-lg">No projects yet. Season is just getting started.</p>
          </div>
        )}
      </section>

      {/* Context section */}
      <section className="bg-field-wash border-y border-field-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold font-serif text-field-ink mb-4">Why We Build</h2>
          <div className="max-w-none text-field-muted">
            <p className="text-base leading-relaxed mb-4">
              A hawk took Birdgit in the first week of April. More hens followed. Farm Guardian
              exists because the flock needs protection that works when we&apos;re not watching —
              AI-powered cameras, automated deterrents, and alerts that fire in seconds.
            </p>
            <p className="text-base leading-relaxed">
              No cloud services, no subscriptions — just a Mac Mini on the desk, the cameras
              around the property, and an AI that builds what the farm needs, when it needs it.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/" className="text-field-accent hover:text-field-accent-deep hover:underline text-sm font-medium">← Back to Farm</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-field-card border-t border-field-border text-field-muted text-center py-8 text-sm">
        <p className="font-serif font-bold text-field-muted mb-1">Farm 2026</p>
        <p>Hampton, CT</p>
      </footer>
    </main>
  );
}
