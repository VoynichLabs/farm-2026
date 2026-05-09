/**
 * Author: Claude Opus 4.6
 * Date: 09-May-2026
 * PURPOSE: Farm infrastructure topology — shows Mark's machines and cameras
 *   as warm, simple cards. Data comes from content/farm-topology.json (SSoT).
 *   Uses farm-cream palette (this is the farm layer, not the system layer).
 * SRP/DRY check: Pass — single responsibility (render topology cards).
 *   Data from JSON file, no duplication of machine info elsewhere.
 */
import topology from "@/content/farm-topology.json";

export default function FarmTopology() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-14">
      <h2 className="text-2xl font-serif font-bold mb-1">
        Mark&apos;s Farm Infrastructure
      </h2>
      <p className="text-forest-light/60 text-sm mb-8 max-w-lg">
        A former game developer&apos;s AI farm hands — two machines, five cameras, one Cloudflare tunnel.
      </p>

      {/* Machines */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        {topology.machines.map((m) => (
          <div
            key={m.name}
            className="rounded-lg border border-cream-dark bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded bg-forest text-cream flex items-center justify-center text-sm font-bold flex-shrink-0">
                {m.name[0]}
              </div>
              <div>
                <h3 className="font-semibold text-base leading-tight">
                  {m.name}
                </h3>
                <p className="text-xs text-forest-light/50">{m.hardware}</p>
              </div>
            </div>
            <p className="text-sm text-forest-light/70 mb-1">{m.role}</p>
            <p className="text-xs text-wood italic">{m.agent}</p>
            <p className="text-xs text-forest-light/40 mt-2">{m.location}</p>
          </div>
        ))}
      </div>

      {/* Cameras */}
      <h3 className="text-sm font-semibold uppercase tracking-wider text-forest-light/50 mb-3">
        Camera Fleet
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {topology.cameras.map((c) => (
          <div
            key={c.name}
            className="rounded border border-cream-dark bg-white/80 px-4 py-3 text-sm"
          >
            <span className="font-mono font-semibold text-forest">
              {c.name}
            </span>
            <span className="text-forest-light/40 mx-1.5">—</span>
            <span className="text-forest-light/60">{c.hardware}</span>
            <p className="text-xs text-forest-light/40 mt-0.5">
              {c.capabilities}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
