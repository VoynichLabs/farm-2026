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
  title: "Mark's AI Farm Projects",
  description:
    "Farm 2026 — a hobby farm in Hampton, CT where Claude builds the technology and the birds run the show. Farm Guardian AI, heritage flock, and weekly field notes.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🐔</text></svg>",
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
