"use client";
/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Full-size modal for a selected gem. Uses the native <dialog>
 *   element — it gives us focus trap, backdrop click, ESC-to-close for
 *   free on modern browsers. Arrow keys navigate prev/next within the
 *   current list. Composes GemCaption + GemMetaTable so a single row
 *   shape feeds both the image view and the metadata panel.
 * SRP/DRY check: Pass — state (which row is open) is lifted to
 *   GemsGalleryClient; this component is controlled via props.
 */
import { useEffect, useRef } from "react";
import type { GemRow } from "@/app/components/guardian/types";
import GemCaption from "./GemCaption";
import GemMetaTable from "./GemMetaTable";

interface Props {
  row: GemRow | null;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function GemLightbox({
  row,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open/close the native dialog in response to prop changes.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (row && !el.open) el.showModal();
    if (!row && el.open) el.close();
  }, [row]);

  // Keyboard nav — arrow keys for prev/next while open.
  useEffect(() => {
    if (!row) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [row, hasPrev, hasNext, onPrev, onNext]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Close when the backdrop (the dialog element itself) is clicked.
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-0 h-full max-h-full w-full max-w-full bg-transparent p-0 backdrop:bg-black/80"
    >
      {row && (
        <div className="flex h-full w-full items-center justify-center p-4">
          <div
            className="relative flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-cream shadow-2xl md:flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-1 bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.full_url}
                alt={row.caption_draft}
                className="h-full max-h-[70vh] w-full object-contain"
              />
              {hasPrev && (
                <button
                  type="button"
                  onClick={onPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
                  aria-label="Previous gem"
                >
                  ←
                </button>
              )}
              {hasNext && (
                <button
                  type="button"
                  onClick={onNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-3 py-2 text-white hover:bg-black/70"
                  aria-label="Next gem"
                >
                  →
                </button>
              )}
            </div>

            <div className="max-h-[40vh] overflow-y-auto md:max-h-[70vh] md:w-80 md:max-w-sm">
              <div className="space-y-4 p-4">
                <GemCaption caption={row.caption_draft} />
                <GemMetaTable row={row} />
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 rounded-full bg-black/50 px-3 py-1 text-sm text-white hover:bg-black/70"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
