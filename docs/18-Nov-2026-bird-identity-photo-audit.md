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

## Colour sweep, all roster entries (added 18-Nov-2026, later the same day)

Method: one agent per roster entry read its colour text and every photo, checked the leg band against the registry, then three independent skeptics re-checked the verdict, each through one lens (colour and pattern, leg band, non-colour features). 41 entries, 164 agents, no failures. Raw result kept in the session scratchpad.

Overall verdicts: match for 5 entries (Birdadonna, Birdgit, Malt Liquor, White Rooster, Robirda); partial for 29; mismatch for 1 (Black Australorp hen); unverifiable for 6 (Birdatha, Little Big Red Junior, Tractor Supply juveniles, Barred Rocks, Plymouth Rocks, March juveniles). "Partial" is mostly wording detail, not wrong birds.

### Corrections applied to content/flock-profiles.json

- Henridot: colour text and the 16-Sep observation said crisp black-and-white barring over the whole bird, head included. Most frames show a finer, speckled, often silver-grey head. Reworded. The 29-Jul Boss-confirmed observation is left untouched.
- Henriessa, 21-Jul observation: said completely unpatterned, no bars. The band-confirmed frame of that date shows fine lacing and barring. Reworded.
- Birddor: removed the live "re-check, five weeks stale" instruction, since he is deceased; points to the photo record for later frames. The owl death is documented elsewhere and is not a data problem.
- Birdimir: tail is mostly black in the September and October frames, not white barred with black. Speckling sits on the neck and upper breast. Reworded in the colour text and the 19-Sep observation. The 12-Nov caption now says cockerel.

### Identity questions for the Boss (not changed)

- Black Australorp hen: the only photo shows a grey, dark-laced hen with golden-bronze hackle, red comb, yellow legs and a dark tail. It is not a black bird with green sheen. Either the photo is of a different bird or the colour text is wrong. Re-checked by eye.
- Adelbird, 08-Aug frame: crisp black-and-white barring, which the roster reserves for Henridot. Adelbird's record is soft charcoal spangling. Band not legible in that frame. Re-checked by eye, same concern.
- Chonkers and Chonkette: the July hero shows a large golden adult, but Chonkette is described as the smaller one. The 23-Aug Chonkers frame shows a deep orange-red body, not the buff-gold in the colour text.
- Birdthazar: the leg band has colour and side but no number. The Boss-confirmed photo the note cites is not on the bird's photo list.
- Little Big Red Junior: the structured death date is set to late April, which conflicts with the Boss-confirmed note.

### Wording fixes still open (for a next pass)

- Adelbird: the 08-Aug barring frame and the 27-Oct and 08-Nov frames need dated observations rather than the single September line.
- Ingebird: the September line says plumage alone cannot tell her apart from Adelbird, which contradicts the undated backfill. The pale lower-back patch is visible in the July frame.
- Horstabird: the juvenile coat was spotted gold in July but rust-brown with black by August.
- Hawk Food: the November frame is mostly black, so "white body" overstates it there.
- Not Soup: the roster says mahogany-red, the photo and caption say brown with a faint red cast.
- Quasibirdo: the colour text omits the dark head and neck, the strongest feature of the June frame.
- Henriello: the body is slate blue-grey in one line and dark charcoal in the notes. The frames show charcoal in July.
- Birdsilla: the comparison clause "and no black tail" is contradicted by the frames. Its own tail matches Birdthazar's black tail in the September frame.
- Bobirda: the band sentence sits inside the colour description and duplicates the leg band field.
- Tractor Supply May batch: still lists the two Buff Rangers that were split out on 18-Jun.
- Cackle Hatchery cohort and March juveniles: colour text is a group label or a breed expectation, not an observed colour.

### Repository state note

While this work was in progress, another session committed the audit and roster edits, and a rebase marker was present in the repository. Nothing was committed or rebased by this audit. The corrections above are uncommitted working-tree changes on top of that commit.
