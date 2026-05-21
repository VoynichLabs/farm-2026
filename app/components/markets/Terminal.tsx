"use client";
/**
 * Author: Claude Opus 4.7 (Bubba)
 * Date: 21-May-2026
 * PURPOSE: Client island for /markets — "POULTRY CAPITAL MARKETS". Renders
 *   the dense terminal: scrolling ticker tape, live EDT/UTC clocks,
 *   jittering quotes, today's flock pick with conviction gauge + receipts,
 *   a candlestick tape, an order book, flock sentiment dial, a vertical
 *   news wire, the six chicken analysts, the pick track record, and a live
 *   coop-floor camera strip. Maximalist on purpose (see page.tsx header).
 *
 *   Hydration safety: the first render is fully deterministic — quotes use
 *   the values from props, "random" series (candles, order book) come from
 *   a fixed seeded LCG so SSR and client agree, clocks render as dashes.
 *   Motion starts only after mount (useEffect): clocks tick, quotes jitter.
 *   Marquees (tape, news wire) are pure CSS so they never mismatch.
 * SRP/DRY check: Pass — single presentational island, no data fetching;
 *   all data arrives via the `data` prop from the server page.
 */
import { useEffect, useRef, useState } from "react";

export interface Quote {
  sym: string;
  px: number;
  chg: number;
}
export interface IndexRow {
  name: string;
  value: string;
  chg: number;
}
export interface Pick {
  date: string;
  ticker: string;
  company: string;
  play: string;
  conviction: number;
  rating: string;
  omen: string;
  frame: string;
  frameTime: string;
  model: string;
  source: string;
  birdReads: string[];
  mood: string;
}
export interface Analyst {
  name: string;
  title: string;
  img: string;
  rating: string;
  specialty: string;
  blurb: string;
}
export interface MarketData {
  terminalName: string;
  desk: string;
  disclaimer: string;
  tape: Quote[];
  indices: IndexRow[];
  picks: Pick[];
  analysts: Analyst[];
  newswire: string[];
}

