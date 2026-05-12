"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import React from "react";

const COLLAPSED_WIDTH = 64;
const EXPANDED_WIDTH = 238;

const Logo: React.FC<{
  className?: string;
  height?: number | string;
}> = ({ className = "", height = 48 }) => {
  return (
    <motion.span
      className={className}
      initial="collapsed"
      animate="collapsed"
      whileHover="expanded"
      whileFocus="expanded"
      variants={{
        collapsed: { width: COLLAPSED_WIDTH },
        expanded: { width: EXPANDED_WIDTH },
      }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      style={{
        display: "inline-block",
        height,
        overflow: "hidden",
        position: "relative",
        verticalAlign: "middle",
      }}
      aria-label="HIGHER.ZIP"
    >
      <motion.span
        aria-hidden="true"
        className="absolute left-0 top-0 block h-full"
        variants={{
          collapsed: { opacity: 0 },
          expanded: { opacity: 1 },
        }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        style={{ width: EXPANDED_WIDTH }}
      >
        <Image
          src="/logo-full.svg"
          alt=""
          fill
          priority
          sizes={`${EXPANDED_WIDTH}px`}
          className="object-contain object-left"
        />
      </motion.span>

      <motion.span
        aria-hidden="true"
        className="absolute left-0 top-0 block h-full"
        variants={{
          collapsed: { opacity: 1 },
          expanded: { opacity: 0 },
        }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        style={{ width: COLLAPSED_WIDTH }}
      >
        <Image
          src="/logo-dual.svg"
          alt=""
          fill
          priority
          sizes={`${COLLAPSED_WIDTH}px`}
          className="object-contain object-left"
        />
      </motion.span>
    </motion.span>
  );
};

export default Logo;
