/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Section header primitive — title + subtitle, with an optional
 *   trailing link ("All X →"). De-duplicates four near-identical blocks
 *   previously inlined across the homepage sections.
 * SRP/DRY check: Pass — one responsibility (render a section header).
 *   See docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md (Phase 2).
 */
import Link from "next/link";

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  linkHref?: string;
  linkLabel?: string;
}

export default function SectionHeader({ title, subtitle, linkHref, linkLabel }: SectionHeaderProps) {
  const hasLink = Boolean(linkHref && linkLabel);

  return (
    <div className={hasLink ? "flex items-end justify-between mb-8" : "mb-8"}>
      <div>
        <h2 className="text-3xl font-bold font-serif">{title}</h2>
        <p className="text-forest/60 mt-2">{subtitle}</p>
      </div>
      {hasLink && (
        <Link href={linkHref!} className="text-wood hover:underline text-sm font-medium">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
