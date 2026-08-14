import { describe, expect, it, vi } from "vitest";
import { createLiveStatusReader } from "./livepeer";

const config = () => ({ apiKey: "test-key", streamId: "test-stream" });

describe("Livepeer status reader", () => {
  it.each([
    [true, "live"],
    [false, "offline"],
  ] as const)("maps isActive=%s to %s", async (isActive, status) => {
    const reader = createLiveStatusReader({
      getConfig: config,
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ isActive }), { status: 200 }),
      ),
    });
    await expect(reader()).resolves.toEqual({ status });
  });

  it.each([
    [() => ({}), vi.fn()],
    [config, vi.fn().mockResolvedValue(new Response("no", { status: 502 }))],
    [config, vi.fn().mockResolvedValue(new Response("{}", { status: 200 }))],
    [config, vi.fn().mockRejectedValue(new Error("provider details"))],
  ])("maps configuration and provider failures to a generic error", async (getConfig, fetchImpl) => {
    const reader = createLiveStatusReader({ getConfig, fetchImpl });
    await expect(reader()).resolves.toEqual({ status: "error" });
  });

  it("coalesces concurrent reads and caches the generic result for five seconds", async () => {
    let resolveResponse!: (response: Response) => void;
    const fetchImpl = vi.fn(
      () => new Promise<Response>((resolve) => (resolveResponse = resolve)),
    );
    let now = 1_000;
    const reader = createLiveStatusReader({ getConfig: config, fetchImpl, now: () => now });

    const first = reader();
    const second = reader();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    resolveResponse(new Response(JSON.stringify({ isActive: false }), { status: 200 }));
    await expect(Promise.all([first, second])).resolves.toEqual([
      { status: "offline" },
      { status: "offline" },
    ]);

    now += 4_999;
    await reader();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    now += 2;
    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ isActive: true }), { status: 200 }),
    );
    await expect(reader()).resolves.toEqual({ status: "live" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
