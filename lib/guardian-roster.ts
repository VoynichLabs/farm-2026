"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 02-May-2026
 * PURPOSE: Client hook that owns the live camera roster. Fetches
 *   `/api/cameras` from the Guardian backend every 30s and filters to
 *   currently-online cameras only, so the stage renders exactly what
 *   the backend reports as live — no hand-curated fleet list, and no
 *   tiles for cameras whose source host is dead.
 *
 *   Boss's rule (2026-04-16): the frontend must treat the roster as
 *   data, not as a hardcoded list. Adding a camera to Guardian's
 *   config should be enough to make it appear on the site. Unplugging
 *   one should mean it disappears from the site without a code change.
 *
 *   Liveness gate (2026-05-02): farm-guardian v2.37.5 added `is_live`
 *   to `/api/cameras` — true when a frame was captured within
 *   max(30s, 3 * snapshot_interval). That is the authoritative signal
 *   for "this camera is producing frames right now." We filter on it
 *   here so the per-feed snapshot poller never has to wait through
 *   ~12s of failed polls before the UI agrees the camera is dead. If
 *   the field is absent (older backend), entries are kept (defensive
 *   default — better to show a tile that fails to render than to hide
 *   a working camera).
 *
 *   Why a fallback: before the first /api/cameras response arrives
 *   (and if that request fails), we render from the static `CAMERAS`
 *   metadata overlay so the page isn't blank. Once the live roster
 *   lands it replaces the fallback. The overlay is a "known hardware"
 *   list, not an authoritative roster — see `lib/cameras.ts` header.
 *
 * SRP/DRY check: Pass — single responsibility: own the roster record
 *   and keep it fresh. No rendering, no policy beyond the is_live gate.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { GUARDIAN_API } from "@/app/components/guardian/types";
import { CAMERAS, CameraMeta, resolveCameraMeta } from "./cameras";

type RawCamera = {
  name: string;
  // `is_live` is the backend's authoritative liveness flag (v2.37.5+).
  // Optional in the type to stay compatible with older backends, where
  // we'd see undefined and treat it as "include." Other fields the
  // backend returns (ip, type, online, capturing, rtsp_url,
  // supports_motion, last_frame_age_seconds, stale_after_seconds) are
  // not consumed by this hook — per-feed JPEG polling handles the
  // rest of the per-tile state.
  is_live?: boolean;
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
      if (Array.isArray(raw)) {
        // Filter to currently-live cameras. Treat `is_live === undefined` as
        // inclusive so older backends keep working. An empty result here is
        // real state ("nothing is online right now") and the stage's empty
        // state will render accordingly.
        const live = raw.filter((c) => c.is_live !== false);
        setCameras(live.map((c) => resolveCameraMeta(c.name)));
      }
    } catch {
      // Network/tunnel failure: keep whatever we had so the rail doesn't blink
      // to "no cameras" every time the tunnel hiccups. The catch path is
      // distinct from a 200 response with zero live cameras.
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
