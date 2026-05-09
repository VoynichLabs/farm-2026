"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 10-May-2026
 * PURPOSE: Thin client wrapper around GuardianCameraStage for the homepage.
 *   Mirrors the /projects/guardian dashboard configuration exactly —
 *   house-yard primary + s7-cam secondary — so the homepage and the
 *   dashboard read as the same surface (this is what Boss asked for in
 *   the v1.16.0 redesign). Roster comes from useGuardianRoster, which
 *   hits /api/cameras every 30s; storage key is per-page so the home
 *   featured selection doesn't fight the dashboard's.
 * SRP/DRY check: Pass — composition only. No fetching of its own beyond
 *   the roster hook; no styling beyond a light wrapper.
 */
import GuardianCameraStage from "@/app/components/guardian/GuardianCameraStage";
import { useGuardianRoster } from "@/lib/guardian-roster";

export default function HomeCameraStage() {
  const { cameras } = useGuardianRoster();

  return (
    <div className="p-2">
      <GuardianCameraStage
        cameras={cameras}
        defaultFeatured="house-yard"
        secondaryFeatured="s7-cam"
        storageKey="farm2026.guardian.featured.home"
        online={null}
      />
    </div>
  );
}
