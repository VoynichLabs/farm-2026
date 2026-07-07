# Hatch Records — Schema

Source of truth for every incubator-hatched bird on the farm. **One file per chick.**
Files live in `content/hatches/<year>/`. The truth is the records — any roll-up / index file is rebuildable from them and is never edited by hand.

Designed so we can ask the lobsters about any bird and get grounded answers, and so next year's hatches can be compared against this year's (down-color → adult-plumage calibration).

---

## File layout

```
content/hatches/
  SCHEMA.md                              (this file)
  2026/
    2026-04-06-01-birdadette.md
    2026-04-25-01-birdadotta.md
    2026-05-16-01-birdthazar.md
    ...
```

Filename = `<id>-<name-or-shortdesc>.md`. The name suffix is convenience only; the `id:` field inside is canonical. Rename the file freely when a chick gets named — the `id` doesn't change.

---

## Full schema (YAML frontmatter + free-text notes)

```yaml
id: 2026-04-06-01              # YYYY-MM-DD-NN (hatch_date + ordinal within that day)
clutch_id: OI-2026-03-16       # <incubator>-<egg_set_date>
egg_id: ""                     # if the egg itself was marked, e.g. "4/25-blue-A"

# Hatch event
hatch_date: 2026-04-06
hatch_time: ""                 # HH:MM EDT if known
incubator: OI                  # OI (old) or NI (new) — only two units exist
egg_set_date: 2026-03-16
egg_color: ""                  # blue / brown / green / cream / etc.

# Lineage
breed: ""                      # best current guess; refine over time
parent_hen: ""                 # if known
parent_rooster_window: ""      # e.g. "LBRJ" or "LBRJ-or-WRL"
parentage_confidence: low      # low / medium / high / confirmed

# Identity
name: ""                       # empty until named
status: alive                  # alive / lost / rehomed

# Photos
photos:
  - path: ""                   # repo-relative, e.g. "public/photos/april-2026/birdadette-fresh-hatch.jpg"
    confidence: medium         # low / medium / high — how sure we are this is this chick
    caption: ""
    date: 2026-04-06           # optional — the day the photo was taken; drives the
                               # age tag ("hatch day" / "day 8" / "3 wks") on the
                               # rotating portrait tiles on /flock (added 06-Jul-2026)
    showcase: false            # optional — set false for documentation frames
                               # (equipment, thermometers, mislabeled files) that
                               # belong in the record but not in the bird's
                               # portrait rotation; omit for normal bird photos

# Evidence trail — links to diary entries, photos, or source documents
evidence:
  - "diary:2026-04-06-hatch-day-and-new-arrivals.md"

# Dated phenotype observations — append-only growth log
phenotype_observations:
  - date: 2026-04-06
    age_days: 0
    observed:
      down_color: ""
      markings: ""
      leg_color: ""
      distinguishing_features: ""
      sex: unknown            # unknown / pullet / cockerel / hen / rooster
    prediction:
      expected_adult_plumage: ""
      expected_sex: ""
      confidence: low         # low / medium / high
      reasoning: ""           # why we think that — parentage, down pattern, etc.
    notes: ""

# Filled in only once the bird is adult; otherwise omit this block.
adult_outcome:
  date_reached_adult: ""
  actual_plumage: ""
  actual_sex: ""
  prediction_review:
    - observation_date: 2026-04-06
      plumage_match: partial  # yes / no / partial
      sex_match: yes
      notes: ""

# Lifecycle milestones
lifecycle:
  named_date: ""
  moved_to_brooder_date: ""
  moved_to_coop_date: ""
  current_location: ""        # incubator / brooder / coop / pen / free-range
  lost_date: ""
  lost_cause: ""

# One-line summary written ONCE, after the bird is grown — "if you read nothing else"
lifecycle_summary: ""
```

Free-text notes go in the markdown body below the frontmatter.

---

## Conventions

- **Empty fields are fine.** Most fields fill in over time. Empty ≠ broken.
- **Append-only `phenotype_observations`.** Never edit a past entry; add a new one. Chicks change fast, and the record of that change is the point.
- **Free text for plumage, markings, etc.** No enums — hobby-flock descriptions don't fit a controlled vocabulary.
- **`parentage_confidence` is required** when `parent_hen` or `parent_rooster_window` is non-empty. Egg color alone is medium at best.
- **`adult_outcome` only when the bird is grown.** That's when prediction-review becomes meaningful.
- **No frontend logic lives here.** Roll-ups, lineage trees, breed pages — all derived. If a derived file gets stale, rebuild it.
