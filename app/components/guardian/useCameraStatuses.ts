/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 15-Apr-2026
 * PURPOSE: Tiny hook owning the per-camera FeedState map for any layout that
 *   composes multiple GuardianCameraFeed instances. Returns a stable
 *   `onStatusChange` callback that GuardianCameraFeed expects, plus the
 *   current `statuses` record. Unknown cameras are absent from the record
 *   (treated as "still discovering" by the consumer). The setter no-ops when
 *   the value is unchanged so consumers don't re-render on duplicate reports.
 *   Used by GuardianCameraStage to drive the smart visibility rule (hide
 *   offline thumbs, auto-promote when featured goes offline) — see
 *   docs/15-Apr-2026-smart-camera-visibility-plan.md.
 * SRP/DRY check: Pass — single responsibility: own the statuses record. No
 *   JSX, no fetching, no policy.
 */
import { useCallback, useState } from "react";
import type { FeedState } from "./GuardianCameraFeed";

export function useCameraStatuses() {
  const [statuses, setStatuses] = useState<Record<string, FeedState>>({});

  const onStatusChange = useCallback((cameraName: string, state: FeedState) => {
    setStatuses((prev) => (prev[cameraName] === state ? prev : { ...prev, [cameraName]: state }));
  }, []);

  return { statuses, onStatusChange };
}
