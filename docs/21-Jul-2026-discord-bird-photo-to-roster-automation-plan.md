# Plan: Discord bird-photo + caption → farm-2026 flock roster (auto)

**Date:** 21-Jul-2026
**Author:** Claude Opus 4.8
**Goal:** When Boss posts a bird photo in the farm Discord channel and names the bird in the caption, the photo is automatically renamed, committed into `farm-2026/public/photos/birds/`, wired into `content/flock-profiles.json` as that bird's portrait, and pushed — with a Discord reply confirming what happened. Group shots and ID mismatches are flagged back to Boss, never guessed.

Grounded in the 21-Jul-2026 multi-agent investigation (OpenClaw config, both repos, git history, live gateway log).

---

## 1. What already exists (so we don't rebuild it)

**A Discord-photo → farm-2026-commit pipeline is real, live, and proven.** It's Job #2 ("HUMAN DROPS") in `farm-guardian/scripts/discord-reaction-sync.py` (LaunchAgent `com.farmguardian.discord-reaction-sync`, every 30 min):

- Boss's own posts already auto-qualify — `BOSS_DISCORD_USER_ID = "293569238386606080"`, *"his act of posting the photo IS the quality-gate signal"* (`discord-reaction-sync.py:401`). This is exactly the gate this request wants.
- It commits into farm-2026 via `git_helper.commit_image_to_farm_2026()` — extension whitelist, path-traversal guard, SHA idempotence, raw-URL, concurrent-push rebase-retry, osxkeychain auth. Proven end-to-end (e.g. discord-drop gem `518506` → commit `6f0bc33`).

**Why it doesn't already do what Boss wants:** every commit it produces lands in the **Instagram-hosting** dirs (`public/photos/{carousel,stories,birdcatraz}/`). **It never writes `public/photos/birds/` and never touches `content/flock-profiles.json`.** Every roster-photo commit in history is hand-authored (e.g. `9ce124e`, `951aa41`, `951aa41`). So the ingest + commit half exists; the **roster-write half is net-new**.

**Caption correlation is a solved problem.** OpenClaw delivers the image and the caption together in one inbound event (the join key is the Discord message itself). The caption ("this is Henridotta") is authoritative for identity; no filesystem sidecar reconstruction needed. Confirmed against `~/.openclaw/logs/gateway.log` and `docs/openclaw/nodes/media-understanding.md`.

---

## 2. Scope

**In:**
- New module `farm-guardian/tools/pipeline/bird_photo_ingest.py` that: parses bird name(s) from the caption, matches to `flock-profiles.json`, runs the VLM for a descriptor slug + coarse sanity check, renames, stages into `public/photos/birds/`, writes the `photo` field, commits both changes, pushes, and replies on Discord.
- A trigger so it fires on a Boss photo-drop in the farm channel.
- Ambiguity gate: group shots / ID mismatches are flagged, never guessed.
- First live test: **Henridotta** (the solo-on-arm photo with the purple leg band), plus a group shot and a mismatch case.

**Out (v1):**
- No auto-editing of `content/hatches/2026/*.md` YAML frontmatter (finicky; `date`/`confidence` drive the growth timeline) — flag to human instead.
- No touching hardcoded homepage `HATCHLINGS_2026` (`app/page.tsx`) or `/markets` tiles — they don't read `flock-profiles.json`.
- No re-introduction of fine-grained auto-ID of *which named bird* it is — that was hard-disabled in v2.38.2 for confident false positives. **Boss's caption is the ID.**
- No writing to `stories/`/`carousel/`/`birdcatraz/` (those are IG-pipeline dirs).

---

## 3. Architecture — reuse first

New module lives in **farm-guardian** (`tools/pipeline/`), where all the machinery and imports already are.

| Stage | Mechanism | Reuse / New |
|---|---|---|
| **Trigger** | OpenClaw internal hook on `message:preprocessed`, filtered to farm channel `#meet-the-lobsters` (`1471632572953006337`, `requireMention:false`) + image present. Fire-and-forget calls the Python module. | New (thin `~/.openclaw/hooks/bird-photo-trigger/`) |
| **Caption → ID** | Parse bird name(s) from `event.context.bodyForAgent` (`User text: …`); match case-insensitively to `flock_birds[].name`. | New (~parser) |
| **Vision** | `vlm_enricher.enrich()` (`qwen/qwen3-vl-4b` @ `localhost:1234`) → descriptor for the slug, `caption_draft`, `bird_count`, `composition`. VLM never names the bird. | Reuse |
| **Ambiguity gate** | `bird_count >= 2` or `composition ∈ {group,wide}` while Boss named 1 → flag & reply, no roster write. | New (small) |
| **Rename** | `IMG_<orig>-<slug>-<descriptor>-<DDmonYYYY>.jpg` (`<orig>` parsed off `IMG_7655---<uuid>.jpg`). | New (small) |
| **Stage image** | `commit_image_to_farm_2026(local_image=<temp w/ final name>, subdir="birds", repo_path=…/farm-2026, commit_message=…)` (`git_helper.py:178`). | Reuse |
| **Roster write** | Load `content/flock-profiles.json`, set `"photo": "birds/<file>"` (base is relative to `public/photos/`, **no** `public/` prefix), commit + push (2nd commit, same rebase-retry). | New |
| **Reply** | `event.messages.push(...)` / `openclaw message send`. Reports bird, raw URL, roster-updated flag, or the ambiguity prompt. | Reuse |

