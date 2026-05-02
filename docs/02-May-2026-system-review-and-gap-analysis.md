# Farm Guardian + farm-2026 — System Review & Gap Analysis

**Date:** 2026-05-02
**Reviewer:** Claude Opus 4.7
**Scope:** `farm-2026` (frontend) and `farm-guardian` (backend) as of today
**Audience:** Other devs working on either repo
**Status:** Boss has asked for instructions for devs, not code. Items below are scoped at "what to change and where," not patches.

---

## Why this doc exists

Boss is doing the physical farm work — feeding the flock, building the new enclosure, recommissioning hardware. The software side has to carry its weight without his weekly intervention. That means:

- It should run unattended through host reboots, network blips, and individual camera failures.
- It should surface its own problems instead of silently hiding them.
- It should make adding/removing cameras a config edit on the Mac Mini, not a frontend code change.

This doc lists the gaps that violate one of those three rules, and what to do about each.

---

## The design fact that drives everything

**The fleet is dynamic.**

- `mba-cam` was decommissioned 2026-04-15 and is being recommissioned right now (2026-05-02).
- `iphone-cam` is opportunistic — present only when Boss's phone is plugged into the Mini.
- Sub-hosts (GWTC laptop, MacBook Air, S7 phone, USB-cam host) come and go on their own schedules.
- New cameras get added via `farm-guardian/scripts/add-camera.py` with no frontend redeploy.

**Implication:** anything in either repo that hardcodes "the four cameras," "five cameras," or any other fixed number is wrong. The single source of truth is the live `/api/cameras` response from Guardian. The frontend `lib/cameras.ts` is correctly framed as a *metadata overlay only* (read its file header) — keep it that way.

If a future PR introduces a fixed-fleet assumption, reject it.

---

## TL;DR — priority gaps

**P0 (block reliable operation through active farm season):**
- **E1** — The social pipeline is committing every gem story / carousel image / reel video into the frontend repo's `public/photos/` and pushing to GitHub. **Stop this.** It's bloating git history forever, triggering a Railway redeploy on every IG post, and serving no rendering purpose for stories/carousels/reels (which the site doesn't render — they're just IG posts).
- **A1** — Mac Mini reboot leaves the system dark; Guardian and the pipeline daemon are launched via manual `nohup`, not LaunchAgents.
- **B2** — Frontend silently *hides* offline cameras instead of showing them as offline. Root cause of "only Reolink shows on the live site."
- **C1** — Public Guardian project page does not document how the system works, what it depends on, or what to do when it breaks.

**P1 (important during active farm season):**
- **E2** — Frontend has a parallel image archive in `public/photos/` that duplicates what the backend's gems API already serves. Surfaces that need images (e.g., `/yard`) should consume the API, not the filesystem.
- **B1** — Public Guardian MDX hardcodes a camera count and table; needs to render from `/api/cameras`.
- **B3** — Frontend ignores backend's authoritative `is_live` / `last_frame_age_seconds` fields (added in farm-guardian v2.37.5).
- **A2** — No monitoring on the Cloudflare tunnel; if it drops, no one knows until Boss looks at the site.
- **D3** — No contract check between farm-guardian's API and farm-2026's `types.ts`. Backend has shipped 28 minor versions since the last frontend type update.

**P2 (hardening):**
- A3, A4, B4, B5, B6, C2, C3, D1, D2, E3, E4, E5 — see below.

---

## Section A — Recovery & resilience

### A1. Mac Mini reboot recovery (P0)

**What's missing.** Per `farm-guardian/HARDWARE_INVENTORY.md` line 25: `guardian.py` is started via "manual `nohup`, PID varies." Same for `tools.pipeline.orchestrator`. These are the two processes the entire public site depends on. If the Mini reboots — power blip, OS update, kernel panic, anything — both stay down until Boss SSHes in and re-runs `nohup ./venv/bin/python guardian.py >> guardian.log 2>&1 & disown`.

For comparison, the things on the Mini that *do* auto-recover via launchd: `cloudflared` tunnel (`com.cloudflare.tunnel.farm-guardian.plist`), `usb-cam-host` (`com.farmguardian.usb-cam-host.plist`), `iphone-cam-host`, the social-pipeline schedulers, and the s7-settings-watchdog. Guardian itself is conspicuously not on that list.

**Why it matters.** This is the single largest reliability gap in the system. During active season the Mini will reboot at least once for OS updates, and a power blip in rural Hampton, CT is plausible.

