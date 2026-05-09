/**
 * Author: Claude Opus 4.6
 * Date: 09-May-2026
 * PURPOSE: Pipeline visualization — the four-step image journey from camera
 *   to public. Cameras see the birds → Mac Mini judges the frames → Discord
 *   becomes the review table → the best moments reach the public. Uses
 *   Guardian dark palette to visually separate the "machine layer" from the
 *   farm-cream content sections above and below.
 * SRP/DRY check: Pass — single responsibility (render the pipeline story).
 *   No data fetching; purely presentational.
 */

const steps = [
  {
    label: "Cameras see the birds",
    detail:
      "Five cameras across the property pull frames around the clock — no video, just clean JPEGs every few seconds.",
    icon: "📷",
  },
  {
    label: "Mac Mini judges the frames",
    detail:
      "Bubba, the OpenClaw agent on the Mac Mini, runs vision-language models against every frame — scoring for composition, activity, and share-worthiness.",
    icon: "🧠",
  },
  {
    label: "Discord becomes the review table",
    detail:
      "The best gems land in the #farm-2026 channel. Boss reacts to the ones worth sharing — the single human-in-the-loop filter.",
    icon: "💬",
  },
  {
    label: "The best moments reach the public",
    detail:
      "Reacted gems post to Instagram and Facebook — stories, carousels, and reels, all from the same pipeline.",
    icon: "🌍",
  },
];

export default function ImagePipeline() {
  return (
    <section className="bg-guardian-bg text-guardian-text py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-serif font-bold text-slate-100 mb-2">
          🦞 The Image Pipeline
        </h2>
        <p className="text-guardian-muted text-sm mb-8 max-w-xl">
          How a frame from the yard becomes a gem on Instagram — every day, automatically.
        </p>

        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line (desktop only, not on last) */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-full w-4 border-t border-dashed border-guardian-border z-0" />
              )}
              <div className="rounded-lg border border-guardian-border bg-guardian-card p-4 h-full flex flex-col">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-2xl leading-none">{step.icon}</span>
                  <span className="text-[0.65rem] uppercase tracking-widest text-guardian-hover font-semibold font-mono">
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mb-1.5">
                  {step.label}
                </h3>
                <p className="text-xs text-guardian-muted leading-relaxed flex-1">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
