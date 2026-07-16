/**
 * Author: Claude Fable 5
 * Date: 16-Jul-2026
 * PURPOSE: Shared metadata layout for /gallery routes. 16-Jul: description
 *   updated for the Birdcatraz era (grown flock, no more "chicks").
 * SRP/DRY check: Pass — metadata-only passthrough layout.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos from the farm — the flock, hawks, Birdcatraz, and years of Hampton CT homesteading.",
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
