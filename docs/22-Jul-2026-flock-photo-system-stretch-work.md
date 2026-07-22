# Flock photo system — stretch / deferred work

**Date:** 22-Jul-2026
**Context:** What shipped in v1.33.0 (per-bird photo timeline, leg-band IDs, homepage-from-roster, Discord bird-drop ingest) works and is live. This is the "later" list — nothing here is blocking; it's the next tier if/when Boss wants it.

## What shipped (one-paragraph recap)

Every bird in `content/flock-profiles.json` has an append-only `photos[]` ledger, backfilled and grown automatically by `farm-guardian/tools/pipeline/bird_photo_ingest.py` on each Discord drop. `/flock` shows an aging strip on every card and links each name to `/flock/[slug]`, a full-size per-bird aging gallery. Leg bands are canonical `leg_band` data rendered as colored `BandChip`s. The homepage "Class of 2026" derives from the roster ornitharchs.

## Stretch work, roughly in priority order

1. **Repo bloat → faster deploys (biggest infra win).** `.git` is ~4.4 GB from ~1,300 committed JPEGs, and every push triggers a full Railway re-clone + rebuild. Move image hosting out of git history (Git LFS, an orphan assets branch, or object storage / a CDN) so the app repo stays small. Large, cross-cutting, but it's the root cause of slow "building forever" deploys.

2. **Date the "undated" legacy photos.** Backfilled shots without a parseable date sort last as "undated." Pull dates from EXIF (or a manual pass) so they slot into the timeline in the right place. Would also let older `history/` and `april-2026/`/`june-2026/` shots be folded into more birds' ledgers.

3. **Gallery UX polish (`/flock/[slug]`).** A "then vs now" first/latest compare (there's already a `ThenAndNow` component to lean on); a click-to-fullscreen lightbox; jump-to-age markers. Currently it's a clean vertical timeline — good, but these would make the aging story pop.

4. **Fill out non-ornitharch timelines.** Adult hens, Robirda, Bobirda, and the turkeys have few photos, so their strips/galleries are thin. This self-heals as Boss drops more (the ledger grows automatically), but a one-time backfill from the other photo dirs would jump-start them.

5. **`#farm-2026` auto-trigger + hook confirmation.** The OpenClaw `bird-photo-trigger` hook is wired to `#meet-the-lobsters`; `#farm-2026` (the website-photo channel) is `requireMention:true`, so a drop there needs an @mention or a dedicated trigger. Also: confirm the real `mediaPath` field on the first live hook fire (the handler logs `event.context` once for this).

6. **Other hardcoded surfaces.** The `/markets` bird tiles (`app/markets/Terminal.tsx`) still don't read the roster. If they should reflect current birds/photos, wire them to `flock-profiles.json` the same way the homepage now is. (The homepage was the one Boss cared about; markets is optional.)

7. **Caption quality + editing.** Ingest captions come from the VLM `caption_draft`. Fine, but a way for Boss to edit/replace a photo's caption (and pick the hero portrait explicitly, vs. always-newest) would tighten the gallery.
