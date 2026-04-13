/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Homepage "2026 Projects" block — grid of project cards with status
 *   pills. Reads from getProjects() (SSoT: the index.mdx files under
 *   content/projects/). Extracted from app/page.tsx during Phase 1 of the
 *   frontend SRP/DRY rewrite.
 * SRP/DRY check: Pass — single responsibility; data via single loader. See
 *   docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md.
 */
import Link from "next/link";
import { getProjects } from "@/lib/content";
import SectionHeader from "@/app/components/primitives/SectionHeader";

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

export default function ActiveProjects() {
  const projects = getProjects();

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <SectionHeader
        title="2026 Projects"
        subtitle="What we're building — and what Claude is building for us."
        linkHref="/projects"
        linkLabel="All projects →"
      />
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((p) => (
          <Link
            key={p.slug}
            href={`/projects/${p.slug}`}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-cream-dark group"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`${statusColors[p.status] ?? "bg-gray-500"} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                >
                  {statusLabels[p.status] ?? p.status}
                </span>
                <span className="text-sm text-forest/50">
                  {p.location}
                </span>
              </div>
              <h3 className="text-xl font-bold font-serif mb-2 group-hover:text-wood transition-colors">{p.title}</h3>
              <p className="text-forest/70 text-sm leading-relaxed">{p.description}</p>
              <p className="text-xs text-forest/40 mt-4">Started {p.startDate}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
