// Author: Claude Opus 4.6
// Date: 05-Apr-2026
// PURPOSE: Recent detection table. Shows time, camera, class, confidence,
//          predator flag. Predator rows highlighted. Mirrors Guardian dashboard
//          detection table styling.
// SRP/DRY check: Pass — pure render, data from parent.

import { Detection } from "./types";

function timeAgo(ts: string): string {
  const ms = new Date(ts).getTime();
  if (isNaN(ms)) return "—";
  const diff = (Date.now() - ms) / 1000;
  if (diff < 0) return "now";
  if (diff < 60) return `${Math.round(diff)}s`;
  if (diff < 3600) return `${Math.round(diff / 60)}m`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h`;
  return `${Math.round(diff / 86400)}d`;
}

function confColor(c: number): string {
  if (c >= 0.8) return "text-emerald-400";
  if (c >= 0.5) return "text-amber-400";
  return "text-red-400";
}

export default function GuardianDetections({
  detections,
}: {
  detections: Detection[];
}) {
  return (
    <div className="rounded border border-guardian-border bg-guardian-card overflow-hidden">
      <table className="w-full border-collapse font-mono">
        <thead style={{ background: "#0f172a" }}>
          <tr>
            <th className="text-left text-guardian-hover font-medium px-2 py-0.5 text-[0.7rem]">
              Time
            </th>
            <th className="text-left text-guardian-hover font-medium px-2 py-0.5 text-[0.7rem]">
              Camera
            </th>
            <th className="text-left text-guardian-hover font-medium px-2 py-0.5 text-[0.7rem]">
              Class
            </th>
            <th className="text-left text-guardian-hover font-medium px-2 py-0.5 text-[0.7rem]">
              Conf
            </th>
            <th className="text-left text-guardian-hover font-medium px-2 py-0.5 text-[0.7rem]">
              Predator
            </th>
          </tr>
        </thead>
        <tbody>
          {detections.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-2 py-2 text-center text-guardian-hover text-[0.7rem]"
              >
                No detections
              </td>
            </tr>
          ) : (
            detections.map((d, i) => (
              <tr
                key={`${d.timestamp}-${i}`}
                className={
                  d.is_predator ? "bg-red-500/5" : i % 2 === 0 ? "bg-guardian-bg/50" : ""
                }
              >
                <td className="px-2 py-0.5 text-[0.7rem] text-slate-400 whitespace-nowrap">
                  {timeAgo(d.timestamp)} ago
                </td>
                <td className="px-2 py-0.5 text-[0.7rem] text-slate-300">
                  {d.camera}
                </td>
                <td
                  className={`px-2 py-0.5 text-[0.7rem] font-semibold ${d.is_predator ? "text-red-400" : "text-slate-300"}`}
                >
                  {d.class}
                </td>
                <td
                  className={`px-2 py-0.5 text-[0.7rem] ${confColor(d.confidence)}`}
                >
                  {(d.confidence * 100).toFixed(0)}%
                </td>
                <td className="px-2 py-0.5 text-[0.7rem]">
                  {d.is_predator ? (
                    <span className="text-red-400 font-semibold">YES</span>
                  ) : (
                    <span className="text-guardian-muted">—</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
