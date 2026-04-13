# 13-Apr-2026 — Guardian Loading State Plan

**Author:** OpenAI Codex GPT-5.4
**Status:** Implemented

## Scope
- Improve the Guardian camera tile UX on first load and during short polling hiccups.
- Keep the change frontend-only in `farm-2026`.
- Preserve the existing backend/API contract.

## Architecture
- Reuse `app/components/guardian/GuardianCameraFeed.tsx` as the single place that decides tile state.
- Replace the binary show/hide logic with explicit client-side feed states:
  - `connecting`
  - `live`
  - `reconnecting`
  - `offline`
- Continue using the existing snapshot polling loop and per-camera failure counter.

## TODO
- [x] Inspect the current Guardian camera feed component.
- [x] Add a connecting state for first-load before the first frame arrives.
- [x] Keep the last good frame visible while reconnecting after short polling failures.
- [x] Reserve hard offline only for a longer failure threshold.
- [x] Update `CHANGELOG.md`.
- [x] Run a production build.
- [x] Commit and push to `main`.

## Out of Scope
- No backend Guardian changes.
- No API response changes.
- No redesign of the overall Guardian page layout.
