"use client";

import dynamic from "next/dynamic";
import HomeInitialLoader from "~/components/HomeInitialLoader";
import { Room } from "~/app/Room";
import PrivyAuthProvider from "~/components/providers/PrivyAuthProvider";

const Home = dynamic(() => import("~/components/Home"), {
  ssr: false,
  loading: () => <HomeInitialLoader />,
});

export default function HomePageClient() {
  return (
    <PrivyAuthProvider>
      <Room>
        <Home />
      </Room>
    </PrivyAuthProvider>
  );
}
