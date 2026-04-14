"use client";
/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Client-side orchestrator for the gems gallery — holds the
 *   flat row list (initial page + load-more appended rows) plus the
 *   lightbox-open row id. Filters are URL-driven by GemFilters, so
 *   the server re-renders this component with fresh initialRows
 *   whenever filters change; a `key` tied to the filter signature
 *   ensures the local list resets cleanly rather than appending onto
 *   stale rows.
 * SRP/DRY check: Pass — layout via GemsGrid, fetching via GemsLoadMore,
 *   rendering via GemCard, modal via GemLightbox. This file wires them.
 */
import { useMemo, useState } from "react";
import type { GemRow } from "@/app/components/guardian/types";
import type { GemsQuery } from "@/lib/gems";
import GemCard from "./GemCard";
import GemsGrid from "./GemsGrid";
import GemLightbox from "./GemLightbox";
import GemsLoadMore from "./GemsLoadMore";
import GemsEmpty from "./GemsEmpty";

interface Props {
  initialRows: GemRow[];
  initialCursor: string | null;
  query: GemsQuery;
}

export default function GemsGalleryClient({
  initialRows,
  initialCursor,
  query,
}: Props) {
  const [rows, setRows] = useState<GemRow[]>(initialRows);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [openId, setOpenId] = useState<number | null>(null);

  const openIndex = useMemo(
    () => (openId === null ? -1 : rows.findIndex((r) => r.id === openId)),
    [openId, rows],
  );
  const openRow = openIndex >= 0 ? rows[openIndex] : null;

  const handleLoaded = (newRows: GemRow[], nextCursor: string | null) => {
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      const dedup = newRows.filter((r) => !seen.has(r.id));
      return [...prev, ...dedup];
    });
    setCursor(nextCursor);
  };

  if (rows.length === 0) {
    return <GemsEmpty />;
  }

  return (
    <>
      <GemsGrid
        rows={rows}
        renderItem={(row, i) => (
          <GemCard
            key={row.id}
            row={row}
            onOpen={setOpenId}
            priority={i < 4}
          />
        )}
      />
      <GemsLoadMore cursor={cursor} query={query} onLoaded={handleLoaded} />
      <GemLightbox
        row={openRow}
        hasPrev={openIndex > 0}
        hasNext={openIndex >= 0 && openIndex < rows.length - 1}
        onClose={() => setOpenId(null)}
        onPrev={() => {
          if (openIndex > 0) setOpenId(rows[openIndex - 1].id);
        }}
        onNext={() => {
          if (openIndex >= 0 && openIndex < rows.length - 1)
            setOpenId(rows[openIndex + 1].id);
        }}
      />
    </>
  );
}
