/**
 * Author: Claude Opus 4.8 (1M context)
 * Date: 21-Jul-2026
 * PURPOSE: Serve /llms.txt — the plain-text AI-discovery brief (llms.txt
 *   convention). Body is built by lib/llms.ts (the SSoT), which reads only
 *   local content files, never the Guardian tunnel, so this route is as
 *   hang-proof as /api/health. The /llm.txt route re-exports this handler so
 *   the singular spelling resolves to the same content.
 * SRP/DRY check: Pass — thin handler; all content lives in lib/llms.ts.
 */
import { buildLlmsTxt } from "@/lib/llms";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
