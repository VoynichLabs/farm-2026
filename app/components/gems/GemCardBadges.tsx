/**
 * Author: Claude Opus 4.8 (orig Claude Opus 4.6 (1M context))
 * Date: 16-Jul-2026 (orig 14-Apr-2026)
 * PURPOSE: 16-Jul-2026 daylight retheme — non-compact pill tone moved off
 *   the deleted cream/forest tokens onto Field Guide card/border/ink
 *   tokens; the compact white-over-photo tone stays as-is.
 *   Metadata pills for a gem tile — camera (hardware label),
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
    : "border-field-border bg-field-card text-field-ink";

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
