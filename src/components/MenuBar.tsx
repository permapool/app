import React, { useState, useEffect } from "react";

interface TimeFormat {
  hours: string;
  minutes: string;
  seconds: string;
  timezone: string;
}

const MenuBar: React.FC = () => {
  const [time, setTime] = useState<Date>(new Date());
  const [blink, setBlink] = useState<boolean>(true);

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
    const timezone = date
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

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white z-50 border-t border-t-[1px] border-t-dashed border-t-[#111111] text-black p-[10px] flex flex-row items-center justify-between">
      <div>
        HIGHER
      </div>
      <div>
      ↑↑↑
      </div>
      <div>
        <p>
          {hours}
          <span>{blink ? ":" : " "}</span>
          {minutes}
          <span>{blink ? ":" : " "}</span>
          {seconds} <span>({timezone})</span>
        </p>
      </div>
    </div>
  );
};

export default MenuBar;