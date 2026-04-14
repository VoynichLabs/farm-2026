// Author: Claude Opus 4.6 (1M context)
// Date: 14-Apr-2026
// PURPOSE: Typed fetchers for farm-guardian's /api/v1/images/* surface
//          (v2.25.0). Single I/O layer for every gems / recent / stats
//          call. Handles URL assembly, Next revalidation window, error
//          mapping, and the `apparent_age_days = -1 → null` normalisation
//          at the API boundary (parent plan 2.b rule).
//          Consumed by GemsGallery, LatestFlockFrames, GemsStatFooter.
// SRP/DRY check: Pass — only lib/gems-format.ts handles formatting; this
//                file only fetches + shapes.
//
// Integration notes:
//   - Base URL defaults to the Cloudflare tunnel
//     (https://guardian.markbarney.net); override via
//     NEXT_PUBLIC_GUARDIAN_BASE for local backend development.
//   - All public endpoints serve Cache-Control; we layer Next's
//     { revalidate: 300 } so SSR pages cold-cache for 5 minutes per
//     parameter combination. Filter changes mint new cache keys naturally
//     because the query string differs.
//   - Never throw raw fetch errors to components — every function returns
//     a typed Result so UI can render a friendly GemsError state instead
//     of a crashed page on tunnel drops.

import type {
  GemRow,
  RecentRow,
  ImageListResponse,
  ImageStats,
} from "@/app/components/guardian/types";
import { GUARDIAN_API } from "@/app/components/guardian/types";

const BASE = process.env.NEXT_PUBLIC_GUARDIAN_BASE ?? GUARDIAN_API;
const REVALIDATE_SECONDS = 300;

export interface GemsQuery {
  camera?: string[];
  scene?: string[];
  activity?: string[];
  individual?: string[];
  since?: string;
  until?: string;
  limit?: number;
  cursor?: string;
  order?: "newest" | "oldest" | "random";
}

export interface RecentQuery extends GemsQuery {
  tier?: Array<"strong" | "decent">;
}

export interface StatsQuery {
  since?: string;
}

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

function buildUrl(path: string, params: object): string {
  const url = new URL(`${BASE}${path}`);
  for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      for (const v of value) url.searchParams.append(key, String(v));
      continue;
    }
    url.searchParams.append(key, String(value));
  }
  return url.toString();
}

// Backend sentinel -1 means "n/a" (not a chick scene). Normalise here so
// callers never render "-1 days old".
function normaliseRow<T extends GemRow>(row: T): T {
  if (row.apparent_age_days === -1) {
    return { ...row, apparent_age_days: null };
  }
  return row;
}

async function request<T>(url: string): Promise<FetchResult<T>> {
  try {
    const res = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { accept: "application/json" },
    });
    if (!res.ok) {
      const body = await res.text();
      let code = "http_error";
      let message = `Guardian API returned ${res.status}`;
      try {
        const parsed = JSON.parse(body);
        if (parsed?.error?.code) code = parsed.error.code;
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {
        // non-JSON error body; keep defaults
      }
      return { ok: false, status: res.status, code, message };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    // Network failure (tunnel drop, DNS, timeout).
    const message = err instanceof Error ? err.message : "network error";
    return { ok: false, status: 0, code: "network_unavailable", message };
  }
}

export async function fetchGems(
  query: GemsQuery = {},
): Promise<FetchResult<ImageListResponse<GemRow>>> {
  const url = buildUrl("/api/v1/images/gems", query);
  const result = await request<ImageListResponse<GemRow>>(url);
  if (!result.ok) return result;
  return {
    ok: true,
    data: { ...result.data, rows: result.data.rows.map(normaliseRow) },
  };
}

export async function fetchGem(id: number): Promise<FetchResult<GemRow>> {
  const url = `${BASE}/api/v1/images/gems/${id}`;
  const result = await request<GemRow>(url);
  if (!result.ok) return result;
  return { ok: true, data: normaliseRow(result.data) };
}

export async function fetchRecent(
  query: RecentQuery = {},
): Promise<FetchResult<ImageListResponse<RecentRow>>> {
  const url = buildUrl("/api/v1/images/recent", query);
  const result = await request<ImageListResponse<RecentRow>>(url);
  if (!result.ok) return result;
  return {
    ok: true,
    data: { ...result.data, rows: result.data.rows.map(normaliseRow) },
  };
}

export async function fetchImageStats(
  query: StatsQuery = {},
): Promise<FetchResult<ImageStats>> {
  const url = buildUrl("/api/v1/images/stats", query);
  return request<ImageStats>(url);
}
