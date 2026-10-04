# Garden Glow-Up — Pumpkins & Gourds on the Public Site

**Date:** 07-Aug-2026 · **Author:** Claude Opus 5 · **Status:** steps 0–3 done, uncommitted; homepage strip not built

**Update, same day.** Phone synced (43 new stills). Bottle gourds **confirmed** —
`IMG_8310`, a white blossom shot 04-Aug 19:55; gourds flower white at dusk where
pumpkins flower yellow in the morning, so the earlier "no gourds" finding was a
sampling artifact of only looking at daytime frames. No fruit set on the trellis
yet. 13 photos exported to `public/photos/garden/` and the field note is written
(`content/field-notes/2026-08-07-the-frontrunner-and-the-houseguest.mdx`).
Remaining: the homepage `GardenStrip`, the docs/CHANGELOG pass, and a commit.

Put this year's garden — the big pumpkin, the squash patch, the harvest — onto
farm.markbarney.net, sourced from the iPhone archive on the Mac Mini.

---

## What I found first (this shapes the plan)

**1. The pumpkin photos exist and they're good.** The 30-Jul-2026 burst in
`198APPLE` is the motherlode: `IMG_8107` is a clean hero shot of the big orange
pumpkin on the vine, wet with rain, blossoms behind it. `IMG_8100/8102/8103/8106/8108/8109/8110`
are the same fruit with a Yorkie beside it — that's your scale reference, and it's
better than a tape measure. `IMG_8111` and `IMG_8112` are squash blossoms.
`IMG_8113` is the harvest tote (zucchini, spaghetti squash, a San Marzano).
Aug 1–4 adds turkeys grazing in the squash patch and a sunflower.

**2. Two gaps, and I think they have the same cause.** You said pumpkins *plural*
and bottle gourds; what I can see is **one** frontrunner pumpkin and **no gourd
fruit in the ~60 frames I sampled** out of the 1,861 in the 20-Jun→05-Aug window.
That's a sample, not a search — I can't say the archive lacks them.

What I can say: the gourd trellis is there and empty-looking (`IMG_8075`, blue
netting, vines climbing, no fruit hanging), and the harvest tote at full size
(`IMG_8113`) is zucchini + spaghetti squash + tomatoes, no gourd. The single
pumpkin is also *consistent* with the plan — the 30-Jul diary entry records the
decision to keep the best one or two fruits and cull the backups.

So both gaps resolve the same way: the season moved on and the archive didn't
follow. See item 0.

**3. The phone hasn't been plugged in since Aug 5, 18:40.** `~/iphone-backup/status.sh`
reports `iPhone: not plugged in` — the watcher is ON and healthy, just idle with
nothing to talk to. Peak pumpkin/gourd size in Hampton is *right now*, so the
best frames of the season are probably sitting on the phone unsynced.

**4. Six garden photos are already committed and orphaned.** `public/photos/garden/`
was populated on Aug 3 (`abd9466`, "staged for the homepage garden section") —
swallowtails, garden beds, turkeys in the squash — and is referenced **nowhere**
in `app/`, `content/`, or `lib/`. This work should absorb those, not run parallel to them.

**5. There is no searchable photo index yet.** The nightly cataloguer has
described 1,249 of 80,581 stills (1.5%); searching it for "pumpkin" returns zero.
Selection is manual for now — which is fine at this scale, and noted so nobody
assumes an index exists.

---

## Scope

**In**

- Export 10–14 curated garden frames into `public/photos/garden/`.
- One field note, `content/field-notes/2026-08-07-the-pumpkin-patch.mdx`, drawn
  from the existing raw note `content/diary/30-Jul-2026-garden-haul-and-a-frontrunner-pumpkin.md`.
- A homepage garden strip (`app/components/home/GardenStrip.tsx`) — one wide hero
  + a small row, linking through to the field note.

**Out**

- No new social lane. These are website photos; the IG/FB pipelines are
  Discord-gated and live on the Mini (CLAUDE.md).
- No new page route, unless you pick Option B below.
- No re-theming, no touching the Guardian dark islands.
- No changes to `lib/gems.ts` or the live camera surfaces.

---

## Architecture

**Placement.** A field note is the documented main content type, and
`getAllFieldNotes()` already feeds the `/field-notes` feed and slug pages with no
code change. The homepage strip is one new server component + one line in
`app/page.tsx`, following the `app/components/home/` pattern.

