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

const nextConfig: NextConfig = {};

export default nextConfig;
