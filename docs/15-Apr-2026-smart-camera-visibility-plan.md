# Smart camera visibility — plan

**Date:** 15-Apr-2026
**Author:** Claude Opus 4.6 (1M context)
**Goal:** Make the Guardian camera UI prioritize cameras that are online and
hide cameras that are offline, on both the homepage and `/projects/guardian`.
The system must scale cleanly from **0 to N cameras** as Boss adds/removes
hardware — no component should care how many there are.

## Why

Today the stage shows all five cameras regardless of status. If `house-yard`
is offline (e.g., Reolink down) it still gets featured on the dashboard with
a big OFFLINE card, and offline thumbs occupy the same grid space as live
ones. Boss wants the UI to lead with what's working, and to keep doing so as
the camera list changes.

## Design principles (binding)

- **`lib/cameras.ts` stays SSoT.** Adding a camera = one entry in the array.
  No other file should need editing for the new cam to appear.
- **SRP per file.** Each component does one thing:
  - `GuardianCameraFeed` — render one camera's frame + state. Already does
    this; we only widen its status callback signature.
  - `useCameraStatuses` (new hook) — own the `Record<CameraName, FeedState>`
    map and the change handler. Pure state ownership, no JSX.
  - `GuardianCameraStage` — pick featured, lay out featured + thumbs, apply
    auto-promote rule. No fetching, no per-camera state internals.
- **DRY.** Every consumer (homepage, dashboard) goes through
  `GuardianCameraStage`. Layout choices live there once, not duplicated.
  Grid-column class selection goes through one helper, not inlined twice.
- **Graceful 0..N scaling.** UI must look right with 1 camera (no thumbs,
  just stage), 2 (1 thumb), 3+ (responsive grid). Empty state if all
  offline / list empty.

## Scope

**In:**
- Lift each camera's `FeedState` from `GuardianCameraFeed` into a new
  `useCameraStatuses` hook, consumed by `GuardianCameraStage` via the
  existing (currently unused) `onStatusChange` callback.
- Hide thumbnails for cameras whose state is `"offline"`.
- Auto-promote: if the featured camera is `"offline"`, switch to the first
  camera in canonical (CAMERAS) order whose state is `"live"`. If none are
  live yet (initial connect), do nothing — don't play musical chairs while
  feeds are still warming up. Once auto-promoted, stay there (no reshuffle
  when the original returns).
- Keep offline cameras mounted in a hidden container so their poll loops
  continue and they reappear automatically when they recover.
- Make the thumbnail grid responsive to visible-thumb count (0 → no row,
  1 → full width, 2 → `grid-cols-2`, 3+ → `grid-cols-3`).
- Empty state when zero cameras live AND zero connecting (everything
  offline / empty list): a calm "No cameras online" panel sized to the
  default aspect ratio, so layout doesn't collapse.

**Out:**
- No new API endpoints. Per-feed fetch success/failure (already detected
  by `GuardianCameraFeed`) is the source of truth — `/api/status` only
  returns aggregate counts.
- No changes to `lib/cameras.ts`. Camera order, naming, and aspect ratio
  remain canonical there.
- No homepage layout restructure beyond what `GuardianCameraStage` does
  internally — section/system-panel split stays.
- No change to PTZ panel or status bar.

## Architecture

### Files touched / added

| File | Change |
|------|--------|
| `app/components/guardian/GuardianCameraFeed.tsx` | Export `FeedState`. Change `onStatusChange` signature. No other behavior change. |
| `app/components/guardian/useCameraStatuses.ts` *(new)* | Hook owning `Record<CameraName, FeedState>` + change handler. ~25 lines. |
| `app/components/guardian/GuardianCameraStage.tsx` | Consume hook. Auto-promote effect. Visible/hidden thumb split. Responsive grid. Empty state. |

### Detailed contract

**`GuardianCameraFeed.tsx`**
- `export type FeedState = "connecting" | "live" | "reconnecting" | "offline"` (promote local type to module export).
- `onStatusChange?: (cameraName: string, state: FeedState) => void` (was `boolean`). Stage needs to distinguish "connecting" (still trying, keep visible) from "offline" (give up, hide).
- Existing internal `useEffect` that calls `onStatusChange` updates accordingly.

