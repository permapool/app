"use client";

import { useCallback, useEffect, useState } from "react";
import Live from "./Live";
import Pipes from "./Pipes";
import type { LiveVisualStatus } from "./useLiveStreamStatus";

type LiveChannelContentProps = {
  status: LiveVisualStatus;
  playbackId?: string;
  isMuted: boolean;
};

export default function LiveChannelContent({
  status,
  playbackId,
  isMuted,
}: LiveChannelContentProps) {
  const [screensaverFailed, setScreensaverFailed] = useState(false);
  const [screensaverKey, setScreensaverKey] = useState(0);
  const handleScreensaverError = useCallback(() => setScreensaverFailed(true), []);

  useEffect(() => {
    if (status !== "offline") setScreensaverFailed(false);
  }, [status]);

  if (status === "checking") {
    return (
      <div
        className="h-full w-full bg-[#111]"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Checking broadcast status"
      />
    );
  }
  if (status === "live" && playbackId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center md:block md:h-auto">
        <Live playbackId={playbackId} isMuted={isMuted} />
      </div>
    );
  }
  if (status === "offline" && !screensaverFailed) {
    return <Pipes key={screensaverKey} onError={handleScreensaverError} />;
  }

  return (
    <div
      className="flex h-full w-full items-center justify-center bg-black text-white"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Broadcast status unavailable"
    >
      <div className="text-center text-sm uppercase">
        <p className="m-0 text-sm">Television signal unavailable</p>
        {screensaverFailed ? (
          <button
            type="button"
            className="mt-4 rounded bg-green px-4 py-2 text-xs text-white"
            onClick={() => {
              setScreensaverFailed(false);
              setScreensaverKey((value) => value + 1);
            }}
          >
            Restart animation
          </button>
        ) : null}
      </div>
    </div>
  );
}
