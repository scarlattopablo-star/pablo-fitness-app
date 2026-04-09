"use client";

import { motion } from "framer-motion";

interface RatLoaderProps {
  size?: number;
  className?: string;
}

export function RatLoader({ size = 64, className = "" }: RatLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      >
        {/* Bar */}
        <rect x="10" y="36" width="60" height="8" rx="4" fill="#a1a1aa" />

        {/* Left weight plates */}
        <rect x="4" y="26" width="10" height="28" rx="3" fill="#22c55e" />
        <rect x="-2" y="30" width="7" height="20" rx="2" fill="#16a34a" />

        {/* Right weight plates */}
        <rect x="66" y="26" width="10" height="28" rx="3" fill="#22c55e" />
        <rect x="75" y="30" width="7" height="20" rx="2" fill="#16a34a" />

        {/* Left grip */}
        <rect x="0" y="37" width="4" height="6" rx="1" fill="#888" />

        {/* Right grip */}
        <rect x="76" y="37" width="4" height="6" rx="1" fill="#888" />
      </motion.svg>
    </div>
  );
}
