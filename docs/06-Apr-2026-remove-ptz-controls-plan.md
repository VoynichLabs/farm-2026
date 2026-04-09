# Remove PTZ Controls — Plan

**Date:** 06-Apr-2026
**Goal:** Remove web PTZ controls, redo dashboard layout to watch-only with both camera feeds side by side

## Scope

**In:**
- Delete `GuardianPTZPanel.tsx` entirely (d-pad, zoom, presets, spotlight, siren)
- Redo dashboard layout: both feeds side by side (55/45), compact read-only status row
- Remove PTZ polling and PTZStatus type
- Remove preset references from homepage and MDX docs
- CHANGELOG entry

**Out:**
- No backend changes
- No changes to detection table, info panels, status bar, home badge
- Patrol/deterrent/track status stays (read-only monitoring)

## Architecture

### Why
PTZ controls from the website don't work reliably. The camera now runs automated sweep patrol. The website becomes a monitoring tool — watch feeds, see detection data — not a control panel.

### New dashboard layout
```
Status Bar
house-yard (55%) | nesting-box (45%)
Patrol: Active | Deterrent: Idle | Tracks: 0
Detection Table
Info Panels
```

### What moves where
- Patrol status, deterrent status, active tracks → compact status row (was at bottom of PTZ panel)
- PTZ state + 10s polling → removed entirely

## Files

| File | Action |
|------|--------|
| `app/components/guardian/GuardianPTZPanel.tsx` | Delete |
| `app/components/guardian/GuardianDashboard.tsx` | Remove PTZ, side-by-side feeds + status row |
| `app/components/guardian/types.ts` | Remove PTZStatus |
| `app/page.tsx` | Remove presets line |
| `content/projects/guardian/index.mdx` | Remove presets bullet |
| `CHANGELOG.md` | [0.5.0] entry |

## Verification
- `npm run build` clean
- `/projects/guardian` — two feeds side by side, no controls, status row
- Homepage — no preset references
