/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Homepage Guardian section — live status badge, camera stage, and a
 *   right-hand system info panel that enumerates cameras from the lib/cameras.ts
 *   SSoT. The camera count in the bottom pipeline row is derived from
 *   CAMERAS.length — no hardcoded "N cameras" literal anywhere in this file.
 * SRP/DRY check: Pass — one job: render the homepage Guardian block. Cameras
 *   enumerated via CAMERAS.map (SSoT). See
 *   docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md.
 */
import Link from "next/link";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import GuardianCameraStage from "@/app/components/guardian/GuardianCameraStage";
import { CAMERAS, DEFAULT_FEATURED } from "@/lib/cameras";

export default function GuardianHomeSection() {
  return (
    <section className="bg-guardian-bg text-guardian-text">
      {/* Live status bar — fetches real data from Guardian API */}
      <GuardianHomeBadge />

      <div className="max-w-6xl mx-auto px-3 py-3">
        {/* Main area: camera feeds (55%) + system panel (45%) */}
        <div className="flex gap-1.5">

          {/* Camera feeds — modular stage: click a thumb to promote it */}
          <div className="flex-[55] min-w-0">
            <GuardianCameraStage
              cameras={CAMERAS}
              defaultFeatured={DEFAULT_FEATURED}
              storageKey="farm2026.guardian.featured.home"
              online={null}
            />
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
                <div className="text-guardian-muted text-[0.65rem]">Watching over the flock</div>
              </div>
            </div>

            <div className="border-t border-guardian-border my-0.5" />

            {/* Cameras */}
            <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Cameras</div>
            <div className="text-guardian-muted text-[0.7rem] leading-snug space-y-0.5">
              {CAMERAS.map((cam, i) => (
                <div key={cam.name}>
                  Cam {i + 1}: <span className="text-slate-300">{cam.device}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-guardian-border my-0.5" />

            {/* Streaming */}
            <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Streaming</div>
            <div className="text-guardian-muted text-[0.7rem] leading-snug space-y-0.5">
              <div>Mode: <span className="text-slate-300">Snapshot polling</span> (all cams)</div>
              <div>Capture: <span className="text-slate-300">OpenCV</span> — no ffmpeg, no HLS</div>
            </div>

            <div className="border-t border-guardian-border my-0.5" />

            {/* Hardware */}
            <div className="text-[0.65rem] uppercase tracking-wider text-guardian-hover font-semibold">Hardware</div>
            <div className="text-guardian-muted text-[0.7rem] leading-snug space-y-0.5">
              <div>CPU: <span className="text-slate-300">Mac Mini M4 Pro</span> 64GB</div>
              <div>Detection: <span className="text-slate-400">offline</span> — cameras only</div>
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
                <td className="px-2 py-1 text-slate-300">Snapshot polling (OpenCV)</td>
                <td className="px-2 py-1 text-slate-300">{CAMERAS.length} cameras</td>
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
  );
}
