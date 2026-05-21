"use client";
/**
 * Author: Claude Opus 4.7 (Bubba)
 * Date: 21-May-2026 (v2 — polish pass per Boss: sharper images, cleaner
 *   layout, real tickers mixed in)
 * PURPOSE: Client island for /markets — "POULTRY CAPITAL MARKETS". Dense
 *   terminal: scrolling ticker tape (poultry + REAL tickers, flagged),
 *   live EDT/UTC clocks, jittering quotes, today's flock pick with real
 *   Tyson quote + receipts, candlestick tape, order book, flock sentiment,
 *   a REAL WATCHLIST (real last-close from stooq, baked at edit time),
 *   flock-vs-S&P benchmark, news wire, six chicken analysts, track record,
 *   and a live coop-floor strip. Maximalist on purpose (see page.tsx).
 *
 *   Real stock numbers are genuine last-close values baked into
 *   content/markets/picks.json; they are static (no runtime fetch) so the
 *   route stays self-contained and can't take the site down. They carry an
 *   "as of" date so nobody mistakes them for live.
 *
 *   Hydration safety: first render is deterministic (quotes from props,
 *   seeded LCG for candles/book, clocks as dashes). Motion starts after
 *   mount. Marquees are pure CSS.
 * SRP/DRY check: Pass — single presentational island; data via props.
 */
import { useEffect, useRef, useState } from "react";

export interface Quote { sym: string; px: number; chg: number; real?: boolean }
export interface IndexRow { name: string; value: string; chg: number }
export interface RealStock { sym: string; name: string; px: number; chg: number; date: string }
export interface Pick {
  date: string; ticker: string; company: string; play: string;
  conviction: number; rating: string; omen: string; frame: string;
  frameTime: string; model: string; source: string; birdReads: string[];
  mood: string; realQuote?: string;
}
export interface Analyst {
  name: string; title: string; img: string; rating: string;
  specialty: string; blurb: string;
}
export interface Position {
  sym: string; name: string; shares: number; fill: number; weight: number;
}
export interface Portfolio {
  account: string; asOf: string; thesis: string; source: string;
  positions: Position[];
}
export interface MarketData {
  terminalName: string; desk: string; disclaimer: string;
  tape: Quote[]; indices: IndexRow[]; picks: Pick[]; analysts: Analyst[];
  newswire: string[]; realStocks: RealStock[]; realAsOf: string;
  benchmark?: { flock: string; spy: string };
  portfolio?: Portfolio;
}

