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
import Link from "next/link";
import "./globals.css";

const SITE_TITLE = "Farm 2026 — Live chicken cameras in Hampton, CT";
const SITE_DESCRIPTION =
  "Live multi-camera feed from a 13.6-acre chicken farm in Hampton, CT, with a continuously curated archive of moments the on-farm OpenClaw + AI pipeline picks out of the stream.";
const OG_IMAGE = {
  url: "/photos/og-2026-05.jpg",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="sticky top-0 z-30 bg-cream/85 backdrop-blur-md border-b border-forest/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <Link
              href="/"
              className="font-serif font-bold text-xl tracking-tight text-forest hover:text-wood transition-colors whitespace-nowrap"
            >
              Hampton Farm
            </Link>
            <div className="flex items-center gap-1 text-sm overflow-x-auto">
              <Link href="/" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
                Home
              </Link>
              <Link href="/projects/guardian" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
                Guardian
              </Link>
              <Link href="/flock" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
                Flock
              </Link>
              <Link href="/projects" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
                Projects
              </Link>
              <Link href="/gallery/gems" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
                Gallery
              </Link>
              <Link href="/field-notes" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
                Field Notes
              </Link>
              {/* Divider + external link back to the rest of the personal-brand network. */}
              <span className="mx-2 h-4 w-px bg-forest/20 shrink-0" aria-hidden="true" />
              <a
                href="https://markbarney.net"
                className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap"
                rel="noopener"
              >
                markbarney.net ↗
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
