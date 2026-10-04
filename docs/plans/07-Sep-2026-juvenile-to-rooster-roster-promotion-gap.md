Author: Claude Sonnet 5 (Bubba)
Date: 07-Sep-2026
PURPOSE: Flag a roster-tooling gap found live in Discord — `bird_photo_ingest.py` cannot
file photos of "The White Rooster" and "the calico rooster" because neither name exists
in `content/flock-profiles.json`. Needs a smarter pass (Boss asked for Dr. Opus / a
stronger model) before any code changes are made.
SRP/DRY check: Pass — this is a note, not a fix. No roster or pipeline code touched.

# The gap

Boss dropped photos in #meet-the-lobsters (07-Sep-2026, ~10:41-10:45 ET) captioned
"The White Rooster" and mentioned "a calico rooster" too. Ran the standard ingest:

```
cd ~/GitHub/farm-guardian && PYTHONPATH=$PWD ./venv/bin/python tools/pipeline/bird_photo_ingest.py \
  "IMG_9621---8ebe7cf0-f0c4-4b39-a87d-776fc6f39709.jpg" "The White Rooster" 1471632572953006337
```

Result: `status: no_match` — "I didn't recognize a roster bird's name in that caption."
Confirmed by reading `flock-profiles.json` directly: no bird named "White Rooster" or
"Calico Rooster" exists.

**The Boss's read, which I have no way to verify or refute from a photo alone:** these
are NOT new acquisitions. They're young birds already in the roster — most likely
sitting inside one of the unsexed juvenile group entries (`Cackle Hatchery cohort (15)`,
`Tractor Supply May batch (6)`, `March juveniles (3)`, `Tractor Supply juveniles (2 of 4
remaining)`, `Barred Rocks (2)`, `Plymouth Rocks (2)`) — that have matured enough to
show rooster hardware (comb, wattles, crowing) and get a name and an individual record.

# Why I didn't just add stub entries myself

1. **No visual ID path.** Neither bird has a leg band mentioned or visible in the
   photos. Plumage alone (solid white; calico/multi-color) isn't enough to safely
   match a specific individual back to a specific *group* roster entry containing
   multiple same-breed juveniles — that's exactly the Henridotta/Ingebird
   near-identical problem the roster skill already warns about, one level harder
   because the source is an anonymous *group* count, not another named individual.
2. **No tool does this.** `bird_photo_ingest.py` only matches photos to *existing*
   individual names in the caption — it has no "promote one bird out of a group count
   and give it an individual record" path. Building that requires a decision on:
   - which juvenile group(s) plausibly contain a white bird and a calico bird (breed
     cross-reference against `breeds` in the JSON — e.g. a pure white bird likely
     traces to a Leghorn/White-something batch, not the RIR-cross groups)
   - how to decrement the group's implicit count / mark one as split out
   - what minimal fields a new individual record needs before a photo can attach
     (name, breed guess, hatch window inherited from the group, sex, status)
3. **Rule against hand-editing `flock-profiles.json`** exists specifically because
   ad hoc edits caused the duplicate-Henridotta-portrait incident (21-Jul-2026).
   Guessing which group these two birds split from and hand-writing new JSON entries
   carries the same risk of a bad edit needing cleanup later — better to get this
   designed properly.

# What's needed (for whoever picks this up — Boss said "Dr. Opus")

- A `promote_juvenile_to_individual` step (or extension to `bird_photo_ingest.py`)
  that: takes a caption naming a new bird + a candidate source group name, creates
  the individual roster record (inheriting hatch_date/breed context from the group),
  and files the photo in the same pass `bird_photo_ingest.py` already does safely.
- Some way to ask the Boss "which group did this one come from?" when it's ambiguous,
  rather than guessing from plumage.

# Immediate status

Photos for "The White Rooster" and the calico rooster are sitting in
`~/.openclaw/media/inbound/` (IMG_9621 = white rooster) — NOT yet filed anywhere.
Nothing was pushed to `farm-2026`. Waiting on the tooling above, or on the Boss
naming which juvenile group each one split from so a manual-but-careful entry can be
made through a real reviewed change instead of a live hand-edit.
