/**
 * Author: Claude Opus 4.7 (Bubba)
 * Date: 21-May-2026
 * PURPOSE: /markets route — "POULTRY CAPITAL MARKETS", a deliberately
 *   over-the-top Bloomberg/terminal-style page where the farm's chickens
 *   issue daily stock + options picks. The pick chain is REAL: the S7
 *   coop cam frame is pulled via Guardian's frame proxy, scored by the
 *   local VLM (qwen/qwen3.5-9b in LM Studio) which reports each bird's
 *   position, and those positions are mapped to a ticker. Receipts
 *   (frame, timestamp, model, bird reads) are shown on the page.
 *
 *   *** AESTHETIC IS INTENTIONAL AND ROUTE-SCOPED ***
 *   This page deliberately violates the "no SaaS template / no dense
 *   dashboard slop" rule in docs/FRONTEND-ARCHITECTURE.md. Boss explicitly
 *   asked for the densest, craziest financial-terminal layout possible for
 *   THIS page only (21-May-2026). Do not "fix" it to match the calm farm
 *   aesthetic — the maximalism is the point. It is not linked from
 *   TerminalNav on purpose (novelty surface, kept out of the kid-friendly
 *   nav); reach it by direct URL.
 *
 *   Self-contained by design: data is read from content/markets/picks.json
 *   at render time via fs (like /yard). NO Guardian-tunnel fetch in SSR,
 *   so this route can never ride the tunnel's latency or take the site
 *   down. All live motion happens client-side in <Terminal />.
 * SRP/DRY check: Pass — page only reads the JSON off disk and hands it to
 *   the client island. All presentation/animation lives in
 *   app/components/markets/Terminal.tsx.
 */
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import Terminal, { type MarketData } from "@/app/components/markets/Terminal";

export const metadata: Metadata = {
  title: "Poultry Capital Markets — Coop Terminal",
  description:
    "Daily stock and options picks issued by the flock. Read from the coop cam by computer vision. Not investment advice.",
};

// Re-read on every render so a freshly-committed pick shows up after deploy.
export const dynamic = "force-static";

function loadData(): MarketData {
  const file = path.join(process.cwd(), "content", "markets", "picks.json");
  return JSON.parse(fs.readFileSync(file, "utf8")) as MarketData;
}

export default function MarketsPage() {
  const data = loadData();
  return <Terminal data={data} />;
}
