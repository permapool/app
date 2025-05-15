"use client";

import { getDefaultConfig } from "connectkit";
import { ConnectKitProvider } from "connectkit";
import { createConfig, http, WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { farcasterFrame } from "@farcaster/frame-wagmi-connector";
import { getRpcUrl } from "~/lib/data";

const defaultConfig = getDefaultConfig({
  chains: [base],
  walletConnectProjectId: '1f21c56d4b92829f7191cd45fa96cb1a',
  appName: "Higher",
  transports: {
    [base.id]: http(getRpcUrl()),
  },
});
// @ts-expect-error: TS2339
defaultConfig.connectors?.push(farcasterFrame());
export const config = createConfig(defaultConfig);

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
