"use client";
/**
 * Author: Claude Opus 4.6 (updated by Larry/Sonnet 4.6 13-Apr-2026)
 * Date: 12-Apr-2026 (v2 UX: connecting/reconnecting states)
 * PURPOSE: Reusable camera feed via snapshot polling. Fetches a single JPEG from
 *   Guardian's /api/cameras/{name}/frame endpoint every ~1s and swaps the img src.
 *   Replaced persistent MJPEG streaming because browsers limit concurrent HTTP/1.1
 *   connections per domain (~6), and 4 MJPEG streams + API polling through the
 *   Cloudflare tunnel exceeded that limit — causing feeds to starve and show only
 *   one camera at a time. Snapshot polling uses short-lived requests that work with
 *   HTTP/2 multiplexing and don't hold connections open. The feed stays visible
 *   unless its own snapshot polling fails; shared `/api/status` hiccups should not
 *   blank healthy camera frames.
 *   v2 UX: Three states — CONNECTING (initial load), RECONNECTING (had frame, temporary
 *   miss, last good frame still shown), OFFLINE (sustained failure threshold reached).
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
  const [hasEverHadFrame, setHasEverHadFrame] = useState(false);
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
        setHasEverHadFrame(true);
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

  // Three display states:
  // - CONNECTING: no frame yet, no error (initial load)
  // - RECONNECTING: had a frame before, temporary miss — keep showing last frame
  // - OFFLINE: sustained failure (feedError=true after 3 consecutive misses)
  // CONNECTING: initial load, no frame yet
  // RECONNECTING: had a frame, hit errors, but still have last good frame to show
  // OFFLINE: sustained failure and no frame (or never got one + failed)
  const isConnecting = !hasEverHadFrame && !feedError;
  const isReconnecting = hasEverHadFrame && feedError && frameUrl !== null;
  const showFeed = frameUrl !== null; // always show last good frame if we have one

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
      ) : isConnecting ? (
        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
          <div className="text-center px-4">
            <div className="w-6 h-6 border-2 border-blue-400/40 border-t-blue-400 rounded-full animate-spin mx-auto mb-2" />
            <div className="text-blue-400/70 text-sm mb-1">CONNECTING</div>
            <div className="text-guardian-muted text-[0.7rem]">{label}</div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
          <div className="text-center px-4">
            <div className="text-red-500/60 text-sm mb-1">OFFLINE</div>
            <div className="text-guardian-muted text-[0.7rem]">{label}</div>
          </div>
        </div>
      )}
      {/* Reconnecting overlay — shown over last good frame */}
      {isReconnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <div className="text-center">
            <div className="w-5 h-5 border-2 border-yellow-400/40 border-t-yellow-400 rounded-full animate-spin mx-auto mb-1" />
            <div className="text-yellow-400/80 text-xs">RECONNECTING</div>
          </div>
        </div>
      )}
      {/* Feed overlay */}
      <div className="absolute top-1.5 right-1.5 bg-black/70 rounded px-2 py-0.5 text-[0.65rem] flex items-center gap-1.5 font-mono">
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block ${showFeed && !feedError ? "bg-emerald-500 animate-pulse" : isConnecting ? "bg-blue-400 animate-pulse" : "bg-red-500"}`}
        />
        <span className="text-slate-300">{label}</span>
        {showFeed && !feedError && <span className="text-emerald-400">LIVE</span>}
        {isConnecting && <span className="text-blue-400">…</span>}
        {feedError && !showFeed && <span className="text-red-400">OFF</span>}
      </div>
    </div>
  );
}
