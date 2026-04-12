"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 12-Apr-2026
 * PURPOSE: Modular camera viewer — one featured feed big, the rest as live
 *   thumbnails. Click any thumbnail to promote it to the stage. Selection
 *   persists in localStorage and can be deep-linked via `?cam=<name>`.
 *   Used by the homepage Guardian section and the `/projects/guardian`
 *   live dashboard (each passes its own default + storage key).
 * SRP/DRY check: Pass — composes GuardianCameraFeed; no reimplementation
 *   of the feed itself. Camera list read from lib/cameras.ts (SSoT).
 */
import { useEffect, useMemo, useState } from "react";
import GuardianCameraFeed from "./GuardianCameraFeed";
import {
  CameraMeta,
  CameraName,
  isCameraName,
} from "@/lib/cameras";

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
  const [featured, setFeatured] = useState<CameraName>(defaultFeatured);

  // On mount: URL `?cam=` wins, else localStorage, else server default.
  // Read directly from window (no Suspense boundary needed, unlike useSearchParams).
  useEffect(() => {
    try {
      const urlCam = new URLSearchParams(window.location.search).get("cam");
      if (urlCam && isCameraName(urlCam)) {
        setFeatured(urlCam);
        return;
      }
      const stored = window.localStorage.getItem(storageKey);
      if (stored && isCameraName(stored)) setFeatured(stored);
    } catch {
      // window/localStorage unavailable — fall back silently.
    }
  }, [storageKey]);

  const promote = (name: CameraName) => {
    if (name === featured) return;
    setFeatured(name);
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
  const thumbs = useMemo(
    () => cameras.filter((c) => c.name !== featured),
    [cameras, featured],
  );

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
        />
      </div>

      {/* Thumbnail picker — the other cameras, still live */}
      <div className="grid grid-cols-3 gap-1.5">
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
              />
            </div>
            <div className="pointer-events-none absolute inset-0 rounded ring-1 ring-transparent group-hover:ring-emerald-400/60 transition" />
          </button>
        ))}
      </div>
    </div>
  );
}
