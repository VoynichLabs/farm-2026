/**
 * Author: Claude Fable 5 (header added 06-Jul-2026; page predates the header rule)
 * Date: 06-Jul-2026
 * PURPOSE: /projects listing — status-badged project cards + "why we build"
 *   context band. 06-Jul-2026 (terminal glow-up): converted from the
 *   cream-era palette to the sitewide dark guardian tokens; the dead
 *   `prose` class (no typography plugin installed) removed in favor of
 *   plainly styled paragraphs. See docs/06-Jul-2026-terminal-glowup-plan.md.
 * SRP/DRY check: Pass — data via getProjects() (lib/content.ts); no
 *   duplicated project metadata.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { getProjects } from "@/lib/content";

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
      <section className="bg-guardian-card border-b border-guardian-border py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="font-mono text-guardian-accent text-sm font-medium tracking-widest uppercase mb-3">
            [PROJECTS] · Farm 2026
          </p>
          <h1 className="text-5xl font-bold font-serif text-white mb-4">2026 Projects</h1>
          <p className="text-guardian-text/70 text-lg max-w-2xl">
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
              className="block bg-guardian-card rounded-xl border border-guardian-border hover:border-guardian-hover transition-colors overflow-hidden group"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`${statusColors[p.status] ?? "bg-gray-500"} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                  >
                    {statusLabels[p.status] ?? p.status}
                  </span>
                  <span className="text-sm text-guardian-muted">{p.location}</span>
                </div>
                <h2 className="text-2xl font-bold font-serif text-white mb-3 group-hover:text-emerald-300 transition-colors">{p.title}</h2>
                <p className="text-guardian-text/70 leading-relaxed mb-4">{p.description}</p>
                <p className="text-xs text-guardian-muted font-mono">Started {p.startDate}</p>

                <div className="mt-6 flex items-center gap-2 text-guardian-accent text-sm font-medium">
                  <span>View project details</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-guardian-muted text-lg">No projects yet. Season is just getting started.</p>
          </div>
        )}
      </section>

      {/* Context section */}
      <section className="bg-guardian-card/40 border-y border-guardian-border">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold font-serif text-white mb-4">Why We Build</h2>
          <div className="max-w-none text-guardian-text/75">
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
            <Link href="/" className="text-guardian-accent hover:text-emerald-300 hover:underline text-sm font-medium">← Back to Farm</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-guardian-card border-t border-guardian-border text-guardian-muted text-center py-8 text-sm">
        <p className="font-serif font-bold text-guardian-text/80 mb-1">Farm 2026</p>
        <p>Hampton, CT</p>
      </footer>
    </main>
  );
}
