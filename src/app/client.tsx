'use client';

import WagmiProvider from "~/components/providers/WagmiProvider";
import Navigation from "~/components/Navigation";
import { MinimizeMenusProvider } from "~/components/providers/MinimizeMenus";
import { ToggleProvider } from "~/components/providers/ToggleContext";

export default function Client({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <WagmiProvider>
      <MinimizeMenusProvider>
        <ToggleProvider>
        <Navigation />
        {children}
        </ToggleProvider>
      </MinimizeMenusProvider>
    </WagmiProvider>
  );
}
