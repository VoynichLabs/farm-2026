/**
 * Author: Claude Opus 4.8
 * Date: 22-Jul-2026
 * PURPOSE: BandChip — a compact leg-band chip (colored swatch + "color #N ·
 *   L/R") rendered from a bird's leg_band. The band is the canonical bird ID
 *   (near-identical birds like Henridotta ≈ Ingebird are told apart by it);
 *   left leg = hatched on the farm. Shared by /flock (cards) and
 *   /flock/[slug] (the per-bird aging gallery header).
 * SRP/DRY check: Pass — extracted from app/flock/page.tsx so both surfaces
 *   share one chip component + color map instead of duplicating it.
 */
import type { LegBand } from "@/lib/content";

// Leg-band color → a real swatch color. Inline style (not a Tailwind class) so
// the dynamic band color survives Tailwind's purge. White gets a near-white
// fill so it stays visible on the light card; unknown colors fall back grey.
const BAND_HEX: Record<string, string> = {
  yellow: "#eab308",
  orange: "#f97316",
  white: "#fafafa",
  red: "#dc2626",
  green: "#16a34a",
  pink: "#ec4899",
  purple: "#9333ea",
  blue: "#2563eb",
};

export default function BandChip({ band }: { band: LegBand }) {
  const hex = BAND_HEX[(band.color ?? "").toLowerCase()] ?? "#9ca3af";
  const num = band.number != null ? `#${band.number}` : "";
  const side = band.side ? band.side[0].toUpperCase() : "";
  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-widest bg-field-bg border border-field-border text-field-muted px-2 py-0.5 rounded"
      title={`${band.color} band ${num}${band.side ? ` · ${band.side} leg` : ""}`}
    >
      <span
        className="inline-block w-2.5 h-2.5 rounded-full border border-black/25"
        style={{ backgroundColor: hex }}
        aria-hidden="true"
      />
      {band.color} {num}
      {side ? ` · ${side}` : ""}
    </span>
  );
}
