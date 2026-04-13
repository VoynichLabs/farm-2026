/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Single source of truth for Guardian cameras. Names, labels,
 *   devices, and native aspect ratios live here so UI layout can size
 *   containers to match each feed. Consumed by `GuardianCameraStage`,
 *   the homepage system panel, and the live `/projects/guardian` dashboard.
 *
 *   NAMING RULE: every string here — `label`, `shortLabel`, `device` — MUST
 *   identify the hardware, never the location. Cameras move. Locations
 *   change. The hardware doesn't. No "brooder", "nestbox", "coop", or
 *   "yard" in any field on this struct. If you're tempted to write where
 *   a camera is pointed, write that somewhere else (a field note) — not
 *   here.
 *
 *   The `name` keys (`house-yard`, etc.) are API keys from farm-guardian's
 *   config.json — they can't be renamed unilaterally from the frontend. The
 *   `house-yard` key is legacy-location-named; a rename needs coordinated
 *   backend change. UI-facing strings (label/shortLabel/device) follow the
 *   hardware-only rule today.
 * SRP/DRY check: Pass — single source, consumed by all camera UI.
 */

export type CameraName = "house-yard" | "s7-cam" | "usb-cam" | "gwtc" | "mba-cam";

export interface CameraMeta {
  name: CameraName;
  label: string;         // full display label — used on the stage overlay — HARDWARE ONLY
  shortLabel: string;    // compact label — used on thumbnails — HARDWARE ONLY
  device: string;        // hardware description — used in system panel — HARDWARE ONLY
  aspectRatio: string;   // CSS aspect-ratio value, e.g. "16 / 9"
}

// Ordered: thumbs render in this order; the featured cam is pulled out.
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

export const DEFAULT_FEATURED: CameraName = "usb-cam";

export function getCamera(name: string): CameraMeta | undefined {
  return CAMERAS.find((c) => c.name === name);
}

export function isCameraName(name: string): name is CameraName {
  return CAMERAS.some((c) => c.name === name);
}