**What to do.**
1. Write `deploy/mac-mini/com.farmguardian.guardian.plist` (LaunchAgent or LaunchDaemon — pick LaunchAgent since the existing `com.cloudflare.tunnel.farm-guardian.plist` is one). It should `cd` to the repo, run `./venv/bin/python guardian.py`, and use `KeepAlive=true` so launchd respawns on crash.
2. Same for `tools.pipeline.orchestrator` — separate plist.
3. Output redirected to `~/Library/Logs/farm-guardian/guardian.log` with rotation (lnav or `newsyslog.conf`).
4. Update `farm-guardian/HARDWARE_INVENTORY.md` line 25 once these are in place.
5. Acceptance test: `sudo shutdown -r now` on the Mini → wait 5 minutes → `curl -s https://guardian.markbarney.net/api/status` returns `online: true` without human intervention.

**Owner.** Backend dev, with Boss to verify the reboot test on the Mini.

### A2. Cloudflare tunnel monitoring (P1)

**What's missing.** The tunnel is the single ingress for the entire public site. There's no alerting if it drops. The frontend's `useGuardianRoster` ([lib/guardian-roster.ts:60-62](lib/guardian-roster.ts#L60-L62)) deliberately swallows errors so the rail doesn't blink during normal hiccups — that's correct UX, but it means a sustained outage is invisible.

**Why it matters.** "Only Reolink shows" → "the whole tunnel is down for 3 hours and we didn't notice" is the same class of problem with worse blast radius.

**What to do.**
1. Add a Cloudflare-side health probe that hits `https://guardian.markbarney.net/api/status` every minute and pages on 3 consecutive failures (Discord webhook → Boss's existing alert channel; reuse `farm-guardian`'s alert plumbing).
2. Better: also probe per-camera frame endpoints once a minute and track in a small time-series so we can answer "when did each camera last serve a frame to a public client."
3. Surface "site connectivity OK" as a top-of-page badge in `farm-2026` (separate from per-camera state) so a tunnel drop is distinguishable from a camera-host drop.

**Owner.** Backend dev for the probe + alerting; frontend dev for the badge.

### A3. Sub-host watchdog uniformity (P2)

**What's missing.** Auto-recovery is uneven across sub-hosts:
- **GWTC** has `farmcam-watchdog` (Shawl service) for the dshow-zombie pattern. ✓
- **S7** has `com.farmguardian.s7-settings-watchdog` for orientation drift after IP Webcam process death. ✓
- **MBA** had no farm-side watchdog while it was active before 2026-04-15. **As Boss recommissions it, give it one.**
- **USB-cam-host** is a LaunchAgent so launchd handles process death. ✓

**What to do.** As part of the MBA recommission, write `deploy/macbook-air/com.farmguardian.mba-watchdog.plist` analogous to GWTC's `farmcam-watchdog.ps1`. The pattern to watch for is: MediaMTX is up but ffmpeg push is dead → restart ffmpeg.

**Owner.** Backend dev, in tandem with Boss recommissioning the MBA.

### A4. Backup & disaster recovery (P2)

**What's missing.** No documented backup strategy for the Mini. If its disk dies:
- `farm-guardian/database.sqlite` (detection history, gem catalog, captions) — gone.
- Image archive on disk (gem JPEGs) — gone.
- `config.json` for the camera fleet — gone but reconstructible from `config.example.json` + memory.
- Social-pipeline ledgers (`tools/social/ledger.py` storage) — gone, meaning duplicate-post protection is gone.

**What to do.**
1. Time Machine to an external disk on the Mini, OR rsync nightly to the Boss's MSI Katana 15 HX (already on the LAN at 192.168.0.3 per HARDWARE_INVENTORY).
2. Off-site copy of `database.sqlite` and the `config.json` files — even just a daily Discord upload of the SQLite file would be enough to recover the system to "yesterday."
3. Document the recovery procedure in `farm-guardian/docs/DISASTER-RECOVERY.md`. New file. Should be readable by a dev who has never SSHed into the Mini.

**Owner.** Backend dev, then Boss to plug in the external disk.

---

## Section B — Frontend gaps

### B1. Public Guardian MDX hardcodes the camera roster (P1)

**What's wrong.** [content/projects/guardian/index.mdx:22](content/projects/guardian/index.mdx#L22) opens with "Five cameras — named for the hardware…" and renders a static markdown table with five rows including `mba-cam`. As of 2026-05-02:
- The actual public roster from `/api/cameras` returns 4 (with `mba-cam` mid-recommission).
- Tomorrow it could be 5 again. Next month, 6.
- Either way, the static table is wrong nearly all the time.

**Why it matters.** This is the public face of the project. Visitors who see the dashboard load 1-3 live tiles and then read "five cameras" below it draw the obvious conclusion. Also: as soon as Boss adds a 6th camera, the MDX silently lies until someone hand-edits it.

