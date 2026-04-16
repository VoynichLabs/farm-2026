"use client";
/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 15-Apr-2026
 * PURPOSE: Reusable camera feed via snapshot polling. Fetches a single JPEG from
 *   Guardian's /api/cameras/{name}/frame endpoint every ~1s and swaps the img src.
 *   Replaced persistent MJPEG streaming because browsers limit concurrent HTTP/1.1
 *   connections per domain (~6), and 4 MJPEG streams + API polling through the
 *   Cloudflare tunnel exceeded that limit — causing feeds to starve and show only
 *   one camera at a time. Snapshot polling uses short-lived requests that work with
 *   HTTP/2 multiplexing and don't hold connections open. The feed stays visible
 *   unless its own snapshot polling fails; shared `/api/status` hiccups should not
 *   blank healthy camera frames. v1.4.2 added explicit connecting/reconnecting/
 *   offline states so first-load latency no longer looks like a dead camera.
 *   13-Apr-2026 tweak: the reconnecting state no longer blackouts the image with
 *   a centered modal — it shows a thin bottom strip so the last good frame stays
 *   visible. It also no longer flips on a single missed snapshot — a threshold
 *   of a few consecutive failures must pass before the strip appears, so normal
 *   one-off tunnel hiccups don't flicker the UI.
 *   15-Apr-2026: `FeedState` is now exported and the `onStatusChange` callback
 *   reports the full state string (not just a live boolean) so parent layouts
 *   can distinguish "connecting" (still trying — keep visible) from "offline"
 *   (give up — hide). See docs/15-Apr-2026-smart-camera-visibility-plan.md.
 * SRP/DRY check: Pass — single responsibility: camera feed display for any camera.
 */

import { useEffect, useState, useRef } from "react";
import { GUARDIAN_API } from "./types";

// How often to fetch a new snapshot (ms)
const POLL_INTERVAL = 1200;
// Misses before giving up on a not-yet-live camera and showing OFFLINE.
const RECONNECT_THRESHOLD = 3;
// Consecutive misses on a live feed before we show the "reconnecting" strip.
// One hiccup is normal; we don't want the overlay flickering on and off.
const RECONNECT_SHOW_THRESHOLD = 3;
// Misses before we give up on a live feed and go full OFFLINE.
const OFFLINE_THRESHOLD = 10;

export type FeedState = "connecting" | "live" | "reconnecting" | "offline";

export default function GuardianCameraFeed({
  cameraName,
  label,
  online,
  onStatusChange,
}: {
  cameraName: string;
  label: string;
  online: boolean | null;
  onStatusChange?: (cameraName: string, state: FeedState) => void;
}) {
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [feedState, setFeedState] = useState<FeedState>("connecting");
  const consecutiveErrors = useRef(0);
  const mountedRef = useRef(true);
  const hadFrameRef = useRef(false);

  // Poll for snapshots
  useEffect(() => {
    mountedRef.current = true;
    consecutiveErrors.current = 0;
    setFeedState("connecting");

    const fetchFrame = async () => {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(
          `${GUARDIAN_API}/api/cameras/${cameraName}/frame?t=${Date.now()}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (!mountedRef.current) return;

        setFrameUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        hadFrameRef.current = true;
        consecutiveErrors.current = 0;
        setFeedState("live");
      } catch {
        if (!mountedRef.current) return;
        consecutiveErrors.current++;

        if (!hadFrameRef.current) {
          setFeedState(
            consecutiveErrors.current >= RECONNECT_THRESHOLD
              ? "offline"
              : "connecting",
          );
          return;
        }

        // Stay on "live" through small hiccups so the UI doesn't flicker; only
        // surface "reconnecting" after several consecutive failures.
        setFeedState(
          consecutiveErrors.current >= OFFLINE_THRESHOLD
            ? "offline"
            : consecutiveErrors.current >= RECONNECT_SHOW_THRESHOLD
              ? "reconnecting"
              : "live",
        );
      }
    };

    fetchFrame();
    const interval = setInterval(fetchFrame, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      hadFrameRef.current = false;
      setFrameUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [cameraName]);

  useEffect(() => {
    if (online === true && feedState === "offline") {
      consecutiveErrors.current = 0;
      setFeedState(frameUrl ? "live" : "connecting");
    }
  }, [online, feedState, frameUrl]);

  const showFeed = frameUrl !== null && feedState !== "offline";
  const isConnecting = feedState === "connecting";
  const isReconnecting = feedState === "reconnecting";
  const isOffline = feedState === "offline";

  useEffect(() => {
    onStatusChange?.(cameraName, feedState);
  }, [feedState, cameraName, onStatusChange]);

  const indicatorClass =
    feedState === "live"
      ? "bg-emerald-500 animate-pulse"
      : feedState === "offline"
        ? "bg-red-500"
        : "bg-amber-400 animate-pulse";

  const overlayTextClass =
    feedState === "live"
      ? "text-emerald-400"
      : feedState === "offline"
        ? "text-red-400"
        : "text-amber-300";

  const overlayLabel =
    feedState === "live"
      ? "LIVE"
      : feedState === "offline"
        ? "OFFLINE"
        : isReconnecting
          ? "RECONNECTING"
          : "CONNECTING";

  return (
    <div
      className="min-w-0 w-full h-full rounded border border-guardian-border overflow-hidden relative"
      style={{ background: "#0a0f1e" }}
    >
      {showFeed ? (
        // Plain <img> is intentional: frameUrl is a blob: URL created from
        // createObjectURL every ~1.2s. next/image expects stable remote
        // sources it can optimize at the CDN; routing every snapshot through
        // its optimization pipeline would just add overhead for no gain.
        // eslint-disable-next-line @next/next/no-img-element -- blob: URL from snapshot polling, not CDN-optimizable
        <img
          src={frameUrl!}
          alt={`Live farm camera — ${label}`}
          className="w-full h-full object-contain block"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center min-h-[80px]">
          <div className="text-center px-4 flex flex-col items-center gap-2">
            {isConnecting && (
              <>
                <div className="w-6 h-6 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
                <div className="text-amber-300 text-sm">CONNECTING…</div>
              </>
            )}
            {isOffline && (
              <div className="text-red-500/70 text-sm">OFFLINE</div>
            )}
            <div className="text-guardian-muted text-[0.7rem]">{label}</div>
          </div>
        </div>
      )}

      {showFeed && isReconnecting && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-2 py-1 text-center pointer-events-none">
          <span className="text-amber-300 text-[0.65rem] font-mono tracking-wider">
            RECONNECTING · holding last good frame
          </span>
        </div>
      )}

      {/* Feed overlay */}
      <div className="absolute top-1.5 right-1.5 bg-black/70 rounded px-2 py-0.5 text-[0.65rem] flex items-center gap-1.5 font-mono">
        <span
          className={`w-1.5 h-1.5 rounded-full inline-block ${indicatorClass}`}
        />
        <span className="text-slate-300">{label}</span>
        <span className={overlayTextClass}>{overlayLabel}</span>
      </div>
    </div>
  );
}
