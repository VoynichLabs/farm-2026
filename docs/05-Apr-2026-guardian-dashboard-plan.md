# Guardian Live Dashboard — Implementation Plan

## Context

The `/projects/guardian` page is currently a static MDX blog post with a redundant hero photo (same backyard the live camera shows). It needs to become a live, interactive dashboard matching the actual Guardian dashboard UI — dark, dense, terminal-style, with real-time data and camera controls. The homepage Guardian section should also pull live stats instead of showing static text.

## Scope

**In:**
- Replace `/projects/guardian` with a live dashboard (camera feed, PTZ controls, live detection table, status panels, live stats)
- Add CORS middleware to farm-guardian so POST requests work from farm.markbarney.net
- Pull live stats into the homepage Guardian section
- PTZ/spotlight/siren controls exposed publicly (no auth)

**Out:**
- No changes to other pages, flock, diary, existing projects
- No new npm dependencies
- No auth system

## Architecture

### New files (farm-2026)

```
app/components/guardian/types.ts              — shared TypeScript interfaces for API responses
app/components/guardian/GuardianDashboard.tsx  — 'use client' orchestrator: state, polling, layout
app/components/guardian/GuardianStatusBar.tsx  — top status bar (online, uptime, frames, detections)
app/components/guardian/GuardianCameraFeed.tsx — MJPEG stream + overlay badges
app/components/guardian/GuardianPTZPanel.tsx   — d-pad, zoom, presets, spotlight, siren
app/components/guardian/GuardianDetections.tsx — recent detection table (polling)
app/components/guardian/GuardianInfoPanels.tsx — active tracks, deterrent status, today summary, eBird
app/components/guardian/GuardianHomeBadge.tsx  — small client component for homepage live stats
```

### Modified files (farm-2026)

```
app/projects/[slug]/page.tsx  — conditional: suppress hero photo, render GuardianDashboard, widen container for guardian slug
app/page.tsx                  — swap static Guardian status text for GuardianHomeBadge client component
CHANGELOG.md                 — update
```

### Modified files (farm-guardian)

```
dashboard.py  — add CORSMiddleware allowing farm.markbarney.net origin
```

### Integration pattern

- `GuardianDashboard` is imported via `next/dynamic` with `ssr: false` in `[slug]/page.tsx`
- Conditionally rendered: `{slug === "guardian" && <GuardianDashboard />}`
- Hero photo suppressed: `{slug !== "guardian" && project.heroPhoto && (...)}`
- Container widened: `max-w-7xl` when `slug === "guardian"` instead of `max-w-4xl`
- MDX content still renders below the dashboard for technical docs

## Layout (top to bottom)

### A. Status Bar (full width, thin)
- `bg-guardian-card`, `border-b border-guardian-border`, `text-[0.7rem]`
- Green pulse dot + "Guardian Online" (or red + "Offline")
- Live from `/api/status`: uptime, cameras online, frames processed, detections today, alerts today
- Polls every 5s

### B. Camera Feed (63%) + PTZ Panel (37%)
- **Left:** `<img src="guardian.markbarney.net/api/cameras/house-yard/stream">` with overlay (camera name, LIVE dot)
- MJPEG heartbeat: reload stream URL with `?t=` cache-bust every 30s to recover from dropped connections
- **Right:** PTZ control panel matching Guardian dashboard:
  - D-pad grid (3×3: up/down/left/right + stop center) → POST `/api/ptz/house-yard/move` and `/stop`
  - Zoom +/- → POST move with `{zoom: 1}` / `{zoom: -1}`
  - 5 preset buttons (Yard, Coop, Fence, Sky, Drive) → POST `/api/ptz/house-yard/preset/{0-4}`
  - Spotlight ON/OFF → POST `/api/ptz/house-yard/spotlight` with `{on: true/false}`
  - Siren button (red, 2-click confirm: first click shows "Confirm?", second fires) → POST `/api/ptz/house-yard/siren` with `{duration: 5}`
  - Patrol status + deterrent status + active tracks count (from polling)