**What to do.**
1. Replace the hardcoded table with a server component that fetches `/api/cameras` at request time and renders the table from the response. Reuse `useGuardianRoster`'s logic (extract a server-safe helper) so the rail and the MDX-region table can't drift.
2. Drop the camera count from prose ("Five cameras…") and lead with "The current fleet — what Guardian sees right now:" so the count is whatever the table renders.
3. Keep the `lib/cameras.ts` overlay for nice display labels, but **the table rows come from the API, not from the overlay**. Unknown cameras get `resolveCameraMeta`'s defaults — already in place.

**Owner.** Frontend dev.

### B2. Smart-visibility hides offline cameras silently (P0)

**What's wrong.** [app/components/guardian/GuardianCameraStage.tsx:121-129](app/components/guardian/GuardianCameraStage.tsx#L121-L129) partitions cameras into "visible" and "hidden" — offline cams are kept polling but rendered in a `hidden` div. This was a deliberate v1.4.x decision to avoid flashing dead tiles. **It is also the direct cause of the user-reported symptom "only Reolink shows on the live site."** Boss has no way to see whether `s7-cam` is offline because the host is asleep, because the IP Webcam app crashed, or because someone unplugged it — the tile just isn't there.

**Why it matters.** During active season, knowing *which* camera is broken is half the diagnostic work. Hiding the failure makes the system look like it's working when it isn't.

**What to do.** Add a small **fleet status panel** below the live feeds on `/projects/guardian` (and a compact variant for the homepage). It should:
- List every camera in the live `/api/cameras` response, regardless of state.
- For each: name, hardware label (from `lib/cameras.ts` overlay), `is_live` from backend, `last_frame_age_seconds` from backend, and the host machine where the source lives (from a backend addition — see B3).
- Color-code: green for live, amber for stale (frame age > stale_after_seconds), red for hard-offline (no frame for >5 min).
- This panel renders **everything**. The smart-visibility tile grid keeps doing what it does for the *featured* viewing experience.

The two surfaces have different jobs: the tile grid is "what's worth watching"; the fleet panel is "what's the fleet's health right now."

**Owner.** Frontend dev, leans on B3 first.

### B3. Frontend ignores backend's authoritative liveness fields (P1)

