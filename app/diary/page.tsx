/**
 * Author: Claude Opus 4.6
 * Date: 09-Apr-2026
 * PURPOSE: Redirect old /diary URL to /field-notes. Preserves any bookmarks.
 * SRP/DRY check: Pass — simple redirect.
 */
import { redirect } from "next/navigation";

export default function DiaryPage() {
  redirect("/field-notes");
}
