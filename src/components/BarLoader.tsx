"use client";

import * as React from "react";

type BarLoaderProps = {
  className?: string;
  fillClassName?: string;
  intervalRate?: number;
  progress?: number;
  trackClassName?: string;
};

const BarLoader: React.FC<BarLoaderProps> = ({
  className = "",
  fillClassName = "bg-gradient-to-r from-[var(--green)] to-[var(--green)]",
  intervalRate,
  progress,
  trackClassName = "bg-black/10",
}) => {
  const [currentProgress, setCurrentProgress] = React.useState<number>(progress ?? 0);

  React.useEffect(() => {
    if (progress !== undefined) {
      setCurrentProgress(progress);
      return;
    }

    if (!intervalRate) return;

    const interval = setInterval(() => {
      setCurrentProgress((prev) => (prev + 10) % 110);
    }, intervalRate);

    return () => clearInterval(interval);
  }, [intervalRate, progress]);

  return (
    <div
      className={`block h-full min-h-[5px] w-full overflow-hidden whitespace-nowrap text-left align-bottom ${trackClassName} ${className}`}
    >
      <div
        className={`h-full w-0 transition-[width] duration-100 ease-linear ${fillClassName}`}
        style={{
          width: `${Math.min(currentProgress, 100)}%`,
        }}
      />
    </div>
  );
};

export default BarLoader;
