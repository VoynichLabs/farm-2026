import type { Metadata } from "next";
import Link from "next/link";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description: "Farm Guardian AI predator detection and other 2026 farm projects. Every line of code built by Claude.",
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
    <main className="min-h-screen bg-cream">
      {/* Header */}
      <section className="bg-forest text-cream py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-cream/60 text-sm font-medium tracking-widest uppercase mb-3">
            Farm 2026
          </p>
          <h1 className="text-5xl font-bold font-serif mb-4">2026 Projects</h1>
          <p className="text-cream/70 text-lg max-w-2xl">
            Farm Guardian is the flagship — an AI predator detection system protecting the flock with cameras, YOLO, and Claude-built code. Every version built in conversation.
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
              className="block bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-cream-dark group"
            >
              <div className="p-8">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`${statusColors[p.status] ?? "bg-gray-500"} text-white text-xs font-semibold px-3 py-1 rounded-full`}
                  >
                    {statusLabels[p.status] ?? p.status}
                  </span>
                  <span className="text-sm text-forest/50">{p.location}</span>
                </div>
                <h2 className="text-2xl font-bold font-serif mb-3 group-hover:text-wood transition-colors">{p.title}</h2>
                <p className="text-forest/70 leading-relaxed mb-4">{p.description}</p>
                <p className="text-xs text-forest/40 font-mono">Started {p.startDate}</p>

                <div className="mt-6 flex items-center gap-2 text-wood text-sm font-medium">
                  <span>View project details</span>
                  <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-forest/50 text-lg">No projects yet. Season is just getting started.</p>
          </div>
        )}
      </section>

      {/* Context section */}
      <section className="bg-cream-dark">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold font-serif mb-4">Why We Build</h2>
          <div className="prose prose-sm max-w-none text-forest/70">
            <p className="text-base leading-relaxed mb-4">
              A hawk took Birdgit in the first week of April. Then we lost three more hens. Farm
              Guardian exists because the flock needs protection that works when we're not watching —
              AI-powered cameras, automated deterrents, and alerts that fire in seconds.
            </p>
            <p className="text-base leading-relaxed">
              Every line of Guardian code was written by Claude in conversation with the farmer.
              No cloud services, no subscriptions — just a Mac Mini, three cameras, and an AI
              that builds what the farm needs, when it needs it.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/" className="text-wood hover:underline text-sm font-medium">← Back to Farm</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest text-cream/50 text-center py-8 text-sm">
        <p className="font-serif font-bold text-cream/70 mb-1">Farm 2026</p>
        <p>Hampton, CT</p>
      </footer>
    </main>
  );
}