// ---- deterministic pseudo-random (seeded) so SSR === first client render ----
function lcg(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const GREEN = "#22e06b";
const RED = "#ff4d4d";
const AMBER = "#f5b301";

function chgColor(n: number): string {
  return n > 0 ? GREEN : n < 0 ? RED : "#94a3b8";
}
function arrow(n: number): string {
  return n > 0 ? "▲" : n < 0 ? "▼" : "▬";
}
function sign(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}`;
}

function ratingColor(r: string): string {
  const u = r.toUpperCase();
  if (u.includes("STRONG BUY") || u.includes("SPECULATIVE BUY")) return GREEN;
  if (u.includes("BUY") || u.includes("ACCUMULATE")) return "#7ee8a4";
  if (u.includes("HOLD")) return AMBER;
  if (u.includes("REDUCE") || u.includes("AVOID") || u.includes("SELL")) return RED;
  return "#94a3b8";
}

function clk(d: Date, utc: boolean): string {
  const h = utc ? d.getUTCHours() : d.getHours();
  const m = utc ? d.getUTCMinutes() : d.getMinutes();
  const s = utc ? d.getUTCSeconds() : d.getSeconds();
  const p = (n: number) => n.toString().padStart(2, "0");
  return `${p(h)}:${p(m)}:${p(s)}${utc ? "Z" : ""}`;
}

const PANEL =
  "border border-[#1f3b2e] bg-[#06120c]/80 backdrop-blur-[1px]";
const LABEL =
  "text-[10px] uppercase tracking-[0.25em] text-[#3f8f63] px-2 py-1 border-b border-[#1f3b2e] bg-[#08160e] flex items-center justify-between";

export default function Terminal({ data }: { data: MarketData }) {
  const [now, setNow] = useState<Date | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>(data.tape);
  const [newsIdx, setNewsIdx] = useState(0);
  const rng = useRef(lcg(424242));

  useEffect(() => {
    setNow(new Date());
    const clock = setInterval(() => setNow(new Date()), 1000);
    const ticker = setInterval(() => {
      setQuotes((qs) =>
        qs.map((q) => {
          const jitter = (rng.current() - 0.48) * Math.max(0.02, q.px * 0.004);
          const px = Math.max(0.01, q.px + jitter);
          const chg = q.chg + (rng.current() - 0.5) * 0.06;
          return { ...q, px, chg };
        }),
      );
    }, 1200);
    const news = setInterval(
      () => setNewsIdx((i) => (i + 1) % data.newswire.length),
      3500,
    );
    return () => {
      clearInterval(clock);
      clearInterval(ticker);
      clearInterval(news);
    };
  }, [data.newswire.length]);

  const today = data.picks[0];
  const history = data.picks;

  // deterministic candlestick tape
  const candles = (() => {
    const r = lcg(1337);
    const out: { o: number; c: number; h: number; l: number }[] = [];
    let price = 50;
    for (let i = 0; i < 40; i++) {
      const o = price;
      const move = (r() - 0.45) * 6;
      const c = Math.max(5, o + move);
      const h = Math.max(o, c) + r() * 3;
      const l = Math.min(o, c) - r() * 3;
      out.push({ o, c, h, l });
      price = c;
    }
    return out;
  })();
  const cMax = Math.max(...candles.map((c) => c.h));
  const cMin = Math.min(...candles.map((c) => c.l));

  // deterministic order book
  const book = (() => {
    const r = lcg(99);
    const mid = today ? 61.4 : 50;
    const bids: { px: number; sz: number }[] = [];
    const asks: { px: number; sz: number }[] = [];
    for (let i = 0; i < 7; i++) {
      bids.push({ px: mid - (i + 1) * 0.03, sz: Math.floor(r() * 900) + 20 });
      asks.push({ px: mid + (i + 1) * 0.03, sz: Math.floor(r() * 900) + 20 });
    }
    return { bids, asks };
  })();

  return (
    <main className="min-h-screen bg-[#020805] text-[#cfeede] font-mono text-[13px] selection:bg-[#22e06b] selection:text-black">
      {/* scanline overlay */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg,#22e06b 0,#22e06b 1px,transparent 1px,transparent 3px)",
        }}
      />

      {/* ticker tape */}
      <div className="overflow-hidden border-y border-[#1f3b2e] bg-black whitespace-nowrap">
        <div
          className="inline-block py-1.5"
          style={{ animation: "ppm-marquee 38s linear infinite" }}
        >
          {[...quotes, ...quotes].map((q, i) => (
            <span key={i} className="mx-4 inline-flex items-center gap-1.5">
              <b className="text-[#e6fff0]">{q.sym}</b>
              <span className="text-[#9fc7b3]">{q.px.toFixed(2)}</span>
              <span style={{ color: chgColor(q.chg) }}>
                {arrow(q.chg)} {sign(q.chg)}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* masthead */}
      <header className="border-b border-[#1f3b2e] px-3 py-2 flex flex-wrap items-end justify-between gap-2 bg-gradient-to-b from-[#08160e] to-transparent">
        <div>
          <h1
            className="text-xl md:text-2xl font-bold tracking-[0.18em] text-[#22e06b]"
            style={{ fontFamily: "var(--font-mono, monospace)", textShadow: "0 0 12px rgba(34,224,107,0.5)" }}
          >
            🐔 {data.terminalName}
          </h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#3f8f63]">
            {data.desk}
          </p>
        </div>
        <div className="text-right text-[11px] leading-tight">
          <div className="flex items-center justify-end gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#22e06b]" style={{ animation: "ppm-blink 1.1s steps(1) infinite" }} />
            <span className="text-[#22e06b] tracking-widest">SESSION OPEN</span>
          </div>
          <div className="text-[#9fc7b3] tabular-nums">
            {now ? clk(now, false) : "--:--:--"} EDT &nbsp;·&nbsp;{" "}
            {now ? clk(now, true) : "--:--:--Z"}
          </div>
        </div>
      </header>

      {/* indices strip */}
      <div className="flex flex-wrap gap-px border-b border-[#1f3b2e] bg-[#0a1a11]">
        {data.indices.map((ix) => (
          <div key={ix.name} className="flex-1 min-w-[150px] px-3 py-1.5">
            <div className="text-[9px] uppercase tracking-widest text-[#3f8f63]">
              {ix.name}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold text-[#e6fff0] tabular-nums">
                {ix.value}
              </span>
              <span className="text-[11px]" style={{ color: chgColor(ix.chg) }}>
                {arrow(ix.chg)} {sign(ix.chg)}%
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 p-2">
        {/* TODAY'S PICK */}
        <section className={`lg:col-span-5 ${PANEL}`}>
          <div className={LABEL}>
            <span>◉ FLOCK PICK OF THE DAY — {today?.date}</span>
            <span className="text-[#f5b301]">PRIORITY</span>
          </div>
          <div className="p-3 grid grid-cols-[1fr_auto] gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-[#22e06b]" style={{ textShadow: "0 0 14px rgba(34,224,107,0.6)" }}>
                  ${today?.ticker}
                </span>
                <span
                  className="px-2 py-0.5 text-[11px] font-bold border tabular-nums"
                  style={{ color: ratingColor(today?.rating ?? ""), borderColor: ratingColor(today?.rating ?? "") }}
                >
                  {today?.rating}
                </span>
              </div>
              <div className="text-[11px] text-[#9fc7b3] mb-2">{today?.company}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#3f8f63]">The Play</div>
              <div className="text-[#e6fff0] mb-2">{today?.play}</div>

              {/* conviction gauge */}
              <div className="text-[10px] uppercase tracking-widest text-[#3f8f63]">
                Conviction
              </div>
              <div className="relative h-4 w-full border border-[#1f3b2e] bg-black mb-2">
                <div
                  className="absolute inset-y-0 left-0"
                  style={{
                    width: `${today?.conviction ?? 0}%`,
                    background: "linear-gradient(90deg,#0e7a3c,#22e06b)",
                    boxShadow: "0 0 10px rgba(34,224,107,0.7)",
                  }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white mix-blend-difference">
                  {today?.conviction}% CONVICTION
                </span>
              </div>
            </div>
            {today?.frame ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={today.frame}
                alt={`Coop frame the ${today.ticker} pick was read from`}
                className="h-44 w-auto border border-[#1f3b2e] object-cover"
              />
            ) : null}
          </div>
          <div className="px-3 pb-3">
            <div className="text-[10px] uppercase tracking-widest text-[#3f8f63] mb-1">
              The Omen
            </div>
            <p className="text-[#cfeede] italic text-[12px] leading-snug mb-3">
              “{today?.omen}”
            </p>
            {/* chain of custody */}
            <div className="border border-[#1f3b2e] bg-black/40 p-2 text-[11px]">
              <div className="text-[9px] uppercase tracking-widest text-[#f5b301] mb-1">
                ▸ Chain of Custody (real)
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[#9fc7b3]">
                <span className="text-[#3f8f63]">FRAME</span>
                <span>{today?.frameTime}</span>
                <span className="text-[#3f8f63]">SOURCE</span>
                <span>{today?.source}</span>
                <span className="text-[#3f8f63]">MODEL</span>
                <span>{today?.model}</span>
                <span className="text-[#3f8f63]">MOOD</span>
                <span>{today?.mood}</span>
              </div>
              {today && today.birdReads.length > 0 ? (
                <ul className="mt-1.5 space-y-0.5">
                  {today.birdReads.map((b, i) => (
                    <li key={i} className="text-[#7ee8a4] before:content-['›_']">
                      {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        </section>

        {/* CANDLE TAPE + ORDER BOOK */}
        <section className="lg:col-span-4 grid grid-rows-[1fr_auto] gap-2">
          <div className={PANEL}>
            <div className={LABEL}>
              <span>$/{today?.ticker} · COOP TAPE (40)</span>
              <span style={{ color: GREEN }}>LIVE</span>
            </div>
            <div className="p-2">
              <svg viewBox="0 0 320 150" className="w-full h-[150px]" preserveAspectRatio="none">
                {candles.map((c, i) => {
                  const x = 6 + i * 7.8;
                  const norm = (v: number) =>
                    150 - ((v - cMin) / (cMax - cMin)) * 140 - 5;
                  const up = c.c >= c.o;
                  const col = up ? GREEN : RED;
                  return (
                    <g key={i}>
                      <line x1={x} x2={x} y1={norm(c.h)} y2={norm(c.l)} stroke={col} strokeWidth={0.8} />
                      <rect
                        x={x - 2.6}
                        width={5.2}
                        y={norm(Math.max(c.o, c.c))}
                        height={Math.max(1, Math.abs(norm(c.o) - norm(c.c)))}
                        fill={col}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          <div className={PANEL}>
            <div className={LABEL}>
              <span>ORDER BOOK · ${today?.ticker}</span>
              <span className="text-[#9fc7b3]">size = birds</span>
            </div>
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

        {/* SENTIMENT + NEWS */}
        <section className="lg:col-span-3 grid grid-rows-[auto_1fr] gap-2">
          <div className={PANEL}>
            <div className={LABEL}>
              <span>FLOCK FEAR / GREED</span>
            </div>
            <div className="p-3 text-center">
              <div className="text-5xl font-black" style={{ color: GREEN, textShadow: "0 0 16px rgba(34,224,107,0.6)" }}>
                73
              </div>
              <div className="text-[11px] tracking-[0.3em] text-[#22e06b]">EXTREME GREED</div>
              <div className="mt-2 h-2 w-full bg-gradient-to-r from-[#ff4d4d] via-[#f5b301] to-[#22e06b] relative">
                <span className="absolute -top-1 h-4 w-0.5 bg-white" style={{ left: "73%" }} />
              </div>
            </div>
          </div>
          <div className={PANEL}>
            <div className={LABEL}>
              <span>◂ COOP NEWS WIRE</span>
              <span style={{ color: RED }} className="animate-pulse">●REC</span>
            </div>
            <div className="p-2 h-[180px] overflow-hidden relative">
              <div style={{ animation: "ppm-scroll-up 22s linear infinite" }}>
                {[...data.newswire, ...data.newswire].map((n, i) => (
                  <p key={i} className="text-[11px] leading-snug mb-2 border-l-2 border-[#1f3b2e] pl-2 text-[#9fc7b3]">
                    <span className="text-[#f5b301]">›</span> {n}
                  </p>
                ))}
              </div>
            </div>
            <div className="border-t border-[#1f3b2e] px-2 py-1 text-[11px] text-[#22e06b] truncate">
              ⟫ {data.newswire[newsIdx]}
            </div>
          </div>
        </section>

        {/* ANALYSTS */}
        <section className={`lg:col-span-8 ${PANEL}`}>
          <div className={LABEL}>
            <span>◉ THE ANALYST DESK — COVERAGE TEAM</span>
            <span className="text-[#9fc7b3]">{data.analysts.length} active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1f3b2e]">
            {data.analysts.map((a) => (
              <div key={a.name} className="bg-[#06120c] p-2 flex gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt={a.name} className="h-16 w-16 object-cover border border-[#1f3b2e] shrink-0" />
                <div className="min-w-0">
                  <div className="text-[12px] font-bold text-[#e6fff0] leading-tight truncate">{a.name}</div>
                  <div className="text-[10px] text-[#3f8f63] leading-tight">{a.title}</div>
                  <div className="text-[10px] font-bold mt-0.5" style={{ color: ratingColor(a.rating) }}>
                    {a.rating}
                  </div>
                  <div className="text-[10px] text-[#9fc7b3] leading-tight mt-0.5">{a.specialty}</div>
                  <div className="text-[10px] text-[#6fae8c] italic leading-tight mt-0.5">“{a.blurb}”</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TRACK RECORD */}
        <section className={`lg:col-span-4 ${PANEL}`}>
          <div className={LABEL}>
            <span>◉ TRACK RECORD</span>
            <span className="text-[#9fc7b3]">audited by nobody</span>
          </div>
          <table className="w-full text-[11px] tabular-nums">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest text-[#3f8f63] border-b border-[#1f3b2e]">
                <th className="text-left px-2 py-1">Date</th>
                <th className="text-left px-2 py-1">Tkr</th>
                <th className="text-left px-2 py-1">Rating</th>
                <th className="text-right px-2 py-1">Conv</th>
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

        {/* LIVE COOP FLOOR */}
        <section className={`lg:col-span-12 ${PANEL}`}>
          <div className={LABEL}>
            <span>◉ TRADING FLOOR — LIVE COOP CAM (S7)</span>
            <span style={{ color: GREEN }} className="flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#22e06b]" style={{ animation: "ppm-blink 1.1s steps(1) infinite" }} />
              ON AIR
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#1f3b2e]">
            {["/photos/markets/live-2.jpg", "/photos/markets/live-3.jpg", "/photos/markets/live-4.jpg", "/photos/markets/hero.jpg"].map(
              (src, i) => (
                <div key={src} className="relative bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`Live coop floor ${i + 1}`} className="h-40 w-full object-cover opacity-90" />
                  <span className="absolute top-1 left-1 text-[9px] bg-black/70 px-1 text-[#22e06b]">CAM-{i + 1}</span>
                  <span className="absolute bottom-1 right-1 text-[9px] bg-black/70 px-1 text-[#ff4d4d]">●LIVE</span>
                </div>
              ),
            )}
          </div>
        </section>
      </div>

      {/* disclaimer */}
      <footer className="border-t border-[#1f3b2e] bg-black px-3 py-3 text-center">
        <p className="text-[11px] text-[#ff4d4d] tracking-wide" style={{ animation: "ppm-blink 2s steps(1) infinite" }}>
          ⚠ {data.disclaimer}
        </p>
        <p className="text-[10px] text-[#3f8f63] mt-1 tracking-[0.3em] uppercase">
          Powered by chickens · S7 coop cam → qwen3.5-9b VLM → conviction · Hampton, CT
        </p>
      </footer>
    </main>
  );
}
