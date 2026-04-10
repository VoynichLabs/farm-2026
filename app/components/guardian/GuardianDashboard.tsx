"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Guardian live dashboard — LIVE STREAMS FIRST. Three cameras displayed
 *   with adaptive layout: online cameras get large panels, offline ones collapse
 *   to compact status bars. Detection data below the feeds.
 * SRP/DRY check: Pass — single orchestrator, delegates rendering to children.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import {
  GUARDIAN_API,
  GuardianStatus,
  Detection,
  DeterrentStatus,
  ActiveTrack,
  DailySummary,
  DeterrentEffectiveness,
  EBirdSighting,
} from "./types";
import GuardianStatusBar from "./GuardianStatusBar";
import GuardianCameraFeed from "./GuardianCameraFeed";
import GuardianDetections from "./GuardianDetections";
import GuardianInfoPanels from "./GuardianInfoPanels";

async function fetchJSON<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${GUARDIAN_API}${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const CAMERAS = [
  { name: "house-yard", label: "house-yard — Reolink E1 Pro 4K PTZ" },
  { name: "s7-cam", label: "s7-cam — Samsung Galaxy S7" },
  { name: "usb-cam", label: "usb-cam — Brooder Camera" },
];

export default function GuardianDashboard() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [status, setStatus] = useState<GuardianStatus | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [deterrentStatus, setDeterrentStatus] =
    useState<DeterrentStatus | null>(null);
  const [activeTracks, setActiveTracks] = useState<ActiveTrack[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [effectiveness, setEffectiveness] =
    useState<DeterrentEffectiveness | null>(null);
  const [ebirdSightings, setEbirdSightings] = useState<EBirdSighting[]>([]);

  const mountedRef = useRef(true);

  const fetchFast = useCallback(async () => {
    if (!mountedRef.current) return;
    const s = await fetchJSON<GuardianStatus>("/api/status");
    if (!mountedRef.current) return;
    setOnline(s?.online ?? false);
    setStatus(s);

    const [dets, tracks, det] = await Promise.all([
      fetchJSON<Detection[]>("/api/detections/recent?limit=20"),
      fetchJSON<ActiveTrack[]>("/api/tracks/active"),
      fetchJSON<DeterrentStatus>("/api/deterrent/status"),
    ]);
    if (!mountedRef.current) return;
    if (dets) setDetections(dets);
    if (tracks) setActiveTracks(tracks);
    if (det) setDeterrentStatus(det);
  }, []);

  const fetchSlow = useCallback(async () => {
    if (!mountedRef.current) return;
    const [sum, eff] = await Promise.all([
      fetchJSON<DailySummary>("/api/v1/summary/today"),
      fetchJSON<DeterrentEffectiveness>("/api/v1/deterrents/effectiveness"),
    ]);
    if (!mountedRef.current) return;
    if (sum) setSummary(sum);
    if (eff) setEffectiveness(eff);
  }, []);

  const fetchEbird = useCallback(async () => {
    if (!mountedRef.current) return;
    const data = await fetchJSON<{ count: number; sightings: EBirdSighting[] }>(
      "/api/v1/ebird/recent"
    );
    if (!mountedRef.current) return;
    if (data?.sightings) setEbirdSightings(data.sightings);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    fetchFast();
    fetchSlow();
    fetchEbird();

    const fast = setInterval(fetchFast, 5000);
    const slow = setInterval(fetchSlow, 60000);
    const glacial = setInterval(fetchEbird, 300000);

    return () => {
      mountedRef.current = false;
      clearInterval(fast);
      clearInterval(slow);
      clearInterval(glacial);
    };
  }, [fetchFast, fetchSlow, fetchEbird]);

  return (
    <div className="bg-guardian-bg text-guardian-text rounded-lg overflow-hidden border border-guardian-border mb-8">
      {/* Status bar */}
      <GuardianStatusBar status={status} online={online} />

      {/* === LIVE CAMERA FEEDS — 4 cameras === */}
      <div className="p-2 space-y-2">
        {/* Primary: house-yard PTZ gets full width */}
        <div className="aspect-video">
          <GuardianCameraFeed cameraName="house-yard" label="house-yard — Reolink 4K PTZ" online={online} />
        </div>

        {/* Secondary row: s7-cam, usb-cam, gwtc — three across */}
        <div className="grid grid-cols-3 gap-2">
          <div className="aspect-video">
            <GuardianCameraFeed cameraName="s7-cam" label="s7-cam — Samsung S7" online={online} />
          </div>
          <div className="aspect-video">
            <GuardianCameraFeed cameraName="usb-cam" label="usb-cam — Brooder" online={online} />
          </div>
          <div className="aspect-video">
            <GuardianCameraFeed cameraName="gwtc" label="gwtc — Gateway Laptop" online={online} />
          </div>
        </div>
      </div>

      {/* Compact status row */}
      <div className="mx-2 mb-2 rounded border border-guardian-border bg-guardian-card px-3 py-2 flex flex-wrap items-center gap-4 text-[0.75rem] font-mono">
        <div>
          <span className="text-guardian-muted">Patrol:</span>{" "}
          <span className="text-slate-300">
            {online === true ? "Step-and-dwell" : "—"}
          </span>
        </div>
        <span className="text-guardian-hover">|</span>
        <div>
          <span className="text-guardian-muted">Deterrent:</span>{" "}
          <span className="text-slate-300">
            {deterrentStatus
              ? deterrentStatus.active_count > 0
                ? `${deterrentStatus.active_count} active`
                : deterrentStatus.enabled
                  ? "Ready"
                  : "Disabled"
              : "—"}
          </span>
        </div>
        <span className="text-guardian-hover">|</span>
        <div>
          <span className="text-guardian-muted">Tracks:</span>{" "}
          <span className="text-slate-300">{activeTracks.length}</span>
        </div>
        <span className="text-guardian-hover">|</span>
        <div>
          <span className="text-guardian-muted">Cameras:</span>{" "}
          <span className="text-slate-300">
            {status ? `${status.cameras_online}/${status.cameras_total} online` : "—"}
          </span>
        </div>
      </div>

      {/* Detection table */}
      <div className="px-2 pb-2">
        <GuardianDetections detections={detections} />
      </div>

      {/* Info panels */}
      <div className="px-2 pb-2">
        <GuardianInfoPanels
          activeTracks={activeTracks}
          deterrentStatus={deterrentStatus}
          effectiveness={effectiveness}
          summary={summary}
          ebirdSightings={ebirdSightings}
        />
      </div>
    </div>
  );
}
