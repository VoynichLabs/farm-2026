"use client";
/**
 * Author: Claude Fable 5 (orig Claude Opus 4.6)
 * Date: 06-Jul-2026 (orig 14-Apr-2026) — guardian palette (terminal glow-up)
 * PURPOSE: Cursor-paginated "Load more" button. Takes the current
 *   cursor + active filter query, calls fetchGems() via our lib, and
 *   hands the new rows up to the parent so the grid stays the owner
 *   of the flat list.
 * SRP/DRY check: Pass — fetch I/O delegated to lib/gems.ts.
 */
import { useState, useTransition } from "react";
import type { GemsQuery } from "@/lib/gems";
import { fetchGems } from "@/lib/gems";
import type { GemRow } from "@/app/components/guardian/types";

interface Props {
  cursor: string | null;
  query: GemsQuery;
  onLoaded: (rows: GemRow[], nextCursor: string | null) => void;
}

export default function GemsLoadMore({ cursor, query, onLoaded }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!cursor) return null;

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      const result = await fetchGems({ ...query, cursor });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      onLoaded(result.data.rows, result.data.next_cursor);
    });
  };

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full border border-guardian-accent/60 bg-guardian-card px-6 py-2 text-sm font-medium text-emerald-300 hover:bg-guardian-accent hover:text-white transition-colors disabled:opacity-60"
      >
        {pending ? "Loading…" : "Load more"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
