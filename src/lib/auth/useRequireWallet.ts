"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";

export function useRequireWallet() {
  const account = useAccount();
  const { authenticated, login, linkWallet } = usePrivy();

  return async () => {
    if (account.address) {
      return true;
    }

    if (authenticated) {
      linkWallet({ walletChainType: "ethereum-only" });
    } else {
      login({ loginMethods: ["email", "wallet"] });
    }

    return false;
  };
}
