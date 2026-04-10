/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: robots.txt — allow all crawlers, point to sitemap.
 * SRP/DRY check: Pass
 */
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://farm.markbarney.net/sitemap.xml",
  };
}
