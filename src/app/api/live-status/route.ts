import { NextResponse } from "next/server";
import { fetchLiveStatus, LIVE_STATUS_CACHE_TTL_MS } from "~/lib/livepeer";

export async function GET() {
  const result = await fetchLiveStatus();
  const success = result.status !== "error";

  return NextResponse.json(result, {
    status: success ? 200 : 503,
    headers: success
      ? {
          // Vercel may cache this generic result regionally. Application code
          // guarantees coalescing only inside one warm runtime, not globally.
          "Cache-Control": "public, max-age=0, must-revalidate",
          "Vercel-CDN-Cache-Control": `public, max-age=${LIVE_STATUS_CACHE_TTL_MS / 1_000}`,
        }
      : { "Cache-Control": "private, no-store" },
  });
}
