/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Metadata pills for a gem tile — camera (hardware label),
 *   activity, and an optional special-chick marker. Kept tiny and
 *   pure so both the default and compact GemCard variants compose it
 *   without duplicating the label mapping.
 * SRP/DRY check: Pass — formatters live in lib/gems-format.ts; this
 *   component only renders.
 */
import type { GemRow } from "@/app/components/guardian/types";
import { activityLabel, cameraLabel } from "@/lib/gems-format";

interface Props {
  row: GemRow;
  compact?: boolean;
}

export default function GemCardBadges({ row, compact = false }: Props) {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs";
  const tone = compact
    ? "border-white/20 bg-black/40 text-white backdrop-blur-sm"
    : "border-forest/15 bg-cream text-forest/80";

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={`${base} ${tone}`}>{cameraLabel(row.camera_id)}</span>
      {row.activity !== "none-visible" && row.activity !== "other" && (
        <span className={`${base} ${tone}`}>{activityLabel(row.activity)}</span>
      )}
      {row.any_special_chick && (
        <span className={`${base} ${tone}`}>special chick</span>
      )}
    </div>
  );
}
