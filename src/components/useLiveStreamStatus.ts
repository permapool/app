"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type LiveVisualStatus = "checking" | "live" | "offline" | "error";

type StatusResponse = { status?: unknown };

export const LIVE_STATUS_POLL_MS = 15_000;

export function useLiveStreamStatus(enabled = true) {
  const [status, setStatus] = useState<LiveVisualStatus>("checking");
  const [isStale, setIsStale] = useState(false);
  const lastKnown = useRef<"live" | "offline" | null>(null);
  const controller = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const mounted = useRef(false);
  const requestSequence = useRef(0);

  const clearTimer = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const poll = useCallback(async () => {
    if (!enabled || !mounted.current || document.hidden || running.current) return;

    clearTimer();
    running.current = true;
    const requestId = ++requestSequence.current;
    const nextController = new AbortController();
    controller.current = nextController;

    try {
      const response = await fetch("/api/live-status", {
        cache: "no-store",
        signal: nextController.signal,
      });
      const payload: StatusResponse = await response.json();
      if (
        !response.ok ||
        (payload.status !== "live" && payload.status !== "offline")
      ) {
        throw new Error("Live status unavailable");
      }

      lastKnown.current = payload.status;
      setStatus(payload.status);
      setIsStale(false);
    } catch (error) {
      if (nextController.signal.aborted) return;
      setIsStale(lastKnown.current !== null);
      if (!lastKnown.current) setStatus("error");
    } finally {
      if (requestSequence.current !== requestId) return;
      controller.current = null;
      running.current = false;
      if (enabled && mounted.current && !document.hidden) {
        timer.current = setTimeout(() => void poll(), LIVE_STATUS_POLL_MS);
      }
    }
  }, [clearTimer, enabled]);

  const retry = useCallback(() => {
    if (!lastKnown.current) setStatus("checking");
    setIsStale(false);
    void poll();
  }, [poll]);

  useEffect(() => {
    mounted.current = true;
    if (enabled) void poll();

    const handleVisibilityChange = () => {
      clearTimer();
      if (document.hidden) {
        requestSequence.current += 1;
        controller.current?.abort();
        controller.current = null;
        running.current = false;
        return;
      }
      void poll();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      mounted.current = false;
      clearTimer();
      requestSequence.current += 1;
      controller.current?.abort();
      controller.current = null;
      running.current = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearTimer, enabled, poll]);

  return { status, isStale, retry };
}
