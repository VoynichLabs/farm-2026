// Author: Claude Opus 4.6
// Date: 05-Apr-2026
// PURPOSE: Top status bar for Guardian dashboard. Shows online state, uptime,
//          camera count, frames processed, detections today, alerts today.
//          Mirrors the Guardian dashboard's #status-bar element.
// SRP/DRY check: Pass — pure render component, data from parent.

import { GuardianStatus } from "./types";

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function GuardianStatusBar({
  status,
  online,
}: {
  status: GuardianStatus | null;
  online: boolean | null;
}) {
  const dotColor =
    online === null
      ? "bg-slate-500"
      : online
        ? "bg-emerald-500 animate-pulse"
        : "bg-red-500";
  const label =
    online === null ? "Connecting..." : online ? "Online" : "Offline";

  return (
    <div className="border-b border-guardian-border bg-guardian-card flex items-center gap-2.5 px-3 py-1 text-[0.7rem] leading-none font-mono">
      <span
        className={`inline-block w-[7px] h-[7px] rounded-full ${dotColor} flex-shrink-0`}
      />
      <span className="text-slate-400">{label}</span>
      {status && (
        <>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">Up:</span>
          <span className="text-slate-300">
            {formatUptime(status.uptime_seconds)}
          </span>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">Cams:</span>
          <span className="text-slate-300">
            {status.cameras_online}/{status.cameras_total}
          </span>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">Frames:</span>
          <span className="text-slate-300">
            {status.frames_processed.toLocaleString()}
          </span>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">Detections:</span>
          <span className="text-blue-400 font-semibold">
            {status.detections_today}
          </span>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">Alerts:</span>
          <span className="text-amber-400 font-semibold">
            {status.alerts_today}
          </span>
        </>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="text-guardian-hover uppercase tracking-wider text-[0.6rem]">
          Farm Guardian
        </span>
      </div>
    </div>
  );
}