**`useCameraStatuses.ts` (new)**
```
export function useCameraStatuses() {
  const [statuses, setStatuses] = useState<Record<string, FeedState>>({});
  const onStatusChange = useCallback((name: string, state: FeedState) => {
    setStatuses(prev => prev[name] === state ? prev : { ...prev, [name]: state });
  }, []);
  return { statuses, onStatusChange };
}
```
SRP: one job — track per-camera FeedState. Reusable if any other surface ever needs it.

**`GuardianCameraStage.tsx`**
- Use `useCameraStatuses()`.
- Pass `onStatusChange` to every mounted `GuardianCameraFeed` (featured + visible thumbs + hidden offline mounts).
- Auto-promote `useEffect` (runs on `statuses` change):
  - If `statuses[featured] === "offline"`, find first `cam` in `cameras` where `statuses[cam.name] === "live"`. If found, `setFeatured(cam.name)`. Otherwise no-op.
- Partition `thumbs` (everything except featured):
  - `visibleThumbs` = `statuses[name] !== "offline"` (includes unknown / connecting / reconnecting / live).
  - `hiddenThumbs` = `statuses[name] === "offline"`.
- Visible thumbs render in a responsive grid; hidden thumbs render in `<div className="hidden" aria-hidden>` so polling continues.
- Empty state: when `cameras.length === 0` OR every camera is offline AND featured is offline, show a centered "No cameras online" placeholder sized to `featuredCam?.aspectRatio ?? "16 / 9"`.
- Grid-column helper (one place):
  ```
  function gridColsForCount(n: number): string {
    if (n <= 1) return "grid-cols-1";
    if (n === 2) return "grid-cols-2";
    return "grid-cols-3";
  }
  ```
  Static class strings so Tailwind JIT picks them up.

### Behavior matrix

| Featured state | Any other live? | Result |
|---|---|---|
| live | — | stays |
| connecting/reconnecting | — | stays (still trying) |
| offline | yes | auto-promotes to first live |
| offline | no | stays (will swap when something comes live) |

### What doesn't change

- Click-to-promote: any visible thumb still becomes the stage on click.
- URL `?cam=` and localStorage persistence: still honored on initial mount.
- Aspect ratios: still come from `lib/cameras.ts`.
- Status bar / PTZ panel / system panel: untouched.

## TODOs (ordered)

1. **Edit** `GuardianCameraFeed.tsx`: export `FeedState`; change `onStatusChange` signature; update header.
2. **Add** `useCameraStatuses.ts` with header.
3. **Edit** `GuardianCameraStage.tsx`: hook integration, auto-promote effect, visible/hidden thumb partition, responsive grid helper, empty state, header update.
4. **Verify** `npm run lint` passes.
5. **Verify** `npm run build` passes.
6. **Manual smoke test** (`npm run dev`) on `/` and `/projects/guardian`:
   - All cameras show; offline ones disappear within ~12s (`OFFLINE_THRESHOLD` × `POLL_INTERVAL`).
   - Force a camera offline (block its name in DevTools network) and confirm: thumb hides, featured auto-switches if it was the offline one.
   - Restore the camera and confirm: thumb reappears without reload.
   - Add/remove a camera in `lib/cameras.ts`; confirm grid still looks right (1, 2, 3, 4, 5 thumbs).
7. **Update** `CHANGELOG.md` with new minor version entry.
8. **Commit + push** (verbose message; per Boss's standing instruction other agents depend on GitHub).

## Docs / Changelog touchpoints

- `CHANGELOG.md` — new minor version entry.
- `docs/FRONTEND-ARCHITECTURE.md` — may need a one-liner about the visibility rule; check after implementation.
- `CLAUDE.md` — no edits needed (count semantics unchanged).

## Risks / mitigations

- **Featured flapping**: bounded — `GuardianCameraFeed` requires 10 consecutive misses (~12s) to reach `"offline"`, so a flickering camera can't cause rapid auto-promotes. Once promoted, we stay (no return-to-original logic).
- **All cameras offline**: empty-state placeholder; matches reality.
- **User chose a cam via URL and it goes offline**: we auto-promote. Boss explicitly asked for this — smarter UI > sticky URL.
- **Hidden mount memory**: ≤ N blob URLs at a time, revoked on each new frame. Negligible.
- **Tailwind purge / static class names**: handled by literal strings in `gridColsForCount`. No dynamic class concatenation.
