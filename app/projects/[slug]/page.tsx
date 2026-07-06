/**
 * Author: Claude Fable 5 (header added 06-Jul-2026; page predates the header rule)
 * Date: 06-Jul-2026
 * PURPOSE: Project detail page — MDX overview, materials table, diary
 *   timeline; the guardian slug swaps the hero for the live dashboard.
 *   06-Jul-2026: MDXRemote now runs with remark-gfm so GFM tables (e.g.
 *   the Guardian hardware table) render as tables, not literal pipe text.
 *   06-Jul-2026 (terminal glow-up): cream-era classes converted to the
 *   guardian palette; dead `prose prose-green` on white cards (the
 *   unreadable wash) replaced with .terminal-prose on guardian-card
 *   panels. See docs/06-Jul-2026-terminal-glowup-plan.md.
 * SRP/DRY check: Pass — content loading lives in lib/content.ts; Guardian
 *   rendering is composed from app/components/guardian/.
 */
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getProject,
  getProjects,
  getProjectEntries,
  getProjectMaterials,
} from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import GuardianDashboard from "@/app/components/guardian/GuardianDashboard";

// GFM support (pipe tables, strikethrough, autolinks) for project MDX —
// without it the Guardian hardware table rendered as literal `|` text
// (fixed 06-Jul-2026, see docs/06-Jul-2026-duo2-frame-and-tunnel-load-plan.md).
const mdxOptions = { mdxOptions: { remarkPlugins: [remarkGfm] } };

const statusColors: Record<string, string> = {
  planning: "bg-yellow-600",
  active: "bg-green-600",
  complete: "bg-blue-600",
  shelved: "bg-slate-500",
};

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.description,
    openGraph: {
      title: project.title,
      description: project.description,
      ...(project.heroPhoto ? { images: [project.heroPhoto] } : {}),
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.description,
      ...(project.heroPhoto ? { images: [project.heroPhoto] } : {}),
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const entries = getProjectEntries(slug);
  const materials = getProjectMaterials(slug);
  const totalCost = materials.reduce((sum, m) => sum + m.totalCost, 0);

  const isGuardian = slug === "guardian";

  return (
    <main className={`${isGuardian ? "max-w-7xl" : "max-w-4xl"} mx-auto px-4 py-12`}>
      <div className="mb-8">
        <Link href="/projects" className="text-guardian-accent hover:text-emerald-300 hover:underline text-sm">
          &larr; All Projects
        </Link>
      </div>

      {/* Guardian Live Dashboard */}
      {isGuardian && <GuardianDashboard />}

      {/* Hero Photo (not for Guardian — live feed replaces it) */}
      {!isGuardian && project.heroPhoto && (
        <div className="mb-10 rounded-xl overflow-hidden border border-guardian-border bg-guardian-card">
          <Image
            src={project.heroPhoto}
            alt={project.title}
            width={1200}
            height={800}
            className="w-full h-auto max-h-[70vh] object-contain mx-auto"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`${statusColors[project.status] ?? "bg-gray-500"} text-white text-xs font-semibold px-2 py-1 rounded`}
          >
            {project.status}
          </span>
          <span className="text-sm text-guardian-muted">
            {project.location}
          </span>
          <span className="text-sm text-guardian-muted">
            Started {project.startDate}
          </span>
        </div>
        <h1 className="text-4xl font-bold font-serif text-white mb-4">{project.title}</h1>
        <p className="text-lg text-guardian-text/75">{project.description}</p>
      </div>

      {/* 3D Model links for enclosure project */}
      {slug === "chicken-enclosure-2026" && (
        <section className="mb-8 bg-guardian-card border border-guardian-border rounded-xl p-6">
          <h2 className="text-xl font-bold font-serif text-white mb-4">🧊 Interactive 3D Models</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="/enclosure-3d.html"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-guardian-accent text-white px-5 py-3 rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              🧊 View Enclosure Volume (3D)
            </a>
            <a
              href="/enclosure-cad.html"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-guardian-hover text-white px-5 py-3 rounded-lg hover:bg-guardian-muted transition-colors font-medium"
            >
              🏠 View House + Deck CAD Drawing (3D)
            </a>
          </div>
          <p className="text-sm text-guardian-muted mt-3">Interactive models — open in a new tab, rotate and zoom freely.</p>
        </section>
      )}

      {/* Project Overview MDX */}
      <section className="terminal-prose max-w-none mb-12 bg-guardian-card border border-guardian-border rounded-lg p-6 md:p-8">
        <MDXRemote source={project.content} options={mdxOptions} />
      </section>

      {/* Materials */}
      {materials.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold font-serif text-white mb-4">
            Bill of Materials — ${totalCost.toFixed(2)}
          </h2>
          <div className="bg-guardian-card border border-guardian-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-guardian-border text-left font-mono text-xs uppercase tracking-wider text-guardian-muted">
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Unit Cost</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3 hidden md:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-guardian-bg/40" : ""}
                  >
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2">
                      {m.qty} {m.unit}
                    </td>
                    <td className="px-4 py-2">${m.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-2 font-semibold">
                      ${m.totalCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell text-guardian-muted">
                      {m.notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Diary Timeline */}
      {entries.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold font-serif text-white mb-6">Diary</h2>
          <div className="space-y-8">
            {entries.map((entry) => (
              <article
                key={entry.date}
                className="bg-guardian-card border border-guardian-border rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-sm text-guardian-muted">
                    {entry.date}
                  </span>
                  <div className="flex gap-1">
                    {entry.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-guardian-accent/10 text-emerald-300/90 border border-guardian-accent/25 px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-bold font-serif text-white mb-3">{entry.title}</h3>
                <div className="terminal-prose max-w-none text-sm">
                  <MDXRemote source={entry.content} options={mdxOptions} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
