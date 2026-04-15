"use client";
/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 15-Apr-2026
 * PURPOSE: Modular camera viewer — one featured feed big, the rest as live
 *   thumbnails. Click any thumbnail to promote it to the stage. Selection
 *   persists in localStorage and can be deep-linked via `?cam=<name>`.
 *   Used by the homepage Guardian section and the `/projects/guardian`
 *   live dashboard (each passes its own default + storage key).
 *
 *   15-Apr-2026 smart visibility: per-camera FeedState is collected via
 *   `useCameraStatuses` (each GuardianCameraFeed reports its own state).
 *   Cameras whose state is "offline" are hidden from the thumbnail grid
 *   but kept mounted in a hidden container so their poll loops continue
 *   and they reappear automatically when they recover. If the featured
 *   camera goes "offline" and any other camera is "live", the stage
 *   auto-promotes to the first live cam in canonical order. Once promoted,
 *   we don't reshuffle. The grid scales to visible-thumb count (1/2/3+).
 *   Empty state when zero cameras are reachable. See
 *   docs/15-Apr-2026-smart-camera-visibility-plan.md.
 * SRP/DRY check: Pass — composes GuardianCameraFeed (rendering) and
 *   useCameraStatuses (state). Camera list read from lib/cameras.ts (SSoT).
 *   Grid-column class selection lives in one helper. Layout decisions live
 *   here once and serve every consumer (homepage, dashboard).
 */
import { useEffect, useMemo, useState } from "react";
import GuardianCameraFeed from "./GuardianCameraFeed";
import { useCameraStatuses } from "./useCameraStatuses";
import {
  CameraMeta,
  CameraName,
  isCameraName,
} from "@/lib/cameras";

// Static class strings so the Tailwind JIT picks them up (no dynamic concat).
function gridColsForCount(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-3";
}

export default function GuardianCameraStage({
  cameras,
  defaultFeatured,
  storageKey,
  online,
}: {
  cameras: CameraMeta[];
  defaultFeatured: CameraName;
  storageKey: string;
  online: boolean | null;
}) {
  // `userFeatured` = the camera the user (or URL/localStorage) most recently
  // chose. `featured` below is *derived* from this plus live statuses, so the
  // smart-visibility auto-promote is a pure computation — no extra effect, no
  // cascading setState. URL/localStorage init happens post-mount to keep SSR
  // and the first client render in lockstep (no hydration mismatch).
  const [userFeatured, setUserFeatured] = useState<CameraName>(defaultFeatured);
  const { statuses, onStatusChange } = useCameraStatuses();

  useEffect(() => {
    try {
      const urlCam = new URLSearchParams(window.location.search).get("cam");
      if (urlCam && isCameraName(urlCam)) {
        setUserFeatured(urlCam);
        return;
      }
      const stored = window.localStorage.getItem(storageKey);
      if (stored && isCameraName(stored)) setUserFeatured(stored);
    } catch {
      // window/localStorage unavailable — fall back silently.
    }
  }, [storageKey]);

  // Smart visibility (derived, not stateful): if the user's choice is offline
  // and some other camera is live, the stage features the first live camera in
  // canonical order. The swap happens on the next render — no extra effect.
  const featured: CameraName = useMemo(() => {
    if (statuses[userFeatured] !== "offline") return userFeatured;
    const liveCam = cameras.find((c) => statuses[c.name] === "live");
    return liveCam?.name ?? userFeatured;
  }, [userFeatured, statuses, cameras]);

  const promote = (name: CameraName) => {
    if (name === userFeatured) return;
    setUserFeatured(name);
    try {
      window.localStorage.setItem(storageKey, name);
      const next = new URLSearchParams(window.location.search);
      next.set("cam", name);
      const url = `${window.location.pathname}?${next.toString()}${window.location.hash}`;
      window.history.replaceState(window.history.state, "", url);
    } catch {
      // ignore
    }
  };

  const featuredCam = useMemo(
    () => cameras.find((c) => c.name === featured) ?? cameras[0],
    [cameras, featured],
  );

  // Partition non-featured cameras into visible (anything not "offline") and
  // hidden (offline) so hidden ones keep polling and rejoin the grid on recovery.
  const { visibleThumbs, hiddenThumbs } = useMemo(() => {
    const others = cameras.filter((c) => c.name !== featured);
    return {
      visibleThumbs: others.filter((c) => statuses[c.name] !== "offline"),
      hiddenThumbs: others.filter((c) => statuses[c.name] === "offline"),
    };
  }, [cameras, featured, statuses]);

  // Empty state: no cameras configured, or every camera (including the one
  // we're trying to feature) is offline.
  const everyCameraOffline =
    cameras.length > 0 &&
    cameras.every((c) => statuses[c.name] === "offline");
  const showEmptyState = cameras.length === 0 || (!featuredCam) || everyCameraOffline;

  if (showEmptyState) {
    return (
      <div className="flex flex-col gap-1.5">
        <div
          className="w-full mx-auto rounded border border-guardian-border bg-guardian-card flex items-center justify-center text-center px-6"
          style={{ aspectRatio: featuredCam?.aspectRatio ?? "16 / 9", maxHeight: "65vh" }}
        >
          <div>
            <div className="text-guardian-muted text-sm uppercase tracking-widest mb-1">
              {cameras.length === 0 ? "No cameras configured" : "No cameras online"}
            </div>
            <div className="text-guardian-muted text-[0.7rem]">
              {cameras.length === 0
                ? "Add a camera in lib/cameras.ts."
                : "Feeds will reappear automatically when they recover."}
            </div>
          </div>
        </div>
        {/* Keep offline cameras polling so the page can self-heal. */}
        {cameras.length > 0 && (
          <div className="hidden" aria-hidden="true">
            {cameras.map((cam) => (
              <GuardianCameraFeed
                key={cam.name}
                cameraName={cam.name}
                label={cam.shortLabel}
                online={online}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Stage — featured camera, sized by its native aspect ratio */}
      <div
        className="w-full mx-auto"
        style={{
          aspectRatio: featuredCam.aspectRatio,
          maxHeight: "65vh",
        }}
      >
        <GuardianCameraFeed
          cameraName={featuredCam.name}
          label={featuredCam.label}
          online={online}
          onStatusChange={onStatusChange}
        />
      </div>

      {/* Thumbnail picker — only cameras that aren't fully offline. */}
      {visibleThumbs.length > 0 && (
        <div className={`grid ${gridColsForCount(visibleThumbs.length)} gap-1.5`}>
          {visibleThumbs.map((cam) => (
            <button
              key={cam.name}
              type="button"
              onClick={() => promote(cam.name)}
              aria-pressed={false}
              aria-label={`Switch stage to ${cam.label}`}
              title={`Switch stage to ${cam.label}`}
              className="group relative block p-0 bg-transparent border-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
              style={{ aspectRatio: cam.aspectRatio }}
            >
              <div className="w-full h-full transition-opacity group-hover:opacity-90">
                <GuardianCameraFeed
                  cameraName={cam.name}
                  label={cam.shortLabel}
                  online={online}
                  onStatusChange={onStatusChange}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded ring-1 ring-transparent group-hover:ring-emerald-400/60 transition" />
            </button>
          ))}
        </div>
      )}

      {/* Offline cameras — kept mounted off-screen so polling continues and
          they re-enter the visible grid the moment a snapshot succeeds. */}
      {hiddenThumbs.length > 0 && (
        <div className="hidden" aria-hidden="true">
          {hiddenThumbs.map((cam) => (
            <GuardianCameraFeed
              key={cam.name}
              cameraName={cam.name}
              label={cam.shortLabel}
              online={online}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
