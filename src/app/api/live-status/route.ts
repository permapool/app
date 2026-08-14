import { NextResponse } from "next/server";
import { fetchLiveStatus, LIVE_STATUS_CACHE_TTL_MS } from "~/lib/livepeer";

export async function GET() {
  const result = await fetchLiveStatus();

  return NextResponse.json(result, {
    status: result.status === "error" ? 503 : 200,
    headers: {
      // The server reader coalesces concurrent requests and caches the generic
      // result for the same five-second window. Accounting conservatively for
      // both layers plus 15-second visible client polling, the worst-case status
      // transition latency is 25 seconds.
      "Cache-Control": `public, max-age=0, s-maxage=${LIVE_STATUS_CACHE_TTL_MS / 1_000}, must-revalidate`,
    },
  });
}