**What's wrong.** `farm-guardian` v2.37.5 added `is_live`, `last_frame_age_seconds`, and `stale_after_seconds` to every entry in `/api/cameras`. The frontend's `useGuardianRoster` ([lib/guardian-roster.ts:33-39](lib/guardian-roster.ts#L33-L39)) explicitly throws those fields away ("we only need the name") and re-derives liveness via per-feed snapshot polling, which takes `OFFLINE_THRESHOLD * POLL_INTERVAL = ~12s` of failed polls before flipping to offline.

**Why it matters.** The backend already knows. Faster, more accurate state, and consistent with what the LAN-side dashboard sees.

**What to do.**
1. Broaden the `RawCamera` type in [lib/guardian-roster.ts:33-39](lib/guardian-roster.ts#L33-L39) to include `is_live`, `last_frame_age_seconds`, `stale_after_seconds`, and `online`.
2. Either extend `CameraMeta` with these or return a parallel `cameraStatus: Record<string, BackendCameraState>` from the hook. Don't muddle "metadata overlay" with "live state" — they have different lifecycles.
3. `GuardianCameraFeed` continues to do its own snapshot polling for the actual JPEG, but it can use the backend `is_live` as a faster signal that something is wrong (skip the 12s wait when the backend already reports the camera dead).
4. The fleet panel from B2 reads from this state.

**Owner.** Frontend dev. Backend should add a `host` field (e.g. `"mac-mini"`, `"gwtc"`, `"s7"`) to the `/api/cameras` response so the panel can show source host without the frontend having to maintain its own host map.

### B4. Hard-coded API base URL (P2)

**What's wrong.** [app/components/guardian/types.ts:14](app/components/guardian/types.ts#L14) has `export const GUARDIAN_API = "https://guardian.markbarney.net";` baked in. Every component imports from there. There is no env-var override.

**Why it matters.** Right now: low. There's only one Guardian backend. But:
- Local development against a dev tunnel or LAN URL requires a code edit + revert.
- Railway preview deploys can't point at a staging Guardian.
- If Boss ever stands up a second Guardian (e.g., during a migration), there's no way to do a soft cutover.

**What to do.** Replace with `process.env.NEXT_PUBLIC_GUARDIAN_API ?? "https://guardian.markbarney.net"`. Document the env var in `CLAUDE.md` Commands section and in Railway. Default stays the same so prod is unaffected.

**Owner.** Frontend dev. Trivial change.

### B5. No frontend telemetry / error reporting (P2)

**What's missing.** No Sentry, no LogRocket, no error boundary that reports anywhere. If a build regression breaks the Guardian dashboard for users, no one knows until Boss notices.

**What to do.** Add Sentry (or equivalent) with `NEXT_PUBLIC_SENTRY_DSN`. Wire up a top-level error boundary. Filter out known noise (Cloudflare tunnel hiccups → already swallowed by `useGuardianRoster`).

**Owner.** Frontend dev.

### B6. Hero rotation is one-deep (P2)

**What's wrong.** [app/components/home/Hero.tsx:24-28](app/components/home/Hero.tsx#L24-L28) calls `fetchGems({ limit: 1 })` and uses that single image as the hero background. If the gems API hiccups (or returns the same gem N requests in a row because of caching), the hero looks frozen.

**Why it matters.** The hero is the most prominent surface on the site. Visual variety signals "this thing is alive."

**What to do.** Fetch ~10 strong gems server-side, pick one pseudo-randomly per request (or rotate by date). Even a `slice(Math.floor(Date.now() / 3600_000) % rows.length)` would give an hourly rotation without client JS. Keep the existing fallback for when the API is fully down.

**Owner.** Frontend dev. ~10 lines.

---

## Section C — Public documentation gaps

### C1. No "How it works" + "When it breaks" page (P0)

**What's missing.** Boss explicitly asked for the public site to document the technology under the hood. Today, [content/projects/guardian/index.mdx](content/projects/guardian/index.mdx) has a "What This Is" section, a hardware table, a "How It Watches" overview, and a "Story" section. It does not have:
- An honest architecture writeup (distributed multi-host, snapshot polling, Cloudflare tunnel, detection pipeline status).
- A "When things break" section (Mac Mini reboot, host disconnection, phone freeze, tunnel drop, etc.).
- Links to the two GitHub repos.
- Any indication that the system is built end-to-end with Claude Code.

**Why it matters.** The visitors who care enough to click through to `/projects/guardian` are exactly the ones who want this depth. Right now they get a story and a hardware table — which are charming but incomplete.

**What to do.** Extend the MDX with three new sections:
1. **Under the Hood** — distributed architecture (Mini coordinates, sub-hosts publish frames), capture stack (Reolink HTTP snapshots, IP Webcam HTTP, USB-cam-host FastAPI service, GWTC ffmpeg→MediaMTX), Cloudflare tunnel rationale, snapshot polling rationale (HTTP/1.1 connection limits, ~1.2s cadence), detection plumbing (YOLOv8 + GLM-4V via LM Studio, currently paused), pipeline / "gems" curation, frontend stack (Next.js 16, Tailwind, Railway), and that the entire thing was built with Claude Code.
2. **When Things Break** — what auto-recovers (Cloudflare tunnel, usb-cam-host, GWTC dshow-zombie watchdog, S7 settings watchdog) vs what needs hands (Guardian core process, pipeline daemon — see A1; phone freeze; physical USB unplug; DHCP drift on GWTC). Honest, not alarming.
3. **Where the Code Lives** — links to `github.com/VoynichLabs/farm-guardian` and `github.com/VoynichLabs/farm-2026`.

Keep the existing voice — current MDX is well-written. New sections should match that tone, not read like internal docs.

**Owner.** Frontend dev. Pull facts from `farm-guardian/HARDWARE_INVENTORY.md` and `farm-guardian/CHANGELOG.md`.

### C2. Cross-repo documentation linkage (P2)

**What's missing.** `farm-2026/CLAUDE.md` mentions the related `farm-guardian` repo at the top (good) but does not point at the operational SSoTs:
- `farm-guardian/HARDWARE_INVENTORY.md` — the canonical list of "what hardware exists, what host runs what, what name to use." Frontend devs need this; right now they'd have to know it exists.
- `farm-guardian/docs/HOW_IT_ALL_FITS.md` and `farm-guardian/docs/SOCIAL_MEDIA_MAP.md` — system architecture and social pipeline overviews.

**What to do.** Add a "Cross-repo references" section to `farm-2026/CLAUDE.md` linking to those three docs. Reciprocally, `farm-guardian/CLAUDE.md` should link back to this gap-analysis doc.

**Owner.** Whoever ships C1 should also ship C2.

### C3. Social pipeline docs may be stale (P2)

**What's missing.** `farm-guardian` has shipped massive changes to `tools/pipeline/`, `tools/social/`, `tools/ig-engage/`, `tools/nextdoor/`, `tools/on_this_day/` — plus 14+ launchd plists in `deploy/ig-scheduled/`, `deploy/nextdoor/`, etc. — over the last three weeks. `HOW_IT_ALL_FITS.md` and `SOCIAL_MEDIA_MAP.md` exist but their date-of-last-update isn't visible at the top.

The frontend doesn't directly consume the social pipeline (v1.11.0 explicitly retired `InstagramFeed` in favor of static external links — good call), so this is not a frontend gap. It's a backend operational gap that affects active-season reliability.

**What to do.**
1. Audit `farm-guardian/docs/HOW_IT_ALL_FITS.md` and `SOCIAL_MEDIA_MAP.md` against the current state. Add a `Last verified: YYYY-MM-DD` stamp at the top, like `HARDWARE_INVENTORY.md` already does.
2. Build a single "what runs when" timetable from the launchd plists in `deploy/`. There are 14+ scheduled jobs across `ig-scheduled/`, `nextdoor/`, `pipeline/`, `s7-settings-watchdog/`, `iphone-cam-watchdog/`, etc. Boss should be able to read one page and know "10am: ig-daily-carousel runs; 2pm: pipeline-digest fires; 8pm: ig-daily-reel; etc."

**Owner.** Backend dev.

---

## Section D — Operational gaps

### D1. No deployment runbook (P2)

**What's missing.** There's no single page that says "the frontend deploys via Railway on push to main" / "the backend is restarted by SSHing into the Mini and running X" / "to add a camera you do Y." The pieces exist (`HARDWARE_INVENTORY.md` Adding a New Camera section is excellent for that one workflow), but a dev onboarding to either repo has no entry-point doc.

**What to do.** Add `farm-2026/docs/DEPLOY-AND-OPERATE.md` covering:
- How the frontend deploys (Railway, what triggers redeploy, where logs are).
- How to verify a deploy succeeded.
- How to roll back.
- How to point at a different Guardian backend for staging (depends on B4).
- Quick reference to `HARDWARE_INVENTORY.md` for backend ops.

Same on the backend side.

**Owner.** Frontend dev for the frontend half; backend dev for the backend half.

### D2. No central "what runs where" index (P2)

**What's missing.** Across both repos there are at least 20 long-running processes/services (Guardian core, pipeline orchestrator, cloudflared, usb-cam-host, iphone-cam-host, s7-settings-watchdog, GWTC's mediamtx + farmcam + farmcam-watchdog, MBA's three plists when active, plus 14+ social-pipeline launchd jobs). HARDWARE_INVENTORY.md's "What Runs Where" table covers some but not all.

**Why it matters.** When something breaks, the dev needs to know "is this thing supposed to be running? What restarts it?" without reading 30 plist files.

**What to do.** Extend `HARDWARE_INVENTORY.md`'s "What Runs Where" table to cover all daemons with: name, host, restart mechanism (LaunchAgent / Shawl service / cron / manual), log location, and "what depends on it."

**Owner.** Backend dev.

### D3. No contract check between the two repos (P1)

**What's missing.** `farm-2026/app/components/guardian/types.ts` was last meaningfully updated 2026-04-14. `farm-guardian` has shipped from v2.18 → v2.38.4 since then — new endpoints, new fields, new error shapes. There is no automated check that the types match the live API.

**Why it matters.** Silent contract drift is the worst kind of bug. The page won't error; it'll just render undefined fields or miss data. During active season this is the kind of thing that breaks two weeks after the change and nobody can find the cause.

**What to do.** Two acceptable approaches, easiest first:
1. **Cheap:** A `scripts/check-guardian-contract.ts` in `farm-2026` that fetches a small set of endpoints (`/api/status`, `/api/cameras`, `/api/v1/images/recent?limit=1`) and asserts the response matches expected shapes (use `zod` or hand-rolled type guards). Wire to CI on push. Failure means types need updating.
2. **Better:** Backend exposes OpenAPI at `/api/openapi.json` (currently disabled per `farm-guardian/dashboard.py:39`); frontend generates types from it via `openapi-typescript` in CI. Backend devs change the API → frontend types regenerate on next build → typecheck fails on drift.

**Owner.** Backend dev to enable OpenAPI export; frontend dev to wire generation. Either approach unblocks fast detection.

---

---

## Section E — Critical architectural feedback (cross-repo)

This section is the "push back" Boss asked for. Each item is a design decision that looks wrong and should be defended or fixed. Not all of them are P0, but they all warrant a conversation.

### E1. The social pipeline auto-commits gem images into the website repo (P0 — biggest single piece of bad engineering in the system right now)

**What's happening.** Look at `git log --oneline` on `farm-2026` for the last week. Sample:

```
831e7fe public/photos/stories: gem 26586 story (ig auto)
3a04f34 public/photos/stories: gem 26014 story (ig auto)
12d12cd public/photos/stories: gem 25556 story (ig auto)
... (tens more per day)
b685bc9 public/photos/carousel/2026-05-01: gem 56418 (10/10, ig carousel auto)
3566ecd public/photos/reels/2026-05: reel from gems [44525, 44822, 46321]... (ig auto)
```

The Instagram poster scripts on the Mac Mini (in `farm-guardian/tools/pipeline/ig_poster.py`, `scripts/ig-*.py`, and friends) are running `git add` + `git commit` + `git push` against the `farm-2026` repo every time they post. Stories, carousels, reels — every IG-bound asset gets committed. Git histories show ~30+ such commits in the last 4 days; there are hundreds of files in `public/photos/stories/` already.

**Why this is wrong, ranked:**

1. **Git history is permanent.** Every JPEG ever auto-posted is now part of `farm-2026`'s history forever. You cannot delete them later without rewriting history (which breaks every clone). Story JPEGs are 300KB–1.4MB. At current cadence the repo grows by 10–30 MB/day, indefinitely. In a year this is a 4–10 GB repo for what is structurally a small marketing site.
2. **Every push triggers a Railway redeploy** (unless explicitly filtered, which I doubt — verify in Railway settings). So every IG story restarts the production frontend. Cold-start latency on every post.
3. **Reels are committed too.** Those are *videos*. Git is famously bad at storing binaries; LFS exists for a reason and isn't being used. Even with LFS, this is the wrong tool.
4. **No rendering benefit.** The site does not render `/photos/stories/`, `/photos/carousel/`, or `/photos/reels/` anywhere. Per [v1.11.0](CHANGELOG.md), Boss explicitly retired the curated-IG-embed approach in favor of "follow us on Instagram" external links. Instagram already hosts these images. The committed copies serve nothing.
5. **The backend already has an image archive** at `/api/v1/images/*` with thumb_url, full_url, scoring tiers, captions, and pagination. That's where curated frames live. Duplicating them into the frontend's `public/` is two sources of truth for the same data.

**What to do.**
1. **Stop the auto-commits immediately.** In `farm-guardian/tools/pipeline/ig_poster.py` (and the other IG scripts), strip the `git add` / `git commit` / `git push` calls. Posting to IG should not touch git.
2. **Decide where the assets live.** Three reasonable choices: (a) keep them on the Mac Mini's image archive volume and serve via `/api/v1/images/<id>/full` through the Cloudflare tunnel; (b) push them to Cloudflare R2 / S3 and reference by URL; (c) don't keep them at all — IG is the only consumer, and IG hosts them after posting. Option (c) is fine for stories/carousels/reels because IG is the destination. Option (a) or (b) is right for anything the website needs to render.
3. **Add `public/photos/stories/`, `public/photos/carousel/`, `public/photos/reels/` to `.gitignore`.** Future posters that mistakenly drop files there won't pollute history.
4. **Decide what to do about historical bloat.** The committed images are already in git history. Options: (i) accept the bloat (cheapest), (ii) `git filter-repo` to nuke them (rewrites history, breaks all clones — only do once with everyone aligned), (iii) wait until enough has accumulated to make (ii) worth the disruption. Defer this decision; (i) is fine for now if you stop the bleeding via step 1.
5. **For the yard-diary case** (`public/photos/yard-diary/` — 3 images per day, 45 in the last 15 days, the `/yard` page actually renders them) — this is option (a) territory: serve via the backend image archive API, not via filesystem. Frontend fetches a list from an endpoint like `/api/v1/yard-diary?since=...` and renders. The page becomes data-driven; no commits needed.

**Owner.** Backend dev who maintains the IG poster scripts. Frontend dev to verify nothing in the site actually consumes the about-to-be-removed paths (other than `/yard`, which needs the API path before the filesystem path is removed).

### E2. The frontend duplicates the backend's image archive (P1)

**What's wrong.** Same root cause as E1 from a different angle. The backend has a curated image archive (gems pipeline → SQLite + JPEG store → REST API). The frontend has `public/photos/` with `april-2026/`, `birds/`, `coop/`, `enclosure/`, `guardian-detections/`, `history/`, `yard-diary/`, plus the auto-committed stories/carousel/reels. There is no clean separation between "static design assets that ship with the build" and "content that's part of the curated archive."

**Why it matters.** Two sources of truth for "where do farm photos live" means:
- Adding a new photo requires a decision: commit to repo, or push to backend? No documented rule.
- The gems API can't serve the photos in `public/photos/birds/` (e.g., `whitey-red-legs.jpg`) because they're in the frontend repo, not the backend's archive.
- The flock roster card photos (e.g., `birds/birdadette.jpg`) are unrelated to the gems pipeline; they were hand-curated and committed. Fine in isolation, but it means the flock UI is built one way and the gallery UI is built another.

**What to do.** Define a rule and write it down in `farm-2026/CLAUDE.md`:
- `public/photos/` is for **static design assets** only: hero fallback, breed-reference graphics, any image that's part of the visual design and rarely changes.
- **All curated content photography** (yard-diary, gems gallery, field-note covers, flock-roster portraits) goes through the backend image archive. Frontend fetches by API.
- Migrate over time. Don't try to do it all in one PR.

**Owner.** Architectural decision needs Boss's signoff first; then frontend dev to define the rule, backend dev to extend the archive API to cover roster portraits.

### E3. `lib/cameras.ts` is hardware metadata in the wrong repo (P2)

**What's wrong.** `farm-2026/lib/cameras.ts` is a "metadata overlay" — for each camera name, it provides `label`, `shortLabel`, `device`, `aspectRatio`. Its file header correctly notes that this is *not* the roster (which is dynamic from `/api/cameras`); it's display strings only.

But `farm-guardian/HARDWARE_INVENTORY.md` is the canonical hardware document. It already knows "Reolink E1 Outdoor Pro" is the device behind `house-yard`. The frontend overlay duplicates that knowledge in TypeScript, with the explicit instruction in HARDWARE_INVENTORY.md that any change to a camera requires updating *both* files.

**Why it matters.** Single source of truth violation. When Boss recommissions `mba-cam` today, both `HARDWARE_INVENTORY.md` and `lib/cameras.ts` need updates. When the labels diverge (which already happened — see HARDWARE_INVENTORY's "13-Apr-2026 incident" anecdote about "Brooder" labels), nobody can tell which is right.

**What to do.** Backend's `/api/cameras` should return `label`, `short_label`, `device`, `aspect_ratio` per camera, sourced from the same config that drives the rest of HARDWARE_INVENTORY. Frontend deletes `lib/cameras.ts`; `useGuardianRoster` uses backend-provided strings. The metadata lives in one repo (the one with the canonical HARDWARE_INVENTORY) and the frontend reads it.

Push back I expect: "but we want to render historical camera names in gem filters even when those cameras are gone." Fine — backend can also expose a "historical roster" endpoint, or the frontend can cache prior roster responses. Either way, two static lists in two repos is the wrong answer.

**Owner.** Backend dev to extend `/api/cameras`; frontend dev to delete `lib/cameras.ts` once the API is shipped.

### E4. Documentation sprawl, especially `farm-guardian/docs/` (P2)

**What's wrong.** `farm-guardian/docs/` has ~80 dated planning docs: `13-Apr-2026-*.md`, `14-Apr-2026-*.md`, etc. Each is a one-shot plan written before some specific change. After the change ships, the plan is rarely deleted, archived, or updated. There is no index. New devs reading the repo can't tell which plans were implemented, which were abandoned, and which describe current behavior.

`farm-2026/docs/` has the same pattern but smaller (~25 files).

**Why it matters.** Onboarding cost compounds. A new dev (or a future agent) trying to understand "how does the snapshot polling actually work today" has to read three or four superseded plan docs before finding the one that reflects current code. Time wasted, and worse — risk of acting on a stale plan.

**What to do.**
1. Each plan doc should have a `Status:` header at the top with one of `proposed | in-progress | implemented | abandoned | superseded by <link>`.
2. Implemented and abandoned plans go to `docs/archive/` after their PR merges. They're history, not current state.
3. The "current state" docs (HARDWARE_INVENTORY.md, HOW_IT_ALL_FITS.md, SOCIAL_MEDIA_MAP.md) live in `docs/` root and are kept up to date with `Last verified: YYYY-MM-DD` stamps — `HARDWARE_INVENTORY.md` already does this; the others should follow.
4. A short `docs/README.md` indexes the current-state docs and points at the archive for plans.

**Owner.** Backend dev for the bigger cleanup; frontend dev for the smaller version.

### E5. No CI on either repo (P2)

**What's missing.** Neither repo has a GitHub Action, pre-commit hook, or any automated check on PRs. So:
- The "device-only naming" rule from HARDWARE_INVENTORY.md is never enforced. The 13-Apr-2026 incident (multiple cameras labeled "Brooder") could recur tomorrow.
- Type drift between repos is invisible (D3).
- A `npm run lint` failure or `npm run build` failure ships without anyone noticing.
- New plan docs without `Status:` headers (E4) ship without enforcement.

**What to do.** Minimal viable CI per repo:
- `farm-2026`: GitHub Action runs `npm ci && npm run lint && npm run build` on every PR. Block merge on failure.
- `farm-guardian`: At minimum `python -m py_compile` on every `.py` file and a check that `config.example.json` parses. Linting (`ruff`) if buy-in.
- Cross-repo contract check (D3) wires in once it exists.

**Owner.** One dev per repo, ~2 hours each.

### E6. Three places for Instagram-posting logic (backend) (P2)

**What's wrong.** In `farm-guardian`:
- `tools/pipeline/ig_poster.py` — 1730 lines. The "main" IG poster, integrated with the gems pipeline.
- `tools/ig-engage/` — separate package for IG engagement (replies, comments).
- `scripts/ig-2hr-story.py`, `scripts/ig-daily-carousel.py`, `scripts/ig-daily-reel.py`, `scripts/ig-post.py`, `scripts/ig-weekly-reel.py` — five top-level scripts, each invoked by its own launchd plist.

That's three layers of Instagram code. Some of `scripts/ig-*.py` is probably a thin wrapper around `tools/pipeline/ig_poster.py`; some duplicates logic; some is orthogonal. From outside it's not legible which.

**Why it matters.** Bug fixes have to hunt across three places. Behavior changes ripple unpredictably. Active-season operational confidence requires "I know where this code lives."

**What to do.** Pick a target structure (likely: `tools/social/` as the package, `scripts/ig-*.py` as launchers, `tools/ig-engage/` folded in or kept separate with a clear contract), document it in `HOW_IT_ALL_FITS.md`, refactor incrementally. Don't bundle the refactor into a feature PR — do it on its own.

**Owner.** Backend dev. Worth a half-day refactor sprint before the active-season load increases.

### E7. Backend has two parallel API surfaces with different contracts (P2)

**What's wrong.** From the audit of `farm-guardian`:
- `dashboard.py` registers routes under `/api/*` (e.g., `/api/cameras`, `/api/cameras/{name}/frame`, `/api/status`).
- `api.py` registers routes under `/api/v1/*` (e.g., `/api/v1/status`, `/api/v1/cameras/{id}/snapshot`, `/api/v1/images/*`).

The frontend uses both — `/api/cameras` from dashboard, `/api/v1/images/*` from api. There's no documented reason for the split, and `/api/status` and `/api/v1/status` return *different shapes* for the same logical question.

**Why it matters.** This is the kind of thing that grows hair the longer it's left. Today there are 2 places; tomorrow if a dev needs a new endpoint, they pick whichever they read first, and now there are 3 conventions.

**What to do.** Consolidate. Pick one (probably `/api/v1/*` since it's versioned), migrate the dashboard routes under it, mark the unversioned routes as deprecated for one release, then remove. OpenAPI export (currently disabled at `dashboard.py:39`) becomes meaningful once the surface is unified.

**Owner.** Backend dev.

### E8. The "OpenAPI is disabled" decision (P2)

**What's wrong.** `farm-guardian/dashboard.py:39` explicitly sets `docs_url=None` to disable FastAPI's auto-generated docs. There's no comment explaining why.

**Why it matters.** OpenAPI/`/docs` is the single biggest free win FastAPI gives you. Disabling it without a documented reason is throwing away contract-as-data, which is exactly what's needed to fix D3 (frontend type generation).

**What to do.** Either re-enable it (likely the right call), or add a comment explaining what it was disabled to mitigate (security exposure? Hidden endpoints? Performance?). If security: gate it behind an auth check rather than disabling outright.

**Owner.** Backend dev — 2-line change plus a decision.

---

## What NOT to do (failure modes for future PRs)

- **Don't hardcode camera names anywhere in code paths.** The metadata overlay in `lib/cameras.ts` is the only allowed place to mention a specific camera by name, and that file's header explains the rule. If a PR introduces `if (camera === "house-yard")` logic, push back — the right discriminator is a backend-provided capability flag (e.g., `camera.supports_ptz`).
- **Don't treat `/api/cameras` as having a fixed length or fixed names.** Render whatever it returns. Degrade gracefully on unknown names (already handled by `resolveCameraMeta`).
- **Don't add "remove this once X is fixed" comments without filing an actionable item.** Stale TODOs accumulate; instead, open a doc entry here or a tracked issue.
- **Don't ship anything that requires Boss to manually restart a process to recover from a transient failure.** Auto-recovery is a hard requirement during active season — if it's not automatic, it doesn't exist.
- **Don't remove `mba-cam` from `lib/cameras.ts`.** Boss is recommissioning it as of today. The overlay-as-historical-roster design (see file header) handles this correctly already.

---

## Cross-references

- **`farm-guardian/HARDWARE_INVENTORY.md`** — canonical hardware/host SSoT. The model for how this kind of doc should be written.
- **`farm-guardian/CHANGELOG.md`** — backend version history. Useful when chasing contract drift.
- **`farm-2026/CHANGELOG.md`** — frontend version history.
- **`farm-2026/CLAUDE.md`** — frontend project conventions.
- **`farm-2026/lib/cameras.ts`** — read its file header before changing anything camera-related.
- **`farm-2026/lib/guardian-roster.ts`** — read its file header before changing anything roster-related.

---

## Closing

Every gap above has at least one "WHAT TO DO" with file paths or component names. None of them are cosmetic — each one corresponds to a way the system fails Boss during active season, or a way it lies to the public, or a way it accumulates technical debt that compounds.

If you only do four things from this list, do **E1**, **A1**, **B2**, and **C1** — in that order. E1 (stop committing IG output to git) is the single piece of bad engineering that compounds fastest. A1 is the biggest reliability gap. B2 is the most visible UX bug. C1 is the most-visible documentation gap.

This doc is meant to be argued with. If something in here is wrong, push back in a follow-up doc or commit. The aim is alignment on what's broken, not a unilateral checklist.
