"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import Loading from "~/components/ui/Loading";

const publicApiKey =
  process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY;

export function Room({ children }: { children: ReactNode }) {
  if (!publicApiKey) {
    throw new Error("Missing NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY");
  }

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEnabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!enabled) {
    return <Loading label="Loading room..." />;
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id="home-page" initialPresence={{ active: true }}>
        <ClientSideSuspense fallback={<Loading label="Loading room..." />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
