# Content Pipeline — How Weekly Updates Work

This is the operational guide for any developer (human or Claude) adding content to farm.markbarney.net.

## Weekly Field Notes

The site publishes weekly farm updates as "Field Notes" — narrative, photo-heavy MDX files.

### Where they live

```
content/field-notes/
  2026-04-06-birdadette-hatches.mdx
  2026-04-08-a-hard-week-for-the-flock.mdx
  2026-04-09-the-command-center.mdx
```

### How to write one

1. Create `content/field-notes/YYYY-MM-DD-slug-here.mdx`
2. Frontmatter:

```yaml
---
title: "Your Title Here"
date: "2026-04-15"
cover: "/photos/april-2026/some-cover-image.jpg"
photos:
  - src: "/photos/april-2026/photo1.jpg"
    caption: "What this shows"
  - src: "/photos/april-2026/photo2.jpg"
    caption: "What this shows"
tags: [flock, guardian, whatever-fits]
---
```

3. Write the MDX body. Narrative voice — not a blog post, not a changelog. Tell what happened.
4. The homepage automatically picks up the latest field note as the featured card.
5. `/field-notes` page auto-generates from all MDX files, sorted newest first.

### Photos

- Put new photos in `public/photos/` — use subdirectories by month (`april-2026/`, `may-2026/`)
- Reference them in frontmatter as `/photos/april-2026/filename.jpg`
- CRITICAL: After committing, verify photos exist on disk AND in the git commit. They can be lost during directory operations. Run: `git ls-tree -r HEAD -- public/photos/ | grep your-file`

## Content Sources for Writing Updates

When starting a weekly update session, check these sources:

### 1. Guardian Daily Reports
```
~/Documents/GitHub/farm-guardian/data/exports/
```
JSON + Markdown per day. Contains: detection counts, species breakdown, peak activity hours, alert summaries.

### 2. Guardian Detection Images
```
~/Documents/GitHub/farm-guardian/events/
```
Date-organized folders with timestamped detection snapshots. Filename format: `{HHMMSS}_{confidence}_{class}.jpg`. Pick high-confidence interesting ones for the site.

### 3. Guardian API (live)
```
curl http://localhost:6530/api/status
curl http://localhost:6530/api/cameras
curl http://localhost:6530/api/detections/recent?limit=20
```
Use for real-time stats in field notes.

### 4. Guardian Changelog
```
~/Documents/GitHub/farm-guardian/CHANGELOG.md
```
Version history — every entry credits Claude Opus. Good for writing about system development.

### 5. Raw Developer Notes
```
content/diary/
```
The other developer (Bubba / another Claude session) sometimes drops raw notes here. These are source material for field notes — not published directly.

### 6. Flock Roster
```
content/flock-profiles.json
```
The authoritative bird database. Update when birds hatch, arrive, die, or change status. Includes breeds, photos, deceased records with dates and causes.

### 7. Photos on the Mac Mini
```
~/Pictures/                                 # Full iPhone photo library (~2800+ photos, all seasons)
~/Documents/GitHub/farm-guardian/docs/     # Command center photos, setup shots
~/bubba-workspace/art/                      # Farm art, hawk photos
~/bubba-workspace/projects/farm-vision/     # Aerial maps, drawings
```

**Photo assessment:** See `docs/10-Apr-2026-photo-assessment.md` for a complete catalog of which `~/Pictures/` photos are usable for the website, organized by category (hero banners, hatching story, flock portraits, seasonal, etc.) with skip lists.

**Breed identification:** See `docs/cackle-hatchery-breed-id.md` for individual chick photo-to-breed mapping for the 15 Cackle Hatchery chicks.

**HEIC conversion:** Photos from the iPhone are HEIC format. Convert with:
```bash
sips -s format jpeg -Z 1200 ~/Pictures/IMG_XXXX.HEIC --out public/photos/april-2026/filename.jpg
```
Most photos need 90° rotation. Keep EXIF data intact.

## Flock Roster Updates

`content/flock-profiles.json` is the single source of truth. `content/flock.json` is deprecated — ignore it.

When a bird dies:
- Set `"status": "deceased"` 
- Add `"deceased_date"` and `"cause_of_death"` fields
- Check if the bird appears in the homepage flock preview grid (`app/page.tsx`) and swap it out

When birds arrive:
- Add entries to `flock_birds` array
- Group entries are fine: `"name": "Turkey poults (3)"`
- Add breed to `breeds` object if it's new

## Guardian Dashboard

The website has two places that show Guardian cameras:

1. **Homepage** (`app/page.tsx`) — uses `GuardianCameraFeed` client component
2. **Guardian project page** (`/projects/guardian`) — uses `GuardianDashboard` orchestrator

Camera names come from the Guardian config. As of v2.11: `house-yard`, `s7-cam`, `usb-cam`. If the other developer adds/renames cameras, update both locations.

The `GuardianCameraFeed` component handles offline cameras gracefully — shows "OFFLINE" with the camera label. No manual intervention needed when cameras go down.

## Enclosure Project (Shelved)

`content/projects/chicken-enclosure-2026/` is archived as an AI design showcase. Don't delete it — the 3D models and drawings are interesting artifacts.

## Build & Deploy

```bash
npm run build    # Builds + copies to standalone
git push         # Railway auto-deploys from main
```

The site deploys to `farm.markbarney.net` via Railway. Guardian API is at `guardian.markbarney.net` via Cloudflare tunnel to the Mac Mini.

## Voice & Tone

- This is a farm, not a startup. Write like a person, not a pitch deck.
- Show what Claude built — don't oversell it. The work speaks for itself.
- "Watching over" not "monitoring." "Looking after" not "surveilling."
- The Mac Mini is Claude's home. The cameras are its eyes. The birds are in its care.
