/**
 * Author: Claude Opus 4.6
 * Date: 12-Apr-2026
 * PURPOSE: Pure helpers for browser-side PTZ timing on the house-yard Reolink.
 *   The Reolink E1 Pro has no absolute-pan endpoint (firmware limit — see
 *   farm-guardian/docs/08-Apr-2026-absolute-ptz-investigation.md), so degree
 *   nudges are done with timed move→stop bursts. The camera has a significant
 *   ramp-up: short bursts move much less than their linear speed would predict.
 *   Empirical data (speed 5, localhost):
 *     180ms →  0.8°
 *     300ms →  0.7°  (still in ramp-up — no real motion)
 *     500ms → 12.5°
 *   Over the Cloudflare tunnel the stop arrives later, so bursts move farther.
 *   We cap single-click bursts at 500ms and iterate for larger requests,
 *   always re-reading camera position between bursts instead of trusting math.
 * SRP/DRY check: Pass — no existing PTZ helper in repo. Consumed by
 *   GuardianPTZPanel only.
 */

export const PTZ_SPEED = 5;
export const BURST_CAP_MS = 500;
export const MAX_DEGREE_INPUT = 60;

// Target-degrees → single-burst duration (ms).
// This is an approximation, not a promise. Caller must re-read /position
// after the burst and decide whether another iteration is needed.
export function estimateBurstMs(degrees: number): number {
  const d = Math.abs(degrees);
  if (d <= 0) return 0;
  // Under ~3°, the camera barely moves in any burst shorter than the cap.
  // Use the cap and let the readback tell the truth.
  if (d <= 3) return 350;
  if (d <= 8) return 450;
  return BURST_CAP_MS;
}

// Circular pan difference in degrees, signed (+right, -left) in [-180, 180].
export function panDelta(from: number, to: number): number {
  let d = to - from;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return d;
}
