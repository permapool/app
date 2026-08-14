// @vitest-environment jsdom

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEnsNames } from "./useEnsNames";

const ADDRESS = "0x0000000000000000000000000000000000000001";

describe("useEnsNames", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("falls back to null and does not loop on identical rerenders", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ name: null }), { status: 200 }),
    );
    const { result, rerender } = renderHook(
      ({ addresses }) => useEnsNames(addresses),
      { initialProps: { addresses: [ADDRESS] } },
    );

    await waitFor(() => expect(result.current).toEqual({ [ADDRESS]: null }));
    rerender({ addresses: [ADDRESS] });
    rerender({ addresses: [ADDRESS] });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aborts outstanding requests on unmount", () => {
    let signal: AbortSignal | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementation((_input, init) => {
      signal = init?.signal as AbortSignal;
      return new Promise<Response>(() => undefined);
    });

    const { unmount } = renderHook(() => useEnsNames([ADDRESS]));
    expect(signal).toBeInstanceOf(AbortSignal);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
