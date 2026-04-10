"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Reusable MJPEG camera feed with status overlay. Shows live stream
 *   when connected, clean offline state when down. Heartbeat retries every 30s.
 *   Reports its online/offline state via onStatusChange callback so parent
 *   can adapt layout.
 * SRP/DRY check: Pass — single responsibility: camera feed display for any camera.
 */

import { useEffect, useState, useCallback } from "react";
import { GUARDIAN_API } from "./types";

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
  const [streamKey, setStreamKey] = useState(0);
  const [feedError, setFeedError] = useState(false);

  // Set initial stream key on mount (avoids hydration mismatch from Date.now in useState)
  // then heartbeat every 30s to recover dropped MJPEG connections
  useEffect(() => {
    setStreamKey(Date.now());
    const interval = setInterval(() => {
      setStreamKey(Date.now());
      setFeedError(false);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset feed error when system comes back online
  useEffect(() => {
    if (online === true) setFeedError(false);
  }, [online]);

  const showFeed = online !== false && !feedError;

  // Report status to parent
  useEffect(() => {
    onStatusChange?.(cameraName, showFeed);
  }, [showFeed, cameraName, onStatusChange]);

  const handleError = useCallback(() => {
    setFeedError(true);
  }, []);

  return (
    <div
      className="min-w-0 w-full h-full rounded border border-guardian-border overflow-hidden relative"
      style={{ background: "#0a0f1e" }}
    >
      {showFeed ? (
        <img
          key={streamKey}
          src={`${GUARDIAN_API}/api/cameras/${cameraName}/stream?t=${streamKey}`}
          alt={`Live farm camera — ${label}`}
          className="w-full h-full object-contain block"
          onError={handleError}
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
        <span className={`w-1.5 h-1.5 rounded-full inline-block ${showFeed ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
        <span className="text-slate-300">{label}</span>
        {showFeed && <span className="text-emerald-400">LIVE</span>}
        {!showFeed && <span className="text-red-400">OFF</span>}
      </div>
    </div>
  );
}
