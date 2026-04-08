"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

import BarLoader from "~/components/BarLoader";

type AnimationData = Record<string, unknown>;

export default function HomeInitialLoader() {
  const [animationData, setAnimationData] = useState<AnimationData | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadAnimation = async () => {
      try {
        const response = await fetch("/lottie/stampede-circles-02.json");

        if (!response.ok) {
          throw new Error(`Failed to load animation: ${response.status}`);
        }

        const data = (await response.json()) as AnimationData;

        if (isMounted) {
          setAnimationData(data);
        }
      } catch (error) {
        console.error("Error loading home intro animation:", error);
      }
    };

    void loadAnimation();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[10020] overflow-hidden bg-black"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_48%)]" />

      {animationData ? (
        <Lottie
          animationData={animationData}
          loop
          autoplay
          className="absolute left-1/2 top-1/2 h-auto min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 opacity-90"
        />
      ) : null}

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <div className="w-full max-w-[420px]">
          <div className="h-[20px]">
            <BarLoader
              intervalRate={300}
              trackClassName="bg-[#ffb040]/30"
              fillClassName="bg-gradient-to-r from-[#ffb040] to-[#ffb040]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
