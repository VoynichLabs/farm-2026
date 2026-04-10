/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Homepage — hero (rotates weekly with latest field note cover),
 *   stats bar, Guardian live section, latest field note feature, flock preview,
 *   projects, Instagram, and footer. Guardian is the flagship project.
 * SRP/DRY check: Pass — reuses content loaders, Guardian components, InstagramFeed.
 */
import Link from "next/link";
import Image from "next/image";
import { getProjects, getAllFieldNotes } from "@/lib/content";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import GuardianCameraFeed from "@/app/components/guardian/GuardianCameraFeed";
import InstagramFeed from "@/app/components/InstagramFeed";
import instagramPosts from "@/content/instagram-posts.json";

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

export default function Home() {
  const projects = getProjects();
  const fieldNotes = getAllFieldNotes();
  const latestNote = fieldNotes[0];
  const recentNotes = fieldNotes.slice(0, 3);

  // Hero image: Birdadette on the keyboard moments after hatching
  const heroImage = "/photos/april-2026/birdadette-fresh-hatch.jpg";

  return (
    <main>
      {/* Hero — Birdadette on the keyboard */}
      <section
        className="relative min-h-[80vh] flex items-end justify-start bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 px-6 pb-16 md:px-16 max-w-3xl">
          <h1 className="text-5xl md:text-7xl text-white font-bold font-serif leading-tight mb-4">
            Farm 2026
          </h1>
          <p className="text-base md:text-lg text-white/50 italic max-w-lg leading-relaxed mb-4">
            They say I must be one of the wonders of Claude&apos;s own creation.
          </p>
          <p className="text-sm md:text-base text-white/70 max-w-lg leading-relaxed mb-2">
            A chick hatched on the keyboard. A hawk took Birdgit two days later.
            By the end of the week, Claude had built a sky-watching AI and 22
            reinforcements were in the brooder.
          </p>
          <p className="text-sm text-white/40 mb-8 font-mono">
            Hampton, CT — 26 birds, 3 cameras, 0 cloud services
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/projects/guardian"
              className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
            >
              Farm Guardian
            </Link>
            <span className="text-white/30">|</span>
            <Link
              href="/field-notes"
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              Field Notes
            </Link>
            <span className="text-white/30">|</span>
            <Link
              href="/flock"
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              The Flock
            </Link>
            <span className="text-white/30">|</span>
            <Link
              href="/gallery"
              className="text-white/70 hover:text-white underline underline-offset-4 transition-colors"
            >
              Gallery
            </Link>
          </div>
        </div>
      </section>

      {/* Guardian — AI Predator Detection (dashboard-style) */}
      <section className="bg-guardian-bg text-guardian-text">
        {/* Live status bar — fetches real data from Guardian API */}
        <GuardianHomeBadge />

        <div className="max-w-6xl mx-auto px-3 py-3">
          {/* Main area: 3 camera feeds (55%) + system panel (45%) */}
          <div className="flex gap-1.5">

            {/* Camera feeds — uses GuardianCameraFeed for proper offline handling */}
            <div className="flex-[55] min-w-0 flex flex-col gap-1.5">
              <div className="aspect-video">
                <GuardianCameraFeed cameraName="house-yard" label="house-yard — 4K PTZ" online={null} />
              </div>
              <div className="flex gap-1.5">
                <div className="flex-1 min-w-0 aspect-video">
                  <GuardianCameraFeed cameraName="s7-cam" label="s7-cam — Samsung S7" online={null} />
                </div>
                <div className="flex-1 min-w-0 aspect-video">
                  <GuardianCameraFeed cameraName="usb-cam" label="usb-cam — Brooder" online={null} />
                </div>
              </div>
            </div>

            {/* System info panel */}
            <div className="flex-[45] min-w-0 rounded border border-guardian-border bg-guardian-card p-2 flex flex-col gap-2 overflow-y-auto text-[0.75rem]">
              <div className="text-[0.65rem] uppercase tracking-widest text-guardian-hover font-semibold">System</div>

              {/* Shield icon + title */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-emerald-600 rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm">◆</span>
                </div>
                <div>
                  <div className="font-semibold text-slate-100 text-sm leading-tight">Farm Guardian</div>
                  <div className="text-guardian-muted text-[0.65rem]">Watching over the flock — v2.11</div>
                </div>
              </div>

              <div className="border-t border-guardian-border my-0.5" />

              {/* Detection pipeline */}
              <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Detection</div>
              <div className="text-guardian-muted text-[0.7rem] leading-snug space-y-0.5">
                <div>RTSP 1fps → <span className="text-slate-300">YOLOv8</span> (MPS)</div>
                <div>Ambiguous → <span className="text-slate-300">GLM-4V</span> species ID</div>
                <div>Targets: <span className="text-red-400">hawk fox raccoon coyote bobcat</span></div>
              </div>

              <div className="border-t border-guardian-border my-0.5" />

              {/* Deterrence levels */}
              <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Deterrence</div>
              <div className="text-[0.7rem] space-y-0.5">
                <div><span className="text-guardian-muted">L1</span> <span className="text-slate-400">Log only</span></div>
                <div><span className="text-amber-400">L2</span> <span className="text-slate-300">Spotlight</span></div>
                <div><span className="text-orange-400">L3</span> <span className="text-slate-300">Spotlight + Audio</span></div>
                <div><span className="text-red-400">L4</span> <span className="text-slate-300">Spotlight + Siren + Audio</span></div>
              </div>

              <div className="border-t border-guardian-border my-0.5" />

              {/* Patrol */}
              <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Patrol</div>
              <div className="text-guardian-muted text-[0.7rem] leading-snug space-y-0.5">
                <div>Mode: <span className="text-slate-300">Step-and-dwell</span> (11 positions, 30° intervals)</div>
                <div>Sky-watch: <span className="text-amber-400">available</span> (fixed hawk surveillance)</div>
              </div>

              <div className="border-t border-guardian-border my-0.5" />

              <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Hardware</div>
              <div className="text-guardian-muted text-[0.7rem] leading-snug space-y-0.5">
                <div>Cam 1: <span className="text-slate-300">Reolink E1 Pro</span> 4K PTZ</div>
                <div>Cam 2: <span className="text-slate-300">Samsung S7</span> RTSP</div>
                <div>Cam 3: <span className="text-slate-300">USB camera</span> brooder</div>
                <div>CPU: <span className="text-slate-300">Mac Mini M4 Pro</span> 64GB</div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-1.5 rounded border border-guardian-border bg-guardian-card overflow-hidden">
            <table className="w-full border-collapse text-[0.75rem]">
              <thead style={{ background: "#0f172a" }}>
                <tr>
                  <th className="text-left text-guardian-hover font-medium px-2 py-0.5">Pipeline</th>
                  <th className="text-left text-guardian-hover font-medium px-2 py-0.5">Hardware</th>
                  <th className="text-left text-guardian-hover font-medium px-2 py-0.5">Alerts</th>
                  <th className="text-right text-guardian-hover font-medium px-2 py-0.5"></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-2 py-1 text-slate-300">RTSP → YOLO → GLM → Track</td>
                  <td className="px-2 py-1 text-slate-300">3 cameras · M4 Pro 64GB</td>
                  <td className="px-2 py-1 text-slate-300">Discord + 4K Snapshots</td>
                  <td className="px-2 py-1 text-right">
                    <Link href="/projects/guardian" className="text-blue-400 hover:text-blue-300 text-[0.7rem]">
                      Full Guardian dashboard →
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Latest Field Note */}
      {latestNote && (
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-serif">Latest from the Farm</h2>
              <p className="text-forest/60 mt-2">Weekly updates — what happened, what hatched, what Claude built.</p>
            </div>
            <Link href="/field-notes" className="text-wood hover:underline text-sm font-medium">
              All field notes →
            </Link>
          </div>

          {/* Featured note */}
          <Link href={`/field-notes/${latestNote.slug}`} className="block group mb-8">
            <article className="relative rounded-xl overflow-hidden shadow-lg">
              {latestNote.cover && (
                <Image
                  src={latestNote.cover}
                  alt={latestNote.title}
                  width={1200}
                  height={500}
                  className="w-full object-cover h-[350px] group-hover:scale-[1.02] transition-transform duration-500"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <span className="text-cream/60 text-sm font-mono">{latestNote.date}</span>
                <h3 className="text-2xl md:text-3xl font-bold text-white font-serif mt-1 group-hover:text-cream/90 transition-colors">
                  {latestNote.title}
                </h3>
                <div className="flex gap-2 mt-3">
                  {latestNote.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs bg-white/20 text-cream px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </Link>

          {/* Recent notes grid */}
          {recentNotes.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {recentNotes.slice(1).map((note) => (
                <Link key={note.slug} href={`/field-notes/${note.slug}`} className="group block">
                  <article className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    {note.cover && (
                      <Image
                        src={note.cover}
                        alt={note.title}
                        width={600}
                        height={250}
                        className="w-full object-cover h-[180px] group-hover:scale-[1.02] transition-transform duration-500"
                      />
                    )}
                    <div className="p-5">
                      <span className="text-xs font-mono text-forest-light/50">{note.date}</span>
                      <h4 className="text-lg font-bold mt-1 group-hover:text-wood transition-colors">{note.title}</h4>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Flock preview strip */}
      <section className="bg-cream-dark">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold font-serif">The Flock</h2>
              <p className="text-forest/60 mt-2">
                Four survivors, one brave chick, and 22 reinforcements in the brooder.
              </p>
            </div>
            <Link href="/flock" className="text-wood hover:underline text-sm font-medium">
              Full roster →
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { photo: "/photos/april-2026/birdadette-fresh-hatch.jpg", name: "Birdadette", breed: "Easter Egger — hatched Apr 6" },
              { photo: "/photos/birds/henrietta.jpg", name: "Henrietta", breed: "Golden Laced Wyandotte" },
              { photo: "/photos/birds/whitey-red-legs.jpg", name: "Whitey Red Legs", breed: "EE × RIR Rooster" },
              { photo: "/photos/birds/ee-hen-1.jpg", name: "EE Hen 1", breed: "Easter Egger" },
              { photo: "/photos/birds/ee-hen-2.jpg", name: "EE Hen 2", breed: "Easter Egger" },
              { photo: "/photos/april-2026/turkey-poult-in-hand.jpg", name: "Turkey Poults (3)", breed: "White Broad-Breasted" },
              { photo: "/photos/april-2026/cackle-hatchery-arrival.jpg", name: "New Arrivals (15)", breed: "Cackle Hatchery specials" },
              { photo: "/photos/april-2026/chicks-samsung-enrichment.jpg", name: "Enrichment Hour", breed: "Chicks watching the Samsung" },
            ].map((bird) => (
              <Link href="/flock" key={bird.name} className="group block">
                <div className="relative h-40 rounded-lg overflow-hidden bg-forest/10">
                  <Image
                    src={bird.photo}
                    alt={bird.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm leading-tight">{bird.name}</p>
                    <p className="text-white/70 text-xs">{bird.breed}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Active Projects */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold font-serif">2026 Projects</h2>
            <p className="text-forest/60 mt-2">What we're building — and what Claude is building for us.</p>
          </div>
          <Link href="/projects" className="text-wood hover:underline text-sm font-medium">
            All projects →
          </Link>
        </div>
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

      {/* Instagram */}
      <section className="bg-cream-dark">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold font-serif">Follow the Farm</h2>
            <p className="text-forest/60 mt-2">More photos, more birds, more behind-the-scenes on Instagram.</p>
          </div>
          <InstagramFeed posts={instagramPosts} />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-forest text-cream/50 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <div>
            <p className="font-serif font-bold text-cream/80 text-base mb-1">Farm 2026</p>
            <p>Hampton, CT — every line built by Claude</p>
          </div>
          <nav className="flex gap-6">
            <Link href="/projects/guardian" className="hover:text-cream/80">Guardian</Link>
            <Link href="/flock" className="hover:text-cream/80">Flock</Link>
            <Link href="/projects" className="hover:text-cream/80">Projects</Link>
            <Link href="/gallery" className="hover:text-cream/80">Gallery</Link>
            <Link href="/field-notes" className="hover:text-cream/80">Field Notes</Link>
          </nav>
          <p>© {new Date().getFullYear()} Mark Barney</p>
        </div>
      </footer>
    </main>
  );
}
