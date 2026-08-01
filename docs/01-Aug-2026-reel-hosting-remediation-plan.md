# Reels don't belong in git — remediation plan

**Date:** 01-Aug-2026
**Author:** Claude Opus 5 (Bubba)
**Status:** plan — awaiting approval
**Measurements:** `docs/01-Aug-2026-repo-size-assessment.md`

---

## What's broken

A reel MP4 exists for one reason: to give Meta a public URL to fetch **once**. After the
Instagram container reaches `FINISHED`, Meta serves the video off its own CDN and the file
is garbage.

We commit it to git forever.

346 MP4s. **3.9 GB.** 79% of `public/photos/`. Nothing on the site links to them — `grep`
for `.mp4` and `/reels/` across `app/`, `lib/`, `content/`, and `scripts/` returns zero
hits. No visitor has ever been shown one. They are pure transport, archived permanently by
accident.

Every push to `main` redeploys Railway, which then pulls a 4.8 GB tree, ~80% of which is
video the container will never serve.

---

## The fix already exists in this codebase

On **04-May-2026** the *stories* lane had this exact problem and it was solved properly.
`images_api.py` grew:

```
GET /api/v1/images/story-assets/{filename}
```

— serving 9:16 JPEGs off the Mini's `data/story-assets/` through the Cloudflare tunnel,
with a `.jpg`-terminated URL Meta's fetcher accepts. From its header:

> *"This gives ig_poster a .jpg-terminated public HTTPS URL that Meta's Graph API media
> fetcher accepts, replacing the raw.githubusercontent.com approach."*

It worked. `public/photos/stories/` **stopped growing that same day** — 334 files, frozen
at 2026-05-04, three months ago. The stories lane has posted through the tunnel ever since
without incident.

The reel lane just never got migrated.

**So: no Cloudflare R2, no second repo, no new service, no new credentials.** Do for reels
what was already done for stories, with the same file as the template.

---

## Phase 1 — reels never enter git

**In farm-guardian:**

1. `data/reel-assets/` on the Mini — same shape as `data/story-assets/`.
2. `GET /api/v1/images/reel-assets/{filename}` in `images_api.py`. Copy the story-asset
   handler; serve `Content-Type: video/mp4`. Path must end `.mp4` — that extension is the
   whole reason media ended up in this repo in the first place.
3. The reel lane writes the MP4 there and feeds Meta
   `https://guardian.markbarney.net/api/v1/images/reel-assets/<name>.mp4`
   instead of calling `git_helper`. **No commit, no push, no farm-2026 involvement.**
4. TTL sweep: delete local reel assets older than **48 h**. The URL is only touched during
   ingest, so an hour would do — 48 h is free and leaves room for a retry.

**One thing to get right:** the file must stay reachable until the container reaches
`FINISHED`, not just until the initial `POST /media`. `ig_poster.py` already polls for this
and notes reels take **30–60 s**. FB's video post needs the same window. Delete only after
both confirm.

**Coverage:** five LaunchAgents still produce reels — `ig-daily-reel`,
`ig-s7-daily-reel`, `ig-s7-weekly-gems-reel`, `ig-duo2-timelapse-reel`,
`ig-house-yard-cam-timelapse-reel`. They all route through the same poster, so this is one
change, not five.

**Risk:** the tunnel has to be up for a 30–60 s window instead of GitHub. The story lane
has run exactly this way since May. Fine.

---

## Phase 2 — purge the 3.9 GB already banked

### The rule blocking this is based on a misreading

`CLAUDE.md` says don't rewrite history because it "could theoretically break past post URLs
if IG ever re-fetches." **That reasoning doesn't hold here.**

Every URL this system has ever handed Meta is a **branch ref**:

```
raw.githubusercontent.com/VoynichLabs/farm-2026/main/public/photos/...
                                                 ^^^^
```

I grepped both repos — there is not one SHA-pinned URL anywhere, and
`git_helper.py:_github_raw_url` is explicit that it uses the branch name deliberately.

A history rewrite changes **commit SHAs**. It does not change **what is at the tip of
`main`**. So every photo that stays on `main` keeps its exact URL, byte for byte, before
and after. The only URLs that break are for files *removed from main* — which is precisely
the reels we're throwing away on purpose.

The rule would be correct if we pinned SHAs. We don't. It should be corrected to say so.

### Blast radius: near zero

No branches. No open PRs. No tags. One human contributor and some cron jobs. Railway
re-clones on the next push by itself. The usual reason not to rewrite — "you'll break
everyone's clones" — has no *everyone* here.

### Steps

```bash
brew install git-filter-repo
```

1. Pick a quiet hour and unload the reel + pipeline LaunchAgents so nothing pushes mid-flight.
2. Fresh mirror clone → `git filter-repo --path public/photos/reels --invert-paths` → force-push.
3. Re-clone `~/GitHub/farm-2026`. **Also re-clone whatever `farm_2026_repo_path` in
   farm-guardian's `config.json` points at** — that's the checkout the posters actually
   write to, and it must not be left on the old history or the next push re-uploads
   everything.
4. Add `public/photos/reels/` to `.gitignore` so nothing can re-add it by reflex.
5. Reload the agents.

Do Phase 1 first. Purging before the source is capped just refills it.

### Expected result

| | Before | After |
|---|---|---|
| GitHub repo | 4.74 GB | **~0.9 GB** |
| Checkout / Railway pull | 4.92 GB | **~1.0 GB** |
| Growth | 1.28 GB/mo | **~0.32 GB/mo** |

---

## Fallback, only if Phase 1 slips

Ten lines: after the reel publish confirms, `git rm` the MP4, commit, push. Shrinks the
checkout and the Railway pull immediately; does **not** shrink GitHub's number, because
blobs stay in the pack. Phase 2 makes it moot — don't bother if Phase 1 is landing soon.

---

## While you're in there

The four disabled timelapse lanes (`usb-cam`, `mba-cam`, `gwtc`, `dominator`) left **2.3 GB**
behind — the largest single category in the repo. Two are still running: `duo2` and
`house-yard`, at **20–33 MB per file**, the heaviest producers on the farm.

Worth asking: does anyone watch these? If they exist mainly because the pipeline can make
them, turning those two agents off is the biggest remaining saving and costs zero
engineering. Not blocking — Phase 1 makes them cheap either way.

---

## Separate bug, found while measuring — you should know

**Yard-diary captures have been landing in a directory that isn't a git repo since ~30-Jul.**

`~/Documents/GitHub/farm-2026/` is a stub — just `content/` and `public/`, no `.git`. But
several farm-guardian modules hardcode `Path.home()/"Documents"/"GitHub"/"farm-2026"`
(`bird_photo_ingest.py:85`, `roster.py:37`, `daily_reel_runner.py:624,633`) instead of
reading `farm_2026_repo_path` from config the way `orchestrator.py` does.

Currently orphaned there, never committed, never served:

- `public/photos/yard-diary/` — `2026-07-31-{morning,noon,evening}.jpg`, `2026-08-01-{morning,noon}.jpg`
- `content/diary/` — `30-Jul-2026-garden-haul-and-a-frontrunner-pumpkin.md`, `31-Jul-2026-ravenessa-crows.md`

The real repo's last yard frame is **2026-07-29**. `/yard` has been three days stale and
the timelapse stockpile has a hole in it.

Fix is in farm-guardian (point those modules at the config path), not here — flagging it
because the files are recoverable right now and the hole grows every day the capture keeps
running into the void.
