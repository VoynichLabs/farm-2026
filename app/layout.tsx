/**
 * Author: Claude Sonnet 5 (prev Claude Opus 4.8; Claude Fable 5; Claude Opus 4.7 (1M context); orig Claude Opus 4.6, 13-Apr-2026)
 * Date: 01-Aug-2026 (orig 13-Apr-2026; updated 10-May / 16-Jul / 01-Aug-2026)
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
 *   v1.35.4 (01-Aug-2026): Title/description rewrite. "Farm 2026 — Live
 *   chicken cameras in Hampton, CT" read as a surveillance-tech demo, which
 *   is the wrong first impression for the link-preview card this site's
 *   URL is about to start getting shared as (Boss's personal intro site,
 *   not just a camera showcase). Retitled around "Mark's Farm" — Boss's
 *   own name is already public in the Person JSON-LD below (`name: "Mark
 *   Barney"`) and in lib/llms.ts, so this isn't a new exposure, just
 *   extending it to the title tag and OG/Twitter card that actually render
 *   as the link preview. Description reframes live cameras as a charming
 *   detail instead of the entire pitch. `title.template` and
 *   `openGraph.siteName` follow suit so subpage tabs stay consistent with
 *   the root title instead of reverting to the old brand string. OG image
 *   also swapped: the old water-bowl gem was a pipeline detection frame,
 *   not a chosen photo. New image is a Boss-supplied elevated overlook shot
 *   (originally portrait, no EXIF orientation tag, corrected + cropped to
 *   landscape — see public/photos/august-2026/) showing the coop, garden,
 *   sunflowers, and turkeys in one frame — an actual establishing shot
 *   instead of a random moment.
 * SRP/DRY check: Pass — single layout, nav structure matches site architecture.
 */
import type { Metadata } from "next";
import "./globals.css";

const SITE_TITLE = "Mark's Farm — Hampton, Connecticut";
const SITE_DESCRIPTION =
  "A small farm in Hampton, Connecticut — chickens, turkeys, a garden, and live cameras on the flock, because why not.";
// Open Graph image lives on GitHub raw, not on farm.markbarney.net. Railway's
// standalone build skips most of `public/photos/` (the 772 MB tree appears
// to exceed the build copy budget, so files added before the most recent
// few deploys 404) — but the auto-pipeline already relies on the raw URL
// for every IG / FB post, so it's the proven-stable surface for social.
// When that root cause gets fixed, switch this back to a "/photos/..." path
// so the host matches the rest of the metadata.
const OG_IMAGE = {
  url: "https://raw.githubusercontent.com/VoynichLabs/farm-2026/main/public/photos/august-2026/homestead-overlook-IMG_8035.jpg",
  width: 1600,
  height: 832,
  alt: "An elevated view of the homestead: a pink-roofed coop and run, a garden bed lined with sunflowers, and three white turkeys grazing on the lawn, all framed by mature trees.",
};

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Mark's Farm",
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
    siteName: "Mark's Farm",
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
        "https://markbarney.net",
        "https://www.instagram.com/pawel_and_pawleen/",
        "https://www.facebook.com/profile.php?id=61557234706008",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://farm.markbarney.net/#website",
      url: "https://farm.markbarney.net",
      name: "Mark's Farm",
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
