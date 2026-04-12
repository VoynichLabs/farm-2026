# Guardian Camera Offline Flap Fix Plan

**Date:** 12-April-2026
**Author:** Claude Opus 4.6
**Status:** Implemented in v1.4.1

## Scope

**In scope**
- Inspect the Guardian frontend polling/offline logic that can make live camera tiles flip to OFFLINE.
- Make the smallest safe fix so the camera feeds stay visible unless their own snapshot polling is actually failing.
- Update the top of `CHANGELOG.md` and this plan if the behavior changes.
- Run a production build to validate the change.

**Out of scope**
- No backend changes in `farm-guardian`.
- No redesign of the Guardian dashboard.
- No changes to PTZ, detections, or content copy unless required for the fix.

## Architecture

- `app/components/guardian/GuardianDashboard.tsx` owns the shared `/api/status` poll and feeds the status bar / camera stage.
- `app/components/guardian/GuardianCameraFeed.tsx` owns per-camera snapshot polling and the offline display logic for each tile.
- The likely failure mode is a shared status failure cascading into all camera tiles, rather than the per-camera snapshot poll itself being down.
- The fix should keep the per-camera feed component as the source of truth for whether a specific camera is visible.

## TODOs

1. Read the Guardian components and confirm which state transition flips the tiles to OFFLINE.
2. Patch the narrowest component so a transient shared status failure cannot hide healthy camera frames.
3. Update the file header metadata in any touched TS/JS file.
4. Add a short `CHANGELOG.md` entry describing the fix and why it was needed.
5. Run `npm run build` and confirm the production build succeeds.
6. Review the diff for scope, then commit and push only if validation passes.

## Docs / Changelog touchpoints

- `CHANGELOG.md` top entry: add a small fix note with what changed, why, and how it was validated.
- This plan document remains the audit trail for the change.

## Acceptance Criteria

- Camera feeds no longer drop to OFFLINE just because the shared status poll hiccups.
- Offline still appears when the camera snapshot poll itself fails repeatedly.
- Production build passes cleanly.
