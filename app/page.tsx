/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Homepage — thin composition of section components living under
 *   app/components/home/. Each section owns its own data fetching and layout;
 *   this file's only job is ordering. Replaces the prior 394-line monolith.
 * SRP/DRY check: Pass — composition only, no data fetch, no layout logic.
 *   See docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md (Phase 1).
 */
import Hero from "@/app/components/home/Hero";
import GuardianHomeSection from "@/app/components/home/GuardianHomeSection";
import LatestFieldNote from "@/app/components/home/LatestFieldNote";
import FlockPreviewStrip from "@/app/components/home/FlockPreviewStrip";
import ActiveProjects from "@/app/components/home/ActiveProjects";
import InstagramSection from "@/app/components/home/InstagramSection";
import SiteFooter from "@/app/components/home/SiteFooter";

export default function Home() {
  return (
    <main>
      <Hero />
      <GuardianHomeSection />
      <LatestFieldNote />
      <FlockPreviewStrip />
      <ActiveProjects />
      <InstagramSection />
      <SiteFooter />
    </main>
  );
}
