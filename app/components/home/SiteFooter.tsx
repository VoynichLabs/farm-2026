/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Site-wide footer — brand line, location, nav links, copyright year.
 *   Phase 4 of the frontend SRP/DRY rewrite stripped the owner name and the
 *   "every line built by Claude" tagline per the memory rules (no name in
 *   public files, no editorializing).
 * SRP/DRY check: Pass — single responsibility. See
 *   docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md.
 */
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-forest text-cream/50 py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div>
          <p className="font-serif font-bold text-cream/80 text-base mb-1">Farm 2026</p>
          <p>Hampton, CT</p>
        </div>
        <nav className="flex gap-6">
          <Link href="/projects/guardian" className="hover:text-cream/80">Guardian</Link>
          <Link href="/flock" className="hover:text-cream/80">Flock</Link>
          <Link href="/projects" className="hover:text-cream/80">Projects</Link>
          <Link href="/gallery" className="hover:text-cream/80">Gallery</Link>
          <Link href="/field-notes" className="hover:text-cream/80">Field Notes</Link>
        </nav>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
