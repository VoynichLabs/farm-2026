/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 16-Apr-2026
 * PURPOSE: Camera UI metadata overlay — NOT a roster. The authoritative list
 *   of live cameras is fetched at runtime from Guardian's `/api/cameras`
 *   endpoint (see `lib/guardian-roster.ts`). This file carries optional
 *   display metadata (nice label, shortLabel, device description, aspect
 *   ratio) for every camera that has ever been on the farm, so the UI can
 *   render a pleasant label when a camera name shows up in the live roster
 *   or in historical data (gems, filters).
 *
 *   Rules:
 *   - DO NOT treat this array as "the camera list." A camera being absent
 *     here just means no one has written metadata for it; it should still
 *     render with sensible defaults (see `resolveCameraMeta`).
 *   - DO NOT delete entries from here just because a camera is currently
 *     offline or missing from Guardian's config. Cameras come and go on
 *     this farm; the frontend must not prune the historical roster.
 *   - NAMING RULE: every `label`, `shortLabel`, `device` must identify the
 *     hardware, never the location. Cameras move; hardware doesn't.
 *
 *   Consumers:
 *   - `lib/guardian-roster.ts` — merges live `/api/cameras` with this
 *     overlay so the stage gets full metadata for each camera.
 *   - `lib/gems-format.ts`, `app/components/gems/GemFilters.tsx` —
 *     historical gem filter chips use this metadata to label cameras whose
 *     gems are in the archive (even if the camera is offline today).
 *
 * SRP/DRY check: Pass — single job: map camera name → display metadata,
 *   with a graceful default for unknown names.
 */

export type CameraName = string;

export interface CameraMeta {
  name: CameraName;
  label: string;         // full display label — HARDWARE ONLY
  shortLabel: string;    // compact label — HARDWARE ONLY
  device: string;        // hardware description — HARDWARE ONLY
  aspectRatio: string;   // CSS aspect-ratio value, e.g. "16 / 9"
}

// Order is historical / presentation — newly-added cameras should be
// appended, not inserted, so existing localStorage `featured` keys remain
// meaningful. This array does NOT decide which cameras render.
export const CAMERAS: CameraMeta[] = [
  {
    name: "usb-cam",
    label: "usb-cam — USB webcam on Mac Mini",
    shortLabel: "USB",
    device: "USB webcam (Mac Mini, AVFoundation)",
    aspectRatio: "16 / 9",
  },
  {
    name: "mba-cam",
    label: "mba-cam — MacBook Air 2013 webcam",
    shortLabel: "MBA",
    device: "MacBook Air 2013 FaceTime HD webcam (RTSP via MediaMTX)",
    aspectRatio: "16 / 9",
  },
  {
    name: "s7-cam",
    label: "s7-cam — Samsung Galaxy S7",
    shortLabel: "S7",
    device: "Samsung Galaxy S7 (IP Webcam app, RTSP)",
    aspectRatio: "16 / 9",
  },
  {
    name: "gwtc",
    label: "gwtc — Gateway laptop webcam",
    shortLabel: "GWTC",
    device: "Gateway laptop webcam (RTSP via MediaMTX)",
    aspectRatio: "16 / 9",
  },
  {
    name: "house-yard",
    label: "house-yard — Reolink E1 Pro 4K PTZ",
    shortLabel: "Reolink",
    device: "Reolink E1 Outdoor Pro 4K PTZ",
    aspectRatio: "16 / 9",
  },
];

// Preferred featured camera for the homepage rail. The stage falls back to
// the first camera in the live roster if this name isn't present.
export const DEFAULT_FEATURED: CameraName = "usb-cam";

const BY_NAME: Map<string, CameraMeta> = new Map(CAMERAS.map((c) => [c.name, c]));

export function getCamera(name: string): CameraMeta | undefined {
  return BY_NAME.get(name);
}

// Always returns a CameraMeta — known cameras get their overlay, unknown
// cameras get sensible defaults (name as label, 16/9) so the UI renders
// something reasonable for any camera the backend returns.
export function resolveCameraMeta(name: string): CameraMeta {
  const hit = BY_NAME.get(name);
  if (hit) return hit;
  return {
    name,
    label: name,
    shortLabel: name,
    device: name,
    aspectRatio: "16 / 9",
  };
}

// Accepts any non-empty string as a valid camera identifier. The backend
// roster defines what's actually live; UI code should not gate on a static
// union.
export function isCameraName(name: unknown): name is CameraName {
  return typeof name === "string" && name.length > 0;
}
