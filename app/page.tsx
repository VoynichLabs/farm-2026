/**
 * Author: Claude Opus 4.6
 * Date: 09-May-2026
 * PURPOSE: Homepage — thin composition of section components living under
 *   app/components/home/. Each section owns its own data fetching and layout;
 *   this file's only job is ordering.
 *   - 09-May-2026: OpenClaw redesign — FarmPulse removed (stats inaccurate),
 *     ImagePipeline and FarmTopology added. Section order reworked so the
 *     pipeline story flows naturally after the live camera feeds.
 * SRP/DRY check: Pass — composition only, no data fetch, no layout logic.
 */
import Hero from "@/app/components/home/Hero";
import GuardianHomeSection from "@/app/components/home/GuardianHomeSection";
import ImagePipeline from "@/app/components/home/ImagePipeline";
import LatestFieldNote from "@/app/components/home/LatestFieldNote";
import FlockPreviewStrip from "@/app/components/home/FlockPreviewStrip";
import LatestFlockFrames from "@/app/components/home/LatestFlockFrames";
import FarmTopology from "@/app/components/home/FarmTopology";
import ActiveProjects from "@/app/components/home/ActiveProjects";
import SocialSection from "@/app/components/home/SocialSection";
import SiteFooter from "@/app/components/home/SiteFooter";

export default function Home() {
  return (
    <main>
      <Hero />
      <GuardianHomeSection />
      <ImagePipeline />
      <LatestFieldNote />
      <FlockPreviewStrip />
      <LatestFlockFrames />
      <FarmTopology />
      <ActiveProjects />
      <SocialSection />
      <SiteFooter />
    </main>
  );
}
