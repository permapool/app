"use client";

import dynamic from "next/dynamic";
import BarLoader from "~/components/BarLoader";

const HomeScreen = dynamic(() => import("~/components/HomeScreen"), {
  ssr: false,
  loading: () => <BarLoader intervalRate={100} progress={0} />,
});

export default function HomePageClient() {
  return <HomeScreen />;
}
