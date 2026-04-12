"use client";
/**
 * Author: Claude Opus 4.6
 * Date: 12-Apr-2026
 * PURPOSE: Manual PTZ controls for the house-yard Reolink. Reads current
 *   position, lets Mark nudge pan/tilt by an approximate degree amount,
 *   recalls on-camera presets, saves new presets, and toggles spotlight /
 *   siren. All five endpoints live in Guardian v2.15 at
 *   https://guardian.markbarney.net/api/v1. No backend changes required.
 *
 *   Timing model: see lib/ptz.ts. The Reolink firmware has no absolute-pan
 *   primitive (confirmed three times, see farm-guardian/docs/
 *   08-Apr-2026-absolute-ptz-investigation.md). We use short move→stop
 *   bursts capped at 500ms per click and iterate up to 5 times for larger
 *   requested deltas, re-reading /position between bursts. Single-burst
 *   accuracy is ±3–5°; iterative accuracy converges toward target.
 *
 *   Safety: always fires /ptz {action:stop} on unmount and on an emergency
 *   STOP button. Siren requires a confirm dialog because it scares the
 *   chickens. Spotlight does not.
 * SRP/DRY check: Pass — no existing PTZ UI in repo (v1.2.0 removed the old
 *   one). Reuses GUARDIAN_API from types.ts and timing helpers from lib/ptz.ts.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { GUARDIAN_API, PTZPosition, PresetMapResponse } from "./types";
import {
  PTZ_SPEED,
  BURST_CAP_MS,
  MAX_DEGREE_INPUT,
  estimateBurstMs,
  panDelta,
} from "@/lib/ptz";

const CAMERA_ID = "house-yard";
const BASE = `${GUARDIAN_API}/api/v1/cameras/${CAMERA_ID}`;
const MAX_BURST_ITERATIONS = 5;
const POSITION_SETTLE_MS = 900;

type Direction = "left" | "right" | "up" | "down";

async function getPosition(): Promise<PTZPosition | null> {
  try {
    const res = await fetch(`${BASE}/position`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as PTZPosition;
  } catch {
    return null;
  }
}

async function getPresets(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`${BASE}/presets`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as PresetMapResponse;
    return data.presets ?? null;
  } catch {
    return null;
  }
}

function postJSON(path: string, body: Record<string, unknown> = {}) {
  // fire-and-forget: we do not await tunnel RTT on the stop command,
  // though we still keep the keep-alive connection warm.
  return fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function GuardianPTZPanel() {
  const [position, setPosition] = useState<PTZPosition | null>(null);
  const [presets, setPresets] = useState<Record<string, number>>({});
  const [degrees, setDegrees] = useState<number>(10);
  const [moving, setMoving] = useState<boolean>(false);
  const [status, setStatus] = useState<string>("");
  const [spotlightOn, setSpotlightOn] = useState<boolean>(false);
  const [savePresetOpen, setSavePresetOpen] = useState<boolean>(false);
  const mountedRef = useRef(true);

  const refreshPosition = useCallback(async () => {
    const p = await getPosition();
    if (mountedRef.current && p) setPosition(p);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refreshPosition();
    getPresets().then((p) => {
      if (mountedRef.current && p) setPresets(p);
    });
    return () => {
      mountedRef.current = false;
      // Safety net — if the user navigates away mid-burst, stop the camera.
      postJSON("/ptz", { action: "stop" }).catch(() => {});
    };
  }, [refreshPosition]);

  // Single burst at speed 5. Schedules the stop on the same tick as the
  // start so browser event-loop delay doesn't extend the burst.
  const runBurst = useCallback(
    (axis: "pan" | "tilt", direction: 1 | -1, ms: number): Promise<void> => {
      return new Promise((resolve) => {
        const body =
          axis === "pan"
            ? { action: "move", pan: direction, tilt: 0, speed: PTZ_SPEED }
            : { action: "move", pan: 0, tilt: direction, speed: PTZ_SPEED };
        postJSON("/ptz", body).catch(() => {});
        const t = window.setTimeout(() => {
          postJSON("/ptz", { action: "stop" })
            .catch(() => {})
            .finally(() => resolve());
        }, Math.max(50, Math.min(BURST_CAP_MS, ms)));
        // best-effort abort on unmount: the cleanup in useEffect also fires
        // an explicit stop, so we don't need to track `t` globally.
        void t;
      });
    },
    []
  );

  const nudge = useCallback(
    async (dir: Direction) => {
      if (moving) return;
      const requested = Math.max(1, Math.min(MAX_DEGREE_INPUT, degrees));
      const axis: "pan" | "tilt" = dir === "left" || dir === "right" ? "pan" : "tilt";
      // Reolink convention (verified in farm-guardian/AGENTS_CAMERA.md):
      //   pan=1 right, pan=-1 left. Tilt: 1 up, -1 down.
      const signedDir: 1 | -1 =
        dir === "right" || dir === "up" ? 1 : -1;

      setMoving(true);
      setStatus(`Requested ${requested}° ${dir}…`);
      const before = await getPosition();
      if (!before) {
        setStatus("Could not read camera position. Try again.");
        setMoving(false);
        return;
      }

      // Iterate small bursts until we've moved ~the requested amount,
      // capped at MAX_BURST_ITERATIONS so a dropped stop can't run away.
      let totalMoved = 0;
      let current = before;
      for (let i = 0; i < MAX_BURST_ITERATIONS; i++) {
        const remaining = requested - totalMoved;
        if (remaining <= 1) break;
        const burstMs = estimateBurstMs(Math.min(remaining, 15));
        await runBurst(axis, signedDir, burstMs);
        await new Promise((r) => setTimeout(r, POSITION_SETTLE_MS));
        const next = await getPosition();
        if (!next) break;
        if (axis === "pan") {
          const delta = Math.abs(panDelta(before.pan_degrees, next.pan_degrees));
          totalMoved = delta;
        } else {
          totalMoved = Math.abs(next.tilt - before.tilt) / 20; // ~20 units per degree
        }
        current = next;
        if (totalMoved >= requested - 1) break;
      }

      // Autofocus after any movement. Don't await — the 3s wait is
      // informational (see AGENTS_CAMERA.md — blurry frames come from
      // skipping this). The snapshot stage refreshes on its own timer.
      postJSON("/autofocus").catch(() => {});
      if (mountedRef.current) {
        setPosition(current);
        setStatus(
          `Requested ${requested}° ${dir} · moved ≈${totalMoved.toFixed(1)}°. ` +
            `Autofocusing — image may blur for ~3s.`
        );
        setMoving(false);
      }
    },
    [degrees, moving, runBurst]
  );

  const emergencyStop = useCallback(() => {
    postJSON("/ptz", { action: "stop" }).catch(() => {});
    setStatus("STOP sent.");
    setMoving(false);
  }, []);

  const gotoPreset = useCallback(
    async (name: string, id: number) => {
      if (moving) return;
      setMoving(true);
      setStatus(`Recalling preset "${name}"…`);
      await postJSON("/preset/goto", { id }).catch(() => {});
      // Preset recalls take ~1-3s. Poll once after 3s.
      setTimeout(async () => {
        const p = await getPosition();
        if (mountedRef.current) {
          if (p) setPosition(p);
          setStatus(`At preset "${name}".`);
          setMoving(false);
        }
      }, 3000);
    },
    [moving]
  );

  const toggleSpotlight = useCallback(async () => {
    const next = !spotlightOn;
    setSpotlightOn(next);
    await postJSON("/spotlight", { on: next, brightness: 100 }).catch(() => {});
    setStatus(`Spotlight ${next ? "on" : "off"}.`);
  }, [spotlightOn]);

  const fireSiren = useCallback(async () => {
    const ok = window.confirm(
      "Fire siren for 10 seconds? This will scare the chickens."
    );
    if (!ok) return;
    await postJSON("/siren", { duration: 10 }).catch(() => {});
    setStatus("Siren fired (10s).");
  }, []);

  const savePresetAt = useCallback(
    async (name: string, id: number) => {
      await postJSON("/preset/save", { id, name }).catch(() => {});
      const fresh = await getPresets();
      if (mountedRef.current) {
        if (fresh) setPresets(fresh);
        setStatus(`Saved preset "${name}" at current position.`);
        setSavePresetOpen(false);
      }
    },
    []
  );

  const posLabel = position
    ? `${position.pan_degrees.toFixed(1)}° pan · ${position.tilt} tilt`
    : "—";

  return (
    <div className="mx-2 mb-2 rounded border border-guardian-border bg-guardian-card p-3 text-guardian-text">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[0.8rem] font-mono text-guardian-muted">
          PTZ · house-yard
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[0.75rem] font-mono text-slate-300">
            {posLabel}
          </span>
          <button
            type="button"
            onClick={refreshPosition}
            className="text-[0.7rem] font-mono text-guardian-muted hover:text-slate-200 underline"
          >
            refresh
          </button>
        </div>
      </div>

      {/* Presets */}
      <div className="mb-3">
        <div className="text-[0.7rem] font-mono text-guardian-muted mb-1.5">
          Presets
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(presets).map(([name, id]) => (
            <button
              key={id}
              type="button"
              disabled={moving}
              onClick={() => gotoPreset(name, id)}
              className="px-2.5 py-1 text-[0.75rem] font-mono rounded border border-guardian-border bg-guardian-bg hover:bg-guardian-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {name}
            </button>
          ))}
          <button
            type="button"
            disabled={moving}
            onClick={() => setSavePresetOpen(true)}
            className="px-2.5 py-1 text-[0.75rem] font-mono rounded border border-dashed border-guardian-border text-guardian-muted hover:text-slate-200 hover:border-solid disabled:opacity-50"
          >
            + save current
          </button>
        </div>
      </div>

      {/* Nudge */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="text-[0.7rem] font-mono text-guardian-muted">
            Nudge
          </div>
          <label className="text-[0.7rem] font-mono flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={MAX_DEGREE_INPUT}
              value={degrees}
              onChange={(e) => setDegrees(parseInt(e.target.value) || 10)}
              className="w-14 bg-guardian-bg border border-guardian-border rounded px-1.5 py-0.5 text-slate-200 font-mono"
            />
            <span className="text-guardian-muted">° (approx)</span>
          </label>
        </div>
        <div className="grid grid-cols-4 gap-1.5 max-w-md">
          <button
            type="button"
            disabled={moving}
            onClick={() => nudge("left")}
            className="px-2.5 py-1.5 text-[0.75rem] font-mono rounded border border-guardian-border bg-guardian-bg hover:bg-guardian-hover disabled:opacity-50"
          >
            ← left
          </button>
          <button
            type="button"
            disabled={moving}
            onClick={() => nudge("right")}
            className="px-2.5 py-1.5 text-[0.75rem] font-mono rounded border border-guardian-border bg-guardian-bg hover:bg-guardian-hover disabled:opacity-50"
          >
            right →
          </button>
          <button
            type="button"
            disabled={moving}
            onClick={() => nudge("up")}
            className="px-2.5 py-1.5 text-[0.75rem] font-mono rounded border border-guardian-border bg-guardian-bg hover:bg-guardian-hover disabled:opacity-50"
          >
            ↑ up
          </button>
          <button
            type="button"
            disabled={moving}
            onClick={() => nudge("down")}
            className="px-2.5 py-1.5 text-[0.75rem] font-mono rounded border border-guardian-border bg-guardian-bg hover:bg-guardian-hover disabled:opacity-50"
          >
            down ↓
          </button>
        </div>
      </div>

      {/* Deterrents + emergency stop */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        <button
          type="button"
          onClick={toggleSpotlight}
          className={`px-2.5 py-1 text-[0.75rem] font-mono rounded border ${
            spotlightOn
              ? "border-amber-500 bg-amber-500/20 text-amber-300"
              : "border-guardian-border bg-guardian-bg hover:bg-guardian-hover"
          }`}
        >
          Spotlight {spotlightOn ? "on" : "off"}
        </button>
        <button
          type="button"
          onClick={fireSiren}
          className="px-2.5 py-1 text-[0.75rem] font-mono rounded border border-red-500/40 bg-guardian-bg hover:bg-red-500/20 text-red-300"
        >
          Siren 10s…
        </button>
        <button
          type="button"
          onClick={emergencyStop}
          className="ml-auto px-2.5 py-1 text-[0.75rem] font-mono rounded border border-red-500 bg-red-500/20 text-red-200 hover:bg-red-500/40"
        >
          STOP
        </button>
      </div>

      {/* Status line */}
      <div className="text-[0.7rem] font-mono text-guardian-muted min-h-[1rem]">
        {moving ? "Moving… " : ""}
        {status}
      </div>

      {savePresetOpen && (
        <SavePresetDialog
          currentPresets={presets}
          onCancel={() => setSavePresetOpen(false)}
          onSave={savePresetAt}
        />
      )}
    </div>
  );
}

