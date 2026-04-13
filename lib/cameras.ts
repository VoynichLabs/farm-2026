/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Single source of truth for Guardian cameras. Names, labels,
 *   devices, locations, and native aspect ratios live here so UI layout
 *   can size containers to match each feed (no cropping, no letterboxing).
 *   Consumed by `GuardianCameraStage`, homepage system panel, and the
 *   live `/projects/guardian` dashboard.
 * SRP/DRY check: Pass — replaces hardcoded camera literals in page.tsx,
 *   GuardianDashboard.tsx, and GuardianCameraStage.tsx. mba-cam added
 *   13-Apr-2026 to match farm-guardian v2.22.1 (fifth camera).
 */

export type CameraName = "house-yard" | "s7-cam" | "usb-cam" | "gwtc" | "mba-cam";

export interface CameraMeta {
  name: CameraName;
  label: string;         // full display label — used on the stage overlay
  shortLabel: string;    // compact label — used on thumbnails
  device: string;        // hardware description — used in system panel
  location: string;      // where it's pointed right now
  aspectRatio: string;   // CSS aspect-ratio value, e.g. "16 / 9"
}

// Ordered: thumbs render in this order; the featured cam is pulled out.
export const CAMERAS: CameraMeta[] = [
  {
    name: "usb-cam",
    label: "usb-cam — desk brooder",
    shortLabel: "Brooder",
    device: "USB webcam",
    location: "Desk brooder (Birdadette + Cackle chicks)",
    aspectRatio: "16 / 9",
  },
  {
    name: "mba-cam",
    label: "mba-cam — MacBook Air 2013",
    shortLabel: "MBA brooder",
    device: "MacBook Air 2013 webcam (FaceTime HD)",
    location: "Brooder (currently)",
    aspectRatio: "16 / 9",
  },
  {
    name: "s7-cam",
    label: "s7-cam — Samsung S7",
    shortLabel: "S7 brooder",
    device: "Samsung S7 (RTSP)",
    location: "Brooder",
    aspectRatio: "16 / 9",
  },
  {
    name: "gwtc",
    label: "gwtc — Gateway laptop",
    shortLabel: "Nestbox",
    device: "Gateway laptop webcam",
    location: "Coop nestbox",
    aspectRatio: "16 / 9",
  },
  {
    name: "house-yard",
    label: "house-yard — Reolink 4K PTZ",
    shortLabel: "Yard PTZ",
    device: "Reolink E1 Pro 4K PTZ",
    location: "House yard",
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
