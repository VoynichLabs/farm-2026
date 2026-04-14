/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Site-wide footer — brand line, location, nav links, copyright year.
 *   Phase 4 of the frontend SRP/DRY rewrite stripped the owner name and the
 *   "every line built by Claude" tagline per the memory rules (no name in
 *   public files, no editorializing). Added a tiny "N gems in the last 7 days"
 *   widget (14-Apr-2026) as a discreet signal that the pipeline is alive.
 * SRP/DRY check: Pass — widget lives in its own component
 *   (GemsStatFooter); footer stays layout-only.
 */
import Link from "next/link";
import GemsStatFooter from "@/app/components/gems/GemsStatFooter";

export default function SiteFooter() {
  return (
    <footer className="bg-forest text-cream/50 py-10">
      <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
        <div>
          <p className="font-serif font-bold text-cream/80 text-base mb-1">Farm 2026</p>
          <p>Hampton, CT</p>
          <GemsStatFooter />
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-1 justify-center">
          <Link href="/projects/guardian" className="hover:text-cream/80">Guardian</Link>
          <Link href="/flock" className="hover:text-cream/80">Flock</Link>
          <Link href="/projects" className="hover:text-cream/80">Projects</Link>
          <Link href="/gallery" className="hover:text-cream/80">Gallery</Link>
          <Link href="/gallery/gems" className="hover:text-cream/80">Gems</Link>
          <Link href="/field-notes" className="hover:text-cream/80">Field Notes</Link>
        </nav>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </footer>
  );
}
