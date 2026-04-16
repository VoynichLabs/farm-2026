"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 16-Apr-2026
 * PURPOSE: Client hook that owns the live camera roster. Fetches
 *   `/api/cameras` from the Guardian backend every 30s so cameras
 *   plugged in (or unplugged) on the Mac Mini flow through to the
 *   website without a redeploy. Each backend entry is run through
 *   `resolveCameraMeta` so it arrives at the UI with a label/device
 *   string — either from the static overlay in `lib/cameras.ts` or a
 *   sensible default derived from the camera name.
 *
 *   Boss's rule (2026-04-16): the frontend must treat the roster as
 *   data, not as a hardcoded list. Adding a camera to Guardian's
 *   config should be enough to make it appear on the site. Unplugging
 *   one should just show an offline indicator, not require a code
 *   change. This hook is the single client-side entry point for that
 *   rule.
 *
 *   Why a fallback: before the first /api/cameras response arrives
 *   (and if that request fails), we render from the static `CAMERAS`
 *   metadata overlay so the page isn't blank. Once the live roster
 *   lands it replaces the fallback. The overlay is a "known hardware"
 *   list, not an authoritative roster — see `lib/cameras.ts` header.
 *
 * SRP/DRY check: Pass — single responsibility: own the roster record
 *   and keep it fresh. No rendering, no policy.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GUARDIAN_API } from "@/app/components/guardian/types";
import { CAMERAS, CameraMeta, resolveCameraMeta } from "./cameras";

type RawCamera = {
  name: string;
  // Guardian returns other fields (ip, type, online, capturing, rtsp_url,
  // supports_motion) — we only need the name here. Per-camera liveness is
  // tracked independently by GuardianCameraFeed via snapshot polling, so
  // `online` from /api/cameras is not authoritative for the rail UI.
};

const REFRESH_MS = 30_000;

export function useGuardianRoster(): {
  cameras: CameraMeta[];
  ready: boolean;
} {
  const [cameras, setCameras] = useState<CameraMeta[]>(CAMERAS);
  const [ready, setReady] = useState(false);
  const mountedRef = useRef(true);

  const fetchRoster = useCallback(async () => {
    try {
      const res = await fetch(`${GUARDIAN_API}/api/cameras`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = (await res.json()) as RawCamera[];
      if (!mountedRef.current) return;
      if (Array.isArray(raw) && raw.length > 0) {
        setCameras(raw.map((c) => resolveCameraMeta(c.name)));
      }
    } catch {
      // Keep whatever we had (fallback overlay or last good response) so the
      // rail doesn't blink to "no cameras" every time the tunnel hiccups.
    } finally {
      if (mountedRef.current) setReady(true);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchRoster();
    const id = setInterval(fetchRoster, REFRESH_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [fetchRoster]);

  return { cameras, ready };
}
