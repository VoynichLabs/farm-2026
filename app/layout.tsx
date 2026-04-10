/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Root layout with navigation and metadata. Nav links: Home, Guardian,
 *   Flock, Projects, Gallery, Field Notes. Diary replaced by Field Notes.
 * SRP/DRY check: Pass — single layout, nav structure matches site architecture.
 */
import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Farm 2026 — AI-Powered Backyard Farm",
    template: "%s | Farm 2026",
  },
  description:
    "A hobby farm in Hampton, CT where Claude builds the technology and the birds run the show. Three cameras, local AI, and one farmer protecting his flock.",
  metadataBase: new URL("https://farm.markbarney.net"),
  openGraph: {
    title: "Farm 2026 — AI-Powered Backyard Farm",
    description:
      "Three cameras, local AI on a Mac Mini, and one farmer protecting his flock. Built entirely by Claude.",
    images: ["/photos/april-2026/birdadette-fresh-hatch.jpg"],
    type: "website",
    siteName: "Farm 2026",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Farm 2026 — AI-Powered Backyard Farm",
    description:
      "Three cameras, local AI on a Mac Mini, and one farmer protecting his flock. Built entirely by Claude.",
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
        <nav className="bg-forest text-cream shadow-md">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="font-bold text-lg hover:text-cream/80 font-serif">
              Farm 2026
            </Link>
            <div className="flex gap-6 text-sm">
              <Link href="/" className="hover:text-cream/80">
                Home
              </Link>
              <Link href="/projects/guardian" className="hover:text-cream/80">
                Guardian
              </Link>
              <Link href="/flock" className="hover:text-cream/80">
                Flock
              </Link>
              <Link href="/projects" className="hover:text-cream/80">
                Projects
              </Link>
              <Link href="/gallery" className="hover:text-cream/80">
                Gallery
              </Link>
              <Link href="/field-notes" className="hover:text-cream/80">
                Field Notes
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
