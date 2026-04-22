// Author: Claude Opus 4.6 (1M context)
// Date: 14-Apr-2026
// PURPOSE: TypeScript interfaces for Farm Guardian API responses.
//          Maps to endpoints at guardian.markbarney.net. Detection-pipeline
//          types (Detection, DeterrentStatus, ActiveTrack, DailySummary,
//          DeterrentEffectiveness, EBirdSighting) are retained for future
//          reuse even though the live Guardian page no longer renders them
//          (v1.4.0 strip). PTZ types added for the GuardianPTZPanel.
//          Image-archive types appended 14-Apr-2026 for farm-guardian
//          v2.25.0 /api/v1/images/* surface — see
//          docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md.
// SRP/DRY check: Pass — single file for all Guardian API types.

export const GUARDIAN_API = "https://guardian.markbarney.net";

export interface GuardianStatus {
  online: boolean;
  uptime_seconds: number;
  frames_processed: number;
  alerts_sent: number;
  cameras_online: number;
  cameras_total: number;
  detections_today: number;
  alerts_today: number;
}

export interface Detection {
  timestamp: string;
  camera: string;
  class: string;
  confidence: number;
  bbox: number[];
  is_predator: boolean;
  snapshot?: string;
}

export interface DeterrentStatus {
  enabled: boolean;
  active_count: number;
  active: Record<string, [number, string]>;
}

export interface ActiveTrack {
  track_id: number;
  camera_id: string;
  class_name: string;
  is_predator: boolean;
  detection_count: number;
  duration_sec: number;
  max_confidence: number;
}

export interface DailySummary {
  date: string;
  summary: string;
  predator_visits: {
    species: string;
    time: string;
    duration_seconds: number;
    max_confidence: number;
    deterrent: string[];
    outcome: string;
  }[];
  stats: {
    total_detections: number;
    predator_detections: number;
    unique_species: string[];
    species_counts: Record<string, number>;
    alerts_sent: number;
    deterrents_fired: number;
    deterrent_success_rate: number;
    peak_activity_hour: number;
    activity_by_hour: Record<string, number>;
  };
}

export interface DeterrentEffectiveness {
  total_actions: number;
  success_rate: number;
  by_type?: Record<string, { total_actions: number; success_rate: number }>;
}

export interface EBirdSighting {
  timestamp: string;
  species: string;
  location: string;
  confidence: number;
}

// PTZ — house-yard Reolink manual control surface.
export interface PTZPosition {
  camera_id: string;
  pan: number;         // raw units (0–7200, 20 per degree)
  pan_degrees: number; // 0–360
  tilt: number;        // raw units
  zoom: number;        // stays 0 — zoom out of scope
}

export interface PresetMapResponse {
  camera_id: string;
  presets: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Image archive — curated frames from the multi-camera pipeline (farm-guardian
// v2.23.0 capture / v2.25.0 REST surface). Populated by
// farm-guardian/tools/pipeline/. Spec authority:
//   docs/14-Apr-2026-image-archive-dataset-and-frontend-plan.md
//
// RULES THAT BIND (see parent plan Part 2.d):
//   - has_concerns=1 rows MUST NEVER reach this type. Public responses omit
//     `concerns` entirely; if you ever see the field on a GemRow, the
//     backend has regressed. Do not add the field to GemRow.
//   - Captions are drafts until overridden. Render with a "Draft caption:"
//     affordance (see GemCaption). Never style as final editorial copy.
//   - apparent_age_days: backend uses -1 as an "n/a" sentinel; normalise to
//     null at the lib/gems.ts boundary so the UI never renders "-1 days".
//   - Camera labels in UI strings must be hardware-only (CAMERAS from
//     lib/cameras.ts is the SSoT). `camera_id` stays a string here rather
//     than the CameraName union, because the API authority is backend config
//     and the frontend should degrade gracefully on drift.
// ---------------------------------------------------------------------------

export type Scene = "brooder" | "yard" | "coop" | "nesting-box" | "sky" | "other";

export type Activity =
  | "huddling"
  | "eating"
  | "drinking"
  | "dust-bathing"
  | "foraging"
  | "preening"
  | "sleeping"
  | "sparring"
  | "alert"
  | "none-visible"
  | "unknown"
  | "other";

export type Lighting =
  | "natural-good"
  | "heat-lamp"
  | "dim"
  | "blown-out"
  | "backlit"
  | "mixed";

export type Composition = "portrait" | "group" | "wide" | "cluttered" | "empty";

export type ImageQuality = "sharp" | "soft" | "blurred";

export type ShareWorth = "skip" | "decent" | "strong";

export type IndividualTag = "birdadette" | "adult-survivor" | "chick" | "unknown-bird";

export interface GemRow {
  id: number;
  camera_id: string;
  ts: string;
  thumb_url: string;
  full_url: string;
  width: number;
  height: number;
  scene: Scene;
  bird_count: number;
  activity: Activity;
  lighting: Lighting;
  composition: Composition;
  image_quality: ImageQuality;
  individuals_visible: IndividualTag[];
  any_special_chick: boolean;
  apparent_age_days: number | null; // backend -1 sentinel normalised to null
  caption_draft: string;
  share_reason: string;
  caption_is_override?: boolean;    // v0.2 backend field; absent in v0.1
}

export interface RecentRow extends GemRow {
  image_tier: "strong" | "decent";
}

export interface ImageListResponse<T> {
  count: number;
  total_estimate: number;
  estimated?: boolean;
  next_cursor: string | null;
  rows: T[];
}

export interface ImageStats {
  range: { since: string; until: string };
  total_rows: number;
  by_tier: Record<"strong" | "decent" | "skip", number>;
  by_camera: Record<string, number>;
  by_scene: Record<Scene, number>;
  by_activity: Record<Activity, number>;
  birdadette_sightings: number;
  oldest_ts: string;
  newest_ts: string;
}

export interface ImageApiError {
  error: { code: string; message: string; detail?: unknown };
  request_id: string;
}
