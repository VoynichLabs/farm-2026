"use client";
/**
 * Author: Claude Opus 5 (Bubba)
 * Date: 30-Jul-2026
 * PURPOSE: Sitewide top bar in the light "Field Guide" register
 *   (16-Jul-2026 daylight retheme, replaces TerminalNav.tsx). Keeps the
 *   terminal era's informational spine — identity strip with location,
 *   build version, live UTC clock; dense lowercase link row — but on
 *   paper instead of phosphor. Nav links carry their page-mark emoji
 *   from lib/emoji.ts (aria-hidden; text labels carry meaning).
 *
 *   /markets EXCEPTION: usePathname() switches the whole bar to a dark
 *   terminal variant on /markets so the green-CRT page keeps a coherent
 *   dark frame. The markets page body (Terminal.tsx) is self-contained
 *   and untouched by the retheme.
 *
 *   The clock is a client island so it ticks every second. SSR renders
 *   `──:──:──Z` until hydration so the HTML is stable for the cache;
 *   `suppressHydrationWarning` covers the SSR/client mismatch.
 *
 *   Outbound links (Boss's personal Instagram @markbarney121, plus
 *   markbarney.net) are grouped in one right-aligned span so the row
 *   keeps a single ml-auto break between site nav and off-site links.
 *
 *   Coordinates are approximate (Hampton, CT town center, not Boss's
 *   actual driveway). They render as a site identifier, not a geofence.
 *
 * SRP/DRY check: Pass — single component, no data fetching beyond the
 *   tick. Version pulled from package.json; emoji from lib/emoji.ts SSoT.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import pkg from "@/package.json";
import { PAGE_MARKS } from "@/lib/emoji";

const NAV_LINKS: { href: string; label: string; mark: string }[] = [
  { href: "/", label: "home", mark: PAGE_MARKS.home },
  { href: "/projects/guardian", label: "guardian", mark: PAGE_MARKS.guardian },
  { href: "/gallery/gems", label: "gallery", mark: PAGE_MARKS.gems },
  { href: "/yard", label: "yard", mark: PAGE_MARKS.yard },
  { href: "/flock", label: "flock", mark: PAGE_MARKS.flock },
  { href: "/markets", label: "markets", mark: PAGE_MARKS.markets },
  { href: "/field-notes", label: "notes", mark: PAGE_MARKS.notes },
  { href: "/projects", label: "projects", mark: PAGE_MARKS.projects },
];

const SITE_VERSION = `v${pkg.version}`;
const SITE_LOCATION = "HAMPTON, CT · 41.7558°N 71.9789°W";

function formatUtc(d: Date): string {
  const hh = d.getUTCHours().toString().padStart(2, "0");
  const mm = d.getUTCMinutes().toString().padStart(2, "0");
  const ss = d.getUTCSeconds().toString().padStart(2, "0");
  return `${hh}:${mm}:${ss}Z`;
}

export default function SiteNav() {
  const [now, setNow] = useState<Date | null>(null);
  const pathname = usePathname();
  // Dark terminal variant frames the green-CRT markets page; the light
  // field-guide chrome runs everywhere else.
  const dark = pathname?.startsWith("/markets") ?? false;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const shell = dark
    ? "sticky top-0 z-30 bg-guardian-bg text-guardian-text border-b border-guardian-border font-mono text-[0.72rem]"
    : "sticky top-0 z-30 bg-field-bg text-field-ink border-b border-field-border font-mono text-[0.72rem]";
  const wordmark = dark
    ? "text-emerald-400 hover:text-emerald-300 font-bold tracking-wider"
    : "font-serif text-[0.85rem] font-bold tracking-wide text-field-ink hover:text-field-accent";
  const meta = dark ? "text-guardian-muted" : "text-field-muted";
  const clock = dark ? "text-emerald-400 ml-auto tabular-nums" : "text-field-accent ml-auto tabular-nums";
  const navRow = dark ? "border-t border-guardian-border/60" : "border-t border-field-hairline";
  const link = dark
    ? "text-guardian-text/80 hover:text-emerald-300"
    : "text-field-ink/80 hover:text-field-accent-deep";
  const outLink = dark
    ? "text-guardian-muted hover:text-guardian-text"
    : "text-field-muted hover:text-field-ink";

  return (
    <header className={shell}>
      {/* Identity strip — wordmark / location / build / clock */}
      <div className="max-w-7xl mx-auto px-3 py-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap">
        <Link href="/" className={wordmark}>
          {dark ? "[FARM-2026]" : "Farm 2026 · Field Station"}
        </Link>
        <span className={`${meta} hidden sm:inline`}>{SITE_LOCATION}</span>
        <span className={meta}>{SITE_VERSION}</span>
        <span className={clock} suppressHydrationWarning>
          {now ? formatUtc(now) : "──:──:──Z"}
        </span>
      </div>

      {/* Nav strip — lowercase mono, dense; page marks lead each label */}
      <nav className={`max-w-7xl mx-auto px-3 py-1 flex items-center gap-x-3 gap-y-0.5 flex-wrap ${navRow}`}>
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={link}>
            {!dark && (
              <span aria-hidden="true" className="mr-1">
                {l.mark}
              </span>
            )}
            {l.label}
          </Link>
        ))}
        {/* Outbound pair, right-aligned as a unit — Boss's personal IG sits
            beside the personal site so the farm's own @pawel_and_pawleen
            links (footer / social CTA) stay unambiguous. */}
        <span className="ml-auto flex items-center gap-x-3">
          <a
            href="https://www.instagram.com/markbarney121/"
            target="_blank"
            rel="noopener noreferrer"
            className={outLink}
          >
            instagram @markbarney121 ↗
          </a>
          <a href="https://markbarney.net" rel="noopener" className={outLink}>
            markbarney.net ↗
          </a>
        </span>
      </nav>
    </header>
  );
}
