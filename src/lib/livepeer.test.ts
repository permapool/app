import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createLiveStatusReader,
  LIVE_STATUS_PROVIDER_TIMEOUT_MS,
} from "./livepeer";

const config = () => ({ apiKey: "test-key", streamId: "test-stream" });

describe("Livepeer status reader", () => {
  afterEach(() => vi.useRealTimers());

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

  it("bounds shared provider work, clears timeout state, and recovers", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () =>
          reject(new DOMException("aborted", "AbortError")),
        );
      }),
    );
    const reader = createLiveStatusReader({ getConfig: config, fetchImpl });

    const first = reader();
    const concurrent = reader();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(LIVE_STATUS_PROVIDER_TIMEOUT_MS);
    await expect(Promise.all([first, concurrent])).resolves.toEqual([
      { status: "error" },
      { status: "error" },
    ]);
    expect(vi.getTimerCount()).toBe(0);

    fetchImpl.mockResolvedValueOnce(
      new Response(JSON.stringify({ isActive: true }), { status: 200 }),
    );
    await expect(reader()).resolves.toEqual({ status: "live" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not cache generic provider errors", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ isActive: false }), { status: 200 }),
      );
    const reader = createLiveStatusReader({ getConfig: config, fetchImpl });

    await expect(reader()).resolves.toEqual({ status: "error" });
    await expect(reader()).resolves.toEqual({ status: "offline" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
