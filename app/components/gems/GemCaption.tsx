/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Render a gem's caption_draft with a "Draft caption:" affordance
 *   per the cross-repo rule (parent plan 2.d.4). The caption is GLM-authored
 *   and is never styled as finished editorial copy. Two length variants:
 *   full (lightbox) and clipped (card). Kept stateless so both places use
 *   the same source of truth.
 * SRP/DRY check: Pass — single responsibility: render a draft caption.
 */

interface Props {
  caption: string;
  clipLines?: number;
}

export default function GemCaption({ caption, clipLines }: Props) {
  const clipClass =
    clipLines === 2
      ? "line-clamp-2"
      : clipLines === 3
        ? "line-clamp-3"
        : "";

  return (
    <figcaption className="text-sm">
      <span className="text-forest/50 uppercase tracking-wide text-[0.65rem] mr-1.5">
        Draft caption
      </span>
      <span className={`text-forest/80 italic ${clipClass}`}>{caption}</span>
    </figcaption>
  );
}
