# SiteNav bird headcount — plan (v2, attestation model)

**Date:** 22-Jul-2026
**Author:** Claude Fable 5 (v1 draft: Claude Sonnet 5, same day)
**Status:** Awaiting Boss approval before implementation

## What changed from v1 and why

The v1 draft added a hand-typed `count` field to every roster entry. Boss
rejected it as hard-coded — correctly. The roster's own history proves the
failure mode: `"Tractor Supply May batch (6)"` still says 6 in its name while
its notes admit it's 4; `"Cackle Hatchery cohort (15)"` says 15 but Cackle
ships bonus chicks and there have been unlogged losses, so nobody knows the
real number without walking out and counting. A bare number in JSON is a
claim with no author and no date — it can't be trusted and it can't expire.

## The durable idea

**A count is either derived or attested. Never typed into a name, a page, or
a config.**

1. **Named individuals are self-counting.** One record = one living bird.
   Their contribution to the headcount is `filter(active).length` — exact,
   forever, no maintenance. The farm is already converging here: the
   banding project (2026-07-21) keeps splitting group birds out into named,
   banded individuals (Chonkers, Chonkette, Scissor Beak, Robirda, Bobirda,
   Ravenessa, Quasibirdo...). Every split-out automatically makes the
   headcount more exact. The workflow Boss already does IS the maintenance.

2. **Group entries carry a headcount *attestation*, not a number.** This
   follows the roster's existing idiom for physical-world facts —
   `leg_band: {confirmed: true, confirmed_date: "2026-07-21"}`:

   ```json
   "headcount": {
     "count": 15,
     "counted_on": "2026-04-08",
     "source": "shipment invoice — Cackle order #519118; NOT a physical count. Cackle ships 1-3 bonus chicks; losses since arrival unlogged.",
     "verified": false
   }
   ```

   vs. a group Boss has actually counted:

   ```json
   "headcount": {
     "count": 3,
     "counted_on": "2026-07-21",
     "source": "Boss, banding session",
     "verified": true
   }
   ```

   The number now has an author, a date, and an honesty bit. It can be
   wrong, but it can't *lie about its own reliability* — which is the actual
   problem with `"(15)"`.

3. **The display is honest about uncertainty.** `getFlockHeadcount()` sums
   individuals (exact) + attestations, and returns `exact: boolean` — false
   if any active group's attestation has `verified: false`. The nav line
   renders `~46 chickens` while any component is unverified, and drops the
   `~` the day every group is either counted or fully split into named
   birds. The tilde is the feature: it tells the truth, and it quietly
   nags toward the physical count without a nag.

4. **The update path is an observation, not a code edit** (phase 2). Boss's
   interface to this whole system is already Discord — reactions gate the
   gem lane, bird-photo captions drive the v2.51.0 roster ingest. Extend
   that same lane with a headcount verb: a `#farm-2026` message like
   `headcount: cackle 13` updates that group's attestation
   (`count: 13, counted_on: <today>, source: "Boss via Discord", verified:
   true`) and commits. Boss counts birds in the coop, types one line on his
   phone, done. No JSON editing, no agent session. Phase 2 because the
   attestation model is useful without it — but the schema is designed so
   phase 2 writes into it without migration.

Long-term this converges: groups shrink as birds get named, attestations
cover the shrinking remainder, and the count asymptotically becomes fully
derived. There is no steady-state where a human maintains parallel numbers.

## Scope

**In (phase 1):**
- `headcount` attestation objects on the 7 active group entries in
  `content/flock-profiles.json` (initial values below — each sourced, none
  invented).
- `getFlockHeadcount()` in `lib/content.ts` (derived; returns per-species
  totals + `exact` flag).
- One small line in `SiteNav.tsx`'s identity strip next to
  `HAMPTON, CT · …` — threaded as a prop from `app/layout.tsx` (SiteNav is
  a client component; the loader is fs-backed).
- Memory + CHANGELOG updates (rule exception, see below).

**Out:**
- Phase 2 Discord headcount verb (designed-for, not built now).
- Any counts elsewhere on the site — the no-bird-counts rule stands
  everywhere else.
- Renaming group entries to strip their stale parentheticals (worth doing,
  but names are matched by the Discord ingest + hatch records — separate
  change with its own blast radius).
- farm-guardian changes. `tools/pipeline/roster.py` ignores unknown fields;
  `headcount` is additive and safe.

## Explicit exception to a standing rule

