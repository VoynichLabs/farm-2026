/**
 * Author: Claude Opus 4.8 (Bubba)
 * Date: 16-Jul-2026
 * PURPOSE: Single source of truth for the site's emoji accent vocabulary
 *   (16-Jul-2026 daylight retheme). Emoji are semantic tokens, not
 *   decoration: one emoji = one meaning, always leading a text label,
 *   always aria-hidden (the text carries the meaning), never in body
 *   prose, and never on /markets (the CRT keeps its own register).
 *   No raw emoji belong in JSX outside consumers of this module —
 *   same rule as camera labels living in lib/cameras.ts.
 *   Vocabulary is flora, fauna, produce, weather, and tools only.
 * SRP/DRY check: Pass — new module, no prior emoji constants existed
 *   (grepped app/ and lib/ for raw emoji in JSX).
 */

/** One mark per route — used in the nav and as that page's section-kicker prefix. Never reused across pages. */
export const PAGE_MARKS = {
  home: "🏡",
  guardian: "📡",
  gems: "✨",
  yard: "🌻",
  flock: "🐔",
  markets: "📈",
  notes: "📓",
  projects: "🛠️",
  hatches: "🐣",
  ornitharch: "🪶",
} as const;

/** Status tokens — category marks, never emphasis. */
export const STATUS = {
  /** anything updating right now (live cameras, newest growth frame) — the bee IS the pulse */
  live: "🐝",
  /** juveniles, new hatch records, freshly added content */
  growing: "🌱",
  /** egg-color chips and incubation strips */
  egg: "🥚",
  /** shelved projects, frozen archives, retired features */
  archived: "🍂",
} as const;

/** Yard-diary capture slots. */
export const DAY_SLOTS = {
  morning: "☀️",
  noon: "🌤️",
  evening: "🌙",
} as const;

/** The vegetable garden — field-note tags now; ready-made page mark if the garden gets its own page. */
export const GARDEN = {
  pumpkins: "🎃",
  /** covers cucumbers AND zucchini — Unicode has no zucchini */
  cucurbits: "🥒",
  corn: "🌽",
} as const;

/** The one purely decorative token, strictly rationed: section dividers on long pages and the field-note kicker. */
export const DIVIDER = "🌼";
