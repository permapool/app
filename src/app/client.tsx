'use client';

import WagmiProvider from "~/components/providers/WagmiProvider";
import Navigation from "~/components/Navigation";
import { MinimizeMenusProvider } from "~/components/providers/MinimizeMenus";

export default function Client({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <WagmiProvider>
      <MinimizeMenusProvider>
        <Navigation />
        {children}
      </MinimizeMenusProvider>
    </WagmiProvider>
  );
}
