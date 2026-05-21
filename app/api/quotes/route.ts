/**
 * Author: Claude Opus 4.7 (Bubba)
 * Date: 21-May-2026
 * PURPOSE: Live-quote proxy for the /markets "Chicken Picks" portfolio panel.
 *   Fetches last price + previous close for the 5 portfolio symbols from
 *   Yahoo Finance server-side (no API key, no CORS headache for the browser),
 *   and returns a compact { quotes: { SYM: {price, prevClose} }, asOf } blob.
 *
 *   Server-side on purpose: the browser can't hit Yahoo directly (CORS), and
 *   doing it here keeps the upstream call off the static /markets render path.
 *   `revalidate = 60` caches the response for 60s so a page full of clients
 *   polling every 45s can't hammer Yahoo. Independent of the Guardian tunnel.
 *
 * SRP/DRY check: Pass — one job (proxy + normalize 5 quotes). Symbol list is
 *   the single source for which names this endpoint serves.
 */
export const revalidate = 60;

const SYMBOLS = ["TSN", "PPC", "ADM", "MOO", "CORN"];

type Quote = { price: number; prevClose: number };

async function fetchOne(sym: string): Promise<[string, Quote] | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    if (typeof price !== "number") return null;
    const prevClose =
      meta?.chartPreviousClose ?? meta?.previousClose ?? price;
    return [sym, { price, prevClose }];
  } catch {
    return null;
  }
}

export async function GET() {
  const settled = await Promise.all(SYMBOLS.map(fetchOne));
  const quotes: Record<string, Quote> = {};
  for (const r of settled) if (r) quotes[r[0]] = r[1];
  return Response.json({ quotes, asOf: new Date().toISOString() });
}
