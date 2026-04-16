"use client";
/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 16-Apr-2026
 * PURPOSE: Modular camera viewer — one featured feed big, the rest as live
 *   thumbnails. Click any thumbnail to promote it to the stage. Selection
 *   persists in localStorage and can be deep-linked via `?cam=<name>`.
 *   Used by the homepage Guardian section and the `/projects/guardian`
 *   live dashboard (each passes its own default + storage key + live
 *   roster).
 *
 *   Camera roster is DATA, not a static list. The `cameras` prop is the
 *   live roster — typically sourced via `useGuardianRoster()` which
 *   fetches Guardian's `/api/cameras` every 30s. Adding/removing a camera
 *   on the backend flows through without any code change here.
 *
 *   Smart visibility: per-camera FeedState is collected via
 *   `useCameraStatuses` (each GuardianCameraFeed reports its own state).
 *   Cameras whose state is "offline" are hidden from the thumbnail grid
 *   but kept mounted in a hidden container so their poll loops continue
 *   and they reappear automatically when they recover. If the featured
 *   camera goes "offline" and any other camera is "live", the stage
 *   auto-promotes to the first live cam in canonical order. Once promoted,
 *   we don't reshuffle. The grid scales to visible-thumb count (1/2/3+).
 *   Empty state when zero cameras are reachable.
 *
 *   Featured fallback: if `defaultFeatured` isn't present in the current
 *   roster (e.g. that camera was never set up, or was unplugged), we use
 *   the first roster entry so the stage never renders a dead slot.
 * SRP/DRY check: Pass — composes GuardianCameraFeed (rendering) and
 *   useCameraStatuses (state). Camera roster arrives as a prop from the
 *   parent's live fetch. Grid-column class selection lives in one helper.
 *   Layout decisions live here once and serve every consumer.
 */
import { useEffect, useMemo, useState } from "react";
import GuardianCameraFeed from "./GuardianCameraFeed";
import { useCameraStatuses } from "./useCameraStatuses";
import { CameraMeta, isCameraName } from "@/lib/cameras";

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
  defaultFeatured: string;
  storageKey: string;
  online: boolean | null;
}) {
  // `userFeatured` = the camera the user (or URL/localStorage) most recently
  // chose. `featured` below is *derived* from this plus live statuses and the
  // current roster, so smart-visibility auto-promote is a pure computation.
  // URL/localStorage init happens post-mount (not in a useState initializer)
  // to keep SSR and the first client render in lockstep — reading
  // localStorage during init would render different markup on the server vs
  // client and trigger a hydration mismatch. The React-19
  // `set-state-in-effect` lint rule flags this pattern; it's the documented
  // trade-off for localStorage-backed UI preferences, so we suppress it with
  // a targeted disable below.
  const [userFeatured, setUserFeatured] = useState<string>(defaultFeatured);
  const { statuses, onStatusChange } = useCameraStatuses();

  useEffect(() => {
    try {
      const urlCam = new URLSearchParams(window.location.search).get("cam");
      if (urlCam && isCameraName(urlCam)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage/URL hydration pattern; SSR safety requires post-mount read
        setUserFeatured(urlCam);
        return;
      }
      const stored = window.localStorage.getItem(storageKey);
      if (stored && isCameraName(stored)) setUserFeatured(stored);
    } catch {
      // window/localStorage unavailable — fall back silently.
    }
  }, [storageKey]);

  // Smart visibility (derived, not stateful):
  //   1. If the user's choice is missing from the current roster, fall back
  //      to the first roster entry. A user-pinned cam that's been unplugged
  //      shouldn't leave the stage empty.
  //   2. If the user's choice is in the roster but "offline", auto-promote
  //      to the first "live" cam in roster order. Once it becomes non-offline
  //      again we stop auto-promoting and respect the user's pick.
  const featured: string = useMemo(() => {
    if (cameras.length === 0) return userFeatured;
    const userCamPresent = cameras.some((c) => c.name === userFeatured);
    const effective = userCamPresent ? userFeatured : cameras[0].name;
    if (statuses[effective] !== "offline") return effective;
    const liveCam = cameras.find((c) => statuses[c.name] === "live");
    return liveCam?.name ?? effective;
  }, [userFeatured, statuses, cameras]);

  const promote = (name: string) => {
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
                ? "Guardian's /api/cameras returned no cameras yet."
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