**Where the strip goes.** After `RecentGemsRail`, before the INDEX list — the
garden is a slower, seasonal story and shouldn't displace the birds or the live
cameras at the top. Say if you'd rather it sat higher.

**Field-note frontmatter — read from the files, not the docs.** Per
[lib/content.ts:236](lib/content.ts:236) and `content/field-notes/2026-07-25-farm-notebook.mdx`:
`cover` is a single **site-absolute** path (`/photos/garden/…`), and `photos` is a
list of **objects** (`- src: … / caption: …`), not bare strings. `tags` is a flat
array.

> Two stale claims in `docs/FRONTEND-ARCHITECTURE.md` found while checking this:
> it describes a homepage `LatestFieldNote` block that [app/page.tsx](app/page.tsx)
> does **not** render, and it writes field-note `photos[]` in a way that reads as
> plain paths. Both get fixed in the docs pass below.

**Photo pipeline.** Three things must happen to every exported frame, and two of
them are traps I verified by hand:

| Step | Why |
|---|---|
| Bake EXIF rotation into pixels | `sips` leaves `Orientation: Rotate 90 CW` as a *tag*. Strip metadata without baking first and every photo renders sideways. |
| Strip all metadata | The originals carry `GPSLatitude 41°44'40"N / GPSLongitude 72°04'09"W` — the house. Same spirit as the no-owner-name rule (FRONTEND-ARCHITECTURE rule 4). |
| Resize + requantize | v1.37.0 shrank the pack from 4.75 GiB → 1013 MiB six days ago. Full-res exports walk that back. |

Verified recipe (`PIL.ImageOps.exif_transpose` → `thumbnail(2000)` → `save(quality=72,
optimize, progressive)`, no `exif=` argument). On `IMG_8107` it produced an
upright 1500×2000 JPEG at **467 KB**, GPS and Make gone — squarely inside the
380–800 KB band the existing `garden/` files already occupy. Naming follows
those files: `descriptive-slug-DDmmmYYYY.jpg`.

**Budget:** ≤600 KB per photo, ~8 MB total for the set.

**Emoji.** `lib/emoji.ts` already exports `GARDEN` (🎃 / 🥒 / 🌽) with a comment
saying it's ready if the garden gets a page. Use it as-is; invent nothing.

---

## TODOs

0. **Plug the iPhone into the Mac Mini.** The watcher picks it up within 2 min.
   This is what gets Aug 6–7 frames — and is the best shot at bottle gourds.
   *Verify:* `~/iphone-backup/status.sh` shows a fresh "copied N photos" line.
1. **Tell me which days you shot the gourds and the other pumpkins.** With the
   catalogue at 1.5%, you are by far the cheapest index on this machine — one
   answer beats another sampling pass. I'll build a contact sheet of those dates
   plus the 30-Jul burst and whatever the sync brings, and we pick the keepers.
2. Export the picks through the verified recipe into `public/photos/garden/`.
   *Verify:* `exiftool -GPSLatitude -Orientation` returns empty on every file;
   every file ≤600 KB.
3. Write the field note from the 30-Jul diary entry, using the frontmatter
   contract above (`tags: [garden, pumpkins]`).
   *Verify:* it appears at `/field-notes` and its slug page renders with the
   gallery populated.
4. Build `GardenStrip.tsx` — with the CLAUDE.md file header (Author / Date /
   PURPOSE / SRP-DRY) — absorbing the six orphaned Aug-3 files. One line into
   `app/page.tsx` after `RecentGemsRail`.
   *Verify:* `npm run build` clean; homepage renders upright photos at desktop
   and mobile widths in the browser preview.
5. Update docs + CHANGELOG (below).

---

## Two shapes — pick one

**Option A (recommended).** Field note + homepage strip. Matches "include some
pictures," reuses existing content machinery, ships in one pass.

**Option B.** Everything in A, plus a `/garden` page — a season arc from June
seedlings through harvest, with the trellis and the beds. Needs a `PAGE_MARKS`
entry, a `SiteNav` link, and a route. Real build, and it wants the whole
season's photos catalogued first. Worth doing in the fall when the harvest is in;
A doesn't block it.

---

## Docs / changelog touchpoints

- `CHANGELOG.md` — new minor entry (1.38.0): garden photos, field note, homepage strip.
- `docs/FRONTEND-ARCHITECTURE.md` — add `public/photos/garden/` to the SSoT table;
  fix the two stale claims found above (the `LatestFieldNote` homepage block, and
  the field-note `photos[]` shape).
- `CLAUDE.md` — add `garden/` to the `public/photos/` inventory line.