**Path gotcha (must not get wrong):** `flock-profiles.json` `photo` base = relative to `public/photos/` (e.g. `"birds/IMG_….jpg"`), rendered as `/photos/${bird.photo}` (`app/flock/page.tsx:206`). The hatch `.md` frontmatter uses the **opposite** base (`public/photos/birds/…`). v1 only writes the JSON.

**Two commits (image, then JSON):** `git_helper` stages only the image, so the JSON change needs its own commit+push. Both must land — verify each with `git ls-tree -r HEAD -- public/photos/... | grep <file>` (photos are known to drop during git ops — `CONTENT-PIPELINE.md:45`, `feedback_photo_management`).

---

## 4. Ambiguity handling — flag, never guess

| Case | Behavior |
|---|---|
| Boss names 1 bird, VLM `bird_count == 1` | Normal path — commit portrait + set `photo`. |
| Boss names N, `bird_count == N` | Multi-name slug; commit the file; **do not** set any single bird's `photo` (a group shot isn't a portrait). Reply noting it's a group. |
| Boss names 1, `bird_count > 1` | **Flag:** "I see N birds — which one is Henridotta?" No roster write. |
| Name not in roster | Reply with closest slug matches; no commit of a roster change. |
| Coarse color mismatch (e.g. Boss "Henridotta", VLM sees clear silver) | Reply: "you said Henridotta but this looks silver — did you mean Henriessa?" Only for coarse, non-hedged roster discriminators (e.g. `silver_marking`). |

---

## 5. Product decisions (defaults chosen; override any)

1. **Channel → `#meet-the-lobsters` (OpenClaw).** Evidence: today's bird photos landed in `~/.openclaw/media/inbound/`; `flock-profiles.json` repeatedly cites `#meet-the-lobsters` as where Boss names birds; it's `requireMention:false`. (The other channel, `#farm-2026`, is the gem-reaction channel polled by `discord-reaction-sync.py` — different mechanism.)
2. **Trigger → deterministic OpenClaw hook**, not a standing order. A standing order depends on the agent reliably acting — the exact failure mode that started this thread. The hook fires code every time.
3. **Overwrite policy → newest named solo becomes the portrait.** Boss wants better pictures for the class of 2026; a named solo shot is an explicit "use this." Group shots never overwrite a portrait.
4. **Ornitharch hatch `.md` → flag to human for v1** (don't auto-edit YAML).

---

## 6. TODOs (ordered, incl. verification)

1. Confirm the `message:preprocessed` media-path field empirically: one-time `JSON.stringify(event.context)` log on a real bird photo (docs only spell out the path field for the audio event). Fallback: newest file in `media/inbound/`.
2. Write `bird_photo_ingest.py`: caption-parse → roster-match → `enrich()` → ambiguity gate → filename → `commit_image_to_farm_2026` → JSON write + commit + push → Discord reply. `try/except GitHelperError`. File header per Mark's standards.
3. Write the hook (`~/.openclaw/hooks/bird-photo-trigger/` `HOOK.md` + `handler.ts`), filtered to the farm channel + image present, fire-and-forget + ack.
4. Restart the OpenClaw gateway to load the hook.
5. **Test on real photos:** (a) Henridotta solo-on-arm w/ purple band → portrait set; (b) the "4 junior Ornitharchs" group → flagged, no portrait; (c) a deliberately mismatched name → coarse flag; (d) an ornitharch → hatch-file flag surfaced. Verify each with `git ls-tree` post-push and by loading `/flock`.
6. Update `farm-guardian/CHANGELOG.md` and `docs/SOCIAL_MEDIA_MAP.md` (new lane row).

---

## 7. Docs / changelog touchpoints

- `farm-guardian/CHANGELOG.md` — new pipeline lane (SemVer bump).
- `farm-2026/docs/SOCIAL_MEDIA_MAP.md` — add the "Discord bird-drop → roster" row.
- `farm-2026/CHANGELOG.md` — note the roster now receives auto-portraits from Discord drops.
- This plan doc.

## 8. Risks

- OpenClaw hook needs a **gateway restart** to load; the `message:preprocessed` media-path field is undocumented → confirm empirically before relying on it (fallback: newest `media/inbound/` file).
- Two-commit atomicity — both the image and the JSON must land; mitigated by post-push `git ls-tree` verify.
- Never write the IG-pipeline dirs (`stories/`/`carousel/`/`birdcatraz/`); never touch the hardcoded homepage/markets surfaces.
- VLM sanity-check must flag only coarse, non-hedged discriminators — otherwise it nags on fine calls the 4B model can't make. Accept Boss's ID silently otherwise.
