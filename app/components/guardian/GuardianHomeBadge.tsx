"use client";
// Author: Claude Opus 4.6
// Date: 05-Apr-2026
// PURPOSE: Small client component for the homepage Guardian section status bar.
//          Fetches /api/status once on mount (no polling) and renders real values.
//          Falls back to static text if Guardian is offline.
// SRP/DRY check: Pass — reuses GUARDIAN_API and GuardianStatus from types.ts.

import { useEffect, useState } from "react";
import { GUARDIAN_API, GuardianStatus } from "./types";

export default function GuardianHomeBadge() {
  const [status, setStatus] = useState<GuardianStatus | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    fetch(`${GUARDIAN_API}/api/status`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: GuardianStatus | null) => {
        if (data?.online) {
          setOnline(true);
          setStatus(data);
        } else {
          setOnline(false);
        }
      })
      .catch(() => setOnline(false));
  }, []);

  const dotColor =
    online === null
      ? "bg-slate-500"
      : online
        ? "bg-emerald-500 animate-pulse"
        : "bg-red-500";
  const label =
    online === null
      ? "Connecting..."
      : online
        ? "Guardian Online"
        : "Guardian Offline";

  return (
    <div className="border-b border-guardian-border bg-guardian-card flex items-center gap-2.5 px-3 py-1 text-[0.7rem] leading-none font-mono">
      <span
        className={`inline-block w-[7px] h-[7px] rounded-full ${dotColor} flex-shrink-0`}
      />
      <span className="text-slate-400">{label}</span>
      {status && (
        <>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">Cams:</span>
          <span className="text-slate-300">
            {status.cameras_online}/{status.cameras_total}
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
      {!status && online === false && (
        <>
          <span className="text-guardian-hover">|</span>
          <span className="text-guardian-muted">
            Pipeline: YOLOv8 → GLM-4V → Deterrent
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
