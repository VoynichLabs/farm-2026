/**
 * Author: Claude Opus 4.7 (1M context) (orig Opus 4.6, 14-Apr-2026)
 * Date: 22-Apr-2026
 * PURPOSE: Homepage — thin composition of section components living under
 *   app/components/home/. Each section owns its own data fetching and layout;
 *   this file's only job is ordering.
 *   - 14-Apr-2026: LatestFlockFrames rail added between FlockPreviewStrip
 *     and ActiveProjects.
 *   - 22-Apr-2026: FarmPulse stats band inserted between Hero and
 *     GuardianHomeSection (living-homepage pass).
 *   - 23-Apr-2026: InstagramSection → SocialSection (dual IG+FB CTA;
 *     retired the curated-embed path that was never populated).
 * SRP/DRY check: Pass — composition only, no data fetch, no layout logic.
 *   See docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md,
 *   docs/14-Apr-2026-frontend-gems-implementation-plan.md, and
 *   docs/22-Apr-2026-living-homepage-hero-and-stats-plan.md.
 */
import Hero from "@/app/components/home/Hero";
import FarmPulse from "@/app/components/home/FarmPulse";
import GuardianHomeSection from "@/app/components/home/GuardianHomeSection";
import LatestFieldNote from "@/app/components/home/LatestFieldNote";
import FlockPreviewStrip from "@/app/components/home/FlockPreviewStrip";
import LatestFlockFrames from "@/app/components/home/LatestFlockFrames";
import ActiveProjects from "@/app/components/home/ActiveProjects";
import SocialSection from "@/app/components/home/SocialSection";
import SiteFooter from "@/app/components/home/SiteFooter";

export default function Home() {
  return (
    <main>
      <Hero />
      <FarmPulse />
      <GuardianHomeSection />
      <LatestFieldNote />
      <FlockPreviewStrip />
      <LatestFlockFrames />
      <ActiveProjects />
      <SocialSection />
      <SiteFooter />
    </main>
  );
}
