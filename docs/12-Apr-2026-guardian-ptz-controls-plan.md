# Guardian Page — Manual PTZ Controls + Strip Detection UI

**Date:** 12-April-2026
**Author:** Claude Opus 4.6 (handoff — next session will implement)
**Status:** Plan only. Not implemented. Previous session was redirected here by Mark before writing code.

---

## Read these first, in order. Do not skip.

1. **`farm-guardian/AGENTS_CAMERA.md`** — single source of truth for the Reolink. Every endpoint shape, every world-model pan degree, every past mistake. Already-learned knowledge.
2. **`farm-guardian/docs/08-Apr-2026-absolute-ptz-investigation.md`** — why absolute pan/tilt does not work at the firmware level. Reolink's HTTP API does not accept `(pan=X, tilt=Y)`. The `reolink_aio` maintainer has been asking Reolink for this since 2023. **Don't investigate this again. It is a firmware limitation. Presets are the only absolute-positioning primitive.**
3. **`farm-2026/docs/06-Apr-2026-remove-ptz-controls-plan.md`** — the last time PTZ controls were on the site, they were ripped out because they were unreliable and patrol was expected to handle positioning autonomously.
4. **`farm-guardian/CLAUDE.md` → Camera Control — Principles** — durable rules. Especially: "Never tell Mark to use the Reolink app. We ARE the Reolink app."

If you haven't read these four, stop and read them. Mark has watched three previous agents re-investigate what these docs already answer.

---

## Context — what Mark said today

Direct quotes from Mark on 12-April:

> "I'd also like you to pull latest. Make sure you're up to date. My other devs have been working."

> "Can you also move the Reolink camera towards the truck a little bit more? A little bit further left. … what would be even better is if, on that Guardian page, you put the controls back for me, because you have this complicated patrol setup before, but that's not really what I want. You have this complicated detection setup. I really want the ability to just be able to move it from the web UI."

> "I know that there's no auth; I don't care; anybody can see what's going on in my backyard; that's fine. … What I really want is to just be able to set kind of how many degrees I want to turn."

> "And absolutely ignore the detections."

> "We've gone back and forth a bunch of times trying polling, patrolling, all sorts of stuff. Previous developers wrote stuff in, undid stuff."

**Read the frustration in that last line.** He has paid for this problem multiple times. The task is not "design a great PTZ UI." The task is "ship a simple, reliable manual-control surface Mark can use from his phone, and get the detection clutter out of his face."

## What Mark actually wants

1. A PTZ control panel on `/projects/guardian` (and probably visible on the homepage Guardian section too). Covers the `house-yard` Reolink only — no other camera supports PTZ.
2. Pan/tilt nudges with a **degree target**: "turn 10° left", "turn 30° right". Not a d-pad with mystery speeds.
3. One-tap preset recall for the five on-camera presets (`yard-center`, `coop-approach`, `fence-line`, `sky-watch`, `driveway`).
4. A button to save the current position as a new preset.
5. Spotlight and siren toggles (already in the API). Honest about what they do.
6. **The detection pipeline UI is gone from the Guardian page.** No detections table, no tracks panel, no deterrent panel, no eBird panel, no "summary today." Those cards are all empty (0 frames processed, 0 detections, 0 tracks) and they make the page look broken. They go.

## What the backend already gives you — no backend changes required

Guardian v2.15.0 exposes everything needed. All endpoints below are live now and verified as of 12-April-2026, reachable at `https://guardian.markbarney.net/api/v1`:

| Endpoint | Method | Body | What it does |
|----------|--------|------|--------------|
| `/cameras/house-yard/position` | GET | — | `{pan, pan_degrees, tilt, zoom}` |
| `/cameras/house-yard/ptz` | POST | `{"action":"move","pan":±1,"tilt":±1,"speed":5}` | Starts continuous directional move |
| `/cameras/house-yard/ptz` | POST | `{"action":"stop"}` | Stops the move |
| `/cameras/house-yard/presets` | GET | — | Existing on-camera preset map |
| `/cameras/house-yard/preset/goto` | POST | `{"id":<0-4>}` | Camera recalls preset autonomously |
| `/cameras/house-yard/preset/save` | POST | `{"id":<0-63>,"name":"…"}` | Save current position as preset |
| `/cameras/house-yard/spotlight` | POST | `{"on":true,"brightness":100}` | White LED on the camera |
| `/cameras/house-yard/siren` | POST | `{"duration":10}` | 10s piezo siren |
| `/cameras/house-yard/autofocus` | POST | — | Triggers AF. **Wait 3s after** before any snapshot. |

Current on-camera presets (verified via API, 12-Apr):
```
yard-center    → id 0
coop-approach  → id 1
fence-line     → id 2
sky-watch      → id 3
driveway       → id 4
```

