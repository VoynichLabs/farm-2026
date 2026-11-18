# Bird identity and photo audit — 18-Nov-2026

Author: Claude Haiku 5.5 (effort: low)
Date: 18-Nov-2026
PURPOSE: Adversarial check of whether each named bird's portrait is the bird it is filed under. Ground truth is the leg band registry (content/flock_bands.json), a visible band on the leg, then plumage. Scope is names and pictures only, as the Boss asked.
SRP/DRY check: Pass — this doc is an audit record; it changes no code. The one data edit is noted below.

## Method

1. Joined every roster bird's photo field to the file on disk. All roster photo paths resolve.
2. Joined the band registry and the roster leg_band fields. Registry and roster agree on every band that appears in both.
3. Opened the hero frame (the `photo` field the site shows) for each Ornitharch bird, plus the hero frames for several contested non-Ornitharch birds, and checked any visible band number or colour against the registry.

## Verified by visible band (identity holds)

- Henridot — hero frame shows a purple band on the left leg (registry: purple #12).
- Birdadotta — hero frame shows an orange band (registry: orange #10).
- Birdimir — hero frame shows a red band (registry: red #3).
- Henriessa — hero frame shows a pink band numbered 08 (registry: pink #8).
- Ingebird — the 19-Sep group frame shows a green band on the right-hand bird (registry: green #2).
- Adelbird — hero frame shows a blue band numbered 07 (registry: blue #7).
- Birdsilla — hero frame shows a white band numbered 03 (registry: white #3).
- Horstabird — hero frame shows a yellow band (registry: yellow #2).
- Robirda — frame IMG_7744 shows an orange band numbered 01 (registry: orange #1 right leg).
- Henridot, 16-Sep frame — purple band visible on the leg, consistent with Henridot.

## Identity holds but the caption was wrong (fixed)

- Adelbird hero caption said "rust-and-black streaked hen". The frame is a dark blue-black speckled hen with blue band 07. The bird is right; the caption described Birdadotta's plumage. Caption corrected in content/flock-profiles.json (photo ledger, Adelbird). No file was renamed or moved.

## Cannot be confirmed from the frame (flagged, not changed)

- Henriello hero (IMG_7791): black head, slate body, pink leg band. Plumage matches Henriello's roster description. Henriello (pink #3) and Henriessa (pink #8) both wear pink, and the band number is not legible in that frame. Needs a frame showing the number.
- Birddor hero (IMG_9640): copper and grey rooster, matches the copper-chestnut description. No leg band visible, so the yellow #1 registry entry cannot be checked. Birddor is recorded as deceased yet carries the Ornitharch flag; the Ornitharch page feeds from that flag without a status filter, so a dead bird is listed on the program roster. Boss to decide whether that is intended.
- Chonkette hero (s7 frame, 25-Jul): shows a large golden adult. The roster describes Chonkette as the smaller, less developed Buff Ranger and Chonkers as the larger one. The hero may be Chonkers. Needs a Boss check against the 18-Jun group frame, where the left bird is the smaller one.
- Bobirda (IMG_7742): frame shows a red-brown crested bird with no legible band. The white #6 band cannot be checked.
- Ravenello (IMG_5958): frame shows a young black bird. The filename uses the old name Ravenessa. Plumage is consistent with a bantam cockerel but the frame does not confirm the bird.
- Birdimir sex: roster temperament says "presumed male" while every caption calls it a hen. Unresolved in the record; the Boss should settle it.

## Shared or ambiguous portraits

- Barred Rocks and Plymouth Rocks point at the same arrival photo.
- Several group frames (Birdthazar with Birdsilla, the Henriello and Birdsilla frame, the Ingebird, Henriessa and Henridot trio) cannot serve as a single-bird portrait for one entry. The site currently uses single-bird frames for the heroes, so this is a background risk, not a live error.

## Not changed, by rule

- No file under public/photos was renamed or moved. Stale filenames such as ravenessa, henriella and henridotta stay as they are; the published raw URLs depend on them.
- Plumage descriptions in color_observations were not rewritten. Those entries carry provenance notes that dates were deliberately not inferred.
- The worktree copy under .claude/worktrees was not touched.

## Still open for the Boss

1. Confirm Chonkers or Chonkette in the July hero frame.
2. Settle Birdimir's sex.
3. Decide whether a deceased bird should appear on the Ornitharch program page.
4. Provide a frame that shows the Henriello band number.
