"use client";

import { getDefaultConfig } from "connectkit";
import { http } from "wagmi";
import { base } from "wagmi/chains";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { getRpcUrl } from "~/lib/data";

export function getLegacyConnectKitConfig() {
  const legacyConnectKitConfig = getDefaultConfig({
    chains: [base],
    walletConnectProjectId: "1f21c56d4b92829f7191cd45fa96cb1a",
    appName: "Higher",
    transports: {
      [base.id]: http(getRpcUrl()),
    },
  });

  // Keep the legacy ConnectKit configuration around until the old wallet UI is fully retired.
  // @ts-expect-error: TS2339
  legacyConnectKitConfig.connectors?.push(farcasterFrame());

  return legacyConnectKitConfig;
}
