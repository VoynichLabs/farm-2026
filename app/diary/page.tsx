/**
 * Author: Claude Opus 5.5 (prev Claude Opus 4.6)
 * Date: 03-Oct-2026 (orig 09-Apr-2026)
 * PURPOSE: Redirect old /diary URL to /field-notes. Preserves any bookmarks.
 *   03-Oct-2026 (SEO checklist pass): permanent (308) instead of temporary
 *   (307). The move is permanent, and a temporary redirect tells search
 *   engines to keep the old address indexed instead of passing it on.
 * SRP/DRY check: Pass — simple redirect.
 */
import { permanentRedirect } from "next/navigation";

export default function DiaryPage() {
  permanentRedirect("/field-notes");
}
