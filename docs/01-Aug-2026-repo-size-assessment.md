# Repository size — assessment

**Date:** 01-Aug-2026
**Author:** Claude Opus 5 (Bubba)
**Status:** assessment only — nothing implemented, no files deleted, no config changed
**Scope:** measure the problem, price the options, recommend. Implementation is a separate decision.

---

## Summary

GitHub reports the repo at **4.74 GB**. It is growing by **~1.28 GB per month**, and **~75% of that is reel MP4s** that no page on the site ever serves and no code in this repo references.

Two measurements decide everything below:

1. **The pack (4.69 GiB) is the same size as the current checkout (4.92 GB of blobs at HEAD.)** Nothing has ever been deleted, so history contains essentially no dead weight. *History is not the problem — the current tree is.*
2. **A shallow clone saves nothing.** Full clone: 39 s, 4.8 GB `.git`. Shallow `--depth 1`: 36 s, 4.8 GB `.git`. Three seconds apart, because the cost is the tree at HEAD, not the commits behind it.

Together those kill the two levers people normally reach for. History rewriting — already prohibited — would also recover almost nothing, so the prohibition costs us no options. Shallow-cloning the deploy is a non-fix.

**Given "no history rewrite," the pack can only ever grow. The only remaining question is how fast.** Only one option changes that number: stop committing reels. Everything else improves deploy and checkout while GitHub keeps climbing.

**One timing note:** GitHub recommends repositories stay under 1 GB and strongly recommends under 5 GB, with accounts past that potentially hearing from Support. At 4.74 GB and ~42 MB/day, this repo crosses 5 GB in roughly a week. That is a soft guideline, not an automatic cutoff — but it moves this from "someday" to "this month."

---

## Measurements

All taken 01-Aug-2026 on the Mac Mini against `main` at `16e4a98`.

### Size

| Metric | Value | Source |
|---|---|---|
| GitHub's reported repo size | **4.74 GB** (4,975,400 KB) | `gh api repos/VoynichLabs/farm-2026` |
| Local pack | **4.69 GiB**, 12,647 objects, 1 pack | `git count-objects -vH` |
| Blobs live at HEAD | **4.92 GB** | `git ls-tree -r -l HEAD` |
| `public/` on disk | 4.9 GB | `du -sh` |
| Full working dir (incl. `node_modules`, `.next`) | 10 GB | `du -sh` |
| Commits | 1,869 (since 2026-04-09) | `git rev-list --count` |

**Pack ≈ HEAD tree is the finding that matters.** In a repo with meaningful churn the pack is much larger than the checkout, because it carries deleted and superseded versions. Here they are the same number: every byte in history is a file that is still there. Nothing has been deleted, and the media files are already-compressed JPEG/MP4 that neither delta nor zlib can shrink further.

### Clone cost — measured

| Clone type | Wall time | `.git` | Total on disk |
|---|---|---|---|
| Full (`--no-local`) | **39 s** | 4.8 GB | 9.7 GB |
| Shallow (`--depth 1`) | **36 s** | 4.8 GB | 9.7 GB |

Local disk-to-disk, so this is a **floor**, not what anyone experiences. Over a network the same 4.8 GB transfer at 100–300 Mbps is roughly **2–7 minutes before a single npm package is installed**.

The shallow result is the informative one: depth-1 fetches only the objects reachable from one commit, and it still comes to 4.8 GB — confirming from a second direction that the entire cost is the current tree.

### Railway build duration — not measured

The Railway CLI is installed but **no project is linked** in this working copy, and linking would change state on the account, so I did not run it. Build duration is therefore **unmeasured** and should be read off the Railway dashboard before committing to any option.

The proxy: Railway's builder pulls a **4.8 GB** source tree from GitHub on every deploy, then Next.js copies `public/` into the served output. Source fetch almost certainly dominates the build, and roughly 80% of that fetch is reel MP4s that the site never serves.

### Growth rate

| Window | Added | Method |
|---|---|---|
| Last 30 days, **all files** | **1.28 GB** (327 files) | sum of blob sizes for files added since the 30-day-ago commit |
| Last 14 days, **reels only** | 441 MB | filename dates × file sizes |
| Last 7 days, **reels only** | 231 MB | same |

