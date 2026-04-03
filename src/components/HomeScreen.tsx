"use client";

import dynamic from "next/dynamic";
import { Room } from "~/app/Room";
import PrivyAuthProvider from "~/components/providers/PrivyAuthProvider";

const DeferredHome = dynamic(() => import("~/components/Home"));

export default function HomeScreen() {
  return (
    <PrivyAuthProvider>
      <Room>
        <DeferredHome />
      </Room>
    </PrivyAuthProvider>
  );
}