`feedback_no_bird_counts.md` ("Don't count the birds... not tallying what's
gone") is enforced today in `app/flock/page.tsx` and `app/page.tsx`
("no-bird-counts rule — Boss rule"). **Boss approved this single nav line as
an exception, 22-Jul-2026, in conversation** — present-tense "what's here,"
no survivor/loss framing, nothing historical. The memory file gets updated
to record the exception so a future agent neither reverts this line as a
violation nor cites it as license to add counts elsewhere.

## Initial attestation values (nothing invented)

| Group entry | count | counted_on | source | verified |
|---|---|---|---|---|
| White turkeys (3) | 3 | 2026-04-07 | purchase record | true |
| Bronze turkeys (2) | 2 | 2026-04-25 | purchase record (TSC) | true |
| Barred Rocks (2) | 2 | 2026-04-25 | purchase record (TSC) | true |
| Plymouth Rocks (2) | 2 | 2026-04-25 | purchase record (TSC) | true |
| Tractor Supply juveniles (2 of 4 remaining) | 2 | 2026-06-07 | Boss-confirmed losses note in entry | true |
| March juveniles (3) | 3 | 2026-07-21 | remainder after banding split-outs | true |
| Tractor Supply May batch (6) | 4 | 2026-06-18 | 6 purchased − Chonkers − Chonkette (per entry notes) | true |
| Cackle Hatchery cohort (15) | 15 | 2026-04-08 | shipment invoice; bonus chicks + unlogged losses possible | **false** |

Ravenessa and Quasibirdo are 2 *of* the Cackle cohort (Boss-confirmed
22-Jul-2026), so the cohort's own attested count must exclude them once
Boss does the physical count; until then the derivation subtracts the
named split-outs from the attested 15 → 13 unnamed, flagged inexact.
(The subtraction rule generalizes: a group's effective count = attested
count − living named birds recorded as split out from it. The May batch
row above shows the same rule already applied by hand; encoding it in the
derivation instead means a future split-out can't double-count. Each
split-out bird gets a `from_group` field naming its origin entry — one more
attestation-style fact the banding sessions already know at split time.)

## Resulting display (today's data)

`~46 chickens · 5 turkeys · 11 ornitharchs`

- Turkeys: 3 + 2, both verified → exact.
- Ornitharchs: 11, matches `get_active_ornitharchs()` in farm-guardian's
  `roster.py` — named individuals only, always exact. Rendered as an
  inclusive subset of chickens (same framing as /flock's "The Ornitharchs"
  section); flip to exclusive if it reads badly live.
- Chickens: named individuals (exact) + group attestations, tilde'd by the
  unverified Cackle cohort. The `~` disappears the day Boss counts them —
  or names them all.
- No ducks. "Duckwing" in the breed pools is a chicken plumage pattern;
  the farm has zero waterfowl. (Recorded because a 🦆 already snuck into
  one draft of this feature.)

## TODOs

1. Add `headcount` attestations to the 8 group entries; add
   `from_group: "Cackle Hatchery cohort (15)"` to Ravenessa + Quasibirdo,
   and `from_group: "Tractor Supply May batch (6)"` to Chonkers + Chonkette,
   `from_group: "March juveniles (3)"`… — no: March juveniles' attested 3 is
   already the post-split remainder (counted 2026-07-21, after the split),
   so its split-outs must NOT carry `from_group`, or they'd be
   double-subtracted. Rule: `from_group` is set only when the group's
   attestation predates the split. Cackle (attested 2026-04-08, split
   2026-06-18) and May batch — set the May batch attestation to the raw 6 @
   purchase date instead of the pre-subtracted 4, and let the derivation do
   the subtraction uniformly. Cleaner: one rule, no hand-subtracted rows.
2. `getFlockHeadcount()` in `lib/content.ts`: actives only; species split
   (breed contains "Turkey" → turkey, else chicken; `ornitharch: true` →
   also ornitharch); group effective count = `headcount.count` − living
   named birds with matching `from_group`; `exact` = all contributing
   attestations verified.
3. Thread from `app/layout.tsx` → `SiteNav` prop; render next to
   `SITE_LOCATION` with the same `hidden sm:inline` collapse. Plain text,
   no emoji (emoji SSoT has no turkey token; raw emoji outside
   `lib/emoji.ts` consumers is banned).
4. `npm run dev`; verify the line reads `~46 chickens · 5 turkeys ·
   11 ornitharchs`; verify mobile collapse; verify a simulated
   `verified: true` on Cackle drops the tilde.
5. Update `memory/feedback_no_bird_counts.md` with the scoped exception.
6. CHANGELOG top entry (SemVer; what/why/how; model name).

## Docs/changelog touchpoints

- `farm-2026/CHANGELOG.md` — top entry.
- `farm-2026/memory/feedback_no_bird_counts.md` — exception recorded.
- This doc — the attestation model + subtraction rule is the reference for
  the phase-2 Discord headcount verb.
