"use client";

import dynamic from "next/dynamic";
import { Room } from "~/app/Room";

const DeferredHome = dynamic(() => import("~/components/Home"));

export default function HomeScreen() {
  return (
    <Room>
      <DeferredHome />
    </Room>
  );
}
