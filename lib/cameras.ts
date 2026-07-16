/**
 * Author: Claude Fable 5 (updated 16-Jul-2026: DEFAULT_FEATURED → s7-cam; 06-Jul-2026: duo2 entry; previously Claude Opus 4.7 (1M context) 06-May-2026; Claude Sonnet 4.6 30-Apr-2026; originally Claude Opus 4.7 16-Apr-2026)
 * Date: 16-Jul-2026
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
    label: "usb-cam — USB webcam on GWTC laptop",
    shortLabel: "USB",
    device: "USB webcam (GWTC Gateway laptop, Windows/OpenCV)",
    aspectRatio: "16 / 9",
  },
  {
    name: "mba-cam",
    label: "mba-cam — MacBook Air 2013 webcam",
    shortLabel: "MBA",
    device: "MacBook Air 2013 FaceTime HD (HTTP snapshot via usb-cam-host)",
    aspectRatio: "16 / 9",
  },
  {
    name: "s7-cam",
    label: "s7-cam — Samsung Galaxy S7",
    shortLabel: "S7",
    device: "Samsung Galaxy S7 (IP Webcam app, portrait 9:16)",
    aspectRatio: "9 / 16",
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
  {
    name: "dominator-cam",
    label: "dominator-cam — MSI Dominator GT72 webcam (manual)",
    shortLabel: "Dominator",
    device: "BisonCam NB Pro on MSI Dominator GT72 6QD (HTTP snapshot, manually started)",
    aspectRatio: "16 / 9",
  },
  {
    name: "duo2",
    label: "duo2 — Reolink Duo 2 dual-lens panoramic",
    shortLabel: "Duo 2",
    device: "Reolink Duo 2 dual-lens panoramic (stitched 8:3 frame, RTSP)",
    aspectRatio: "8 / 3",
  },
];

// Preferred featured camera for the homepage rail. The stage falls back to
// the first camera in the live roster if this name isn't present.
// 16-Jul-2026: s7-cam is the flagship — it watches the Birdcatraz water bowl
// and feeds the gem pipeline (usb-cam is currently offline).
export const DEFAULT_FEATURED: CameraName = "s7-cam";

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
