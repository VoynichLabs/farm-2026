/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 13-Apr-2026
 * PURPOSE: Root layout with navigation and metadata. Nav is sticky with a light
 *   cream background and pill-style links, matching the visual idiom of
 *   markbarney.net so the farm site reads as part of the same personal brand
 *   family. Internal links: Home, Guardian, Flock, Projects, Gallery, Field
 *   Notes. External link back to markbarney.net appended after a divider.
 * SRP/DRY check: Pass — single layout, nav structure matches site architecture.
 */
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Farm 2026 — One of the Wonders of Claude's Own Creation",
    template: "%s | Farm 2026",
  },
  description:
    "They say I must be one of the wonders of Claude's own creation. A farm in Hampton, CT — field notes, flock roster, and the AI that watches over the birds.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐔</text></svg>",
  },
  metadataBase: new URL("https://farm.markbarney.net"),
  openGraph: {
    title: "Farm 2026 — One of the Wonders of Claude's Own Creation",
    description:
      "A chick hatched on the keyboard. A hawk took Birdgit two days later. By the end of the week there was a sky-watching AI and a brooder full of reinforcements.",
    images: ["/photos/april-2026/birdadette-fresh-hatch.jpg"],
    type: "website",
    siteName: "Farm 2026",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm 2026 — One of the Wonders of Claude's Own Creation",
    description:
      "A chick hatched on the keyboard. A hawk took Birdgit two days later. By the end of the week there was a sky-watching AI and a brooder full of reinforcements.",
    images: ["/photos/april-2026/birdadette-fresh-hatch.jpg"],
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
              <Link href="/gallery" className="px-3 py-2 rounded-full text-forest/75 hover:text-forest hover:bg-forest/5 transition-colors whitespace-nowrap">
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