These reconcile: reels run ~32 MB/day ≈ **0.96 GB/30 d**, which is **~75%** of the 1.28 GB total. The remaining ~0.32 GB/month is the photo lanes — carousel, stories, yard-diary, on-this-day.

Straight-line projection at 1.28 GB/month: **5 GB in ~1 week, ~9 GB by Feb 2027, ~16 GB by Aug 2027.**

### What the weight actually is

`public/photos/reels/` — **346 MP4s, 3.9 GB, 79% of all `public/photos/`:**

| Family | Files | Size | Still producing? |
|---|---|---|---|
| Per-camera timelapses (duo2, usb-cam, mba-cam, gwtc, house-yard, dominator) | 129 | **2.32 GB** | yes — house-yard through 2026-08-01, duo2 through 07-31 |
| `s7-daily` | 68 | 697 MB | yes — through 07-30 |
| `s7-backlog` | 87 | 670 MB | yes — through 07-28 |
| `reel-daily` (gem reels) | 61 | 466 MB | yes — through 07-29 |

Largest single file 33 MB; no file anywhere near GitHub's 100 MB per-file block. The timelapse family alone is 2.3 GB — **60% of all reel weight** and ~47% of the repo.

Everything else, for scale: carousel 353 MB · yard-diary 256 MB · on-this-day 112 MB · stories 111 MB · birds 83 MB.

### Do reels need to be in git?

**Yes, as currently built — and nothing else about them is load-bearing.**

- **No page serves them.** `grep` for `.mp4` and `/reels/` across `app/`, `lib/`, `content/`, and `scripts/` returns **zero** references. 346 files and 3.9 GB that no visitor has ever been shown by this site.
- **The IG/FB posters fetch them from `raw.githubusercontent.com`, not from farm.markbarney.net.** Confirmed in `farm-guardian/tools/pipeline/git_helper.py` (`_github_raw_url`) and the `ig_poster.py` call sites. So the file must be *on GitHub* at post time — but it never needs to be *on Railway* at all.
- Verified serving: reels return `200` from raw GitHub at every size tested (3 MB, 7 MB, 32 MB, 33 MB). They also return `200` from farm.markbarney.net, but nothing uses that path.

**On URL stability — the pipeline answers this itself.** `_github_raw_url` builds a **branch-ref** URL (`.../main/<path>`), never a commit SHA, and its docstring states the reasoning:

> *"Using the branch name (rather than a commit SHA) means the URL tracks whatever HEAD is — fine for this use case because IG fetches the image once at container-create and then caches it on Meta's CDN; we don't need the URL to remain stable long-term."*

That is the pipeline author's own design note, and it matters for two reasons. First, it means removing a reel from `main` **does** break its published URL — a branch-ref URL 404s the moment the file leaves the branch, exactly as a history rewrite would. Second, it means that breakage was anticipated and deemed acceptable, because Meta serves published media from its own CDN afterward.

Caveat, stated plainly: that is a documented design assumption, not a guarantee from Meta, and it is not verifiable from this machine. Any option that removes files from `main` inherits it.

---

## Options

### Option 1 — Stop shipping reels to Railway *(cheapest; zero risk; do this regardless)*

Exclude `public/photos/reels/` from the Railway deploy via `.railwayignore`, leaving git completely untouched.

- **Touches:** nothing in git, no history, no URL. The posters keep using raw GitHub, which is unaffected.
- **Gains:** the container stops carrying ~3.9 GB it never serves. Should cut deploy payload and `next build` copy time substantially.
- **Costs:** `farm.markbarney.net/photos/reels/...` starts returning 404. Nothing links there and no poster uses it, so this is invisible.
- **Does not fix:** GitHub repo size, clone time, or the 5 GB trajectory. This is a deploy fix only.
- **Unverified:** Railway's exact `.railwayignore` behaviour under Nixpacks — specifically whether it trims the source fetch or only the build context. **Test on one deploy and read the duration off the dashboard before assuming the win.**

### Option 2 — Retention window on reels in `main`

`git rm` reels older than N days on a schedule (a farm-guardian job, after the post has succeeded).

