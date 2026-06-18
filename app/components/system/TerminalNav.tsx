"use client";
/**
 * Author: Claude Opus 4.7 (1M context); Claude Opus 4.8 (1M context) (Bubba) (edit 18-June-2026 — added the /markets nav link per Boss, surfacing the Poultry Capital Markets page from direct-URL-only into the nav)
 * Date: 10-May-2026
 * PURPOSE: Sitewide top bar in a terminal / mission-control aesthetic.
 *   Replaces the cream pill-link nav (v1.16.0 and prior) per Boss's
 *   v1.16.3 ask: "professional scientific terminal or
 *   surveillance/monitoring something, rather than a vibe-coded piece of
 *   shit disaster." Two compact rows: identity strip (host, location,
 *   build, live UTC clock) and nav strip (lowercase mono links). Hairline
 *   borders, font-mono everywhere, no rounded corners.
 *
 *   The clock is a client island so it ticks every second. SSR renders
 *   `──:──:──Z` until hydration so the HTML is stable for the cache; the
 *   first useEffect tick replaces it with real time. `suppressHydrationWarning`
 *   is set so React doesn't yell about the SSR/client mismatch on the
 *   timestamp text.
 *
 *   Coordinates are approximate (Hampton, CT town center, not Boss's
 *   actual driveway). They render as a system identifier, not a
 *   geofence — keep them general.
 *
 * SRP/DRY check: Pass — single component, no data fetching beyond the
 *   tick. Version pulled from package.json so a release bump propagates
 *   to the bar without a string edit.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import pkg from "@/package.json";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/", label: "home" },
  { href: "/projects/guardian", label: "guardian" },
  { href: "/gallery/gems", label: "gallery" },
  { href: "/yard", label: "yard" },
  { href: "/flock", label: "flock" },
  { href: "/markets", label: "markets" },
  { href: "/field-notes", label: "notes" },
  { href: "/projects", label: "projects" },
];

const SITE_VERSION = `v${pkg.version}`;
const SITE_LOCATION = "HAMPTON, CT · 41.7558°N 71.9789°W";

function formatUtc(d: Date): string {
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}Z`;
}

export default function TerminalNav() {
  const [now, setNow] = useState<Date | null>(null);

  // First tick fires from the interval too — SSR renders `──:──:──Z`,
  // then ~1s after hydration the clock starts. Avoids React 19's
  // `set-state-in-effect` rule that fires when you setState directly
  // in the effect body.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-guardian-bg text-guardian-text border-b border-guardian-border font-mono text-[0.72rem]">
      {/* Identity strip — host / location / build / clock */}
      <div className="max-w-7xl mx-auto px-3 py-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 font-bold tracking-wider"
        >
          [FARM-2026]
        </Link>
        <span className="text-guardian-muted hidden sm:inline">{SITE_LOCATION}</span>
        <span className="text-guardian-muted">{SITE_VERSION}</span>
        <span
          className="text-emerald-400 ml-auto tabular-nums"
          suppressHydrationWarning
        >
          {now ? formatUtc(now) : "──:──:──Z"}
        </span>
      </div>

      {/* Nav strip — lowercase mono, dense */}
      <nav className="max-w-7xl mx-auto px-3 py-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap border-t border-guardian-border/60">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-guardian-text/80 hover:text-emerald-300"
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://markbarney.net"
          rel="noopener"
          className="text-guardian-muted hover:text-guardian-text ml-auto"
        >
          markbarney.net ↗
        </a>
      </nav>
    </header>
  );
}
