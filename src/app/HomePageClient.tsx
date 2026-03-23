"use client";

import dynamic from "next/dynamic";

const HomeScreen = dynamic(() => import("~/components/HomeScreen"), {
  ssr: false,
  loading: () => <div className="p-6 text-xs uppercase">Loading home...</div>,
});

export default function HomePageClient() {
  return <HomeScreen />;
}