### C. Detection Table (full width)
- Table: Time | Camera | Class | Conf | Predator
- From `/api/detections/recent?limit=20`, polls every 5s
- Predator rows highlighted red, confidence color-coded
- Compact: `text-[0.75rem]`, monospace timestamps

### D. Info Grid (2-3 columns)
- **Active Tracks** from `/api/tracks/active` — species, duration, detection count
- **Deterrent Status** from `/api/deterrent/status` + `/api/v1/deterrents/effectiveness` — active deterrents, success rate
- **Today's Summary** from `/api/v1/summary/today` — species counts, predator visits, peak hour
- **eBird Sightings** from `/api/v1/ebird/recent` — recent raptor reports

### E. MDX Content
- Existing technical documentation (architecture, REST API, tech stack) renders below in standard prose style

## Polling Strategy

| Endpoint | Interval | Group |
|----------|----------|-------|
| `/api/status` | 5s | fast |
| `/api/detections/recent?limit=20` | 5s | fast |
| `/api/tracks/active` | 5s | fast |
| `/api/deterrent/status` | 5s | fast |
| `/api/ptz/status` | 10s | medium |
| `/api/v1/summary/today` | 60s | slow |
| `/api/v1/deterrents/effectiveness` | 60s | slow |
| `/api/v1/ebird/recent` | 300s | glacial |

Single `useEffect` with grouped `setInterval` calls. Initial fetch on mount. `AbortController` cleanup on unmount.

## Offline Handling

- Track `guardianOnline` boolean from `/api/status` success/failure
- When offline: red dot, "Offline" label, camera shows `/photos/backyard.png` with "OFFLINE" overlay, PTZ controls disabled (grayed), detection table shows "No connection", info panels show "---"
- Individual endpoint failures don't cascade — each panel handles its own error state

## CORS Fix (farm-guardian)

Add to `dashboard.py` `create_app()`:

```python
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://farm.markbarney.net"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

## Homepage Live Stats

`GuardianHomeBadge.tsx` — small `'use client'` component that:
- Fetches `/api/status` once on mount (no polling on homepage)
- Replaces the static "Guardian Online" and pipeline text in the status bar with real values
- Shows actual detections today, cameras online, uptime
- Gracefully falls back to static text if Guardian is offline

## Implementation Order

1. CORS fix in farm-guardian (3-line change, restart Guardian)
2. `types.ts` — all API response interfaces
3. `GuardianDashboard.tsx` — orchestrator with polling
4. `GuardianStatusBar.tsx` + `GuardianCameraFeed.tsx` — validate basics work
5. `GuardianPTZPanel.tsx` — controls with POST actions
6. `GuardianDetections.tsx` — detection table
7. `GuardianInfoPanels.tsx` — tracks, deterrent, summary, eBird
8. Modify `[slug]/page.tsx` — dynamic import, conditional render, wider container, suppress hero
9. `GuardianHomeBadge.tsx` + update `app/page.tsx` for live homepage stats
10. Update `CHANGELOG.md`
11. Build, verify, commit, push

## Verification

```bash
# 1. Restart Guardian after CORS fix
cd ~/Documents/GitHub/farm-guardian && python guardian.py

# 2. Build farm site
cd ~/Documents/GitHub/farm-2026 && npm run build

# 3. Dev server
npm run dev

# 4. Check:
# - localhost:3000/projects/guardian shows live dashboard with camera feed
# - PTZ controls work (camera moves)
# - Spotlight/siren buttons work
# - Detection table populates with real data
# - Status bar shows real uptime/detection counts
# - Kill Guardian → page shows "Offline" state gracefully
# - Restart Guardian → page recovers automatically
# - Homepage at localhost:3000 shows live stats in Guardian section
# - All other pages still work
# - npm run build passes clean
```
