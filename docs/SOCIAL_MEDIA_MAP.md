# Social Media Automation Map — farm-2026 ↔ farm-guardian

> **Audience:** any LLM assistant working in this repository that needs to know where farm-2026's photos and videos end up on social media, and how content flows between this repo, farm-guardian, and the public surfaces.
>
> **Canonical version:** [`farm-guardian/docs/SOCIAL_MEDIA_MAP.md`](https://github.com/VoynichLabs/farm-guardian/blob/main/docs/SOCIAL_MEDIA_MAP.md). Edit there first; mirror non-credentialed changes here. Do not fork the operational details (file paths on the Mac Mini, kill switches, LaunchAgent config) into this repo — they belong in farm-guardian only.

**Last updated:** 2026-04-26

## How farm-2026 fits in

farm-2026 is the public-facing website at [farm.markbarney.net](https://farm.markbarney.net). It does **not** run any social-posting code. What it does is host the photos and videos that the social pipelines reference:

- The Mac Mini's gem-lane and on-this-day pipelines commit photos / videos into `public/photos/{stories,carousel,brooder,yard-diary,on-this-day}/...`, push to GitHub, and feed Instagram's Graph API the resulting `raw.githubusercontent.com` URLs (Graph rejects URLs not ending in a media file extension, so the Cloudflare-tunnelled Guardian API can't be used directly for IG media fetches — the Git push round-trip is the working pattern).
- Don't revert those auto-commits. Don't rename the destination subdirs. Don't add them to any CI / lint / size-budget gate. They arrive asynchronously and the social pipelines will republish stale URLs if the path changes.

## Outbound surfaces (what gets posted, where, when)

| Surface | Cadence | Source | Trust gate |
|---|---|---|---|
| **Instagram `@pawel_and_pawleen`** — story | every 2h | live-camera reacted gems (FIFO; cap = IG's rolling 24h publish quota) | Discord `#farm-2026` reaction count > 0 |
| **Instagram** — carousel | daily 18:00 ET | today's reacted strong+sharp gems | same |
| **Instagram** — reel | Sundays 19:00 ET | week's reacted strong+sharp gems, ffmpeg-stitched | same |
| **Facebook Page "Yorkies App"** | mirrors every successful IG post | tail-called from `ig_poster` success branches | same — FB inherits IG's gate |
| **IG / FB Stories — on-this-day archive** | every 90 min | iPhone photo catalog (years 2022 / 2024 / 2025; 2023 deliberately skipped) | automated keyword filter (farm/pet keywords in; predators/receipts/screenshots out) — NO Discord gate |
| **Nextdoor — Hampton CT neighborhood** | 08:00 ET throwback + 18:30 ET today | 1 reacted archive photo + 1 reacted live-camera gem per day | Discord `#farm-2026` reaction. Audience hard-locked to "Your neighborhood · Hampton only". |
| **Twitter / X** | not active | — | dropped 2026-04-23 after investigation (no OAuth bridge, separate cookie-lift not built) |

## Inbound surfaces (curation, engagement, reciprocity)

| Surface | What it does |
|---|---|
| **Discord `#farm-2026`** | The reaction-quality-gate every outbound lane (except on-this-day) reads. The Mac Mini scrapes reaction counts every 30 minutes and records them on its `image_archive` table. |
| **IG engagement (`@pawel_and_pawleen`)** | Likes / comments / story-reactions on others' content. Daily caps: 30 / 10 / 20. Session-based, not continuous. |
| **Nextdoor engagement** | Likes / comments on neighbors' posts. Daily caps: 10 / 3. |
| **FB reciprocate harvester** | Pulls who's been engaging with the Page so the operator can manually click back. |

## Key conventions farm-2026 contributors should respect

- **Photos in `public/photos/stories/` are 9:16 portrait (1080×1920)**; carousel is 1:1 or landscape; brooder is mixed. The IG / FB pipelines frame these crop-aware.
- **`@pawel_and_pawleen` is the dogs' Instagram account** (two Yorkies, Pawel and Pawleen). The farm cross-posts to that handle. There is no separate "farm" handle. Nothing about "the farm account" — it's the same account.
- **The website never publishes to social directly.** All posting is initiated by farm-guardian on the Mac Mini.
- **Hampton, CT** is the operator's town and is fine to reference. Specific street / address is not.
- **The brooder private notes are internal-only** and never get rendered into any public-facing component (`BrooderPrivateNotes` etc. — if you see it, it's gated).

## Why this doc exists in farm-2026 even though no posting code runs here

Because LLM assistants working in farm-2026 routinely need to answer questions like "is this photo going to be on Instagram?" or "why is there a `public/photos/yard-diary/` directory full of timestamped JPEGs?" without context-switching to the farm-guardian repo. Having the high-level surface map here lets that work happen without leaving the Next.js codebase.

## Pointers

- [farm-guardian canonical version (full operational detail)](https://github.com/VoynichLabs/farm-guardian/blob/main/docs/SOCIAL_MEDIA_MAP.md)
- [farm-guardian/CLAUDE.md](https://github.com/VoynichLabs/farm-guardian/blob/main/CLAUDE.md) — full operating context for the Mac Mini side
- [`CLAUDE.md`](../CLAUDE.md) — this repo's contributor / agent guide
- [`CHANGELOG.md`](../CHANGELOG.md) — site-side changelog
