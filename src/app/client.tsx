'use client';

import dynamic from "next/dynamic";
import PrivyAuthProvider from "~/components/providers/PrivyAuthProvider";
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
    <PrivyAuthProvider>
      <MinimizeMenusProvider>
        <ToggleProvider>
          <Navigation />
          {children}
        </ToggleProvider>
      </MinimizeMenusProvider>
    </PrivyAuthProvider>
  );
}
