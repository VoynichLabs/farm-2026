"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 02-May-2026
 * PURPOSE: Site-to-Guardian connectivity banner. Renders only when the
 *   /api/status fetch has failed at least once (online === false), telling
 *   the visitor the site can't currently reach Guardian — distinct from any
 *   individual camera being offline. The intended UX:
 *
 *   - Online (online === true): banner hidden. Per-camera tiles speak for
 *     themselves.
 *   - Connecting (online === null, first load): banner hidden. We don't
 *     want to flash "disconnected" before the first response lands.
 *   - Disconnected (online === false): banner visible. The Cloudflare
 *     tunnel is down or the Mac Mini's API is unreachable; every camera
 *     tile is going to fail to fetch frames for the same reason. The
 *     banner attributes the failure to the right cause.
 *
 *   Why a distinct surface rather than relying on the existing status bar:
 *   the status bar's "Online/Offline" indicator is one element among many
 *   (uptime, frame counts, detections). When everything else is breaking,
 *   the visitor needs the connectivity signal to be unambiguous.
 *
 * SRP/DRY check: Pass — single responsibility: render the disconnected
 *   state. No fetching, no policy beyond the online prop.
 */
export default function GuardianConnectivityBanner({
  online,
}: {
  online: boolean | null;
}) {
  if (online !== false) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-red-950/40 border-b border-red-500/40 px-3 py-2 text-[0.75rem] flex items-center gap-2 flex-wrap"
    >
      <span className="inline-block w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
      <span className="font-semibold uppercase tracking-wider text-[0.65rem] text-red-300">
        Site disconnected
      </span>
      <span className="text-red-200/80">
        Can&apos;t reach Guardian on the Mac Mini right now. Camera tiles will
        reappear when the connection recovers.
      </span>
    </div>
  );
}
