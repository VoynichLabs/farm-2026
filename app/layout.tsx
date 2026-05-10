/**
 * Author: Claude Opus 4.7 (1M context) (orig Claude Opus 4.6, 13-Apr-2026)
 * Date: 10-May-2026
 * PURPOSE: Root layout with navigation and metadata. Nav is sticky with a light
 *   cream background and pill-style links, matching the visual idiom of
 *   markbarney.net so the farm site reads as part of the same personal brand
 *   family. Internal links: Home, Guardian, Flock, Projects, Gallery, Field
 *   Notes. External link back to markbarney.net appended after a divider.
 *
 *   v1.16.0 (10-May-2026): SEO refresh. Title default rewritten to describe
 *   what the page actually IS for search engines and tabs ("Live chicken
 *   cameras in Hampton, CT") instead of internal-jargon ("OpenClaw on the
 *   Farm"). Open Graph and Twitter descriptions rewritten to match the new
 *   homepage (cameras + gems rail). OG image swapped from the April
 *   Birdadette-fresh-hatch portrait to a current chick portrait in the
 *   brooder under heat-lamp light. Image dimensions specified explicitly
 *   so social previews can render without a HEAD request.
 * SRP/DRY check: Pass — single layout, nav structure matches site architecture.
 */
import type { Metadata } from "next";
import "./globals.css";

const SITE_TITLE = "Farm 2026 — Live chicken cameras in Hampton, CT";
const SITE_DESCRIPTION =
  "Live multi-camera feed from a 13.6-acre chicken farm in Hampton, CT, with a continuously curated archive of moments the on-farm OpenClaw + AI pipeline picks out of the stream.";
// Open Graph image lives on GitHub raw, not on farm.markbarney.net. Railway's
// standalone build skips most of `public/photos/` (the 772 MB tree appears
// to exceed the build copy budget, so files added before the most recent
// few deploys 404) — but the auto-pipeline already relies on the raw URL
// for every IG / FB post, so it's the proven-stable surface for social.
// When that root cause gets fixed, switch this back to a "/photos/..." path
// so the host matches the rest of the metadata.
const OG_IMAGE = {
  url: "https://raw.githubusercontent.com/VoynichLabs/farm-2026/main/public/photos/og-2026-05.jpg",
  width: 1200,
  height: 900,
  alt: "A young chicken portrait under heat-lamp purple light in the brooder, with the USB camera and power adapter that watch the flock visible behind it.",
};

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Farm 2026",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐔</text></svg>",
  },
  metadataBase: new URL("https://farm.markbarney.net"),
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
    type: "website",
    siteName: "Farm 2026",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
};

import TerminalNav from "@/app/components/system/TerminalNav";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TerminalNav />
        {children}
      </body>
    </html>
  );
}
