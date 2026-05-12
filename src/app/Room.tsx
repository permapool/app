"use client";

import { usePrivy } from "@privy-io/react-auth";
import { ReactNode, useEffect, useState } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import BarLoader from "~/components/BarLoader";

export function Room({ children }: { children: ReactNode }) {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setEnabled(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!enabled || !ready) {
    return (
      <div className="flex min-h-[20px] items-center justify-center px-4">
        <div className="w-full max-w-[320px]">
          <BarLoader intervalRate={300} />
        </div>
      </div>
    );
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const headers: HeadersInit = {
          "Content-Type": "application/json",
        };

        if (authenticated) {
          const accessToken = await getAccessToken();

          if (accessToken) {
            headers.Authorization = `Bearer ${accessToken}`;
          }
        }

        const response = await fetch("/api/liveblocks-auth", {
          method: "POST",
          headers,
          body: JSON.stringify({ room }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;

          throw new Error(payload?.error ?? "Unable to authenticate with Liveblocks");
        }

        return response.json();
      }}
    >
      <RoomProvider
        id="home-page"
        initialPresence={{
          active: true,
          cursor: null,
        }}
      >
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
