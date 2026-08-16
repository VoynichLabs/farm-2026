#!/usr/bin/env node
/**
 * Author: Claude Opus 5 (prev Claude Opus 4.7)
 * Date: 15-Aug-2026
 * PURPOSE: Live-API contract check between farm-2026 (frontend) and
 *   farm-guardian (backend). Hits the surfaces this app actually consumes
 *   and asserts that the response shapes match what `app/components/guardian/types.ts`
 *   and `lib/guardian-roster.ts` expect. Catches silent contract drift —
 *   a backend rename or removed field — before users find it.
 *
 *   Closes gap D3 from docs/02-May-2026-system-review-and-gap-analysis.md.
 *   This is the "cheap" version of D3 (handwritten checks); the "better"
 *   version is OpenAPI-driven type generation, which can come later.
 *
 *   Run:  node scripts/check-guardian-contract.mjs
 *   Or:   npm run check:contract
 *
 *   Targets prod by default. Override with:
 *     GUARDIAN_API=https://staging.example.com node scripts/check-guardian-contract.mjs
 *
 *   Exit code: 0 on full pass, 1 on any contract violation. CI-friendly.
 *
 * SRP/DRY check: Pass — single responsibility: probe live endpoints, assert
 *   shape, report drift. No side effects beyond stdout/exit code.
 */

import fs from "node:fs";
import path from "node:path";

const API = process.env.GUARDIAN_API ?? "https://guardian.markbarney.net";

const C = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

function fail(label, msg) {
  console.error(`  ${C.red}✗${C.reset} ${label} — ${msg}`);
}

function pass(label, note) {
  const tail = note ? ` ${C.dim}(${note})${C.reset}` : "";
  console.log(`  ${C.green}✓${C.reset} ${label}${tail}`);
}

function warn(label, msg) {
  console.warn(`  ${C.yellow}!${C.reset} ${label} — ${msg}`);
}

/**
 * Verify each field in `expected` exists on `obj` with the given type.
 * Type values: "string", "number", "boolean", "array", "object", or
 * "string|null", etc. Unknown extra fields on `obj` are fine — backend
 * may add things; we only fail on what the frontend expects but doesn't
 * find or finds with the wrong type.
 *
 * Returns the number of failures.
 */
function checkShape(obj, expected, label) {
  let failures = 0;
  for (const [field, type] of Object.entries(expected)) {
    const allowNull = type.includes("|null");
    const baseType = type.replace("|null", "");
    if (!(field in obj)) {
      fail(label, `missing field "${field}" (expected ${type})`);
      failures++;
      continue;
    }
    const value = obj[field];
    if (value === null) {
      if (allowNull) continue;
      fail(label, `field "${field}" was null (expected ${type})`);
      failures++;
      continue;
    }
    if (baseType === "array") {
      if (!Array.isArray(value)) {
        fail(label, `field "${field}" expected array, got ${typeof value}`);
        failures++;
      }
      continue;
    }
    const actual = typeof value;
    if (actual !== baseType) {
      fail(label, `field "${field}" expected ${baseType}, got ${actual}`);
      failures++;
    }
  }
  return failures;
}

async function fetchJson(path) {
  const url = `${API}${path}`;
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    const elapsed = Date.now() - t0;
    if (!res.ok) {
      fail(path, `HTTP ${res.status} ${res.statusText} (${elapsed}ms)`);
      return null;
    }
    return { json: await res.json(), elapsed };
  } catch (err) {
    fail(path, `fetch failed: ${err.message}`);
    return null;
  }
}

async function checkStatus() {
  console.log(`\n${C.bold}/api/status${C.reset} ${C.dim}— GuardianStatus (types.ts:16)${C.reset}`);
  const result = await fetchJson("/api/status");
  if (!result) return 1;
  let failures = 0;
  failures += checkShape(
    result.json,
    {
      online: "boolean",
      uptime_seconds: "number",
      frames_processed: "number",
      alerts_sent: "number",
      cameras_online: "number",
      cameras_total: "number",
      detections_today: "number",
      alerts_today: "number",
    },
    "/api/status",
  );
  if (failures === 0) pass("/api/status", `${result.elapsed}ms`);
  return failures;
}

