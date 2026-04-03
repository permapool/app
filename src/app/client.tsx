'use client';

import dynamic from "next/dynamic";
import { MinimizeMenusProvider } from "~/components/providers/MinimizeMenus";
import { ToggleProvider } from "~/components/providers/ToggleContext";

const Navigation = dynamic(() => import("~/components/Navigation"), {
  ssr: false,
});

export default function Client({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MinimizeMenusProvider>
      <ToggleProvider>
        <Navigation />
        {children}
      </ToggleProvider>
    </MinimizeMenusProvider>
  );
}
