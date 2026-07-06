/**
 * Author: Claude Fable 5 (orig Claude Opus 4.6)
 * Date: 06-Jul-2026 (orig 14-Apr-2026) — guardian palette (terminal glow-up)
 * PURPOSE: Empty state for gems views — "no gems match these filters
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
    <div className="rounded-xl border border-guardian-border bg-guardian-card/50 p-8 text-center">
      <p className="text-guardian-text/70">{message}</p>
    </div>
  );
}
