// Author: Claude Opus 4.6
// Date: 05-Apr-2026
// PURPOSE: Info panels grid — active tracks, deterrent status + effectiveness,
//          today's summary (species counts, predator visits), eBird sightings.
//          Dense, compact card layout matching Guardian dashboard aesthetic.
// SRP/DRY check: Pass — pure render, data from parent.

import {
  ActiveTrack,
  DeterrentStatus,
  DeterrentEffectiveness,
  DailySummary,
  EBirdSighting,
} from "./types";

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded border border-guardian-border bg-guardian-card p-2">
      <div className="text-[0.6rem] uppercase tracking-wider text-guardian-hover font-semibold mb-1.5 font-mono">
        {title}
      </div>
      {children}
    </div>
  );
}

function TracksPanel({ tracks }: { tracks: ActiveTrack[] }) {
  return (
    <Card title="Active Tracks">
      {tracks.length === 0 ? (
        <div className="text-[0.7rem] text-guardian-muted font-mono">
          No active tracks
        </div>
      ) : (
        <div className="space-y-1">
          {tracks.map((t) => (
            <div
              key={t.track_id}
              className={`text-[0.7rem] font-mono flex items-center gap-2 ${t.is_predator ? "text-red-400" : "text-slate-300"}`}
            >
              <span className="font-semibold">{t.class_name}</span>
              <span className="text-guardian-muted">
                {t.duration_sec.toFixed(0)}s
              </span>
              <span className="text-guardian-muted">
                ×{t.detection_count}
              </span>
              <span className="text-guardian-muted">
                {(t.max_confidence * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function DeterrentPanel({
  status,
  effectiveness,
}: {
  status: DeterrentStatus | null;
  effectiveness: DeterrentEffectiveness | null;
}) {
  return (
    <Card title="Deterrent">
      <div className="text-[0.7rem] font-mono space-y-0.5">
        <div>
          <span className="text-guardian-muted">Status: </span>
          <span className="text-slate-300">
            {status
              ? status.enabled
                ? status.active_count > 0
                  ? `${status.active_count} active`
                  : "Armed"
                : "Disabled"
              : "—"}
          </span>
        </div>
        {effectiveness && (
          <>
            <div>
              <span className="text-guardian-muted">Success rate: </span>
              <span
                className={
                  effectiveness.success_rate >= 0.8
                    ? "text-emerald-400"
                    : "text-amber-400"
                }
              >
                {(effectiveness.success_rate * 100).toFixed(0)}%
              </span>
              <span className="text-guardian-muted">
                {" "}
                ({effectiveness.total_actions} actions)
              </span>
            </div>
            {Object.entries(effectiveness.by_type || {}).map(([type, data]) => (
              <div key={type} className="pl-2">
                <span className="text-guardian-muted">{type}: </span>
                <span className="text-slate-300">
                  {(data.success_rate * 100).toFixed(0)}%
                </span>
                <span className="text-guardian-muted">
                  {" "}
                  ({data.total_actions})
                </span>
              </div>
            ))}
          </>
        )}
      </div>
    </Card>
  );
}

function SummaryPanel({ summary }: { summary: DailySummary | null }) {
  if (!summary) {
    return (
      <Card title="Today">
        <div className="text-[0.7rem] text-guardian-muted font-mono">
          No report available
        </div>
      </Card>
    );
  }

  const { stats } = summary;
  const sortedSpecies = Object.entries(stats.species_counts).sort(
    (a, b) => b[1] - a[1]
  );
  const maxCount = sortedSpecies[0]?.[1] || 1;

  return (
    <Card title="Today">
      <div className="text-[0.7rem] font-mono space-y-1">
        <div className="flex gap-3">
          <div>
            <span className="text-guardian-muted">Det: </span>
            <span className="text-blue-400 font-semibold">
              {stats.total_detections}
            </span>
          </div>
          <div>
            <span className="text-guardian-muted">Pred: </span>
            <span className="text-red-400 font-semibold">
              {stats.predator_detections}
            </span>
          </div>
          <div>
            <span className="text-guardian-muted">Peak: </span>
            <span className="text-slate-300">{stats.peak_activity_hour}:00</span>
          </div>
        </div>
        {/* Species bar chart */}
        <div className="space-y-0.5 mt-1">
          {sortedSpecies.slice(0, 6).map(([species, count]) => (
            <div key={species} className="flex items-center gap-1.5">
              <span className="text-[0.6rem] text-guardian-muted w-14 truncate text-right">
                {species}
              </span>
              <div className="flex-1 h-2.5 bg-guardian-bg rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500/60 rounded"
                  style={{ width: `${(count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-[0.6rem] text-slate-400 w-6 text-right">
                {count}
              </span>
            </div>
          ))}
        </div>
        {/* Predator visits */}
        {summary.predator_visits.length > 0 && (
          <div className="border-t border-guardian-border pt-1 mt-1">
            <div className="text-[0.6rem] text-guardian-hover uppercase tracking-wider mb-0.5">
              Predator Visits
            </div>
            {summary.predator_visits.map((v, i) => (
              <div key={i} className="text-red-400/80">
                {v.time} — {v.species} ({v.duration_seconds}s) →{" "}
                <span
                  className={
                    v.outcome === "deterred"
                      ? "text-emerald-400"
                      : "text-guardian-muted"
                  }
                >
                  {v.outcome}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function EBirdPanel({ sightings }: { sightings: EBirdSighting[] }) {
  return (
    <Card title="eBird Raptors (15km)">
      {sightings.length === 0 ? (
        <div className="text-[0.7rem] text-guardian-muted font-mono">
          No recent sightings
        </div>
      ) : (
        <div className="space-y-0.5 font-mono">
          {sightings.slice(0, 5).map((s, i) => (
            <div key={i} className="text-[0.7rem]">
              <span className="text-amber-400">{s.species}</span>
              <span className="text-guardian-muted"> — {s.location}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function GuardianInfoPanels({
  activeTracks,
  deterrentStatus,
  effectiveness,
  summary,
  ebirdSightings,
}: {
  activeTracks: ActiveTrack[];
  deterrentStatus: DeterrentStatus | null;
  effectiveness: DeterrentEffectiveness | null;
  summary: DailySummary | null;
  ebirdSightings: EBirdSighting[];
}) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
      <TracksPanel tracks={activeTracks} />
      <DeterrentPanel status={deterrentStatus} effectiveness={effectiveness} />
      <SummaryPanel summary={summary} />
      <EBirdPanel sightings={ebirdSightings} />
    </div>
  );
}
