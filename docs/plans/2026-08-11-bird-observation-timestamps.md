# Plan: date-stamped, age-aware plumage observations for the flock roster

**Author:** Bubba (Claude Sonnet 5), at the Boss's direction
**Date:** 11-Aug-2026
**Status:** proposed — needs a dev to implement, not yet built
**Repos touched:** `farm-2026` (schema + data), `farm-guardian` (ingest pipeline)

## Problem

Today (11-Aug-2026) two ID calls went sideways in `#meet-the-lobsters`:

1. A bird's green band read as Ingebird (`#2`, logged), but Ingebird's `color_description`
   ("near-black with fine irregular white ticking") didn't match the bird in the photo. The
   band was right; the text description was stale. Bubba talked himself out of the correct
   band match by trusting old prose over the ID that's supposed to be authoritative, and got
   called out for it by the Boss.
2. A second bird was color-matched to Birdadotta with high confidence, but the leg-side in
   the photo didn't match the logged band leg (left vs. right) — an open discrepancy that
   couldn't be resolved from a single photo.

The Boss's point: **`flock-profiles.json` has no concept of time.** `color_description` is a
single flat string with no date attached, so nobody — human or agent — can tell whether a
description was written when the bird was 3 weeks old, freshly molted, or a year into full
adult plumage. Chickens change color and feathering substantially as they age (juvenile down
→ first true feathers → adult plumage → post-molt); a description with no timestamp silently
goes stale and actively misleads identification instead of helping it. The same gap means
there's no way to answer "what will this year's chicks look like once they're grown" — there's
no dated growth trail to project from, per breed or per bird.

## Goals

1. Every plumage/color observation in the roster carries a **date** (and, where hatch_date is
   known, a **derived age**) — not just a single ever-overwritten string.
2. **Band is the authoritative identifier**, formally, not just a convention Bubba has to
   remember to apply. A stale text description should never outrank a legible band match.
3. Build a dated growth trail per bird (and eventually per breed) so "what will a chick from
   this year's hatch look like at 8/16/52 weeks" becomes answerable from data instead of guesswork.

## Non-goals (this pass)

- Not rewriting the whole roster UI/site today.
- Not backfilling perfect historical dates for old entries — where the true observation date
  isn't recoverable, mark it `"date_unknown": true` rather than inventing one.
- Not building the breed-level growth reference table yet — flagged as a stretch/follow-up
  once per-bird dated observations exist to draw it from.

## Proposed schema change — `content/flock-profiles.json`

Current shape (per bird in `flock_birds[]`):
```json
{
  "name": "Birdatha",
  "hatch_date": "2024-04-01",
  "color_description": "Reddish-brown",
  "notes": "...",
  "photo": "birds/birdatha.jpg"
}
```

`color_description` is a flat, silently-overwritten string — that's the bug. Replace with a
dated list, keep a derived top-level field for cheap display/back-compat:

```json
{
  "name": "Birdatha",
  "hatch_date": "2024-04-01",
  "hatch_date_estimated": true,
  "color_observations": [
    {
      "date": "2026-06-23",
      "age_weeks": 116,
      "description": "Reddish-brown, bare tan shanks",
      "source": "chat:meet-the-lobsters",
      "date_unknown": false
    },
    {
      "date": "2026-07-21",
      "age_weeks": 120,
      "description": "Reddish-brown, deeper rust cape post-molt",
      "source": "bird_photo_ingest",
      "date_unknown": false
    }
  ],
  "color_description": "Reddish-brown, deeper rust cape post-molt",
  "color_description_as_of": "2026-07-21",
  "notes": "...",
  "photo": "birds/birdatha.jpg"
}
```

- `color_description` / `color_description_as_of` = derived convenience mirror of the
  **latest** entry in `color_observations` (most recent `date`). Keeps existing site code
  that reads `color_description` working without a rewrite.
- `age_weeks` is computed from `hatch_date` at observation time when `hatch_date` is known
  and not itself a rough estimate flagged unreliable; otherwise omit the field rather than
  guess.
- `source` records where the observation came from (chat log, ingest pipeline, in-person
  Boss note) — useful for trust-weighting later.

## Ingest pipeline change — `farm-guardian/tools/pipeline/bird_photo_ingest.py`

Right now `bird_photo_ingest.py` only sets `photo` (and `photos[]`) on the matched roster
entry — it doesn't touch `color_description` at all, so every plumage note in the roster
today was hand-typed by an agent with no forced timestamp. Extend the ingest step so that
when a caption includes (or the VLM step produces) a plumage/color description, it appends a
`color_observations` entry stamped with `datetime.now()` and the computed age, instead of
leaving that to ad-hoc chat edits. This closes the gap at the source going forward — new
sightings get dated automatically; only the historical backlog needs a manual pass.

## Identification-logic change

Wherever a roster consumer (agent prompt guidance, `roster.py`, any matching helper) compares
a photo against the roster, banded ID must win over plumage-text ID when the two conflict and
the band number/leg is legible. Today that's a convention documented in SOUL.md prose
("leg bands = the real ID") that an agent can still talk itself out of, as happened today.
Make the precedence explicit and mechanical wherever matching logic lives, not just advisory.

## Backfill (follow-up, not blocking)

For the 35 existing `flock_birds` entries: turn each current `color_description` into a
single `color_observations[0]` entry. Use the most specific date already present in the data
or recent chat history (e.g. "last confirmed 21-Jul-2026" style notes some birds already
have); where no date is recoverable, set `"date_unknown": true` and leave `date` null rather
than fabricating one. This is a second, separate PR — don't block the schema/ingest change on
finishing it.

## Acceptance criteria

- New bird photo filings through `bird_photo_ingest.py` always produce a dated
  `color_observations` entry, no manual timestamping required.
- Given a legible band and a conflicting plumage description, matching logic (and agent
  guidance) picks the band, full stop — no more "band says X but the write-up doesn't match
  so I'll call it unknown" waffling.
- `flock-profiles.json` validates against `farm-guardian/tools/pipeline/schema.json` (or its
  equivalent) after the shape change — schema needs updating alongside the data shape.
