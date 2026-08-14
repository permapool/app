// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LIVE_STATUS_POLL_MS, useLiveStreamStatus } from "./useLiveStreamStatus";

let hidden = false;

describe("useLiveStreamStatus", () => {
  beforeEach(() => {
    hidden = false;
    Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it.each(["live", "offline"] as const)("moves from checking to %s", async (status) => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status }), { status: 200 }),
    );
    const { result } = renderHook(() => useLiveStreamStatus());
    expect(result.current.status).toBe("checking");
    await waitFor(() => expect(result.current.status).toBe(status));
  });

  it("shows an initial error and retry returns through checking", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "error" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "offline" }), { status: 200 }));
    const { result } = renderHook(() => useLiveStreamStatus());
    await waitFor(() => expect(result.current.status).toBe("error"));
    act(() => result.current.retry());
    expect(result.current.status).toBe("checking");
    await waitFor(() => expect(result.current.status).toBe("offline"));
  });

  it("retains the last known state after a transient error", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "live" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ status: "error" }), { status: 503 }));
    const { result } = renderHook(() => useLiveStreamStatus());
    await act(async () => Promise.resolve());
    expect(result.current.status).toBe("live");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(LIVE_STATUS_POLL_MS);
    });
    expect(result.current.status).toBe("live");
    expect(result.current.isStale).toBe(true);
  });

  it("does not overlap requests and polls every fifteen seconds", async () => {
    vi.useFakeTimers();
    let resolveFirst!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise<Response>((resolve) => (resolveFirst = resolve)),
    );
    renderHook(() => useLiveStreamStatus());
    await act(async () => vi.advanceTimersByTimeAsync(LIVE_STATUS_POLL_MS * 2));
    expect(fetch).toHaveBeenCalledTimes(1);
    resolveFirst(new Response(JSON.stringify({ status: "offline" }), { status: 200 }));
    await act(async () => Promise.resolve());
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: "offline" }), { status: 200 }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(LIVE_STATUS_POLL_MS - 1));
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => vi.advanceTimersByTimeAsync(1));
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("pauses while hidden and refreshes immediately when visible", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: "offline" }), { status: 200 }),
    );
    renderHook(() => useLiveStreamStatus());
    await act(async () => Promise.resolve());
    hidden = true;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    await act(async () => vi.advanceTimersByTimeAsync(LIVE_STATUS_POLL_MS * 2));
    expect(fetch).toHaveBeenCalledTimes(1);
    hidden = false;
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await Promise.resolve();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("passes an AbortSignal, aborts on unmount, and ignores late completion", async () => {
    let resolveRequest!: (response: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(
      () => new Promise<Response>((resolve) => (resolveRequest = resolve)),
    );
    const { result, unmount } = renderHook(() => useLiveStreamStatus());
    const signal = vi.mocked(fetch).mock.calls[0][1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(signal?.aborted).toBe(false);

    unmount();
    expect(signal?.aborted).toBe(true);
    resolveRequest(new Response(JSON.stringify({ status: "live" }), { status: 200 }));
    await act(async () => Promise.resolve());
    expect(result.current.status).toBe("checking");
  });

  it("leaves one poll schedule and listener under Strict Mode", async () => {
    vi.useFakeTimers();
    const addListener = vi.spyOn(document, "addEventListener");
    const removeListener = vi.spyOn(document, "removeEventListener");
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ status: "offline" }), { status: 200 }),
    );
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );
    const { unmount } = renderHook(() => useLiveStreamStatus(), { wrapper });
    await act(async () => Promise.resolve());

    expect(vi.getTimerCount()).toBe(1);
    const visibilityAdds = addListener.mock.calls.filter(
      ([type]) => type === "visibilitychange",
    ).length;
    const visibilityRemovals = removeListener.mock.calls.filter(
      ([type]) => type === "visibilitychange",
    ).length;
    expect(visibilityAdds - visibilityRemovals).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(
      removeListener.mock.calls.filter(([type]) => type === "visibilitychange"),
    ).toHaveLength(visibilityAdds);
  });
});