Current patrol state: `patrol_active: false`, `patrol_enabled: false` in config. **Patrol is off.** Manual controls will not fight patrol today. If the next dev changes that, note it in the changelog — silent re-enable has burned Mark before.

## The "turn N degrees" primitive — the only honest way

Absolute `(pan=X)` is impossible — firmware limitation, confirmed. Here is what you do instead:

- Speed 5 moves the Reolink at ~85°/second (measured in the `08-Apr-2026-absolute-ptz-investigation.md` doc).
- To turn `N` degrees: `duration_ms = (N / 85) * 1000`, at speed 5.
- Client-side sequence: POST `{"action":"move", "pan": dir, "speed": 5}`, `setTimeout(stop, duration_ms)`, POST `{"action":"stop"}`.
- **Stop is non-negotiable.** Every long `setTimeout` that missed has overshot the camera. Fire the stop on a setTimeout created the same tick as the start, not after reading a polling response.

Accuracy is about ±3° over a 10° nudge. Document this in the UI (e.g. "≈10° left"). Do not claim precision you can't deliver. For precision, Mark uses a preset.

**Constraints inherited from `AGENTS_CAMERA.md` — enforce these in the UI or they will bite you:**
- Never issue a burst longer than ~500ms. Over the Cloudflare tunnel the stop may arrive late enough to overshoot a full second of travel. Cap the degree input to something like 60°/burst max, and for anything bigger, loop small bursts.
- After any move, trigger autofocus (`POST /autofocus`) and do not display a "new snapshot" for 3 seconds.
- Zoom is out of scope. Do not add a zoom control. The existing AGENTS doc says zoom stays at 0.
- Dead zone: pan 340°–22° — the mounting post blocks the frame. If you show a compass/dial, shade this band so Mark doesn't aim into it.

## Detection UI — what to remove

In `app/components/guardian/GuardianDashboard.tsx`, these blocks render empty state on a working system (detection pipeline is not currently feeding frames — `frames_processed: 0`). **Delete them from the Guardian page.**

- The compact status row (Patrol / Deterrent / Tracks / Cameras) — keep only "Cameras N/M online", drop the rest, and merge it into the new PTZ panel header.
- `GuardianDetections` — entire component call, gone from this page.
- `GuardianInfoPanels` — entire component call, gone from this page.

**Do not delete the component files themselves.** They're shared types; a future "intel" page could reuse them. Just stop rendering them in `GuardianDashboard`.

The dashboard's `fetchFast`/`fetchSlow`/`fetchEbird` poll loops that hydrate detections, tracks, deterrent, summary, effectiveness, and eBird — strip those from the dashboard too. Keep only `/api/status` for the online indicator. Save the ~6 fetches-per-cycle Mark pays for in Cloudflare traffic while detection is dormant.

## Files

**New**
- `app/components/guardian/GuardianPTZPanel.tsx` (`"use client"`) — the controls. Slots into the Guardian dashboard and optionally the homepage Guardian section. Reuses the existing `GUARDIAN_API` constant from `types.ts`.
- (optional) `lib/ptz.ts` — pure helpers: `degreesToDurationMs(deg, speed = 5)`, `clampBurstMs(ms)`. Keeps the timing math testable and out of the component.

**Modified**
- `app/components/guardian/GuardianDashboard.tsx` — strip detection UI, add the PTZ panel below the camera stage, prune the poll loops.
- `app/components/guardian/types.ts` — add `PTZPosition`, `PresetMap`, and whatever else the panel needs. Keep existing types.
- `app/page.tsx` — optional: embed a compact PTZ panel in the homepage Guardian section, or leave PTZ to `/projects/guardian` only. Mark has not specified; default to dashboard-only unless asked.
- `CHANGELOG.md` — `[1.4.0]` entry. What / why / how. Include a "deferred" line about detection UI removal.
- `content/projects/guardian/index.mdx` — update the "How It Watches" / "What's working" copy. It currently advertises YOLOv8 + GLM-4V and "Still being tuned: detection confidence." That's stale and oversold. Rewrite to reflect current reality: four cameras visible, manual PTZ, deterrents available, detection paused.

**Do not touch**
- `farm-guardian` Python backend. Every endpoint needed already exists. If you find yourself writing Python, you are on the wrong track.
- `GuardianCameraStage.tsx`, `GuardianCameraFeed.tsx`, `lib/cameras.ts` — the camera stage shipped in v1.3.0 today and is the piece Mark currently likes.

## Proposed UI layout (sketch — tune to taste)

