// Author: Claude Opus 4.6 (1M context)
// Date: 14-Apr-2026
// PURPOSE: Pure formatter helpers for gems UI — camera id → hardware
//          label, activity → human text, ISO timestamp → relative time,
//          apparent-age-days → bucket label. No I/O, no framework
//          imports beyond Intl. Consumed by GemCard, GemCaption,
//          GemMetaTable, GemLightbox, LatestFlockFrames.
// SRP/DRY check: Pass — lib/gems.ts owns I/O, this owns formatting.
//                CAMERAS from lib/cameras.ts is the SSoT for hardware
//                labels (parent plan rule: hardware-only strings).

import { CAMERAS } from "./cameras";
import type {
  Activity,
  IndividualTag,
  Scene,
} from "@/app/components/guardian/types";

export function cameraLabel(cameraId: string): string {
  const meta = CAMERAS.find((c) => c.name === cameraId);
  return meta?.shortLabel ?? cameraId;
}

export function cameraDevice(cameraId: string): string {
  const meta = CAMERAS.find((c) => c.name === cameraId);
  return meta?.device ?? cameraId;
}

const ACTIVITY_LABELS: Record<Activity, string> = {
  huddling: "huddling",
  eating: "eating",
  drinking: "drinking",
  "dust-bathing": "dust-bathing",
  foraging: "foraging",
  preening: "preening",
  sleeping: "sleeping",
  sparring: "sparring",
  alert: "alert",
  "none-visible": "resting",
  other: "other",
};

export function activityLabel(activity: Activity): string {
  return ACTIVITY_LABELS[activity] ?? activity;
}

const SCENE_LABELS: Record<Scene, string> = {
  brooder: "brooder",
  yard: "yard",
  coop: "coop",
  "nesting-box": "nest box",
  sky: "sky",
  other: "scene",
};

export function sceneLabel(scene: Scene): string {
  return SCENE_LABELS[scene] ?? scene;
}

export function individualLabel(tag: IndividualTag): string {
  switch (tag) {
    case "birdadette":
      return "Birdadette";
    case "adult-survivor":
      return "adult";
    case "chick":
      return "chick";
    case "unknown-bird":
    default:
      return "bird";
  }
}

// Relative time without pulling in a date library. Intl.RelativeTimeFormat
// handles pluralisation + locale-aware output.
const RTF = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

export function relativeTime(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  const diffMs = then.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSec);
  if (absSec < 60) return RTF.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return RTF.format(diffMin, "minute");
  const diffHr = Math.round(diffMin / 60);
  if (Math.abs(diffHr) < 24) return RTF.format(diffHr, "hour");
  const diffDay = Math.round(diffHr / 24);
  if (Math.abs(diffDay) < 30) return RTF.format(diffDay, "day");
  const diffMonth = Math.round(diffDay / 30);
  if (Math.abs(diffMonth) < 12) return RTF.format(diffMonth, "month");
  return RTF.format(Math.round(diffMonth / 12), "year");
}

// America/New_York for absolute timestamps in tooltips / metadata tables.
const ABS_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  dateStyle: "medium",
  timeStyle: "short",
});

export function absoluteTime(iso: string): string {
  return ABS_FORMATTER.format(new Date(iso));
}

// Age buckets for the metadata pill. Null = not a chick scene.
export function ageBucket(days: number | null): string | null {
  if (days === null || days < 0) return null;
  if (days === 0) return "day-old chick";
  if (days === 1) return "1-day-old chick";
  if (days < 7) return `${days}-day-old chick`;
  const weeks = Math.floor(days / 7);
  const rem = days % 7;
  if (weeks === 1) return rem === 0 ? "1-week-old chick" : `~1 week old`;
  if (weeks < 8) return `~${weeks} weeks old`;
  const months = Math.floor(days / 30);
  return `~${months} month${months === 1 ? "" : "s"} old`;
}
