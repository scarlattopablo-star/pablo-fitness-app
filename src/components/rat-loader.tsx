"use client";

import { motion } from "framer-motion";

interface RatLoaderProps {
  size?: number;
  className?: string;
}

// Sin City muscular rat lifting weights — aggressive noir style
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
        {/* Shadow */}
        <ellipse cx="40" cy="68" rx="24" ry="4" fill="rgba(34,197,94,0.1)" />

        {/* Back legs — planted, muscular */}
        <ellipse cx="30" cy="58" rx="5" ry="4" fill="#222" />
        <ellipse cx="30" cy="58" rx="4" ry="3" fill="#333" />
        <ellipse cx="50" cy="58" rx="5" ry="4" fill="#222" />
        <ellipse cx="50" cy="58" rx="4" ry="3" fill="#333" />
        {/* Feet */}
        <ellipse cx="28" cy="62" rx="4" ry="2" fill="#1a1a1a" />
        <ellipse cx="52" cy="62" rx="4" ry="2" fill="#1a1a1a" />

        {/* Body — big V-shape torso */}
        <ellipse cx="40" cy="46" rx="16" ry="14" fill="#1a1a1a" />
        {/* Chest highlight */}
        <ellipse cx="40" cy="44" rx="12" ry="10" fill="#2a2a2a" />
        {/* Abs definition */}
        <line x1="37" y1="40" x2="37" y2="52" stroke="#333" strokeWidth="0.5" />
        <line x1="43" y1="40" x2="43" y2="52" stroke="#333" strokeWidth="0.5" />
        <line x1="34" y1="45" x2="46" y2="45" stroke="#333" strokeWidth="0.3" />
        <line x1="34" y1="49" x2="46" y2="49" stroke="#333" strokeWidth="0.3" />

        {/* Tail */}
        <motion.path
          d="M24 50 Q16 42 14 34 Q12 28 16 26"
          stroke="#333"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: [
              "M24 50 Q16 42 14 34 Q12 28 16 26",
              "M24 50 Q18 40 17 33 Q16 27 20 25",
              "M24 50 Q16 42 14 34 Q12 28 16 26",
            ],
          }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Head — angular, aggressive */}
        <ellipse cx="40" cy="28" rx="12" ry="11" fill="#1a1a1a" />
        {/* Jaw — strong */}
        <path d="M30 32 Q40 38 50 32" fill="#222" />

        {/* Ears — pointed */}
        <path d="M28 18 L32 10 L36 20" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
        <path d="M29 18 L32 12 L35 20" fill="#22c55e" opacity="0.2" />
        <path d="M44 18 L48 10 L52 20" fill="#1a1a1a" stroke="#333" strokeWidth="0.8" />
        <path d="M45 18 L48 12 L51 20" fill="#22c55e" opacity="0.2" />

        {/* Eyes — intense white slits */}
        <ellipse cx="35" cy="26" rx="3.5" ry="2" fill="white" />
        <ellipse cx="45" cy="26" rx="3.5" ry="2" fill="white" />
        <ellipse cx="35.5" cy="26.5" rx="1.5" ry="1.8" fill="black" />
        <ellipse cx="45.5" cy="26.5" rx="1.5" ry="1.8" fill="black" />
        <circle cx="34.5" cy="25.5" r="0.6" fill="white" />
        <circle cx="44.5" cy="25.5" r="0.6" fill="white" />

        {/* Angry eyebrows */}
        <motion.line
          x1="31" y1="22" x2="38" y2="23.5"
          stroke="white" strokeWidth="1.5" strokeLinecap="round"
          animate={{ y1: [22, 21, 22] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
        <motion.line
          x1="49" y1="22" x2="42" y2="23.5"
          stroke="white" strokeWidth="1.5" strokeLinecap="round"
          animate={{ y1: [22, 21, 22] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />

        {/* Nose */}
        <ellipse cx="40" cy="31" rx="2" ry="1.5" fill="#22c55e" />

        {/* Snarl mouth with fang */}
        <path d="M36 34 Q40 36 44 34" stroke="#444" strokeWidth="0.7" fill="none" />
        <path d="M38 34 L39 36.5 L40 34" fill="white" />
        <path d="M41 34 L42 36.5 L43 34" fill="white" />

        {/* Whiskers */}
        <line x1="32" y1="29" x2="22" y2="27" stroke="#444" strokeWidth="0.5" />
        <line x1="32" y1="31" x2="21" y2="32" stroke="#444" strokeWidth="0.5" />
        <line x1="48" y1="29" x2="58" y2="27" stroke="#444" strokeWidth="0.5" />
        <line x1="48" y1="31" x2="59" y2="32" stroke="#444" strokeWidth="0.5" />

        {/* Green headband */}
        <path d="M28 20 Q40 15 52 20" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="28" cy="20" r="1.5" fill="#22c55e" />
        <line x1="26" y1="20" x2="24" y2="16" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="26" y1="20" x2="24" y2="23" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" />

        {/* Arms lifting barbell — pumping motion */}
        <motion.g
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Left arm — muscular */}
          <path d="M28 38 L16 24" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
          <path d="M28 38 L16 24" stroke="#2a2a2a" strokeWidth="4" strokeLinecap="round" />
          {/* Bicep bulge */}
          <circle cx="22" cy="30" r="4" fill="#222" />
          <circle cx="22" cy="30" r="3" fill="#2a2a2a" />
          {/* Vein */}
          <path d="M21 28 Q22 31 21 33" stroke="#444" strokeWidth="0.4" fill="none" />

          {/* Right arm — muscular */}
          <path d="M52 38 L64 24" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" />
          <path d="M52 38 L64 24" stroke="#2a2a2a" strokeWidth="4" strokeLinecap="round" />
          {/* Bicep bulge */}
          <circle cx="58" cy="30" r="4" fill="#222" />
          <circle cx="58" cy="30" r="3" fill="#2a2a2a" />

          {/* Barbell */}
          <rect x="8" y="21" width="64" height="5" rx="2.5" fill="#555" />
          <rect x="8" y="21" width="64" height="5" rx="2.5" fill="#444" />

          {/* Left weights — green */}
          <rect x="3" y="16" width="9" height="16" rx="2" fill="#22c55e" />
          <rect x="-2" y="18" width="6" height="12" rx="1.5" fill="#16a34a" />

          {/* Right weights — green */}
          <rect x="68" y="16" width="9" height="16" rx="2" fill="#22c55e" />
          <rect x="76" y="18" width="6" height="12" rx="1.5" fill="#16a34a" />
        </motion.g>

        {/* Sweat drops — green tinted */}
        <motion.circle
          cx="54" cy="22" r="1.5" fill="#22c55e" opacity="0.6"
          animate={{ cy: [22, 16, 22], opacity: [0, 0.6, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.circle
          cx="26" cy="24" r="1.2" fill="#22c55e" opacity="0.6"
          animate={{ cy: [24, 18, 24], opacity: [0, 0.6, 0] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
        />

        {/* Effort lines around head */}
        <motion.g
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          <line x1="24" y1="14" x2="20" y2="10" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
          <line x1="56" y1="14" x2="60" y2="10" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
          <line x1="40" y1="10" x2="40" y2="6" stroke="#22c55e" strokeWidth="1" strokeLinecap="round" />
        </motion.g>
      </svg>
    </div>
  );
}
