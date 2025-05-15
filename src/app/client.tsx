'use client';

import WagmiProvider from "~/components/providers/WagmiProvider";
import Navigation from "~/components/Navigation";

export default function Client({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <WagmiProvider>
      <Navigation />
      {children}
    </WagmiProvider>
  );
}
