"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 03-May-2026
 * PURPOSE: Guardian live dashboard — LIVE STREAMS + MANUAL CONTROLS.
 *   Renders the camera stage (one featured, others as thumbs; click to
 *   promote) and the PTZ control panel for the house-yard Reolink. All
 *   detection-pipeline UI was removed in v1.4.0; the only poll loop left
 *   is /api/status for the online indicator and cameras-online count.
 *   The camera roster for the stage is fetched live from Guardian's
 *   `/api/cameras` via `useGuardianRoster` — adding/removing cameras on
 *   the backend reflects on the page without a code change.
 *
 *   Hysteresis (2026-05-03): a single failed /api/status poll used to
 *   flip `online` to false, which made the connectivity banner flap on
 *   every transient hiccup of the Cloudflare tunnel. The poll loop now
 *   requires `STATUS_FAILURE_THRESHOLD` consecutive failures before
 *   declaring the site disconnected. A single success resets the counter
 *   and clears the disconnected state immediately.
 *
 * SRP/DRY check: Pass — orchestrator delegates to GuardianStatusBar,
 *   GuardianCameraStage, and GuardianPTZPanel. Roster comes from a
 *   dedicated hook, not a hardcoded list.
 */

import { useEffect, useRef, useState } from "react";
import { GUARDIAN_API, GuardianStatus } from "./types";
import GuardianConnectivityBanner from "./GuardianConnectivityBanner";
import GuardianStatusBar from "./GuardianStatusBar";
import GuardianCameraStage from "./GuardianCameraStage";
import GuardianPTZPanel from "./GuardianPTZPanel";
import { useGuardianRoster } from "@/lib/guardian-roster";

const STATUS_POLL_MS = 10_000;
// Two consecutive failed status polls (~20s of no response) before we declare
// the site disconnected. Below this, transient tunnel jitter is invisible to
// the visitor — the banner only appears for sustained outages.
const STATUS_FAILURE_THRESHOLD = 2;

function fetchStatus(): Promise<GuardianStatus | null> {
  return fetch(`${GUARDIAN_API}/api/status`)
    .then((res) => (res.ok ? (res.json() as Promise<GuardianStatus>) : null))
    .catch(() => null);
}

export default function GuardianDashboard() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GuardianStatus | null>(null);
  const { cameras } = useGuardianRoster();
  const consecutiveFailuresRef = useRef(0);

  // Single poll loop: only /api/status. Drives the online dot and the
  // "Cameras N/M online" readout. setState runs inside the .then callback
  // (not synchronously in the effect body) so React's new
  // `set-state-in-effect` rule is satisfied.
  useEffect(() => {
    let cancelled = false;
    const apply = (s: GuardianStatus | null) => {
      if (cancelled) return;
      if (s?.online) {
        // Success — clear the failure streak and update visible state.
        consecutiveFailuresRef.current = 0;
        setOnline(true);
        setStatus(s);
        return;
      }
      // Failure (network error, non-OK response, or `online: false` body).
      consecutiveFailuresRef.current += 1;
      setStatus(null);
      if (consecutiveFailuresRef.current >= STATUS_FAILURE_THRESHOLD) {
        setOnline(false);
      }
      // else: keep the previous `online` value. A single bad poll between
      // good polls leaves the banner hidden — only a sustained streak flips
      // the disconnected state.
    };
    fetchStatus().then(apply);
    const id = setInterval(() => {
      fetchStatus().then(apply);
    }, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="bg-guardian-bg text-guardian-text rounded-lg overflow-hidden border border-guardian-border mb-8">
      {/* Connectivity banner — only renders when the site can't reach Guardian */}
      <GuardianConnectivityBanner online={online} />

      {/* Status bar */}
      <GuardianStatusBar status={status} online={online} />

      {/* === LIVE CAMERA FEEDS — modular stage: click a thumb to promote it === */}
      <div className="p-2">
        <GuardianCameraStage
          cameras={cameras}
          defaultFeatured="house-yard"
          secondaryFeatured="s7-cam"
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
