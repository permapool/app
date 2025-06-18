import React, { ReactNode } from "react";

interface ClickerTooltipProps {
  content: string;
  children: ReactNode;
}

const ClickerTooltip: React.FC<ClickerTooltipProps> = ({ content, children }) => (
  <div className="relative flex group h-[100%]">
    {children}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex px-3 py-2 bg-black text-white text-xs shadow-lg z-10 whitespace-nowrap pointer-events-none transition-all duration-200">
      {content}
    </div>
  </div>
);

export default ClickerTooltip;