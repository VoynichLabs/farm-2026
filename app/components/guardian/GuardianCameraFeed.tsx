"use client";
// Author: Claude Opus 4.6
// Date: 06-Apr-2026
// PURPOSE: Reusable MJPEG camera feed with status overlay. Accepts cameraName
//          and label props to support multiple cameras. Periodically cache-busts
//          the stream URL to recover from dropped connections. Shows offline
//          fallback when Guardian or individual camera feed is down.
//          compact mode for secondary camera placement (shorter height).
// SRP/DRY check: Pass — single responsibility: camera feed display for any camera.

import { useEffect, useState } from "react";
import { GUARDIAN_API } from "./types";

export default function GuardianCameraFeed({
  cameraName,
  label,
  online,
  compact,
}: {
  cameraName: string;
  label: string;
  online: boolean | null;
  compact?: boolean;
}) {
  const [streamKey, setStreamKey] = useState(Date.now());
  const [feedError, setFeedError] = useState(false);

  // Heartbeat: reload stream every 30s to recover from dropped MJPEG connections
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamKey(Date.now());
      setFeedError(false); // retry on heartbeat
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Reset feed error when system comes back online
  useEffect(() => {
    if (online === true) setFeedError(false);
  }, [online]);

  const showFeed = online !== false && !feedError;

  return (
    <div
      className={`min-w-0 rounded border border-guardian-border overflow-hidden relative${compact ? "" : " flex-[63]"}`}
      style={{
        background: "#0a0f1e",
        minHeight: compact ? "160px" : undefined,
        maxHeight: compact ? "220px" : undefined,
      }}
    >
      {showFeed ? (
        <img
          key={streamKey}
          src={`${GUARDIAN_API}/api/cameras/${cameraName}/stream?t=${streamKey}`}
          alt={`Live farm camera — ${label}`}
          className="w-full h-full object-contain block"
          onError={() => setFeedError(true)}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${compact ? "min-h-[160px]" : "min-h-[300px]"}`}>
          <div className="text-center">
            <div className="text-red-500 text-2xl mb-2">●</div>
            <div className="text-guardian-muted text-[0.75rem]">
              FEED OFFLINE
            </div>
          </div>
        </div>
      )}
      {/* Feed overlay */}
      <div className="absolute top-1 right-1 bg-black/65 rounded px-1.5 py-0.5 text-[0.65rem] flex items-center gap-1 font-mono">
        {showFeed && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
        )}
        <span className="text-slate-300">{label}</span>
        {showFeed && <span className="text-emerald-400">LIVE</span>}
        {!showFeed && <span className="text-red-400">OFFLINE</span>}
      </div>
    </div>
  );
}