- **Gains:** shrinks the HEAD tree immediately, which is the thing that dominates every clone. A 30-day window would drop reels in-tree from 3.9 GB to ~0.95 GB, taking the checkout from ~4.9 GB to **~2.0 GB (−60%)**. A 7-day window takes it to ~1.25 GB.
- **Does not shrink the pack.** Removed blobs stay in history forever (that is the point), so full clones still transfer 4.7 GB and GitHub's reported size still only grows. This helps shallow clones, the Railway checkout, and local disk — not the 5 GB number.
- **Risk — do not present this as free:** deleting from `main` breaks published raw URLs exactly as a history rewrite would. The pipeline's own docstring says that is acceptable post-publication, but the risk is real and identical in kind to the thing the "no rewrite" rule was written to prevent.
- **Cheap hardening if this is chosen:** have the poster record the commit SHA at post time and log a SHA-pinned URL (`.../<sha>/public/photos/reels/...`), which survives any later deletion. Small change in `git_helper.py`, and it makes every future retention decision risk-free.

### Option 3 — Move reels out of git entirely *(the only actual fix)*

Stop committing MP4s. Publish them to an object store with clean `.mp4` URLs — Cloudflare R2 is the natural fit given the tunnel already runs on Cloudflare, has a free tier that covers this volume, and serves public buckets with real file extensions (which is the constraint that pushed media into this repo in the first place). A second GitHub repo (`farm-2026-media`) is the lower-effort variant: same raw-URL ergonomics, same commit-and-push flow, weight simply lands somewhere that isn't the deploy repo.

- **Gains:** cuts growth from ~1.28 GB/month to **~0.32 GB/month (−75%)**. It is the only option that changes the GitHub trajectory, because the pack cannot shrink without a rewrite.
- **Costs:** a change in **farm-guardian**, not here — the reel branch of `ig_poster.py` / `fb_poster.py` and `git_helper.py`. Existing reels stay in history untouched; this only redirects new ones.
- **Risk:** low, and testable end-to-end with one dry-run post before switching over. Meta needs a publicly-fetchable `.mp4` URL; R2 and a second repo both provide one.
- **Not addressed:** the 4.74 GB already banked. That is permanent under the no-rewrite rule.

### Option 4 — Accept and monitor

Do nothing, revisit at a threshold.

- **Honest case for it:** clone time is 39 s on local disk, deploys work, the site is fine, and this is a hobby farm. Nothing is broken today.
- **Honest case against:** at ~1.28 GB/month it doubles by early 2027, every option gets more expensive as the banked total grows, and under the no-rewrite rule none of it is ever recoverable. Deferring is a real decision with a compounding price, not a neutral one.

---

## Recommendation

**Option 1 now, Option 3 next.** Option 1 is free, reversible, and independent of everything else — the only unknown is how much it buys, which one deploy will tell you. Option 3 is the only change that bends the GitHub curve, and it belongs in farm-guardian rather than here.

**Option 2 is optional** and I would only reach for it if local disk or checkout size becomes a felt problem, and only after the SHA-pinning hardening lands — its whole risk profile changes once published URLs no longer depend on `main`.

The 2.3 GB of per-camera timelapses is worth one separate question that this assessment cannot answer: **is anyone watching them?** They are the single largest category in the repo, they are still being produced daily, and they are indistinguishable from the gem reels in terms of what this repo does with them (nothing). If they exist mainly because the pipeline can make them, turning that lane off is the largest single saving available and costs no engineering at all.

---

## Confidence

| Claim | Basis |
|---|---|
| Repo 4.74 GB; pack 4.69 GiB; HEAD tree 4.92 GB | **Measured** |
| Clone 39 s full / 36 s shallow, both 4.8 GB | **Measured** on local disk — a floor, not real-world |
| Growth 1.28 GB/30 d; reels ~75% of it | **Measured** from git blob sizes and filename dates |
| Reels 3.9 GB / 346 files; timelapses 2.3 GB | **Measured** |
| No code or content references any `.mp4` | **Measured** (grep across `app/`, `lib/`, `content/`, `scripts/`) |
| Posters use branch-ref raw GitHub URLs | **Measured** — read from farm-guardian source |
| Published URLs break when a file leaves `main` | **Inferred** from how branch-ref URLs resolve; consistent with the pipeline's own docstring |
| Meta does not re-fetch after publication | **Unverified** — the pipeline documents this assumption; not confirmable from this machine |
| Railway build duration and `.railwayignore` behaviour | **Unmeasured** — project not linked; linking is a state change I did not make |
| Growth projections | **Extrapolated** straight-line from the last 30 days; the pipelines' cadence could change at any time |
