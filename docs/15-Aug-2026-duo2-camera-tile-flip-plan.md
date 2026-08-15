# 15-Aug-2026 — Duo 2 camera tile flips between two Reolinks — fix plan

**Author:** Claude Opus 5
**Reported by:** Boss — "the box that should be showing the Duo 2 keeps flipping between the two reolink cameras."

## Symptom

The primary stage tile — the one the user has pinned to `duo2` — alternates
roughly every 1.2 s between the **Reolink Duo 2** (`duo2`, 8:3 panoramic) and
the **Reolink E1 Pro PTZ** (`house-yard`, 16:9). Both are Reolinks, which is
why the report reads as "flipping between the two reolink cameras."

## Backend is not at fault

`/api/cameras` reports both cameras `is_live: true`, and 10 consecutive pulls of
`/api/cameras/duo2/frame?max_width=1280&q=75` returned a stable `1280×480`
(8:3) — always the Duo 2. Guardian serves the correct frame for the requested
camera every time. The wrong frame is being *requested by the browser*, from a
poll chain that should no longer exist.

## Root cause — orphaned poll chain in `GuardianCameraFeed`

`GuardianCameraFeed` runs a chained-`setTimeout` snapshot poller inside an
effect keyed on `[cameraName, maxWidth]`. Its "am I still alive?" guard is
`mountedRef`, which is **component-scoped, not effect-run-scoped**:

1. `cameraName` changes on a *mounted* tile. React runs the cleanup —
   `mountedRef.current = false`, and clears `nextTick`, a variable local to
   the old effect run.
2. React immediately runs the new effect body — `mountedRef.current = true`.
3. The fetch that the **old** chain launched a few hundred ms earlier now
   resolves. It checks `if (!mountedRef.current) return` — which passes,
   because step 2 already flipped it back. So it writes the **old camera's**
   blob into the shared `frameUrl`, and its `finally` re-arms
   `nextTick = setTimeout(fetchFrame, POLL_INTERVAL)` on the **old closure**,
   carrying the old `cameraName`.
4. That new timer is stored in the *old* run's `nextTick`. The current cleanup
   closes over its own `nextTick` and can never reach it. The old chain is now
   unreachable and immortal.

Two poll chains, one `frameUrl` state, alternating writes at ~1.2 s. The
in-flight fetch is also never aborted on cleanup, which is what makes the race
win reliably rather than occasionally.

### Why *these* two cameras, and why it happens on every page load

Both consumers pin `defaultFeatured="house-yard"`
(`HomeCameraStage.tsx`, `GuardianDashboard.tsx`), and `GuardianCameraStage`
initialises `userFeatured` to that value, then reads `?cam=` / `localStorage`
**post-mount** (required for hydration safety). So on every load:

- first render mounts the primary tile as `house-yard` and starts a
  `house-yard` chain;
- the post-mount effect flips the prop to `duo2`;
- the `house-yard` fetch launched milliseconds earlier lands after
  `mountedRef` is back to `true`.

No click required. Once `farm2026.guardian.featured.home` is `"duo2"` (or the
URL carries `?cam=duo2`), **every single load reproduces it.** Clicking the
Duo 2 thumbnail is a second, equally valid trigger.

### Cascade — why it gets worse, and the dead thumbnail click

The orphaned chain shares the component's single `feedState`, and
`onStatusChange` reports it under the *current prop* `cameraName`. So
`house-yard`'s failures get recorded against `duo2`. If that reaches
`OFFLINE_THRESHOLD`, `GuardianCameraStage`'s auto-promote reads `duo2` as
offline and promotes a different camera — changing `cameraName` on the same
mounted tile again and spawning a *third* chain.

That also strands the UI in a state where `userFeatured === "duo2"` but
`featured !== "duo2"`, so `duo2` renders as a thumbnail while still being the
user's pick — and `promote()`'s `if (name === userFeatured) return;` guard
makes clicking it a **no-op**. Boss can click the Duo 2 thumb and nothing
happens.

## Scope

**In:**

- `app/components/guardian/GuardianCameraFeed.tsx` — make the poll chain
  run-scoped and abort in-flight fetches on teardown; reset per-camera state
  when the camera changes.
- `app/components/guardian/GuardianCameraStage.tsx` — key the top-stage tiles
  by camera name so tile identity is structural; fix the `promote()` no-op.
- `CHANGELOG.md` — behaviour change.

**Out:**

- Any farm-guardian / backend change. Backend is exonerated above.
- Poll cadence, timeout, and threshold tuning — unchanged, not implicated.
- `lib/cameras.ts` metadata, roster logic, `is_live` gating — all correct.
- Redesigning the stage layout or the auto-promote policy.

## Architecture

Responsibilities stay exactly where they are. Two targeted corrections:

### 1. `GuardianCameraFeed` — run-scoped lifetime (the load-bearing fix)

Replace the component-scoped `mountedRef` with a `let cancelled = false`
declared **inside** the effect body, so each effect run owns its own liveness
token. A superseded run's token stays `false` forever; a stale fetch can
neither write state nor re-arm its timer. Additionally:

