# 04-Jun-2026 — June 2026 clutch hatch records + season-final naming

## Goal

Get every bird from all of the 2026 incubator season's hatches onto the site
**with its name**, including the brand-new June clutch — the last hatch of the
2026 season. Source of truth is the boss-confirmed provenance memory (the
"2026 incubator hatch spine," eventId `fbdbd023-…`, plus the per-bird naming
events) and the existing repo records, not chat recollection.

## Scope

**In**

- Six new per-chick hatch records under `content/hatches/2026/` for the June
  clutch: Birdimir, Ingebird, Henriessa, Horstabird, Henridotta, Adelbird.
- One `status: lost` record for **Egg #6** (brown, Henrietta-line, died in
  shell 2026-06-03) — the schema covers losses, so it gets a grounded record.
- Naming the two previously-unnamed May-16 chicks that the boss-confirmed spine
  now names: `2026-05-16-02` → **Henriella**, `2026-05-16-03` → **Birdsilla**
  ("Monster Leg"). Filenames renamed (schema allows; `id` unchanged), `name`
  filled, one grounded observation appended. No prior observations edited.
- `content/flock-profiles.json`: add the six June chicks to `flock_birds`
  (active, brooder) and update the two May display names. `incubating` stays
  empty — the NI clutch has fully hatched.
- `CHANGELOG.md` top entry (SemVer) and this plan doc.

**Out**

- Photo-to-chick mapping (best-effort only; not guessing — left as follow-up).
- Any frontend/code change. `/hatches` and `/flock` already render from the
  data; no roll-up/index is hand-maintained (none exists — `getHatchRecords`
  reads the directory directly).
- Rewriting existing observation history.

## Key facts reconciled from sources (provenance memory)

- **Incubator: the June clutch is the NEW incubator (NI) clutch** — 18 eggs set
  ~2026-05-12, lockdown 2026-05-30, expected hatch ~2026-06-02, paternity
  window **Whitey Red Legs** (`memory:bubba farm-calendar`; confirmed in the
  hatch spine "current NI clutch"). The OI (old, 8-egg) was retired after the
  April/May hatch. On hatch-night Jun 2, Birdimir & Ingebird were *moved* into
  the now-empty OI as a holding spot — that move is the likely origin of the
  task brief's "all six in OI at hatch." Recorded as NI; **flagged to boss.**
- **Egg colors (all sourced):** Birdimir/Ingebird/Horstabird/Adelbird = blue;
  Henriessa/Henridotta/Egg #6 = brown (Henrietta line).
- **Assisted hatches:** Horstabird (egg #4) — boss removed a small shell piece
  + water droplet, hatched 16:44 EDT. Adelbird (egg #5) — water droplet on the
  membrane the evening of Jun 3, finished on her own overnight. Egg #6 — boss's
  first-ever full assist attempt; opened ~12:21, no life, lost 12:37.
- **Silver:** the boss's latest call (2026-06-04, phrased as a question, "my
  mistake") is that **Henridotta** is the silver one — recorded at
  `confidence: low` with a note that he first said Henriessa. Not asserted.

## TODO (ordered)

1. Branch `hatch/june-2026-clutch` off main. ✓
2. This plan doc. ✓
3. Six June hatch records + Egg #6 loss record (strict YAML; quote `#`/times;
   block scalars for multi-line notes).
4. Rename + name the two May chicks; append one grounded observation each.
5. Update `flock-profiles.json` (six new `flock_birds`; rename two; roster
   `egg_color` stays `"TBD (too young)"` — that field is the *laying* color).
6. `CHANGELOG.md` top entry, SemVer bump, model name.
7. Verify: `npm run build` (the real gate) and `npm run check:contract`
   (orthogonal live-API probe). Confirm /hatches and /flock render via the
   loader.
8. Commit on branch; rebase on latest main; merge + push (boss authorized) —
   **only if build passes**; hold and report if the contract check is red.

## Docs/Changelog touchpoints

- `CHANGELOG.md` — new top entry.
- This plan doc.
- No `types.ts` / component change → no contract surface touched.
