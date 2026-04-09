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
import GuardianDashboard from "@/app/components/guardian/GuardianDashboard";

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
        <Link href="/projects" className="text-wood hover:underline text-sm">
          &larr; All Projects
        </Link>
      </div>

      {/* Guardian Live Dashboard */}
      {isGuardian && <GuardianDashboard />}

      {/* Hero Photo (not for Guardian — live feed replaces it) */}
      {!isGuardian && project.heroPhoto && (
        <div className="mb-10 rounded-xl overflow-hidden shadow-lg">
          <Image
            src={project.heroPhoto}
            alt={project.title}
            width={1200}
            height={600}
            className="w-full object-cover max-h-[480px]"
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
          <span className="text-sm text-forest-light/60">
            {project.location}
          </span>
          <span className="text-sm text-forest-light/60">
            Started {project.startDate}
          </span>
        </div>
        <h1 className="text-4xl font-bold mb-4">{project.title}</h1>
        <p className="text-lg text-forest-light/80">{project.description}</p>
      </div>

      {/* 3D Model links for enclosure project */}
      {slug === "chicken-enclosure-2026" && (
        <section className="mb-8 bg-forest/5 border border-forest/20 rounded-xl p-6">
          <h2 className="text-xl font-bold font-serif mb-4">🧊 Interactive 3D Models</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="/enclosure-3d.html"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-forest text-cream px-5 py-3 rounded-lg hover:bg-forest/80 transition-colors font-medium"
            >
              🧊 View Enclosure Volume (3D)
            </a>
            <a
              href="/enclosure-cad.html"
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 bg-wood text-white px-5 py-3 rounded-lg hover:bg-wood/80 transition-colors font-medium"
            >
              🏠 View House + Deck CAD Drawing (3D)
            </a>
          </div>
          <p className="text-sm text-forest/60 mt-3">Interactive models — open in a new tab, rotate and zoom freely.</p>
        </section>
      )}

      {/* Project Overview MDX */}
      <section className="prose prose-green max-w-none mb-12 bg-white rounded-lg shadow p-6">
        <MDXRemote source={project.content} />
      </section>

      {/* Materials */}
      {materials.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">
            Bill of Materials — ${totalCost.toFixed(2)}
          </h2>
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-forest text-cream text-left">
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
                    className={i % 2 === 0 ? "bg-cream/50" : "bg-white"}
                  >
                    <td className="px-4 py-2 font-medium">{m.name}</td>
                    <td className="px-4 py-2">
                      {m.qty} {m.unit}
                    </td>
                    <td className="px-4 py-2">${m.unitCost.toFixed(2)}</td>
                    <td className="px-4 py-2 font-semibold">
                      ${m.totalCost.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 hidden md:table-cell text-forest-light/60">
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
          <h2 className="text-2xl font-bold mb-6">Diary</h2>
          <div className="space-y-8">
            {entries.map((entry) => (
              <article
                key={entry.date}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="font-mono text-sm text-forest-light/60">
                    {entry.date}
                  </span>
                  <div className="flex gap-1">
                    {entry.tags.map((t) => (
                      <span
                        key={t}
                        className="text-xs bg-forest/10 text-forest px-2 py-0.5 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{entry.title}</h3>
                <div className="prose prose-green max-w-none text-sm">
                  <MDXRemote source={entry.content} />
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
