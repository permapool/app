"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { StyledConnectKitButton } from "./ui/StyledConnectKitButton";

import { useMinimize } from "./providers/MinimizeMenus";

interface TimeFormat {
  hours: string;
  minutes: string;
  seconds: string;
  timezone: string;
}

export default function Navigation() {
  const [time, setTime] = useState<Date>(new Date());
  const [blink, setBlink] = useState<boolean>(true);

  const { minimized } = useMinimize();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setBlink((prev: boolean) => !prev);
    }, 1300);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date): TimeFormat => {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    const timezone =
      date
        .toLocaleTimeString("en-US", { timeZoneName: "short" })
        .split(" ")
        .pop() || "";

    return {
      hours,
      minutes,
      seconds,
      timezone,
    };
  };

  const { hours, minutes, seconds, timezone } = formatTime(time);

  if (minimized) return null;

  return (
    <div className="fixed flex px-4 border-b border-b-[1px] border-b-black items-center justify-between w-full z-50 flex-row backdrop-blur-sm bg-white/100">
      <div className="flex items-center flex-grow">
        <Link href="/">HIGHER</Link>
      </div>
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:flex items-center">
      <span>↑↑↑</span>
      </div>
      <div className="flex items-center gap-2 md:gap-6">
        <p className="text-xs md:text-base">
          {hours}
          <span>{blink ? ":" : " "}</span>
          {minutes}
          <span>{blink ? ":" : " "}</span>
          {seconds} <span>({timezone})</span>
        </p>
        <StyledConnectKitButton />
      </div>
    </div>
  );
}
