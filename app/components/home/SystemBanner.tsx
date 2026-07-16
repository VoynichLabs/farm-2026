/**
 * Author: Claude Fable 5 (prev Claude Opus 4.7 (1M context))
 * Date: 16-Jul-2026 (orig 10-May-2026; 16-Jul: camera count removed — the
 *   roster is live data from Guardian's /api/cameras, never a literal)
 * PURPOSE: Story strip at the top of the homepage — one short paragraph
 *   describing how the live grid below is produced. Boss asked
 *   (v1.16.3) for "more of the story about how it works, up in the
 *   top" in the new terminal aesthetic. This component renders a
 *   monospaced READOUT block with a small ASCII flow diagram, sitting
 *   directly above the camera grid so a visitor sees what the page is
 *   before the cameras finish connecting.
 *
 *   Pure content — no data fetching. Copy mirrors the auto-pipeline
 *   architecture documented in CLAUDE.md (gem lane + archive lane) and
 *   the canonical doc at farm-guardian/docs/HOW_IT_ALL_FITS.md, in
 *   plain English.
 *
 * SRP/DRY check: Pass — render-only, no imports beyond React.
 */

export default function SystemBanner() {
  return (
    <section className="border-b border-guardian-border font-mono text-[0.78rem] text-guardian-text/90 leading-relaxed">
      <div className="max-w-7xl mx-auto px-3 py-3">
        <div className="text-emerald-400 tracking-wider mb-1.5">
          ▸ FARM GUARDIAN :: HOW IT WORKS
        </div>
        <ul className="space-y-0.5 mb-3">
          <li>
            <span className="text-guardian-muted select-none">$ </span>
            <span className="text-emerald-300">Cameras</span>
            <span className="text-guardian-text/80">
              {" "}
              feed snapshots every <span className="text-amber-300">1.2s</span>{" "}
              through a Cloudflare tunnel to a Mac Mini under the keyboard.
            </span>
          </li>
          <li>
            <span className="text-guardian-muted select-none">$ </span>
            <span className="text-guardian-text/80">
              A <span className="text-emerald-300">YOLO + VLM pipeline</span>{" "}
              scores every frame. Strong-tier captures queue for human review
              on Discord; reacted gems auto-publish to Instagram and Facebook
              every 2&nbsp;hours.
            </span>
          </li>
          <li>
            <span className="text-guardian-muted select-none">$ </span>
            <span className="text-guardian-text/80">
              <span className="text-amber-300">Predator detections</span> fire
              a deterrent loop and surface in the dashboard&apos;s alert feed.
            </span>
          </li>
          <li>
            <span className="text-guardian-muted select-none">$ </span>
            <span className="text-guardian-text/80">
              This page mirrors the live grid and the most recent archived
              gems &mdash; no pre-recorded marketing footage.
            </span>
          </li>
        </ul>

        {/* ASCII data-flow — collapses to plain text in narrow viewports */}
        <pre className="hidden md:block text-[0.7rem] text-guardian-muted leading-tight overflow-x-auto">
{`  cameras ─▶ Mac Mini ─▶ YOLO + VLM ─▶ Discord queue ─▶ Instagram + Facebook
                              │
                              └─▶ archive  ──────────▶  /gallery/gems`}
        </pre>
      </div>
    </section>
  );
}