- hold the in-flight `AbortController` in a ref and `abort()` it from cleanup,
  so the superseded request drops immediately instead of occupying a tunnel
  connection until it resolves;
- reset `hadFrameRef`, `consecutiveErrors`, and `reconnectingShownAt` on
  camera change — not just on unmount — so a new camera can't inherit the
  previous camera's "already had a frame" history and skip `CONNECTING`
  straight to `OFFLINE`;
- revoke the outgoing blob URL on teardown without routing through a state
  setter, so cleanup has no side effect on a live render.

This must be fixed at the guard, not worked around with keys: the effect deps
include `maxWidth`, which legitimately changes (1600 on the stage, 800 on a
thumb) independently of `cameraName`. A `key` on camera name alone would not
cover that re-run.

### 2. `GuardianCameraStage` — structural tile identity

Add `key={featuredCam.name}` / `key={secondaryCam.name}` to the top-stage
tiles. Thumbnails are already keyed via `key={cam.name}` on their button; the
two top slots were the only unkeyed positions, which is why they were the ones
mutating a live tile's `cameraName`. This makes "a tile is bound to one camera
for its lifetime" visible in the JSX instead of load-bearing on a ref.

Also make `promote()` re-assert the user's pick when the derived `featured` has
drifted away from `userFeatured` (auto-promote), so clicking the Duo 2
thumbnail always does something.

## TODOs

1. [x] Confirm backend serves correct `duo2` frames (10× dimension probe).
2. [x] Trace the orphaned-chain mechanism in `GuardianCameraFeed`.
3. [x] Write this plan.
4. [x] Reproduce in the browser at `/?cam=duo2` — instrument the stage `<img>`
       and compare its `alt` (what the component thinks it shows) against
       `naturalWidth/naturalHeight` (what the frame actually is). A `duo2`
       alt with a ~1.778 ratio is `house-yard` painted into the Duo 2 box.
5. [x] Fix `GuardianCameraFeed` (run-scoped token, abort, state reset).
6. [x] Fix `GuardianCameraStage` (tile keys, `promote()`).
7. [x] Update both file headers.
8. [x] Re-run the same instrumented repro; assert the Duo 2 box holds a stable
       ~2.667 ratio across a sustained sample window, on `/` and
       `/projects/guardian`.
9. [x] Verify the thumbnail-click path (promote `duo2`, then promote away and
       back) shows no cross-camera frames.
10. [x] `npm run lint` and `npm run build`.
11. [x] `CHANGELOG.md` top entry.

## Results

Measured with a fetch-level instrument (immune to the 250-entry
`performance` resource-timing buffer cap) over a 42.3 s window on
`/projects/guardian?cam=duo2`:

| Signal | Before | After |
|---|---|---|
| Duo 2 tile painted with the Duo 2 frame (8:3) | 1 / 42 samples | **42 / 42** |
| Duo 2 tile painted with a `house-yard` frame (16:9) | 41 / 42 samples | **0** |
| `house-yard` polled at *stage* width while only a thumbnail | 27 polls, 2000 ms cadence (live orphan chain) | **1** (first-render fetch, aborted before re-arming) |
| `house-yard` thumbnail chains | 54 polls @ 6 ms median gap — 2 chains | **21 polls @ 2000 ms — 1 chain** |
| Distinct poll chains for 6 cameras | 8 | **6** |
| Cross-camera frames across 3 click-promotes | — | **0** |

Also verified on `/?cam=duo2` (homepage): 26 / 26 samples at 2.667.
`npm run build` clean; ESLint clean on both touched files (the repo's 11,285
pre-existing lint problems are all inside stale `.claude/worktrees/` build
output and predate this change).

The `house-yard` thumbnail's doubled chain is **not** attributed to a specific
trigger here. It was a second orphan of the same defect — two chains on one
tile, which is exactly what an un-cleared `nextTick` produces — and it is gone
after the fix. What ruled out a blanket cause like a StrictMode double-mount is
that the doubling was *not* uniform: `usb-webcam-1080p`,
`macbook-air-facetime`, and `jieli-dashcam` all sat at a clean single chain in
the same measurement. Only `house-yard` doubled, and `house-yard` is the one
camera that started on the stage and was displaced. The precise sequence that
spawned it wasn't isolated, and isn't worth chasing now that the class of bug
is closed.

## Verification

No test suite exists in this repo, so the instrumented browser repro **is** the
verification step. Pass criteria:

- On `/?cam=duo2`, every sample of the primary tile reports an aspect ratio of
  ~2.667 (8:3). Zero samples at ~1.778.
- Same on `/projects/guardian?cam=duo2`.
- Promoting between cameras via thumbnail clicks never paints a frame from the
  outgoing camera into the incoming camera's box.
- Clicking the Duo 2 thumbnail always promotes it, even after an auto-promote.
- `npm run lint` and `npm run build` clean.

## Docs / changelog touchpoints

- `CHANGELOG.md` — new top entry (patch-level; bug fix, no API change).
- File headers on both touched `.tsx` files.
- No `docs/FRONTEND-ARCHITECTURE.md` change: the SSoT rules, roster-as-data
  contract, and naming rules are all unaffected — this is a lifecycle bug
  inside one component, not a contract change.
