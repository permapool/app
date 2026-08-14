import "server-only";

export type LiveBroadcastStatus = "live" | "offline" | "error";

type LiveStatusResult = {
  status: LiveBroadcastStatus;
};

type LiveStatusReaderOptions = {
  fetchImpl?: typeof fetch;
  getConfig?: () => { apiKey?: string; streamId?: string };
  now?: () => number;
  cacheTtlMs?: number;
  providerTimeoutMs?: number;
};

const LIVEPEER_API_BASE = "https://livepeer.studio/api";
export const LIVE_STATUS_CACHE_TTL_MS = 5_000;
export const LIVE_STATUS_PROVIDER_TIMEOUT_MS = 5_000;

export function createLiveStatusReader({
  fetchImpl = fetch,
  getConfig = () => ({
    apiKey: process.env.LIVEPEER_API_KEY,
    streamId: process.env.LIVEPEER_STREAM_ID,
  }),
  now = Date.now,
  cacheTtlMs = LIVE_STATUS_CACHE_TTL_MS,
  providerTimeoutMs = LIVE_STATUS_PROVIDER_TIMEOUT_MS,
}: LiveStatusReaderOptions = {}) {
  let cached: { expiresAt: number; result: LiveStatusResult } | null = null;
  let inFlight: Promise<LiveStatusResult> | null = null;

  const readProvider = async (): Promise<LiveStatusResult> => {
    const { apiKey, streamId } = getConfig();
    if (!apiKey || !streamId) return { status: "error" };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), providerTimeoutMs);

    try {
      const response = await fetchImpl(`${LIVEPEER_API_BASE}/stream/${streamId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) return { status: "error" };

      const payload: unknown = await response.json();
      if (
        !payload ||
        typeof payload !== "object" ||
        typeof (payload as { isActive?: unknown }).isActive !== "boolean"
      ) {
        return { status: "error" };
      }

      return {
        status: (payload as { isActive: boolean }).isActive ? "live" : "offline",
      };
    } catch {
      return { status: "error" };
    } finally {
      clearTimeout(timeout);
    }
  };

  return async function readLiveStatus(): Promise<LiveStatusResult> {
    const currentTime = now();
    if (cached && cached.expiresAt > currentTime) return cached.result;
    if (inFlight) return inFlight;

    inFlight = readProvider().then((result) => {
      // Errors are intentionally not retained: the next request can recover
      // immediately. Successful results get a short, per-runtime cache.
      cached = result.status === "error"
        ? null
        : { expiresAt: now() + cacheTtlMs, result };
      return result;
    });

    try {
      return await inFlight;
    } finally {
      inFlight = null;
    }
  };
}

export const fetchLiveStatus = createLiveStatusReader();
