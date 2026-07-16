/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; orig Claude Opus 4.6)
 * Date: 16-Jul-2026 (orig 14-Apr-2026)
 * PURPOSE: 16-Jul-2026 daylight retheme — recolored from guardian tokens
 *   to the light Field Guide wash/border/muted tokens.
 *   Empty state for gems views — "no gems match these filters
 *   yet." Kept as its own component so the gallery + rail + retrospective
 *   can share identical copy / tone.
 * SRP/DRY check: Pass — single responsibility (empty state).
 */

interface Props {
  message?: string;
}

export default function GemsEmpty({
  message = "No gems match these filters yet. Try broadening your filters — the pipeline adds new images every few minutes.",
}: Props) {
  return (
    <div className="rounded-xl border border-field-border bg-field-wash p-8 text-center">
      <p className="text-field-muted">{message}</p>
    </div>
  );
}
