"use client";
/**
 * Author: Claude Fable 5 (prev Claude Opus 4.7 (1M context))
 * Date: 06-Jul-2026
 * PURPOSE: Modular camera viewer — one featured feed big, the rest as live
 *   thumbnails. Click any thumbnail to promote it to the stage. Selection
 *   persists in localStorage and can be deep-linked via `?cam=<name>`.
 *   Used by the homepage Guardian section and the `/projects/guardian`
 *   live dashboard (each passes its own default + storage key + live
 *   roster).
 *
 *   Camera roster is DATA, not a static list. The `cameras` prop is the
 *   live roster — sourced via `useGuardianRoster()`, which itself filters
 *   /api/cameras to entries the backend reports as live (`is_live: true`).
 *   So every camera that arrives here should be a camera the user wants
 *   to see, and the stage's job is just to render them.
 *
 *   2026-05-02 simplification: the prior "smart visibility" hidden-thumb
 *   container is gone. It was hiding tiles whose per-feed snapshot poll
 *   had failed 10+ times in a row (~12s of failures), which was the root
 *   cause of "the website only shows the Reolink." The roster-level
 *   is_live gate now handles "this camera is dead"; per-tile state inside
 *   GuardianCameraFeed handles transient frame-fetch failures with its
 *   own connecting/reconnecting/offline indicator. Each tile speaks for
 *   itself.
 *
 *   Auto-promote: if the user's chosen featured tile is reporting offline
 *   (transient snapshot failure), promote the first tile that's reporting
 *   "live" so the big stage isn't a dead frame. The user's pick is
 *   restored once it recovers. This is per-tile state, not roster state.
 *
 *   Featured fallback: if `defaultFeatured` isn't present in the current
 *   roster (camera not online right now, or never configured), use the
 *   first roster entry so the stage never renders a dead slot.
 *
 * SRP/DRY check: Pass — composes GuardianCameraFeed (rendering) and
 *   useCameraStatuses (per-tile FeedState aggregation for auto-promote).
 *   Roster arrives pre-filtered as a prop. Grid-column class selection
 *   lives in one helper. Layout decisions live here once.
 */
import { useEffect, useMemo, useState } from "react";
import GuardianCameraFeed from "./GuardianCameraFeed";
import { useCameraStatuses } from "./useCameraStatuses";
import { CameraMeta, isCameraName } from "@/lib/cameras";

// Snapshot width hints forwarded to the backend's max_width param
// (06-Jul-2026): top-stage tiles get more pixels than thumbnails. Layout
// decisions live here once — the feed component just polls at whatever
// width it's told.
const STAGE_FRAME_WIDTH = 1600;
const THUMB_FRAME_WIDTH = 800;

// Static class strings so the Tailwind JIT picks them up (no dynamic concat).
function gridColsForCount(count: number): string {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-2";
  return "grid-cols-3";
}

export default function GuardianCameraStage({
  cameras,
  defaultFeatured,
  secondaryFeatured,
  storageKey,
  online,
}: {
  cameras: CameraMeta[];
  defaultFeatured: string;
  // Optional pinned second stage. When set AND present in the live roster
  // AND distinct from the primary, the top of the stage renders as a
  // side-by-side pair (mobile: stacked) instead of a single tile. Used by
  // the dashboard to put house-yard and s7-cam at top-level prominence
  // (2026-05-02). Other consumers (homepage) leave this unset and keep the
  // single-tile behavior.
  secondaryFeatured?: string;
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

  // If `secondaryFeatured` is configured, resolve it against the live roster.
  // Skip when missing from the roster (camera not currently online) or when
  // it collides with the primary (e.g., auto-promote landed on it). When
  // resolved, it pins as the second top-level tile.
  const secondaryCam: CameraMeta | null = useMemo(() => {
    if (!secondaryFeatured) return null;
    if (secondaryFeatured === featured) return null;
    return cameras.find((c) => c.name === secondaryFeatured) ?? null;
  }, [cameras, featured, secondaryFeatured]);

  // Every camera in the roster gets a tile. The roster is already filtered
  // upstream (useGuardianRoster -> is_live), so anything that arrives here is
  // a camera we want to render. Per-tile connecting/reconnecting/offline
  // states are shown by GuardianCameraFeed itself. Thumbs exclude both top
  // slots so the same camera never renders twice.
  const thumbs = useMemo(
    () => cameras.filter((c) => c.name !== featured && c.name !== secondaryCam?.name),
    [cameras, featured, secondaryCam],
  );

  // Empty state: no cameras online right now (roster is empty, or the chosen
  // featured doesn't resolve). Same copy in both cases — from the visitor's
  // point of view the page is empty for the same reason.
  const showEmptyState = cameras.length === 0 || !featuredCam;

  if (showEmptyState) {
    return (
      <div className="flex flex-col gap-1.5">
        <div
          className="w-full mx-auto rounded border border-guardian-border bg-guardian-card flex items-center justify-center text-center px-6"
          style={{ aspectRatio: featuredCam?.aspectRatio ?? "16 / 9", maxHeight: "65vh" }}
        >
          <div>
            <div className="text-guardian-muted text-sm uppercase tracking-widest mb-1">
              No cameras online
            </div>
            <div className="text-guardian-muted text-[0.7rem]">
              Cameras will reappear automatically when Guardian reports them live.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      {/* Top stage — single primary tile, OR primary + secondary side-by-side
          when `secondaryFeatured` is configured and resolves. The secondary
          path uses fixed-height tiles on md+ so each cam keeps its native
          aspect ratio without one swallowing the row. Mobile stacks. */}
      {secondaryCam ? (
        <div className="flex flex-col md:flex-row gap-1.5 md:items-start md:justify-center">
          <div
            className="w-full md:w-auto md:h-[50vh]"
            style={{ aspectRatio: featuredCam.aspectRatio }}
          >
            <GuardianCameraFeed
              cameraName={featuredCam.name}
              label={featuredCam.label}
              online={online}
              onStatusChange={onStatusChange}
              maxWidth={STAGE_FRAME_WIDTH}
            />
          </div>
          <div
            className="w-full md:w-auto md:h-[50vh]"
            style={{ aspectRatio: secondaryCam.aspectRatio }}
          >
            <GuardianCameraFeed
              cameraName={secondaryCam.name}
              label={secondaryCam.label}
              online={online}
              onStatusChange={onStatusChange}
              maxWidth={STAGE_FRAME_WIDTH}
            />
          </div>
        </div>
      ) : (
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
            maxWidth={STAGE_FRAME_WIDTH}
          />
        </div>
      )}

      {/* Thumbnail picker — every other camera in the live roster. */}
      {thumbs.length > 0 && (
        <div className={`grid ${gridColsForCount(thumbs.length)} gap-1.5`}>
          {thumbs.map((cam) => (
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
                  maxWidth={THUMB_FRAME_WIDTH}
                />
              </div>
              <div className="pointer-events-none absolute inset-0 rounded ring-1 ring-transparent group-hover:ring-emerald-400/60 transition" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
