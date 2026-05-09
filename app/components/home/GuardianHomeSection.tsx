"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 09-May-2026
 * PURPOSE: Homepage Guardian section — live status badge and full-width camera
 *   stage. System-internals panel (hardware specs, streaming mode, camera
 *   device list) removed in the OpenClaw redesign — that detail lives in the
 *   Guardian MDX page now. The pipeline story and topology are handled by
 *   dedicated components (ImagePipeline, FarmTopology), not this one.
 * SRP/DRY check: Pass — one job: render the homepage Guardian camera block.
 *   Roster + metadata come from `useGuardianRoster()`; display metadata
 *   fallback lives in `lib/cameras.ts`.
 */
import Link from "next/link";
import GuardianHomeBadge from "@/app/components/guardian/GuardianHomeBadge";
import GuardianCameraStage from "@/app/components/guardian/GuardianCameraStage";
import { DEFAULT_FEATURED } from "@/lib/cameras";
import { useGuardianRoster } from "@/lib/guardian-roster";

export default function GuardianHomeSection() {
  const { cameras } = useGuardianRoster();

  return (
    <section className="bg-guardian-bg text-guardian-text">
      <GuardianHomeBadge />

      <div className="max-w-6xl mx-auto px-3 py-3">
        <GuardianCameraStage
          cameras={cameras}
          defaultFeatured={DEFAULT_FEATURED}
          storageKey="farm2026.guardian.featured.home"
          online={null}
        />

        <div className="mt-1.5 rounded border border-guardian-border bg-guardian-card px-3 py-2 flex items-center justify-between text-[0.75rem]">
          <span className="text-guardian-muted font-mono">
            {cameras.length > 0
              ? `${cameras.length} cameras watching the flock`
              : "Connecting to cameras…"}
          </span>
          <Link
            href="/projects/guardian"
            className="text-blue-400 hover:text-blue-300 text-[0.7rem]"
          >
            Full Guardian dashboard →
          </Link>
        </div>
      </div>
    </section>
  );
}