async function checkCameras() {
  console.log(`\n${C.bold}/api/cameras${C.reset} ${C.dim}— RawCamera[] (lib/guardian-roster.ts:33)${C.reset}`);
  const result = await fetchJson("/api/cameras");
  if (!result) return 1;
  if (!Array.isArray(result.json)) {
    fail("/api/cameras", `expected array, got ${typeof result.json}`);
    return 1;
  }
  if (result.json.length === 0) {
    warn("/api/cameras", "empty array — no cameras configured right now");
    pass("/api/cameras", `${result.elapsed}ms, 0 cameras`);
    return 0;
  }
  let failures = 0;
  // Frontend reads `name` (required) and `is_live` (optional). Validate both
  // when present. Backend returns several other fields (online, capturing,
  // last_frame_age_seconds, ...) that the frontend doesn't yet consume —
  // those aren't checked here, but if you add a frontend consumer for one,
  // add a check.
  for (let i = 0; i < result.json.length; i++) {
    const cam = result.json[i];
    failures += checkShape(cam, { name: "string" }, `/api/cameras[${i}]`);
  }
  // is_live: warn if missing on every entry (drift signal). Don't fail —
  // older backends are still supported.
  const hasIsLive = result.json.every((c) => "is_live" in c);
  if (!hasIsLive) {
    warn(
      "/api/cameras",
      'no "is_live" field on at least one camera — frontend roster filtering reverts to "show all" (older backend?)',
    );
  }
  if (failures === 0) {
    const liveCount = result.json.filter((c) => c.is_live !== false).length;
    pass(
      "/api/cameras",
      `${result.elapsed}ms, ${result.json.length} cameras, ${liveCount} live`,
    );
  }
  return failures;
}

async function checkRecentImages() {
  console.log(
    `\n${C.bold}/api/v1/images/recent${C.reset} ${C.dim}— ImageListResponse<RecentRow> (types.ts:178,182)${C.reset}`,
  );
  const result = await fetchJson("/api/v1/images/recent?limit=1");
  if (!result) return 1;
  let failures = 0;
  failures += checkShape(
    result.json,
    {
      count: "number",
      total_estimate: "number",
      next_cursor: "string|null",
      rows: "array",
    },
    "/api/v1/images/recent",
  );
  if (Array.isArray(result.json.rows) && result.json.rows.length > 0) {
    const row = result.json.rows[0];
    failures += checkShape(
      row,
      {
        id: "number",
        camera_id: "string",
        ts: "string",
        thumb_url: "string",
        full_url: "string",
        width: "number",
        height: "number",
        scene: "string",
        bird_count: "number",
        activity: "string",
        lighting: "string",
        composition: "string",
        image_quality: "string",
        any_special_chick: "boolean",
        caption_draft: "string",
        share_reason: "string",
        image_tier: "string",
      },
      "/api/v1/images/recent.rows[0]",
    );
    // Note: apparent_age_days is documented to use -1 sentinel from backend
    // (normalized to null in lib/gems.ts). Don't validate here; that's a
    // shape contract internal to lib/gems.ts.
  } else {
    warn("/api/v1/images/recent", "rows[] empty — no recent gems? skipping row shape check");
  }
  if (failures === 0) {
    pass("/api/v1/images/recent", `${result.elapsed}ms, ${result.json.count} returned`);
  }
  return failures;
}

// ---------------------------------------------------------------------------
// Frame aspect-ratio contract.
//
// `lib/cameras.ts` declares an `aspectRatio` per camera, and the stage uses it
// to size the tile's box. The frame itself is rendered `object-contain`, so
// when the declared ratio and the camera's real output disagree the picture
// silently letterboxes inside a wrongly-shaped box — no error, no log, just a
// tile that looks off. That drift is invisible until someone eyeballs it.
//
// It is a live risk, not a hypothetical: s7-cam switched to portrait 9:16 on
// 2026-04-21 (farm-guardian v2.35.2), and the Duo 2 emits a stitched 8:3
// panoramic. Either one changing again — a camera remounted, a lens swapped,
// a backend resize default changed — desyncs the overlay with nothing to catch
// it.
//
// Scope note: this checks *metadata drift* (declared vs actual geometry). It
// would not have caught the 15-Aug-2026 orphaned-poll-chain bug, where the
// endpoint returned a perfectly correct frame and the frontend requested the
// wrong camera. That one is only observable in the browser.
// ---------------------------------------------------------------------------

