"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 16-Apr-2026
 * PURPOSE: Guardian live dashboard — LIVE STREAMS + MANUAL CONTROLS.
 *   Renders the camera stage (one featured, others as thumbs; click to
 *   promote) and the PTZ control panel for the house-yard Reolink. All
 *   detection-pipeline UI was removed in v1.4.0; the only poll loop left
 *   is /api/status for the online indicator and cameras-online count.
 *   The camera roster for the stage is fetched live from Guardian's
 *   `/api/cameras` via `useGuardianRoster` — adding/removing cameras on
 *   the backend reflects on the page without a code change.
 * SRP/DRY check: Pass — orchestrator delegates to GuardianStatusBar,
 *   GuardianCameraStage, and GuardianPTZPanel. Roster comes from a
 *   dedicated hook, not a hardcoded list.
 */

import { useEffect, useState } from "react";
import { GUARDIAN_API, GuardianStatus } from "./types";
import GuardianStatusBar from "./GuardianStatusBar";
import GuardianCameraStage from "./GuardianCameraStage";
import GuardianPTZPanel from "./GuardianPTZPanel";
import { useGuardianRoster } from "@/lib/guardian-roster";

function fetchStatus(): Promise<GuardianStatus | null> {
  return fetch(`${GUARDIAN_API}/api/status`)
    .then((res) => (res.ok ? (res.json() as Promise<GuardianStatus>) : null))
    .catch(() => null);
}

export default function GuardianDashboard() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GuardianStatus | null>(null);
  const { cameras } = useGuardianRoster();

  // Single poll loop: only /api/status. Drives the online dot and the
  // "Cameras N/M online" readout. setState runs inside the .then callback
  // (not synchronously in the effect body) so React's new
  // `set-state-in-effect` rule is satisfied.
  useEffect(() => {
    let cancelled = false;
    const apply = (s: GuardianStatus | null) => {
      if (cancelled) return;
      setOnline(s?.online ?? false);
      setStatus(s);
    };
    fetchStatus().then(apply);
    const id = setInterval(() => {
      fetchStatus().then(apply);
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-guardian-bg text-guardian-text rounded-lg overflow-hidden border border-guardian-border mb-8">
      {/* Status bar */}
      <GuardianStatusBar status={status} online={online} />

      {/* === LIVE CAMERA FEEDS — modular stage: click a thumb to promote it === */}
      <div className="p-2">
        <GuardianCameraStage
          cameras={cameras}
          defaultFeatured="house-yard"
          storageKey="farm2026.guardian.featured.dashboard"
          online={online}
        />
      </div>

      {/* Compact cameras-only row (detection stats removed in v1.4.0) */}
      <div className="mx-2 mb-2 rounded border border-guardian-border bg-guardian-card px-3 py-2 text-[0.75rem] font-mono">
        <span className="text-guardian-muted">Cameras:</span>{" "}
        <span className="text-slate-300">
          {status ? `${status.cameras_online}/${status.cameras_total} online` : "—"}
        </span>
      </div>

      {/* === PTZ CONTROLS — house-yard Reolink only === */}
      <GuardianPTZPanel />
    </div>
  );
}
