"use client";
/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; orig Claude Opus 4.6, 14-Apr-2026)
 * Date: 16-Jul-2026
 * PURPOSE: Filter chip bar for the gems gallery. All filter state lives
 *   in the URL query string, so filter combinations are deep-linkable,
 *   SSR-friendly, and survive reloads. Each chip click replaces the
 *   current route with a new search param set, which Next re-fetches
 *   server-side on navigation — no client-side filtering logic.
 *
 *   06-Jul-2026 (terminal glow-up, Boss-directed): Camera and Individual
 *   rows removed. The gem pipeline is fed by the S7 alone (other cameras
 *   make timelapse reels), so camera chips filtered a single-camera
 *   archive against the *live* roster and mostly returned nothing; the
 *   VLM's individual tags ("chick"/"adult") were too coarse to mean
 *   anything. Activity choices trimmed to the tags that actually occur
 *   in the curated archive (dust-bathing/sparring had 1–3 rows; huddling
 *   and drinking were missing). Deep links with camera=/individual=
 *   params still filter server-side — this bar just no longer offers
 *   them. Chips restyled to guardian tokens.
 *   16-Jul-2026 (daylight retheme): guardian chip styling → light Field
 *   Guide tokens (active = accent-soft/accent, inactive = card/muted).
 * SRP/DRY check: Pass — activity options come from the Activity type;
 *   no duplication.
 */
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { activityLabel } from "@/lib/gems-format";
import type { Activity } from "@/app/components/guardian/types";

const ACTIVITY_CHOICES: Activity[] = [
  "foraging",
  "alert",
  "sleeping",
  "huddling",
  "drinking",
  "eating",
  "preening",
];

type RangePreset = "day" | "week" | "month" | "all";
const RANGE_CHOICES: Array<{ value: RangePreset; label: string }> = [
  { value: "day", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function currentRange(params: URLSearchParams): RangePreset {
  const since = params.get("since");
  if (!since) return "week";
  const d = new Date(since).getTime();
  const now = Date.now();
  const days = (now - d) / (1000 * 60 * 60 * 24);
  if (days <= 1.2) return "day";
  if (days <= 7.2) return "week";
  if (days <= 30.5) return "month";
  return "all";
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-mono transition-colors ${
        active
          ? "border-field-accent-line bg-field-accent-soft text-field-accent"
          : "border-field-border bg-field-card text-field-muted hover:border-field-accent-line hover:text-field-ink"
      }`}
    >
      {label}
    </button>
  );
}

export default function GemFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = useMemo(
    () => ({
      cameras: searchParams.getAll("camera"),
      activities: searchParams.getAll("activity"),
      individuals: searchParams.getAll("individual"),
      range: currentRange(searchParams),
    }),
    [searchParams],
  );

  const push = (next: URLSearchParams) => {
    const qs = next.toString();
    router.replace(qs ? `/gallery/gems?${qs}` : "/gallery/gems", { scroll: false });
  };

  const toggleValue = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const values = next.getAll(key);
    next.delete(key);
    const newValues = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values, value];
    for (const v of newValues) next.append(key, v);
    push(next);
  };

  const setRange = (preset: RangePreset) => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("since");
    next.delete("until");
    if (preset === "day") next.set("since", daysAgoIso(1));
    else if (preset === "week") next.set("since", daysAgoIso(7));
    else if (preset === "month") next.set("since", daysAgoIso(30));
    push(next);
  };

  const clearAll = () => {
    router.replace("/gallery/gems", { scroll: false });
  };

  const anyActive =
    current.cameras.length > 0 ||
    current.activities.length > 0 ||
    current.individuals.length > 0 ||
    current.range !== "week";

  return (
    <div className="space-y-3 rounded-xl border border-field-border bg-field-wash p-4">
      <FilterRow label="Activity">
        {ACTIVITY_CHOICES.map((a) => (
          <Chip
            key={a}
            label={activityLabel(a)}
            active={current.activities.includes(a)}
            onClick={() => toggleValue("activity", a)}
          />
        ))}
      </FilterRow>

      <FilterRow label="Range">
        {RANGE_CHOICES.map((r) => (
          <Chip
            key={r.value}
            label={r.label}
            active={current.range === r.value}
            onClick={() => setRange(r.value)}
          />
        ))}
      </FilterRow>

      {anyActive && (
        <div className="pt-1">
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-field-accent hover:text-field-accent-deep hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-mono font-semibold uppercase tracking-wide text-field-muted">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}