// Minimal JPEG header walk — width/height from the SOF segment. Avoids adding
// an image dependency to a script that is otherwise stdlib-only.
function jpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  const SOF = new Set([
    0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7,
    0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
  ]);
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i++;
      continue;
    }
    const marker = buf[i + 1];
    // Standalone markers carry no length payload.
    if (marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    const segmentLength = buf.readUInt16BE(i + 2);
    if (SOF.has(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (segmentLength < 2) return null;
    i += 2 + segmentLength;
  }
  return null;
}

// Pull name → aspectRatio out of lib/cameras.ts. Regex rather than an import
// because this script is plain .mjs and cameras.ts is TypeScript; matching one
// object literal at a time keeps a missing field from bleeding across entries.
function declaredAspectRatios() {
  const src = fs.readFileSync(
    path.join(import.meta.dirname, "..", "lib", "cameras.ts"),
    "utf8",
  );
  const out = new Map();
  for (const block of src.match(/\{[^{}]*?name:\s*"[^"]+"[^{}]*?\}/g) ?? []) {
    const name = block.match(/name:\s*"([^"]+)"/)?.[1];
    const ratio = block.match(/aspectRatio:\s*"([^"]+)"/)?.[1];
    if (!name || !ratio) continue;
    const [w, h] = ratio.split("/").map((n) => parseFloat(n.trim()));
    if (w > 0 && h > 0) out.set(name, { text: ratio, value: w / h });
  }
  return out;
}

async function checkFrameAspectRatios() {
  console.log(
    `\n${C.bold}/api/cameras/{name}/frame${C.reset} ${C.dim}— geometry vs lib/cameras.ts aspectRatio${C.reset}`,
  );

  const declared = declaredAspectRatios();
  const roster = await fetchJson("/api/cameras");
  if (!roster || !Array.isArray(roster.json)) return 0; // checkCameras already reported

  // Same liveness gate the frontend applies (lib/guardian-roster.ts).
  const live = roster.json.filter((c) => c.is_live !== false);
  if (live.length === 0) {
    warn("frame geometry", "no live cameras — nothing to sample");
    return 0;
  }

  let failures = 0;
  for (const cam of live) {
    const url = `${API}/api/cameras/${cam.name}/frame?max_width=640&q=60`;
    let size = null;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) {
        warn(cam.name, `frame HTTP ${res.status} — skipped`);
        continue;
      }
      size = jpegSize(Buffer.from(await res.arrayBuffer()));
    } catch (err) {
      warn(cam.name, `frame fetch failed: ${err.message} — skipped`);
      continue;
    }
    if (!size) {
      warn(cam.name, "could not parse JPEG dimensions — skipped");
      continue;
    }

    const actual = size.width / size.height;
    const spec = declared.get(cam.name);
    const geometry = `${size.width}×${size.height} = ${actual.toFixed(3)}`;

    if (!spec) {
      // Documented + intentional: resolveCameraMeta falls back to 16/9 for any
      // camera without an overlay entry, so this is a nudge, not a violation.
      warn(
        cam.name,
        `no lib/cameras.ts entry — renders at the default 16/9, actual is ${geometry}`,
      );
      continue;
    }

    // 2% tolerance absorbs the backend's rounding on odd source dimensions.
    if (Math.abs(actual - spec.value) / spec.value > 0.02) {
      fail(
        cam.name,
        `declares "${spec.text}" (${spec.value.toFixed(3)}) but serves ${geometry} — ` +
          `the tile will letterbox; update lib/cameras.ts or check the camera`,
      );
      failures++;
    } else {
      pass(cam.name, `${geometry} matches "${spec.text}"`);
    }
  }
  return failures;
}

async function main() {
  console.log(`${C.bold}Guardian API contract check${C.reset}`);
  console.log(`${C.dim}Target:${C.reset} ${API}`);

  const totals = await Promise.all([
    checkStatus(),
    checkCameras(),
    checkRecentImages(),
    checkFrameAspectRatios(),
  ]);
  const failures = totals.reduce((a, b) => a + b, 0);

  console.log("");
  if (failures > 0) {
    console.error(
      `${C.red}${C.bold}✗ ${failures} contract violation${failures === 1 ? "" : "s"} found${C.reset}`,
    );
    console.error(
      `${C.dim}Update app/components/guardian/types.ts and lib/guardian-roster.ts to match, OR${C.reset}`,
    );
    console.error(`${C.dim}fix the backend if the drift was unintentional.${C.reset}`);
    process.exit(1);
  }
  console.log(`${C.green}${C.bold}✓ All contracts pass${C.reset}`);
}

main().catch((err) => {
  console.error(`${C.red}Unexpected failure:${C.reset}`, err);
  process.exit(2);
});
