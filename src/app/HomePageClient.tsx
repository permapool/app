"use client";

import dynamic from "next/dynamic";
import HomeInitialLoader from "~/components/HomeInitialLoader";

const HomeScreen = dynamic(() => import("~/components/HomeScreen"), {
  ssr: false,
  loading: () => <HomeInitialLoader />,
});

export default function HomePageClient() {
  return <HomeScreen />;
}
