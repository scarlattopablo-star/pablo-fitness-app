"use client";

import { motion } from "framer-motion";

interface GymRatLogoProps {
  animated?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Big Disney-style rat animation:
// Appears from bottom, runs right across GYMRAT, runs left (2nd pass), then climbs up behind text and hides
const ratAnimation = {
  hidden: { opacity: 0, x: 150, y: 160 } as const,
  run: {
    x:      [  150,  150,  280,  280,   20,   20,  150,  150,  150],
    y:      [  160,  115,  100,  100,  100,  100,  100,   70,   65],
    opacity:[    0,    1,    1,    1,    1,    1,    1,  0.6,    0],
    scaleX: [    1,    1,    1,   -1,   -1,    1,    1,    1,    1],
    rotate: [    0,    0,    5,    0,   -5,    0,    0,  -15,  -15],
    transition: {
      duration: 4.5,
      delay: 1.0,
      ease: "easeInOut" as const,
      times: [0, 0.08, 0.30, 0.32, 0.58, 0.60, 0.72, 0.90, 1],
    },
  },
};

// Rat cartoon character — bigger, rounder, Disney-style
function CartoonRat({ animated }: { animated: boolean }) {
  if (!animated) return null;

  return (
    <motion.g
      variants={ratAnimation}
      initial="hidden"
      animate="run"
    >
      {/* Shadow */}
      <ellipse cx="0" cy="18" rx="12" ry="3" fill="rgba(0,0,0,0.2)" />

      {/* Tail — long curvy */}
      <motion.path
        d="M-18 5 Q-28 -5 -25 -15 Q-22 -22 -16 -18 Q-12 -15 -15 -8"
        stroke="#c0a080"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        animate={{ d: [
          "M-18 5 Q-28 -5 -25 -15 Q-22 -22 -16 -18 Q-12 -15 -15 -8",
          "M-18 5 Q-30 0 -28 -12 Q-25 -20 -18 -16 Q-14 -13 -16 -6",
          "M-18 5 Q-28 -5 -25 -15 Q-22 -22 -16 -18 Q-12 -15 -15 -8",
        ]}}
        transition={{ duration: 0.6, repeat: Infinity }}
      />

      {/* Body — big round */}
      <ellipse cx="0" cy="5" rx="16" ry="13" fill="#d4b896" />
      {/* Belly */}
      <ellipse cx="2" cy="8" rx="10" ry="8" fill="#e8d5b8" />

      {/* Back legs */}
      <motion.g animate={{ rotate: [0, -15, 0, 15, 0] }} transition={{ duration: 0.25, repeat: Infinity }}>
        <ellipse cx="-10" cy="15" rx="5" ry="4" fill="#c0a080" />
        <ellipse cx="-10" cy="18" rx="4" ry="2.5" fill="#d4b896" />
      </motion.g>

      {/* Front legs — running animation */}
      <motion.g animate={{ rotate: [0, 20, 0, -20, 0] }} transition={{ duration: 0.25, repeat: Infinity }}>
        <ellipse cx="10" cy="14" rx="4" ry="3.5" fill="#c0a080" />
        <ellipse cx="12" cy="17" rx="3.5" ry="2" fill="#d4b896" />
      </motion.g>

      {/* Head — big round Disney style */}
      <circle cx="16" cy="-4" r="12" fill="#d4b896" />

      {/* Cheeks */}
      <circle cx="22" cy="0" r="4" fill="#e8c8a8" />
      <circle cx="10" cy="0" r="3.5" fill="#e8c8a8" />

      {/* Ears — big and round */}
      <circle cx="8" cy="-16" r="8" fill="#c0a080" />
      <circle cx="8" cy="-16" r="5.5" fill="#f0c0a0" />
      <circle cx="24" cy="-14" r="7" fill="#c0a080" />
      <circle cx="24" cy="-14" r="4.5" fill="#f0c0a0" />

      {/* Eyes — big expressive Disney eyes */}
      <ellipse cx="13" cy="-6" rx="4" ry="4.5" fill="white" />
      <ellipse cx="22" cy="-5" rx="3.5" ry="4" fill="white" />
      {/* Pupils — looking in direction of movement */}
      <motion.circle
        cx="14.5" cy="-5.5" r="2.2" fill="#222"
        animate={{ cx: [14.5, 15.5, 14.5, 13, 14.5] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <motion.circle
        cx="23" cy="-4.5" r="2" fill="#222"
        animate={{ cx: [23, 24, 23, 22, 23] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      {/* Eye shine */}
      <circle cx="13.5" cy="-7.5" r="1" fill="white" />
      <circle cx="22" cy="-6.5" r="0.8" fill="white" />

      {/* Nose — pink */}
      <ellipse cx="27" cy="-2" rx="3" ry="2.5" fill="#ff8899" />
      {/* Nose shine */}
      <circle cx="26" cy="-3" r="0.8" fill="#ffb0b8" />

      {/* Mouth — cute smile */}
      <path d="M24 2 Q27 5 30 2" stroke="#8B6914" strokeWidth="1" fill="none" strokeLinecap="round" />

      {/* Whiskers */}
      <motion.g
        animate={{ rotate: [-3, 3, -3] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        style={{ transformOrigin: "27px -1px" }}
      >
        <line x1="28" y1="-4" x2="38" y2="-7" stroke="#c0a080" strokeWidth="0.8" />
        <line x1="28" y1="-1" x2="39" y2="-1" stroke="#c0a080" strokeWidth="0.8" />
        <line x1="28" y1="1" x2="37" y2="4" stroke="#c0a080" strokeWidth="0.8" />
      </motion.g>

      {/* Little green headband (gym rat!) */}
      <path d="M5 -12 Q16 -18 27 -10" stroke="#22c55e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </motion.g>
  );
}

export function GymRatLogo({ animated = false, size = "md", className = "" }: GymRatLogoProps) {
  const sizes = {
    sm: { width: 140, height: 70 },
    md: { width: 200, height: 100 },
    lg: { width: 300, height: 150 },
  };

  const { width, height } = sizes[size];

  const Wrapper = animated ? motion.div : "div";
  const wrapperProps = animated
    ? {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.8, ease: "easeOut" },
      }
    : {};

  return (
    <Wrapper {...(wrapperProps as Record<string, unknown>)} className={className}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 300 150"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: "visible" }}
      >
        {/* Dumbbell icon */}
        <g>
          {animated ? (
            <>
              <motion.rect
                x="95" y="18" width="16" height="30" rx="3"
                fill="#22c55e"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "103px 33px" }}
              />
              <motion.rect
                x="85" y="22" width="10" height="22" rx="2"
                fill="#16a34a"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "90px 33px" }}
              />
              <motion.rect
                x="111" y="29" width="78" height="8" rx="4"
                fill="#d4d4d8"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                style={{ transformOrigin: "150px 33px" }}
              />
              <motion.rect
                x="189" y="18" width="16" height="30" rx="3"
                fill="#22c55e"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "197px 33px" }}
              />
              <motion.rect
                x="205" y="22" width="10" height="22" rx="2"
                fill="#16a34a"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "210px 33px" }}
              />
              <motion.rect
                x="80" y="30" width="5" height="6" rx="1"
                fill="#a1a1aa"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
              <motion.rect
                x="215" y="30" width="5" height="6" rx="1"
                fill="#a1a1aa"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />
            </>
          ) : (
            <>
              <rect x="95" y="18" width="16" height="30" rx="3" fill="#22c55e" />
              <rect x="85" y="22" width="10" height="22" rx="2" fill="#16a34a" />
              <rect x="111" y="29" width="78" height="8" rx="4" fill="#d4d4d8" />
              <rect x="189" y="18" width="16" height="30" rx="3" fill="#22c55e" />
              <rect x="205" y="22" width="10" height="22" rx="2" fill="#16a34a" />
              <rect x="80" y="30" width="5" height="6" rx="1" fill="#a1a1aa" />
              <rect x="215" y="30" width="5" height="6" rx="1" fill="#a1a1aa" />
            </>
          )}
        </g>

        {/* GYMRAT text */}
        {animated ? (
          <motion.text
            x="150"
            y="85"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="white"
            letterSpacing="3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            GYMRAT
          </motion.text>
        ) : (
          <text
            x="150"
            y="85"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="38"
            fontWeight="900"
            fill="white"
            letterSpacing="3"
          >
            GYMRAT
          </text>
        )}

        {/* by Pablo Scarlatto */}
        {animated ? (
          <motion.text
            x="150"
            y="108"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="12"
            fill="#22c55e"
            letterSpacing="4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            BY PABLO SCARLATTO
          </motion.text>
        ) : (
          <text
            x="150"
            y="108"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="12"
            fill="#22c55e"
            letterSpacing="4"
          >
            BY PABLO SCARLATTO
          </text>
        )}

        {/* ENTRENAMIENTOS */}
        {animated ? (
          <motion.text
            x="150"
            y="125"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="8"
            fill="#555"
            letterSpacing="5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            ENTRENAMIENTOS
          </motion.text>
        ) : (
          <text
            x="150"
            y="125"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="8"
            fill="#555"
            letterSpacing="5"
          >
            ENTRENAMIENTOS
          </text>
        )}

        {/* Disney-style cartoon rat — runs around GYMRAT twice then hides behind text */}
        <CartoonRat animated={animated} />
      </svg>
    </Wrapper>
  );
}
