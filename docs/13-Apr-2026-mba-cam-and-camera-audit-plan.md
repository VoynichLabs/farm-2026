# mba-cam Integration + Camera-Wiring Audit

**Date:** 13-April-2026
**Author:** Claude Opus 4.6
**Repo:** farm-2026
**Related:** `docs/13-Apr-2026-mba-cam-frontend-integration-plan.md` (prior handoff — superseded by this broader audit), `farm-guardian/CHANGELOG.md` v2.22.1

## Context

Farm Guardian is now running five cameras as of backend v2.22.1 (`farm-guardian/config.json`): `house-yard`, `s7-cam`, `usb-cam`, `gwtc`, **`mba-cam`**. The frontend registry at `lib/cameras.ts` still only declares four — `mba-cam` is missing. On top of that, several copy strings and hard-coded counts across the site still say "four cameras." Result: the website understates what Guardian is actually watching, the MacBook Air's feed doesn't appear anywhere on https://farm.markbarney.net, and the homepage stat block is wrong.

Boss asked for the fifth camera added AND an audit sweep of existing camera wiring for drift against backend reality.

## Scope

**In**
- Register `mba-cam` in `lib/cameras.ts` at position 2 (right after `usb-cam`).
- Update every "four cameras" / "4 cameras" reference across MDX, page copy, and component labels to reflect five.
- Add an `mba-cam` row to the camera roster table in `content/projects/guardian/index.mdx`.
- Verify existing four-camera metadata (device, label, location) still matches backend `config.json` reality — fix any drift found.
- CHANGELOG bump (SemVer minor).

**Out**
- Detection wiring for `mba-cam` (backend `detection_enabled: false`; chicks aren't predators).
- PTZ controls for `mba-cam` (fixed camera).
- Surfacing new backend v1 API endpoints (patterns, tracks, deterrent effectiveness). Separate effort.
- Renaming `mba-cam` to anything location-based (device-not-location naming rule stands).

## Audit findings (current frontend vs. backend v2.22.1)

| Camera | Frontend label/device/location | Backend reality | Drift? |
|---|---|---|---|
| `usb-cam` | "USB webcam" / "Desk brooder (Birdadette + Cackle chicks)" | USB on Mac Mini, 1920×1080, snapshot mode, WB+autofocus | None material |
| `s7-cam` | "Samsung S7 (RTSP)" / "Brooder" | RTSP UDP @ 192.168.0.249:5554/camera, fixed | None |
| `gwtc` | "Gateway laptop webcam" / "Coop nestbox" | RTSP TCP @ 192.168.0.68:8554/nestbox | None |
| `house-yard` | "Reolink E1 Pro 4K PTZ" / "House yard" | Reolink snapshot mode, 4K JPEG via cmd=Snap, PTZ | None |
| `mba-cam` | **MISSING** | RTSP TCP @ 192.168.0.50:8554/mba-cam, fixed, MacBook Air 2013 webcam | **ADD** |

Two hardcoded-default defaults (`DEFAULT_FEATURED="usb-cam"` in `lib/cameras.ts` vs. `defaultFeatured="house-yard"` in `GuardianDashboard.tsx`) are intentional — homepage leads with the brooder, dashboard leads with the PTZ. Leaving both as-is.

## Files to change

1. **`lib/cameras.ts`** — Add `"mba-cam"` to `CameraName` union; insert new `CameraMeta` at index 1 (after `usb-cam`, before `s7-cam`). Update file header date + model.
2. **`content/projects/guardian/index.mdx`**
   - Line 5: `"Four cameras, ..."` → `"Five cameras, ..."` (description frontmatter).
   - Line 22: `"Four cameras, each with a different job:"` → `"Five cameras, each with a different job:"`.
   - Add table row: `| mba-cam | MacBook Air 2013 webcam | The brooder. Built-in 720p webcam. macOS Big Sur, ffmpeg + MediaMTX → RTSP. |`.
   - Line 40: `"from all four cameras"` → `"from all five cameras"`.
3. **`app/page.tsx`** line 188 — `"4 cameras · M4 Pro 64GB"` → `"5 cameras · M4 Pro 64GB"`.
4. **`app/components/guardian/GuardianHomeBadge.tsx`** line 72 — `"4 cameras · HLS streaming · snapshot polling"` → `"5 cameras · snapshot polling"` (also drop the stale `HLS streaming` claim — backend is snapshot-only now per farm-guardian v2.18.0).
5. **`CHANGELOG.md`** — new top entry `[1.5.0] — 2026-04-13` describing the addition + drift sweep.

## Reused modules (no new code paths)

- `GuardianCameraFeed.tsx` — generic per-camera feed; consumes camera name, no per-camera branches. Zero change.
- `GuardianCameraStage.tsx` — generic stage + thumbs layout; reads the registry. Zero change.
- `lib/cameras.ts` — single source of truth; only the array grows. SRP/DRY pattern preserved.

## Verification

```bash
cd ~/Documents/GitHub/farm-2026
npm run lint    # must pass
npm run build   # must pass
npm run dev     # local smoke: http://localhost:3000/projects/guardian
```

Manual checks in the dev browser:
- `/projects/guardian` shows **five** thumbs; `mba-cam` appears in the second slot; click promotes it to the stage.
- Homepage system panel lists `mba-cam` with the MacBook Air 2013 device string.
- Network tab: `GET https://guardian.markbarney.net/api/cameras/mba-cam/frame` returns 200 with a ~100–150 KB JPEG every ~1.2 s.
- Homepage status badge reads "5 cameras" (not 4) and no longer claims HLS.

Production verification after merge: Railway auto-deploys from `main`; reload https://farm.markbarney.net and confirm the same five-camera layout.

## Docs/Changelog touchpoints

- `CHANGELOG.md` — top entry, SemVer 1.5.0 (minor; user-visible addition).
- `CLAUDE.md` — already lists five cameras (done in earlier commit); no further edit.
- `docs/13-Apr-2026-mba-cam-frontend-integration-plan.md` — earlier handoff; leave in place as historical record, this plan supersedes.
