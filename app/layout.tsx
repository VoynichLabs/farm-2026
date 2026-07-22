/**
 * Author: Claude Opus 4.8 (prev Claude Fable 5; Claude Opus 4.7 (1M context); orig Claude Opus 4.6, 13-Apr-2026)
 * Date: 16-Jul-2026
 * PURPOSE: Root layout with navigation and metadata. Renders SiteNav (light
 *   "Field Guide" chrome sitewide; dark terminal variant on /markets only —
 *   16-Jul-2026 daylight retheme) above every page.
 *
 *   v1.16.0 (10-May-2026): SEO refresh. Title default rewritten to describe
 *   what the page actually IS for search engines and tabs ("Live chicken
 *   cameras in Hampton, CT") instead of internal-jargon ("OpenClaw on the
 *   Farm"). Image dimensions specified explicitly so social previews can
 *   render without a HEAD request.
 *   v1.29.0 (16-Jul-2026): OG image swapped from the May brooder chick
 *   portrait to a July Birdcatraz water-bowl frame — the flock is grown
 *   and outdoors now, and social previews should say so.
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
  url: "https://raw.githubusercontent.com/VoynichLabs/farm-2026/main/public/photos/carousel/2026-07-14/2026-07-14-gem1428094.jpg",
  width: 1080,
  height: 1920,
  alt: "A grown white pullet with black-flecked hackles standing at the big water bowl inside Birdcatraz, the outdoor fenced compound, with the rest of the flock foraging behind her.",
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

import SiteNav from "@/app/components/system/SiteNav";

// JSON-LD structured data — the machine-readable identity an HTML-only crawler
// or LLM reads even if it never fetches /llms.txt. Stable, public facts only:
// name, location, the site URL, and sameAs → the real IG/FB from the footer.
// No volatile counts (would drift, and the site renders no flock headcount by
// rule). Deliberately Person + WebSite, NOT LocalBusiness/Organization — this
// is a hobby farm with pet chickens, and a commercial schema type would
// misrepresent it. Kept in sync with the prose brief in lib/llms.ts.
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://farm.markbarney.net/#mark",
      name: "Mark Barney",
      url: "https://farm.markbarney.net",
      description:
        "Owner of a ~13.6-acre hobby farm in Hampton, Connecticut, where the chickens and turkeys are kept as named pets rather than livestock. Built Farm Guardian, a self-made AI camera and monitoring system that watches the flock, curates the best moments, and helps deter hawks.",
      homeLocation: {
        "@type": "Place",
        name: "Hampton, Connecticut, USA",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Hampton",
          addressRegion: "CT",
          addressCountry: "US",
        },
      },
      sameAs: [
        "https://www.instagram.com/pawel_and_pawleen/",
        "https://www.facebook.com/profile.php?id=61557234706008",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://farm.markbarney.net/#website",
      url: "https://farm.markbarney.net",
      name: "Farm 2026",
      description: SITE_DESCRIPTION,
      inLanguage: "en-US",
      author: { "@id": "https://farm.markbarney.net/#mark" },
      about: { "@id": "https://farm.markbarney.net/#mark" },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
