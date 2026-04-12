// Author: Claude Opus 4.6
// Date: 12-Apr-2026
// PURPOSE: TypeScript interfaces for Farm Guardian API responses.
//          Maps to endpoints at guardian.markbarney.net. Detection-pipeline
//          types (Detection, DeterrentStatus, ActiveTrack, DailySummary,
//          DeterrentEffectiveness, EBirdSighting) are retained for future
//          reuse even though the live Guardian page no longer renders them
//          (v1.4.0 strip). PTZ types added for the GuardianPTZPanel.
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
