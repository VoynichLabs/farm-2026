"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 12-Apr-2026
 * PURPOSE: Guardian live dashboard — LIVE STREAMS + MANUAL CONTROLS.
 *   Renders the camera stage (one featured, others as thumbs; click to
 *   promote) and the PTZ control panel for the house-yard Reolink. All
 *   detection-pipeline UI (detections table, tracks, deterrent, summary,
 *   eBird) was removed in v1.4.0 because the detection pipeline is not
 *   currently feeding frames — the cards rendered empty and looked broken.
 *   The only poll loop left is /api/status, for the online indicator and
 *   cameras-online count.
 * SRP/DRY check: Pass — orchestrator delegates to GuardianStatusBar,
 *   GuardianCameraStage, and GuardianPTZPanel. Camera list from
 *   lib/cameras.ts (SSoT). Detection components still exist in the repo
 *   for possible future reuse on a separate "intel" page, but are no
 *   longer imported here.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { GUARDIAN_API, GuardianStatus } from "./types";
import GuardianStatusBar from "./GuardianStatusBar";
import GuardianCameraStage from "./GuardianCameraStage";
import GuardianPTZPanel from "./GuardianPTZPanel";
import { CAMERAS } from "@/lib/cameras";

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${GUARDIAN_API}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default function GuardianDashboard() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GuardianStatus | null>(null);

  const mountedRef = useRef(true);

  // Single poll loop: only /api/status. Drives the online dot and the
  // "Cameras N/M online" readout. All detection-pipeline fetches removed.
  const fetchStatus = useCallback(async () => {
    if (!mountedRef.current) return;
    const s = await fetchJSON<GuardianStatus>("/api/status");
    if (!mountedRef.current) return;
    setOnline(s?.online ?? false);
    setStatus(s);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchStatus();
    const id = setInterval(fetchStatus, 10000);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchStatus]);

  return (
    <div className="bg-guardian-bg text-guardian-text rounded-lg overflow-hidden border border-guardian-border mb-8">
      {/* Status bar */}
      <GuardianStatusBar status={status} online={online} />

      {/* === LIVE CAMERA FEEDS — modular stage: click a thumb to promote it === */}
      <div className="p-2">
        <GuardianCameraStage
          cameras={CAMERAS}
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
