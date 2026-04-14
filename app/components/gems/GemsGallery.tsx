/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Server entry for /gallery/gems — parses search params into a
 *   GemsQuery, calls fetchGems() with Next's 5-minute SSR cache, and
 *   hands the first page down to GemsGalleryClient for hydration.
 *   On fetch failure renders GemsError; on zero rows renders GemsEmpty.
 * SRP/DRY check: Pass — all fetching lives in lib/gems.ts; no client
 *   state here.
 */
import { fetchGems, type GemsQuery } from "@/lib/gems";
import GemFilters from "./GemFilters";
import GemsGalleryClient from "./GemsGalleryClient";
import GemsError from "./GemsError";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

function toArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value;
  return [value];
}

function toScalar(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
}

function paramsToQuery(params: Props["searchParams"]): GemsQuery {
  return {
    camera: toArray(params.camera),
    scene: toArray(params.scene),
    activity: toArray(params.activity),
    individual: toArray(params.individual),
    since: toScalar(params.since),
    until: toScalar(params.until),
    limit: 24,
  };
}

export default async function GemsGallery({ searchParams }: Props) {
  const query = paramsToQuery(searchParams);
  const result = await fetchGems(query);

  const clientKey = new URLSearchParams(
    Object.entries(searchParams ?? {}).flatMap(([k, v]) =>
      Array.isArray(v)
        ? v.map((x) => [k, x] as [string, string])
        : v
          ? [[k, v] as [string, string]]
          : [],
    ),
  ).toString();

  return (
    <div className="space-y-6">
      <GemFilters />
      {result.ok ? (
        <GemsGalleryClient
          key={clientKey}
          initialRows={result.data.rows}
          initialCursor={result.data.next_cursor}
          query={query}
        />
      ) : (
        <GemsError />
      )}
    </div>
  );
}