// deterministic pseudo-random so SSR === first client render
function lcg(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

const GREEN = "#22e06b";
const RED = "#ff4d4d";
const AMBER = "#f5b301";
const CYAN = "#38d6ff";

const chgColor = (n: number) => (n > 0 ? GREEN : n < 0 ? RED : "#94a3b8");
const arrow = (n: number) => (n > 0 ? "▲" : n < 0 ? "▼" : "▬");
const sign = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(2)}`;

function ratingColor(r: string): string {
  const u = r.toUpperCase();
  if (u.includes("STRONG BUY") || u.includes("SPECULATIVE BUY")) return GREEN;
  if (u.includes("BUY") || u.includes("ACCUMULATE")) return "#7ee8a4";
  if (u.includes("HOLD")) return AMBER;
  if (u.includes("REDUCE") || u.includes("AVOID") || u.includes("SELL")) return RED;
  return "#94a3b8";
}

function clk(d: Date, utc: boolean): string {
  const p = (n: number) => n.toString().padStart(2, "0");
  const h = utc ? d.getUTCHours() : d.getHours();
  const m = utc ? d.getUTCMinutes() : d.getMinutes();
  const s = utc ? d.getUTCSeconds() : d.getSeconds();
  return `${p(h)}:${p(m)}:${p(s)}${utc ? "Z" : ""}`;
}

const PANEL = "border border-[#1f3b2e] bg-[#06120c]";
const LABEL =
  "text-[10px] uppercase tracking-[0.22em] text-[#46a571] px-2 py-1.5 border-b border-[#1f3b2e] bg-[#0a1a11] flex items-center justify-between";

// CHICKEN PICKS — the real paper portfolio. Fills are baked into picks.json;
// last prices come live from /api/quotes (Yahoo proxy) and P&L is computed here.
function ChickenPicks({ pf }: { pf: Portfolio }) {
  const [live, setLive] = useState<Record<string, { price: number; prevClose: number }>>({});
  const [asOf, setAsOf] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await fetch("/api/quotes", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        if (j?.quotes && Object.keys(j.quotes).length) {
          setLive(j.quotes); setAsOf(j.asOf); setState("ok");
        } else setState("error");
      } catch { if (alive) setState("error"); }
    };
    load();
    const id = setInterval(load, 45000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const rows = pf.positions.map((p) => {
    const lq = live[p.sym]?.price ?? null;
    const cost = p.shares * p.fill;
    const mkt = lq != null ? p.shares * lq : null;
    const pnl = mkt != null ? mkt - cost : null;
    const pnlPct = pnl != null ? (pnl / cost) * 100 : null;
    return { ...p, lq, cost, mkt, pnl, pnlPct };
  });
  const haveLive = state === "ok";
  const totalCost = rows.reduce((a, r) => a + r.cost, 0);
  const totalMkt = rows.reduce((a, r) => a + (r.mkt ?? r.cost), 0);
  const totalPnl = totalMkt - totalCost;
  const totalPct = totalCost ? (totalPnl / totalCost) * 100 : 0;
  const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const asOfStr = asOf ? new Date(asOf).toLocaleTimeString("en-US", { hour12: false }) : "--:--:--";

  return (
    <section className={`lg:col-span-12 ${PANEL}`}>
      <div className={LABEL}>
        <span>◉ CHICKEN PICKS — LIVE PAPER PORTFOLIO · {pf.account}</span>
        <span className="flex items-center gap-1" style={{ color: haveLive ? GREEN : AMBER }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: haveLive ? GREEN : AMBER, animation: "ppm-blink 1.1s steps(1) infinite" }} />
          {state === "loading" ? "FETCHING" : haveLive ? `LIVE · ${asOfStr}` : "QUOTES OFFLINE"}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f3b2e]">
        <div className="bg-[#06120c] px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-[#46a571]">Cost Basis</div>
          <div className="text-[15px] font-bold text-[#e6fff0] tabular-nums">{usd(totalCost)}</div>
        </div>
        <div className="bg-[#06120c] px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-[#46a571]">Market Value</div>
          <div className="text-[15px] font-bold text-[#e6fff0] tabular-nums">{haveLive ? usd(totalMkt) : "—"}</div>
        </div>
        <div className="bg-[#06120c] px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-[#46a571]">Open P&amp;L</div>
          <div className="text-[15px] font-bold tabular-nums" style={{ color: haveLive ? chgColor(totalPnl) : "#94a3b8" }}>
            {haveLive ? `${totalPnl >= 0 ? "+" : ""}${usd(totalPnl)}` : "—"}
          </div>
        </div>
        <div className="bg-[#06120c] px-3 py-2">
          <div className="text-[9px] uppercase tracking-widest text-[#46a571]">Return</div>
          <div className="text-[15px] font-bold tabular-nums" style={{ color: haveLive ? chgColor(totalPnl) : "#94a3b8" }}>
            {haveLive ? `${arrow(totalPnl)} ${sign(totalPct)}%` : "—"}
          </div>
        </div>
      </div>

      <table className="w-full text-[11px] tabular-nums">
        <thead>
          <tr className="text-[9px] uppercase tracking-widest text-[#46a571] border-b border-[#1f3b2e]">
            <th className="text-left px-2 py-1">Sym</th>
            <th className="text-left px-2 py-1">Name</th>
            <th className="text-right px-2 py-1">Wt</th>
            <th className="text-right px-2 py-1">Shrs</th>
            <th className="text-right px-2 py-1">Fill</th>
            <th className="text-right px-2 py-1">Last</th>
            <th className="text-right px-2 py-1">Mkt Val</th>
            <th className="text-right px-2 py-1">P&amp;L</th>
            <th className="text-right px-2 py-1">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.sym} className="border-b border-[#10241a]">
              <td className="px-2 py-1 font-bold text-[#22e06b]">${r.sym}</td>
              <td className="px-2 py-1 text-[#9fc7b3] truncate max-w-[160px]">{r.name}</td>
              <td className="px-2 py-1 text-right text-[#6fae8c]">{r.weight}%</td>
              <td className="px-2 py-1 text-right text-[#9fc7b3]">{r.shares}</td>
              <td className="px-2 py-1 text-right text-[#9fc7b3]">{r.fill.toFixed(2)}</td>
              <td className="px-2 py-1 text-right text-[#e6fff0]">{r.lq != null ? r.lq.toFixed(2) : "—"}</td>
              <td className="px-2 py-1 text-right text-[#e6fff0]">{r.mkt != null ? usd(r.mkt) : "—"}</td>
              <td className="px-2 py-1 text-right" style={{ color: r.pnl != null ? chgColor(r.pnl) : "#94a3b8" }}>{r.pnl != null ? `${r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(0)}` : "—"}</td>
              <td className="px-2 py-1 text-right" style={{ color: r.pnlPct != null ? chgColor(r.pnlPct) : "#94a3b8" }}>{r.pnlPct != null ? `${arrow(r.pnlPct)} ${sign(r.pnlPct)}%` : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="px-3 py-2 border-t border-[#1f3b2e] text-[10px] text-[#6fae8c] leading-snug">
        <span className="text-[#46a571] uppercase tracking-widest">Thesis </span>{pf.thesis}
        <div className="mt-1 text-[#46a571]">{pf.source} · last prices via Yahoo Finance (auto-refresh 45s)</div>
      </div>
    </section>
  );
}

export default function Terminal({ data }: { data: MarketData }) {
  const [now, setNow] = useState<Date | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>(data.tape);
  const rng = useRef(lcg(424242));

  useEffect(() => {
    setNow(new Date());
    const clock = setInterval(() => setNow(new Date()), 1000);
    const ticker = setInterval(() => {
      setQuotes((qs) =>
        qs.map((q) => {
          const jitter = (rng.current() - 0.48) * Math.max(0.02, q.px * 0.003);
          return { ...q, px: Math.max(0.01, q.px + jitter), chg: q.chg + (rng.current() - 0.5) * 0.05 };
        }),
      );
    }, 1300);
    return () => { clearInterval(clock); clearInterval(ticker); };
  }, []);

  const today = data.picks[0];
  const history = data.picks;

  const candles = (() => {
    const r = lcg(1337);
    const out: { o: number; c: number; h: number; l: number }[] = [];
    let price = 50;
    for (let i = 0; i < 44; i++) {
      const o = price;
      const c = Math.max(5, o + (r() - 0.45) * 6);
      out.push({ o, c, h: Math.max(o, c) + r() * 3, l: Math.min(o, c) - r() * 3 });
      price = c;
    }
    return out;
  })();
  const cMax = Math.max(...candles.map((c) => c.h));
  const cMin = Math.min(...candles.map((c) => c.l));

  const book = (() => {
    const r = lcg(99);
    const mid = 66.5;
    const bids: { px: number; sz: number }[] = [];
    const asks: { px: number; sz: number }[] = [];
    for (let i = 0; i < 7; i++) {
      bids.push({ px: mid - (i + 1) * 0.04, sz: Math.floor(r() * 900) + 20 });
      asks.push({ px: mid + (i + 1) * 0.04, sz: Math.floor(r() * 900) + 20 });
    }
    return { bids, asks };
  })();

  return (
    <main className="min-h-screen bg-[#020805] text-[#cfeede] font-mono text-[13px] selection:bg-[#22e06b] selection:text-black">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.06]"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,#22e06b 0,#22e06b 1px,transparent 1px,transparent 3px)" }}
      />

      {/* ticker tape */}
      <div className="overflow-hidden border-y border-[#1f3b2e] bg-black whitespace-nowrap">
        <div className="inline-block py-1.5" style={{ animation: "ppm-marquee 46s linear infinite" }}>
          {[...quotes, ...quotes].map((q, i) => (
            <span key={i} className="mx-4 inline-flex items-center gap-1.5">
              <b style={{ color: q.real ? CYAN : "#e6fff0" }}>
                {q.sym}{q.real ? <sup className="text-[8px] text-[#38d6ff]"> R</sup> : null}
              </b>
              <span className="text-[#9fc7b3]">{q.px.toFixed(2)}</span>
              <span style={{ color: chgColor(q.chg) }}>{arrow(q.chg)} {sign(q.chg)}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* masthead */}
      <header className="border-b border-[#1f3b2e] px-3 py-2.5 flex flex-wrap items-end justify-between gap-2 bg-gradient-to-b from-[#0a1a11] to-transparent">
        <div>
          <h1 className="text-xl md:text-3xl font-bold tracking-[0.16em] text-[#22e06b]" style={{ textShadow: "0 0 14px rgba(34,224,107,0.5)" }}>
            🐔 {data.terminalName}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.32em] text-[#46a571]">{data.desk}</p>
        </div>
        <div className="text-right text-[11px] leading-tight">
          <div className="flex items-center justify-end gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22e06b]" style={{ animation: "ppm-blink 1.1s steps(1) infinite" }} />
            <span className="text-[#22e06b] tracking-widest">SESSION OPEN</span>
          </div>
          <div className="text-[#9fc7b3] tabular-nums">
            {now ? clk(now, false) : "--:--:--"} EDT &nbsp;·&nbsp; {now ? clk(now, true) : "--:--:--Z"}
          </div>
          <div className="text-[9px] text-[#46a571] uppercase tracking-wider">
            real quotes as of {data.realAsOf} · <span className="text-[#38d6ff]">ⓡ = real ticker</span>
          </div>
        </div>
      </header>

      {/* indices strip */}
      <div className="flex flex-wrap gap-px border-b border-[#1f3b2e] bg-[#0a1a11]">
        {data.indices.map((ix) => (
          <div key={ix.name} className="flex-1 min-w-[150px] px-3 py-1.5 bg-[#06120c]">
            <div className="text-[9px] uppercase tracking-widest text-[#46a571]">{ix.name}</div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold text-[#e6fff0] tabular-nums">{ix.value}</span>
              <span className="text-[11px]" style={{ color: chgColor(ix.chg) }}>{arrow(ix.chg)} {sign(ix.chg)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-2">
        {/* CHICKEN PICKS — live paper portfolio */}
        {data.portfolio ? <ChickenPicks pf={data.portfolio} /> : null}

        {/* PICK */}
        <section className={`lg:col-span-5 ${PANEL}`}>
          <div className={LABEL}>
            <span>◉ FLOCK PICK OF THE DAY — {today?.date}</span>
            <span className="text-[#f5b301]">PRIORITY</span>
          </div>
          <div className="p-3 grid grid-cols-[1fr_auto] gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-4xl font-black text-[#22e06b]" style={{ textShadow: "0 0 14px rgba(34,224,107,0.6)" }}>${today?.ticker}</span>
                <span className="px-2 py-0.5 text-[11px] font-bold border" style={{ color: ratingColor(today?.rating ?? ""), borderColor: ratingColor(today?.rating ?? "") }}>{today?.rating}</span>
              </div>
              <div className="text-[11px] text-[#9fc7b3] mb-2">{today?.company}</div>
              {today?.realQuote ? (
                <div className="text-[11px] mb-2"><span className="text-[#38d6ff]">ⓡ REAL:</span> <span className="text-[#cfeede]">{today.realQuote}</span></div>
              ) : null}
              <div className="text-[10px] uppercase tracking-widest text-[#46a571]">The Play</div>
              <div className="text-[#e6fff0] mb-2">{today?.play}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#46a571]">Conviction</div>
              <div className="relative h-4 w-full border border-[#1f3b2e] bg-black mb-1">
                <div className="absolute inset-y-0 left-0" style={{ width: `${today?.conviction ?? 0}%`, background: "linear-gradient(90deg,#0e7a3c,#22e06b)", boxShadow: "0 0 10px rgba(34,224,107,0.7)" }} />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white mix-blend-difference">{today?.conviction}% CONVICTION</span>
              </div>
            </div>
            {today?.frame ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={today.frame} alt={`Coop frame the ${today.ticker} pick was read from`} className="h-52 w-auto border border-[#1f3b2e] object-cover" />
            ) : null}
          </div>
          <div className="px-3 pb-3">
            <div className="text-[10px] uppercase tracking-widest text-[#46a571] mb-1">The Omen</div>
            <p className="text-[#cfeede] italic text-[12px] leading-snug mb-3">“{today?.omen}”</p>
            <div className="border border-[#1f3b2e] bg-black/40 p-2 text-[11px]">
              <div className="text-[9px] uppercase tracking-widest text-[#f5b301] mb-1">▸ Chain of Custody (real)</div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[#9fc7b3]">
                <span className="text-[#46a571]">FRAME</span><span>{today?.frameTime}</span>
                <span className="text-[#46a571]">SOURCE</span><span>{today?.source}</span>
                <span className="text-[#46a571]">MODEL</span><span>{today?.model}</span>
                <span className="text-[#46a571]">MOOD</span><span>{today?.mood}</span>
              </div>
              {today && today.birdReads.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5">
                  {today.birdReads.map((b, i) => (<li key={i} className="text-[#7ee8a4] before:content-['›_']">{b}</li>))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        {/* CANDLE + ORDER BOOK */}
        <section className="lg:col-span-4 grid grid-rows-[1fr_auto] gap-2">
          <div className={PANEL}>
            <div className={LABEL}><span>$/{today?.ticker} · COOP TAPE (44)</span><span style={{ color: GREEN }}>LIVE</span></div>
            <div className="p-2">
              <svg viewBox="0 0 320 156" className="w-full h-[156px]" preserveAspectRatio="none">
                {candles.map((c, i) => {
                  const x = 6 + i * 7.1;
                  const norm = (v: number) => 156 - ((v - cMin) / (cMax - cMin)) * 146 - 5;
                  const up = c.c >= c.o; const col = up ? GREEN : RED;
                  return (
                    <g key={i}>
                      <line x1={x} x2={x} y1={norm(c.h)} y2={norm(c.l)} stroke={col} strokeWidth={0.8} />
                      <rect x={x - 2.4} width={4.8} y={norm(Math.max(c.o, c.c))} height={Math.max(1, Math.abs(norm(c.o) - norm(c.c)))} fill={col} />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <div className={PANEL}>
            <div className={LABEL}><span>ORDER BOOK · ${today?.ticker}</span><span className="text-[#9fc7b3]">size = birds</span></div>
            <div className="grid grid-cols-2 text-[11px] tabular-nums">
              <div className="border-r border-[#1f3b2e]">
                {book.bids.map((b, i) => (
                  <div key={i} className="flex justify-between px-2 py-0.5 relative">
                    <span aria-hidden className="absolute inset-y-0 right-0" style={{ width: `${Math.min(100, b.sz / 9)}%`, background: "rgba(34,224,107,0.12)" }} />
                    <span style={{ color: GREEN }} className="relative">{b.px.toFixed(2)}</span>
                    <span className="relative text-[#9fc7b3]">{b.sz}</span>
                  </div>
                ))}
              </div>
              <div>
                {book.asks.map((a, i) => (
                  <div key={i} className="flex justify-between px-2 py-0.5 relative">
                    <span aria-hidden className="absolute inset-y-0 left-0" style={{ width: `${Math.min(100, a.sz / 9)}%`, background: "rgba(255,77,77,0.12)" }} />
                    <span className="relative text-[#9fc7b3]">{a.sz}</span>
                    <span style={{ color: RED }} className="relative">{a.px.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SENTIMENT + BENCHMARK */}
        <section className="lg:col-span-3 grid grid-rows-[auto_auto_1fr] gap-2">
          <div className={PANEL}>
            <div className={LABEL}><span>FLOCK FEAR / GREED</span></div>
            <div className="p-3 text-center">
              <div className="text-5xl font-black" style={{ color: GREEN, textShadow: "0 0 16px rgba(34,224,107,0.6)" }}>73</div>
              <div className="text-[11px] tracking-[0.3em] text-[#22e06b]">EXTREME GREED</div>
              <div className="mt-2 h-2 w-full bg-gradient-to-r from-[#ff4d4d] via-[#f5b301] to-[#22e06b] relative">
                <span className="absolute -top-1 h-4 w-0.5 bg-white" style={{ left: "73%" }} />
              </div>
            </div>
          </div>
          {data.benchmark ? (
            <div className={PANEL}>
              <div className={LABEL}><span>FLOCK vs BENCHMARK</span></div>
              <div className="p-2 text-[11px] space-y-1">
                <div className="flex justify-between"><span className="text-[#46a571]">FLOCK</span><span style={{ color: GREEN }}>{data.benchmark.flock}</span></div>
                <div className="flex justify-between gap-2"><span className="text-[#38d6ff]">ⓡ S&amp;P</span><span className="text-[#9fc7b3] text-right">{data.benchmark.spy}</span></div>
              </div>
            </div>
          ) : null}
          <div className={PANEL}>
            <div className={LABEL}><span>◂ COOP NEWS WIRE</span><span style={{ color: RED }} className="animate-pulse">●REC</span></div>
            <div className="p-2 h-[150px] overflow-hidden">
              <div style={{ animation: "ppm-scroll-up 24s linear infinite" }}>
                {[...data.newswire, ...data.newswire].map((n, i) => (
                  <p key={i} className="text-[11px] leading-snug mb-2 border-l-2 border-[#1f3b2e] pl-2 text-[#9fc7b3]"><span className="text-[#f5b301]">›</span> {n}</p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* REAL WATCHLIST */}
        <section className={`lg:col-span-4 ${PANEL}`}>
          <div className={LABEL}>
            <span className="text-[#38d6ff]">ⓡ REAL WATCHLIST — THE BENCHMARK</span>
            <span className="text-[#9fc7b3]">close {data.realAsOf}</span>
          </div>
          <table className="w-full text-[11px] tabular-nums">
            <tbody>
              {data.realStocks.map((s) => (
                <tr key={s.sym} className="border-b border-[#10241a]">
                  <td className="px-2 py-1 font-bold text-[#38d6ff]">{s.sym}</td>
                  <td className="px-2 py-1 text-[#9fc7b3] truncate max-w-[110px]">{s.name}</td>
                  <td className="px-2 py-1 text-right text-[#e6fff0]">{s.px.toFixed(2)}</td>
                  <td className="px-2 py-1 text-right" style={{ color: chgColor(s.chg) }}>{arrow(s.chg)} {sign(s.chg)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* TRACK RECORD */}
        <section className={`lg:col-span-4 ${PANEL}`}>
          <div className={LABEL}><span>◉ FLOCK TRACK RECORD</span><span className="text-[#9fc7b3]">audited by nobody</span></div>
          <table className="w-full text-[11px] tabular-nums">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-[#46a571] border-b border-[#1f3b2e]">
                <th className="text-left px-2 py-1">Date</th><th className="text-left px-2 py-1">Tkr</th>
                <th className="text-left px-2 py-1">Rating</th><th className="text-right px-2 py-1">Conv</th>
              </tr>
            </thead>
            <tbody>
              {history.map((p) => (
                <tr key={p.date} className="border-b border-[#10241a]">
                  <td className="px-2 py-1 text-[#9fc7b3]">{p.date}</td>
                  <td className="px-2 py-1 font-bold text-[#e6fff0]">${p.ticker}</td>
                  <td className="px-2 py-1" style={{ color: ratingColor(p.rating) }}>{p.rating}</td>
                  <td className="px-2 py-1 text-right" style={{ color: chgColor(p.conviction - 50) }}>{p.conviction}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* DISCLAIMER MINI (fills the row) */}
        <section className={`lg:col-span-4 ${PANEL} flex flex-col`}>
          <div className={LABEL}><span>⚠ RISK DISCLOSURE</span><span style={{ color: RED }}>READ</span></div>
          <div className="p-3 text-[11px] text-[#9fc7b3] leading-snug flex-1">
            <p className="mb-2">Picks are generated by <span className="text-[#22e06b]">live chickens</span> via computer vision (S7 coop cam → qwen3.5-9b VLM → ticker).</p>
            <p className="text-[#ff4d4d]">{data.disclaimer}</p>
          </div>
        </section>

        {/* ANALYSTS */}
        <section className={`lg:col-span-12 ${PANEL}`}>
          <div className={LABEL}><span>◉ THE ANALYST DESK — COVERAGE TEAM</span><span className="text-[#9fc7b3]">{data.analysts.length} active</span></div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-[#1f3b2e]">
            {data.analysts.map((a) => (
              <div key={a.name} className="bg-[#06120c] flex flex-col">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={a.name} className="h-36 w-full object-cover border-b border-[#1f3b2e]" />
                <div className="p-2 flex-1">
                  <div className="text-[11px] font-bold text-[#e6fff0] leading-tight">{a.name}</div>
                  <div className="text-[9px] text-[#46a571] leading-tight mb-1">{a.title}</div>
                  <div className="text-[10px] font-bold" style={{ color: ratingColor(a.rating) }}>{a.rating}</div>
                  <div className="text-[9px] text-[#9fc7b3] leading-tight mt-0.5">{a.specialty}</div>
                  <div className="text-[9px] text-[#6fae8c] italic leading-tight mt-0.5">“{a.blurb}”</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* LIVE FLOOR */}
        <section className={`lg:col-span-12 ${PANEL}`}>
          <div className={LABEL}>
            <span>◉ TRADING FLOOR — LIVE COOP CAM (S7)</span>
            <span style={{ color: GREEN }} className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22e06b]" style={{ animation: "ppm-blink 1.1s steps(1) infinite" }} /> ON AIR
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f3b2e]">
            {["/photos/markets/live-1.jpg", "/photos/markets/live-2.jpg", "/photos/markets/live-3.jpg", "/photos/markets/live-4.jpg"].map((src, i) => (
              <div key={src} className="relative bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Live coop floor ${i + 1}`} className="h-44 w-full object-cover opacity-90" />
                <span className="absolute top-1 left-1 text-[9px] bg-black/70 px-1 text-[#22e06b]">CAM-{i + 1}</span>
                <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 px-1 text-[#ff4d4d]">●LIVE</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <footer className="border-t border-[#1f3b2e] bg-black px-3 py-3 text-center">
        <p className="text-[10px] text-[#46a571] tracking-[0.3em] uppercase">
          Powered by chickens · S7 coop cam → qwen3.5-9b VLM → conviction · real quotes via stooq ({data.realAsOf}) · Hampton, CT
        </p>
      </footer>
    </main>
  );
}
