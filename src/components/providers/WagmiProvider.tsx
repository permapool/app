"use client";

import { createConfig, WagmiProvider } from "@privy-io/wagmi";
import { http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getRpcUrl } from "~/lib/data";

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(getRpcUrl()),
  },
});

const queryClient = new QueryClient();

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>{children}</WagmiProvider>
    </QueryClientProvider>
  );
}