function SavePresetDialog({
  currentPresets,
  onSave,
  onCancel,
}: {
  currentPresets: Record<string, number>;
  onSave: (name: string, id: number) => void;
  onCancel: () => void;
}) {
  const usedIds = new Set(Object.values(currentPresets));
  const nextId = (() => {
    for (let i = 0; i < 64; i++) if (!usedIds.has(i)) return i;
    return 0;
  })();
  const [name, setName] = useState<string>("");
  const [id, setId] = useState<number>(nextId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-guardian-card border border-guardian-border rounded p-4 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[0.8rem] font-mono text-slate-200 mb-3">
          Save current camera position as preset
        </div>
        <label className="block mb-2 text-[0.7rem] font-mono text-guardian-muted">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. truck-view"
            className="mt-1 w-full bg-guardian-bg border border-guardian-border rounded px-2 py-1 text-slate-200 font-mono text-[0.8rem]"
            autoFocus
          />
        </label>
        <label className="block mb-4 text-[0.7rem] font-mono text-guardian-muted">
          ID (0–63, {nextId} is the next free slot)
          <input
            type="number"
            min={0}
            max={63}
            value={id}
            onChange={(e) => setId(parseInt(e.target.value) || 0)}
            className="mt-1 w-full bg-guardian-bg border border-guardian-border rounded px-2 py-1 text-slate-200 font-mono text-[0.8rem]"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-2.5 py-1 text-[0.75rem] font-mono rounded border border-guardian-border text-guardian-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name.trim()}
            onClick={() => onSave(name.trim(), id)}
            className="px-2.5 py-1 text-[0.75rem] font-mono rounded border border-emerald-500/50 bg-emerald-500/20 text-emerald-200 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
