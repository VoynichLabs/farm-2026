/**
 * Author: Claude Opus 4.6 (1M context)
 * Date: 14-Apr-2026
 * PURPOSE: Key/value metadata table for a gem — camera, scene, activity,
 *   lighting, composition, quality, age bucket, absolute timestamp.
 *   Rendered inside GemLightbox. Kept as a dumb presentational component
 *   so filters can later reuse any of these facets without re-implementing
 *   the label logic.
 * SRP/DRY check: Pass — all label mapping lives in lib/gems-format.ts.
 */
import type { GemRow } from "@/app/components/guardian/types";
import {
  absoluteTime,
  activityLabel,
  ageBucket,
  cameraDevice,
  sceneLabel,
} from "@/lib/gems-format";

interface Props {
  row: GemRow;
}

export default function GemMetaTable({ row }: Props) {
  const age = ageBucket(row.apparent_age_days);
  const entries: Array<[string, string]> = [
    ["Camera", cameraDevice(row.camera_id)],
    ["Scene", sceneLabel(row.scene)],
    ["Activity", activityLabel(row.activity)],
    ["Lighting", row.lighting],
    ["Composition", row.composition],
    ["Image quality", row.image_quality],
    ["Captured", absoluteTime(row.ts)],
  ];
  if (row.bird_count > 0) {
    entries.push(["Birds in frame (approx.)", String(row.bird_count)]);
  }
  if (age) entries.push(["Age", age]);

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-forest/50">{k}</dt>
          <dd className="text-forest/90">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
