"use client";

import { motion } from "framer-motion";

interface RatLoaderProps {
  size?: number;
  className?: string;
}

export function RatLoader({ size = 64, className = "" }: RatLoaderProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Rat body */}
        <ellipse cx="40" cy="48" rx="14" ry="10" fill="#d4b896" />
        {/* Belly */}
        <ellipse cx="40" cy="50" rx="9" ry="6" fill="#e8d5b8" />

        {/* Back legs (planted) */}
        <ellipse cx="32" cy="56" rx="4" ry="3" fill="#c0a080" />
        <ellipse cx="48" cy="56" rx="4" ry="3" fill="#c0a080" />
        <ellipse cx="32" cy="58" rx="3.5" ry="2" fill="#d4b896" />
        <ellipse cx="48" cy="58" rx="3.5" ry="2" fill="#d4b896" />

        {/* Tail */}
        <motion.path
          d="M26 50 Q18 45 16 38 Q14 32 18 30"
          stroke="#c0a080"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: [
              "M26 50 Q18 45 16 38 Q14 32 18 30",
              "M26 50 Q20 43 19 36 Q18 30 22 28",
              "M26 50 Q18 45 16 38 Q14 32 18 30",
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Head */}
        <circle cx="40" cy="34" r="10" fill="#d4b896" />

        {/* Ears */}
        <circle cx="32" cy="25" r="6" fill="#c0a080" />
        <circle cx="32" cy="25" r="4" fill="#f0c0a0" />
        <circle cx="48" cy="25" r="6" fill="#c0a080" />
        <circle cx="48" cy="25" r="4" fill="#f0c0a0" />

        {/* Eyes — focused/straining */}
        <ellipse cx="36" cy="32" rx="3" ry="3.5" fill="white" />
        <ellipse cx="44" cy="32" rx="3" ry="3.5" fill="white" />
        <circle cx="36.5" cy="32.5" r="1.8" fill="#222" />
        <circle cx="44.5" cy="32.5" r="1.8" fill="#222" />
        <circle cx="36" cy="31" r="0.8" fill="white" />
        <circle cx="44" cy="31" r="0.8" fill="white" />

        {/* Eyebrows — straining expression */}
        <motion.line
          x1="33" y1="27.5" x2="38" y2="28.5"
          stroke="#8B6914"
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ y1: [27.5, 26.5, 27.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.line
          x1="47" y1="27.5" x2="42" y2="28.5"
          stroke="#8B6914"
          strokeWidth="1.2"
          strokeLinecap="round"
          animate={{ y1: [27.5, 26.5, 27.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Nose */}
        <ellipse cx="40" cy="37" rx="2.5" ry="2" fill="#ff8899" />
        <circle cx="39.5" cy="36.5" r="0.6" fill="#ffb0b8" />

        {/* Mouth — effort grimace */}
        <path d="M37 40 Q40 41 43 40" stroke="#8B6914" strokeWidth="0.8" fill="none" />

        {/* Green headband */}
        <path d="M30 28 Q40 23 50 28" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Arms holding barbell — pumping up and down */}
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Left arm */}
          <line x1="30" y1="42" x2="18" y2="28" stroke="#d4b896" strokeWidth="4" strokeLinecap="round" />
          {/* Right arm */}
          <line x1="50" y1="42" x2="62" y2="28" stroke="#d4b896" strokeWidth="4" strokeLinecap="round" />

          {/* Barbell bar */}
          <rect x="10" y="26" width="60" height="4" rx="2" fill="#a1a1aa" />

          {/* Left weights */}
          <rect x="6" y="20" width="8" height="16" rx="2" fill="#22c55e" />
          <rect x="0" y="22" width="6" height="12" rx="1.5" fill="#16a34a" />

          {/* Right weights */}
          <rect x="66" y="20" width="8" height="16" rx="2" fill="#22c55e" />
          <rect x="74" y="22" width="6" height="12" rx="1.5" fill="#16a34a" />
        </motion.g>

        {/* Sweat drops */}
        <motion.circle
          cx="52" cy="28"
          r="1.5"
          fill="#66ccff"
          animate={{ cy: [28, 22, 28], opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.circle
          cx="28" cy="30"
          r="1.2"
          fill="#66ccff"
          animate={{ cy: [30, 24, 30], opacity: [0, 1, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
        />
      </svg>
    </div>
  );
}
