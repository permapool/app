"use client";

import { useEffect, useState } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { base } from "wagmi/chains";
import { AuthProvider } from "./AuthProvider";
import WagmiProvider from "./WagmiProvider";

export default function PrivyAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!appId) {
    throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID");
  }

  if (!mounted) {
    return null;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
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
      }}
    >
      <WagmiProvider>
        <AuthProvider>{children}</AuthProvider>
      </WagmiProvider>
    </PrivyProvider>
  );
}
