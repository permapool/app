import { afterEach, describe, expect, it, vi } from "vitest";
import { createEnsResolver } from "./ens";

const ADDRESS = "0x0000000000000000000000000000000000000001";

describe("ENS resolver", () => {
  afterEach(() => vi.useRealTimers());

  it("rejects invalid addresses without contacting the provider", async () => {
    const lookup = vi.fn();
    const resolveEnsName = createEnsResolver({ lookup });

    await expect(resolveEnsName("not-an-address")).resolves.toBeNull();
    expect(lookup).not.toHaveBeenCalled();
  });

  it("normalizes successful names and caches them", async () => {
    const lookup = vi.fn().mockResolvedValue("  Example.ETH ");
    const resolveEnsName = createEnsResolver({ lookup });

    await expect(resolveEnsName(ADDRESS)).resolves.toBe("example.eth");
    await expect(resolveEnsName(ADDRESS)).resolves.toBe("example.eth");
    expect(lookup).toHaveBeenCalledTimes(1);
  });

  it("coalesces concurrent lookups in one runtime", async () => {
    let finishLookup: ((name: string | null) => void) | undefined;
    const lookup = vi.fn(
      () => new Promise<string | null>((resolve) => { finishLookup = resolve; }),
    );
    const resolveEnsName = createEnsResolver({ lookup });

    const first = resolveEnsName(ADDRESS);
    const second = resolveEnsName(ADDRESS);
    expect(lookup).toHaveBeenCalledTimes(1);
    finishLookup?.("shared.eth");

    await expect(Promise.all([first, second])).resolves.toEqual([
      "shared.eth",
      "shared.eth",
    ]);
  });

  it("uses a bounded negative cache for no-name and provider failures", async () => {
    let now = 0;
    const lookup = vi.fn().mockResolvedValueOnce(null).mockRejectedValueOnce(new Error("rpc detail"));
    const resolveEnsName = createEnsResolver({
      lookup,
      now: () => now,
      negativeCacheTtlMs: 100,
    });

    await expect(resolveEnsName(ADDRESS)).resolves.toBeNull();
    now = 99;
    await expect(resolveEnsName(ADDRESS)).resolves.toBeNull();
    expect(lookup).toHaveBeenCalledTimes(1);

    now = 100;
    await expect(resolveEnsName(ADDRESS)).resolves.toBeNull();
    expect(lookup).toHaveBeenCalledTimes(2);
  });

  it("times out safely, clears its timer, and permits later recovery", async () => {
    vi.useFakeTimers();
    const lookup = vi
      .fn()
      .mockImplementationOnce(() => new Promise<string | null>(() => undefined))
      .mockResolvedValueOnce("recovered.eth");
    let now = 0;
    const resolveEnsName = createEnsResolver({
      lookup,
      now: () => now,
      providerTimeoutMs: 50,
      negativeCacheTtlMs: 1,
    });

    const timedOut = resolveEnsName(ADDRESS);
    await vi.advanceTimersByTimeAsync(50);
    await expect(timedOut).resolves.toBeNull();
    expect(vi.getTimerCount()).toBe(0);

    now = 1;
    await expect(resolveEnsName(ADDRESS)).resolves.toBe("recovered.eth");
    expect(lookup).toHaveBeenCalledTimes(2);
  });
});
