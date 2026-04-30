'use client';

import dynamic from "next/dynamic";
import { MinimizeMenusProvider } from "~/components/providers/MinimizeMenus";
import { MuteProvider } from "~/components/providers/MuteContext";
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
        <MuteProvider>
          <Navigation />
          {children}
        </MuteProvider>
      </ToggleProvider>
    </MinimizeMenusProvider>
  );
}
