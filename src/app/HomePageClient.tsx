"use client";

import dynamic from "next/dynamic";
import HomeInitialLoader from "~/components/HomeInitialLoader";
import { Room } from "~/app/Room";

const Home = dynamic(() => import("~/components/Home"), {
  ssr: false,
  loading: () => <HomeInitialLoader />,
});

export default function HomePageClient() {
  return (
    <Room>
      <Home />
    </Room>
  );
}
