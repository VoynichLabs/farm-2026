/*
 * Author: Claude Opus 4.7 (1M context)
 * Date: 2026-05-11
 * PURPOSE: Next.js configuration. Standalone output was previously enabled
 *   for theoretical deploy-size savings, but Railway is not a Docker-imaged
 *   deploy target — and `output: "standalone"` requires manually copying
 *   `public/` into `.next/standalone/public/` post-build, which was not
 *   surviving the Nixpacks build→deploy boundary. Symptom: every
 *   /photos/... URL 404'd in production (and every next/image request 400'd
 *   with "The requested resource isn't a valid image"), so /flock,
 *   FlockPreviewStrip, the hero photo, gem thumbs — everything that depends
 *   on public/ — rendered as broken placeholders. Switching to the default
 *   build output (and `next start`) lets Next.js serve public/ natively.
 * SRP/DRY check: Pass — config file with one purpose.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 65 is here for the homepage's Class of 2026 hero row. Those tiles render
    // ~194 CSS px wide, so on a DPR-3 phone they pull the 640w variant — six of
    // them, preloaded, before anything else on the page. At that display size
    // the step down from q75 is not visible, and it is the cheapest way to keep
    // the row light on a phone without giving up retina sharpness (dropping to
    // a 384w variant instead would be visible). Next 16 requires every quality
    // an <Image> asks for to be declared here; 75 stays for everything else.
    qualities: [65, 75],
  },
};

export default nextConfig;
