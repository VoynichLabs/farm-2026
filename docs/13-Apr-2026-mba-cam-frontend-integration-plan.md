# mba-cam Frontend Integration — Handoff Plan

**Date:** 13-April-2026
**Author:** Claude Opus 4.6 (handing off to whichever agent picks this up next)
**Repo:** farm-2026
**Backend status:** ✅ DONE — `mba-cam` is live in Farm Guardian as of v2.22.1. Stream `rtsp://192.168.0.50:8554/mba-cam` is published by the MacBook Air, Guardian is polling it, and `http://localhost:6530/api/cameras/mba-cam/frame` returns a 1280x720 JPEG. The Cloudflare tunnel at `https://guardian.markbarney.net` will proxy the same endpoint without any additional config (cameras are looked up by name from Guardian's running config — there's nothing tunnel-side to update).

---

## What Boss Wants

`mba-cam` (MacBook Air 2013 webcam, currently aimed at the brooder) must show up on the public website at https://farm.markbarney.net the same way `house-yard`, `s7-cam`, `usb-cam`, and `gwtc` do — as a live snapshot-polling feed in the Guardian dashboard and the homepage system panel.

## What Needs to Change in farm-2026 (small, surgical)

The frontend already uses a **single source of truth** for camera metadata: `lib/cameras.ts`. Adding `mba-cam` is a one-file change plus an MDX content update — no component rewrites needed.

### 1. `lib/cameras.ts` — add `mba-cam` to the registry

- Add `"mba-cam"` to the `CameraName` union type.
- Append a `CameraMeta` entry to the `CAMERAS` array. Suggested values (Boss can adjust):

  ```ts
  {
    name: "mba-cam",
    label: "mba-cam — MacBook Air 2013",
    shortLabel: "MBA brooder",
    device: "MacBook Air 2013 webcam (FaceTime HD)",
    location: "Brooder (currently)",
    aspectRatio: "16 / 9",
  }
  ```

- **Position in the array matters** — `CAMERAS` order drives thumb order and the system-panel list. Brooder cameras are currently promoted to the top (per CHANGELOG v? — `usb-cam` is `DEFAULT_FEATURED`, `s7-cam` is second). Since `mba-cam` is also a brooder angle right now, place it after `s7-cam` and before `gwtc` so all three brooder views cluster.
- Bump the file header date and update the SRP/DRY check note.

### 2. `content/projects/guardian/index.mdx` — add a row to the cameras table

Open the file and find the Markdown table that documents the camera roster (around lines 25-30 — currently lists `house-yard`, `s7-cam`, `usb-cam`, `gwtc`). Add:

```
| mba-cam | MacBook Air 2013 webcam (FaceTime HD) | The brooder. Built-in 720p webcam. macOS Big Sur, ffmpeg + MediaMTX → RTSP. |
```

### 3. `CLAUDE.md` is already updated

I edited `CLAUDE.md` in this commit batch to say "Five cameras (v2.22 names): ... `mba-cam` (MacBook Air 2013 webcam via MediaMTX → `rtsp://192.168.0.50:8554/mba-cam`)". No further edit needed there.

### 4. `CHANGELOG.md` — top entry

Bump SemVer (next minor) and document:

- Added `mba-cam` to `lib/cameras.ts` registry — fifth camera now appears in the dashboard, homepage system panel, and stage chooser without any component changes (single-source-of-truth pattern from v? holds).
- Added `mba-cam` row to the `content/projects/guardian/index.mdx` cameras table.
- Cross-link to `farm-guardian/CHANGELOG.md` v2.22.1 for the backend bring-up.

### 5. Validation

```bash
cd ~/Documents/GitHub/farm-2026
npm run lint                 # should pass
npm run build                # should pass — no new dependencies
npm run dev                  # local check at http://localhost:3000/projects/guardian
                             # mba-cam should appear as a live thumbnail; click to promote
```

In the browser, confirm:

- The `/projects/guardian` page shows **five** thumbnails, not four. `mba-cam` displays a live frame (cycles every ~1.2s — `GuardianCameraFeed.tsx` uses `fetch()` + `createObjectURL()`).
- The homepage system panel lists `mba-cam` with the device + location values from the registry.
- Click `mba-cam` thumb → it promotes to the stage feed correctly.
- DevTools Network tab: `/api/cameras/mba-cam/frame` requests are 200, ~100-150KB JPEG payload, served by `https://guardian.markbarney.net`.

### 6. Deploy

Railway auto-deploys on push to main. After the merge, browse https://farm.markbarney.net and confirm the same five-camera layout in production.

## What's NOT in scope

- **Detection** — `detection_enabled: false` in the Guardian config. The chicks aren't predators; YOLO would just churn CPU on chick frames. If Boss decides to enable it later (e.g., to detect a hand reaching into the brooder), that's a `farm-guardian` config flip, not a farm-2026 change.
- **PTZ controls** — `mba-cam` is fixed (the lid points where it points). `GuardianPTZPanel.tsx` is hardcoded to `house-yard` (`CAMERA_ID = "house-yard"` at line 35) and stays that way.
- **Renaming** — `mba-cam` is the device name (MacBook Air = MBA). Per the device-not-location naming rule (CHANGELOG v2.11.0 / v2.22.1 — Boss called this out **twice** in 13-Apr session and asked for it to be propagated), do **NOT** rename it to `brooder-cam` even though the camera currently points at the brooder. The MacBook can be re-aimed at any time and the name doesn't follow.

## Reference: How to Drive the MacBook Air If You Need To

If you need to do anything on the Air — adjust ffmpeg parameters, restart the LaunchAgent, debug a stream issue — **don't ask Boss to relay your prompt** to a Claude session he's sitting in front of. Spawn a fresh headless Claude there over SSH:

```bash
ssh -i ~/.ssh/id_ed25519 markb@192.168.0.50 'c -p "<self-contained task description>"'
```

Full pattern + per-machine reference is in `farm-guardian/CLAUDE.md` under "Multi-Machine Claude Orchestration" and `bubba-workspace/skills/multi-claude-orchestration/SKILL.md`. The mba-cam bring-up itself was the worked example — see `farm-guardian/CHANGELOG.md` v2.22.x for the full story.

## Cross-references

- `farm-guardian/CHANGELOG.md` — v2.22.0 (initial bring-up) and v2.22.1 (rename to device-not-location).
- `farm-guardian/docs/12-Apr-2026-macbook-air-camera-node-plan.md` — original plan, with 13-Apr execution-update header.
- `farm-guardian/deploy/macbook-air/` — canonical copies of both LaunchAgent plists running on the Air.
- `farm-guardian/CLAUDE.md` — Multi-Machine Claude Orchestration section.
- `bubba-workspace/skills/macbook-air/SKILL.md` — Air-specific operations (SSH, power settings, screensaver, install recipes, TCC notes).
- `bubba-workspace/skills/multi-claude-orchestration/SKILL.md` — the orchestration pattern as a standalone skill.
