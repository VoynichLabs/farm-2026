/**
 * Author: Claude Opus 4.8 (1M context)
 * Date: 21-Jul-2026
 * PURPOSE: /llm.txt — singular-spelling alias for /llms.txt. The convention is
 *   "llms.txt", but people (and Boss) reach for "llm.txt", so both resolve to
 *   the same brief. Re-exports the canonical handler; no duplicated content.
 * SRP/DRY check: Pass — pure re-export of app/llms.txt/route.ts.
 */
export const dynamic = "force-static";
export { GET } from "@/app/llms.txt/route";
