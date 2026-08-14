"use client";

import { PrivyProvider, type PrivyClientConfig } from "@privy-io/react-auth";
import { base } from "wagmi/chains";
import { AuthProvider } from "./AuthProvider";
import WagmiProvider from "./WagmiProvider";

export const privyConfig: PrivyClientConfig = {
  loginMethods: ["email", "wallet"],
  appearance: {
    theme: "light",
    accentColor: "#000000",
    showWalletLoginFirst: false,
    walletChainType: "ethereum-only",
  },
  embeddedWallets: {
    ethereum: {
      createOnLogin: "off",
    },
  },
  defaultChain: base,
  supportedChains: [base],
};

export default function PrivyAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID");
  }

  return (
    <PrivyProvider appId={appId} config={privyConfig}>
      <WagmiProvider>
        <AuthProvider>{children}</AuthProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
