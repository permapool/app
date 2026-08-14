import { beforeEach, describe, expect, it, vi } from "vitest";

const livepeerMock = vi.hoisted(() => ({
  fetchLiveStatus: vi.fn(),
}));

vi.mock("~/lib/livepeer", () => ({
  fetchLiveStatus: livepeerMock.fetchLiveStatus,
  LIVE_STATUS_CACHE_TTL_MS: 5_000,
}));

import { GET } from "./route";

describe("GET /api/live-status", () => {
  beforeEach(() => livepeerMock.fetchLiveStatus.mockReset());

  it.each(["live", "offline"] as const)("returns only the stable %s status", async (status) => {
    livepeerMock.fetchLiveStatus.mockResolvedValue({ status });
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status });
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=0, must-revalidate",
    );
    expect(response.headers.get("vercel-cdn-cache-control")).toBe(
      "public, max-age=5",
    );
  });

  it("sanitizes provider failures", async () => {
    livepeerMock.fetchLiveStatus.mockResolvedValue({ status: "error" });
    const response = await GET();
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body).toEqual({ status: "error" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.has("vercel-cdn-cache-control")).toBe(false);
    expect(JSON.stringify(body)).not.toMatch(
      /timeout|provider|stream|playback|token|credential/i,
    );
  });
});
