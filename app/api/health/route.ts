/**
 * Author: Claude Opus 4.7 (1M context)
 * Date: 06-May-2026
 * PURPOSE: Dedicated liveness endpoint for Railway's healthcheck. Returns
 *   200 {ok:true} with no upstream calls — must stay independent of the
 *   Guardian Cloudflare tunnel, the Mac Mini, env reads, content loading,
 *   and any imports from lib/. Replaces `healthcheckPath: "/"` (the
 *   homepage), which was awaiting three Guardian fetches during SSR;
 *   tunnel jitter could time out the healthcheck and trigger Railway's
 *   ON_FAILURE restart policy. See docs/06-May-2026-healthcheck-and-ssr
 *   -timeout-plan.md for the root-cause walkthrough.
 *
 *   `dynamic = "force-dynamic"` so the response proves the live Next.js
 *   server actually answered, not a statically-rendered asset cached at
 *   the edge — that's the whole point of a liveness probe.
 *
 * SRP/DRY check: Pass — single responsibility (process is alive). Zero
 *   imports beyond Next's request handling, by design.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ ok: true }, { status: 200 });
}
