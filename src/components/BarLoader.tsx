'use client';

import * as React from 'react';

interface BarLoaderProps {
  intervalRate?: number;
  progress?: number;
}

const BarLoader: React.FC<BarLoaderProps> = ({ intervalRate, progress }) => {
  const [currentProgress, setCurrentProgress] = React.useState<number>(progress || 0);

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
    <div className="bg-[var(--theme-border)] h-[calc(var(--font-size)*var(--theme-line-height-base))] whitespace-nowrap text-left align-bottom block">
      <div
        className="h-full w-0 transition-[width] duration-100 ease-linear bg-[linear-gradient(to_right,transparent,var(--theme-text))]"
        style={{
          width: `${Math.min(currentProgress, 100)}%`,
        }}
      />
    </div>
  );
};

export default BarLoader;