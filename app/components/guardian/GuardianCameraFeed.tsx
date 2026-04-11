"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 11-Apr-2026
 * PURPOSE: Reusable camera feed via snapshot polling. Fetches a single JPEG from
 *   Guardian's /api/cameras/{name}/frame endpoint every ~1s and swaps the img src.
 *   Replaced persistent MJPEG streaming because browsers limit concurrent HTTP/1.1
 *   connections per domain (~6), and 4 MJPEG streams + API polling through the
 *   Cloudflare tunnel exceeded that limit — causing feeds to starve and show only
 *   one camera at a time. Snapshot polling uses short-lived requests that work with
 *   HTTP/2 multiplexing and don't hold connections open.
 * SRP/DRY check: Pass — single responsibility: camera feed display for any camera.
 */

import { useEffect, useState, useCallback, useRef } from "react";
import { GUARDIAN_API } from "./types";

// How often to fetch a new snapshot (ms)
const POLL_INTERVAL = 1200;

export default function GuardianCameraFeed({
  cameraName,
  label,
  online,
  onStatusChange,
}: {
  cameraName: string;
  label: string;
  online: boolean | null;
  onStatusChange?: (cameraName: string, isLive: boolean) => void;
}) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [feedError, setFeedError] = useState(false);
  const consecutiveErrors = useRef(0);
  const mountedRef = useRef(true);

  // Poll for snapshots
  useEffect(() => {
    mountedRef.current = true;

    const fetchFrame = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(
          `${GUARDIAN_API}/api/cameras/${cameraName}/frame?t=${Date.now()}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!mountedRef.current) return;

        // Revoke previous object URL to prevent memory leaks
        setFrameUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        consecutiveErrors.current = 0;
        setFeedError(false);
      } catch {
        if (!mountedRef.current) return;
        consecutiveErrors.current++;
        // Mark as error after 3 consecutive failures (not just one dropped frame)
        if (consecutiveErrors.current >= 3) {
          setFeedError(true);
        }
      }
    };

    fetchFrame();
    const interval = setInterval(fetchFrame, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      // Clean up last object URL
      setFrameUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [cameraName]);

  // Reset feed error when system comes back online
  useEffect(() => {
    if (online === true) {
      setFeedError(false);
      consecutiveErrors.current = 0;
    }
  }, [online]);

  const showFeed = online !== false && !feedError && frameUrl !== null;

  // Report status to parent
  useEffect(() => {
    onStatusChange?.(cameraName, showFeed);
  }, [showFeed, cameraName, onStatusChange]);

  return (
    <div
      className="min-w-0 w-full h-full rounded border border-guardian-border overflow-hidden relative"
      style={{ background: "#0a0f1e" }}
    >
      {showFeed ? (
        <img
          src={frameUrl!}
          alt={`Live farm camera — ${label}`}
          className="w-full h-full object-contain block"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
          <div className="text-center px-4">
            <div className="text-red-500/60 text-sm mb-1">OFFLINE</div>
            <div className="text-guardian-muted text-[0.7rem]">{label}</div>
          </div>
        </div>
      )}
      {/* Feed overlay */}
      <div className="absolute top-1.5 right-1.5 bg-black/70 rounded px-2 py-0.5 text-[0.65rem] flex items-center gap-1.5 font-mono">
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block ${showFeed ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`}
        />
        <span className="text-slate-300">{label}</span>
        {showFeed && <span className="text-emerald-400">LIVE</span>}
        {!showFeed && <span className="text-red-400">OFF</span>}
      </div>
    </div>
  );
}
