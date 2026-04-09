# Nesting-Box Camera — Website Integration Plan

**Date:** 06-Apr-2026
**Goal:** Surface the Samsung Galaxy S7 nesting-box camera on the farm website and update Guardian docs

## Scope

**In:**
- Update Guardian MDX project docs for: second camera, sweep patrol, per-camera RTSP transport
- Add nesting-box MJPEG feed to Guardian dashboard page
- Add nesting-box MJPEG feed to homepage Guardian section
- Parameterize `GuardianCameraFeed` component for multi-camera use
- CHANGELOG entry

**Out:**
- No backend changes (farm-guardian already serves `/api/cameras/nesting-box/stream`)
- No PTZ/deterrent controls for nesting-box (fixed camera)
- No camera selector UI or full multi-camera refactor
- No changes to types, detections table, info panels, status bar (already generic)

## Architecture

### Reuse
- `GuardianCameraFeed.tsx` — parameterize existing component (add `cameraName`, `label`, `compact` props) rather than creating a new component
- All other Guardian components are already multi-camera safe

### Modified files
- `content/projects/guardian/index.mdx` — docs update
- `app/components/guardian/GuardianCameraFeed.tsx` — parameterize props
- `app/components/guardian/GuardianDashboard.tsx` — add second feed instance
- `app/page.tsx` — add nesting-box stream to homepage
- `CHANGELOG.md` — [0.4.0] entry

### Layout (dashboard)
```
Status Bar
house-yard feed (63%) | PTZ panel (37%)
nesting-box feed (full width, compact ~200px)
Detection Table
Info Panels
```

### Layout (homepage)
```
GuardianHomeBadge
house-yard feed (63%) | System panel (37%)
nesting-box feed (full width, compact ~200px)
Pipeline summary table
```

## TODOs

1. Write this plan doc
2. Update `content/projects/guardian/index.mdx` — S7 hardware, sweep patrol, per-camera transport, architecture diagram
3. Parameterize `GuardianCameraFeed.tsx` — `cameraName`, `label`, `compact` props; per-feed error/load state
4. Update `GuardianDashboard.tsx` — add nesting-box feed row between camera+PTZ and detection table
5. Update `app/page.tsx` — add nesting-box `<img>` stream, update hardware references
6. Update `CHANGELOG.md` — [0.4.0] entry
7. `npm run build` + `npm run lint` — verify clean

## Verification

- `npm run build` passes clean
- `/projects/guardian` shows both feeds, PTZ controls only on house-yard
- `/` homepage shows both feeds, hardware references updated
- Nesting-box offline state independent of house-yard
- All other pages unaffected

## Docs/Changelog touchpoints
- `content/projects/guardian/index.mdx` — updated
- `CHANGELOG.md` — [0.4.0] added
