/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Error state for gems views — renders when the Cloudflare
 *   tunnel is down or Guardian returns 5xx. Per parent plan Part 4 F1,
 *   we surface "live feeds are still up" as a recovery hint toward the
 *   Guardian page so visitors have a non-broken path forward.
 * SRP/DRY check: Pass — single responsibility (error UI).
 */
import Link from "next/link";

interface Props {
  message?: string;
}

export default function GemsError({
  message = "The gems gallery is temporarily unavailable.",
}: Props) {
  return (
    <div className="rounded-xl border border-forest/20 bg-cream/70 p-8 text-center">
      <p className="text-forest/80">{message}</p>
      <p className="mt-2 text-sm text-forest/60">
        Live camera feeds are still available on the{" "}
        <Link href="/projects/guardian" className="text-wood hover:underline">
          Guardian page
        </Link>
        .
      </p>
    </div>
  );
}