```
┌──────────────────────────────────────────────────────────────┐
│  GuardianStatusBar — online dot · "Cams 4/4"                 │
├──────────────────────────────────────────────────────────────┤
│  GuardianCameraStage (one featured, three thumbs)            │
├──────────────────────────────────────────────────────────────┤
│  PTZ — house-yard                                            │
│                                                              │
│   Current: 183.7° pan, 28 tilt          [Refresh]            │
│                                                              │
│   Presets:  [ yard-center ] [ coop-approach ] [ fence-line ] │
│             [ sky-watch ]   [ driveway ]      [+ save new]   │
│                                                              │
│   Nudge:                                                     │
│     Pan degrees: [  10  ]  [← left]  [right →]               │
│     Tilt degrees:[  5   ]  [↑ up]    [down ↓]                │
│                                                              │
│   Deterrents:  [ Spotlight ] [ Siren 10s ]  (confirm dialog) │
└──────────────────────────────────────────────────────────────┘
```

- Degree input is a number field with sensible defaults (10°). `max={60}`.
- After any nudge, auto-fire autofocus and show a subtle "refocusing…" badge on the stage for 3 seconds. Do not block the UI.
- Preset buttons are single-click, no confirm. Preset save pops a small dialog for a name + id (default to next unused id).
- Siren needs a confirm dialog. The chickens will panic. Mark will chew you out if a stray click triggers it.
- Spotlight is a toggle with brightness, no confirm.

## Verification

1. `npm run build` + `npm run lint` clean.
2. Local dev (`npm run dev`, http://localhost:3000/projects/guardian):
   - Status bar shows "online" and "4/4 cameras".
   - Camera stage works (the v1.3.0 component).
   - PTZ panel reads the current position on mount. Nudge `10° left` — camera moves, stops, position updates. Measured with `curl /position` before and after, within ±3°.
   - Each of the 5 presets recalls in <2s with no polling/overshoot.
   - Save a test preset at id 5, name `"test"`, then goto id 0, then goto id 5 — camera returns.
   - Spotlight on/off visible in the stage image within ~5s of toggle.
   - **Do not test the siren with chickens nearby.** Unit-test the request body only.
   - Detection cards are gone. No visible "No detections" tables.
3. Cloudflare tunnel: all the same via `https://guardian.markbarney.net/api/v1/...`. Mark will operate from his phone over cellular — test on actual mobile once.
4. **Move the camera to what Mark asked for today**: current is 183.7°, he wants "a little further left toward the truck." Nudge `~15° left` lands near 168–170°, into the driveway side of the frame. Confirm with a snapshot and describe what you see before claiming done. (This is the functional ack Mark is waiting for.)

## Mistakes to not repeat

1. **Don't try absolute pan/tilt again.** Three previous sessions burned days proving it's a firmware limit. Use presets + timed bursts.
2. **Don't rebuild patrol.** Mark explicitly doesn't want it. `patrol_enabled: false` in config is intentional. Leave it off.
3. **Don't suggest the Reolink phone app.** We are the Reolink app.
4. **Don't sleep > 0.5s before a stop.** Overshoot is reliable at 85°/s.
5. **Don't skip the 3s autofocus wait** before showing a snapshot after a move. Every blurry image in this repo is from skipping it.
6. **Don't silently re-enable detection fetch loops.** Mark noticed the clutter. If you have to hit `/api/status` in the dashboard, that is the only loop the Guardian page should run.
7. **Don't reintroduce empty detection cards** as a "safe default." Empty state for dead features looks like broken UI.
8. **Don't investigate, write, or rip out PTZ a fourth time without a plan doc approved by Mark.** This doc is the plan. Update it if the approach changes; don't just improvise.

## What today's session actually shipped (for context, not to revisit)

- `v1.2.0` (commit `edf0e0f`) — hero redesign, brooder cameras featured, dynamic chick ages, Guardian system panel rewritten for v2.15.
- `v1.3.0` (commit `e6eed9a`) — `GuardianCameraStage` (modular featured cam + live thumbs, localStorage + `?cam=` deep-link), camera registry at `lib/cameras.ts`, stopped cropping story photos (featured field note, field note covers, project hero, inline gallery, bg-cover heroes).
- `v1.3.1` / `v1.3.2` — pulled in from other devs (Light Brahma note; Guardian SEO image swap to Birdadette).
- Guardian backend (farm-guardian) was relaunched from Claude Code's shell earlier today and all 4 cameras (including USB) came up. Previous handoff claimed Claude Code's shell lacks macOS Camera TCC — today it worked. State may have changed; verify before assuming either way.

## One sentence to land on

The backend is done. The docs are done. The history is long. **Read the four docs above, ship the minimal UI, strip the dead cards, and don't re-litigate firmware limits that have been re-confirmed three times.**
