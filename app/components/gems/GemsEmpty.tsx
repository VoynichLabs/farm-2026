/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
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
    <div className="rounded-xl border border-forest/10 bg-cream/50 p-8 text-center">
      <p className="text-forest/70">{message}</p>
    </div>
  );
}
