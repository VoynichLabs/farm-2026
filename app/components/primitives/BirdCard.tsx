/**
 * Author: Claude Opus 4.6
 * Date: 13-Apr-2026
 * PURPOSE: Bird tile — photo + name + breed + optional age badge on a fixed-
 *   height card that links to the flock roster (or a custom href). Used in
 *   the homepage flock preview strip and will be reused on /flock in Phase 6.
 * SRP/DRY check: Pass — one responsibility. See
 *   docs/13-Apr-2026-frontend-srp-dry-rewrite-plan.md (Phase 2).
 */
import Link from "next/link";
import Image from "next/image";

interface BirdCardProps {
  name: string;
  breed: string;
  photo: string;
  ageLabel?: string | null;
  href?: string;
}

export default function BirdCard({ name, breed, photo, ageLabel, href = "/flock" }: BirdCardProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative h-40 rounded-lg overflow-hidden bg-forest/10">
        <Image
          src={photo}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        {ageLabel && (
          <div className="absolute top-2 right-2">
            <span className="bg-amber-500/90 text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full">{ageLabel}</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white font-semibold text-sm leading-tight">{name}</p>
          <p className="text-white/70 text-xs">{breed}</p>
        </div>
      </div>
    </Link>
  );
}
