"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import BarLoader from "~/components/BarLoader";

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
    return (
      <div className="flex min-h-[20px] items-center justify-center px-4">
        <div className="w-full max-w-[320px]">
          <BarLoader intervalRate={300} />
        </div>
      </div>
    );
  }

  return (
    <LiveblocksProvider publicApiKey={publicApiKey}>
      <RoomProvider id="home-page" initialPresence={{ active: true }}>
        <ClientSideSuspense
          fallback={
            <div className="flex min-h-[20px] items-center justify-center px-4">
              <div className="h-[5px] w-[33vw] max-w-[420px] min-w-[180px]">
                <BarLoader intervalRate={300} />
              </div>
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
