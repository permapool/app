"use client";

import dynamic from "next/dynamic";
import Loading from "~/components/ui/Loading";

const HomeScreen = dynamic(() => import("~/components/HomeScreen"), {
  ssr: false,
  loading: () => <Loading label="Loading home..." />,
});

export default function HomePageClient() {
  return <HomeScreen />;
}
