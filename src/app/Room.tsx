"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

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
    return <div>Triangulating</div>;
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id="home-page" initialPresence={{ cursor: null }}>
        <ClientSideSuspense fallback={<div>Triangulating</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
