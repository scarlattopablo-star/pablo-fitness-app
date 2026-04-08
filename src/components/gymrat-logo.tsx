"use client";

import { motion } from "framer-motion";

interface GymRatLogoProps {
  animated?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Sin City style rat — runs from bottom, circles GYMRAT twice, climbs up and hides
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

// Sin City muscular rat — high contrast, aggressive, noir style
function SinCityRat({ animated }: { animated: boolean }) {
  if (!animated) return null;

  return (
    <motion.g
      variants={ratAnimation}
      initial="hidden"
      animate="run"
    >
      {/* Shadow */}
      <ellipse cx="0" cy="20" rx="14" ry="3" fill="rgba(0,0,0,0.4)" />

      {/* Tail — thick, aggressive curl */}
      <motion.path
        d="M-20 4 Q-32 -8 -28 -20 Q-24 -28 -16 -22 Q-10 -17 -14 -8"
        stroke="#333"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        animate={{ d: [
          "M-20 4 Q-32 -8 -28 -20 Q-24 -28 -16 -22 Q-10 -17 -14 -8",
          "M-20 4 Q-34 -2 -30 -16 Q-27 -24 -19 -20 Q-13 -16 -16 -6",
          "M-20 4 Q-32 -8 -28 -20 Q-24 -28 -16 -22 Q-10 -17 -14 -8",
        ]}}
        transition={{ duration: 0.5, repeat: Infinity }}
      />

      {/* Back leg — muscular */}
      <motion.g animate={{ rotate: [0, -12, 0, 12, 0] }} transition={{ duration: 0.2, repeat: Infinity }}>
        <ellipse cx="-8" cy="12" rx="6" ry="5" fill="#222" />
        <ellipse cx="-8" cy="12" rx="5" ry="4" fill="#444" />
        <ellipse cx="-9" cy="17" rx="4" ry="2.5" fill="#333" />
      </motion.g>

      {/* Body — big, muscular, V-shape */}
      <ellipse cx="2" cy="2" rx="18" ry="14" fill="#1a1a1a" />
      {/* Muscle definition — chest/back highlight */}
      <ellipse cx="4" cy="0" rx="14" ry="10" fill="#2a2a2a" />
      {/* Abs hint */}
      <line x1="-2" y1="-2" x2="-2" y2="8" stroke="#333" strokeWidth="0.5" />
      <line x1="4" y1="-3" x2="4" y2="7" stroke="#333" strokeWidth="0.5" />

      {/* Front leg — muscular, running */}
      <motion.g animate={{ rotate: [0, 18, 0, -18, 0] }} transition={{ duration: 0.2, repeat: Infinity }}>
        <ellipse cx="14" cy="10" rx="5" ry="5" fill="#222" />
        <ellipse cx="14" cy="10" rx="4" ry="4" fill="#444" />
        <ellipse cx="16" cy="16" rx="4" ry="2" fill="#333" />
      </motion.g>

      {/* Arm muscles — big biceps visible */}
      <ellipse cx="-6" cy="-2" rx="4" ry="6" fill="#333" transform="rotate(-15 -6 -2)" />
      <ellipse cx="12" cy="-4" rx="4" ry="6" fill="#333" transform="rotate(15 12 -4)" />

      {/* Neck — thick */}
      <rect x="10" y="-12" width="8" height="8" rx="3" fill="#1a1a1a" />

      {/* Head — angular, aggressive */}
      <ellipse cx="18" cy="-14" rx="12" ry="11" fill="#1a1a1a" />
      {/* Jaw — strong, angular */}
      <path d="M10 -8 Q18 -2 26 -8" fill="#222" />

      {/* Ears — pointed, aggressive */}
      <path d="M8 -24 L12 -30 L16 -22" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
      <path d="M8 -24 L12 -28 L15 -22" fill="#22c55e" opacity="0.3" />
      <path d="M22 -24 L26 -30 L28 -20" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
      <path d="M23 -24 L26 -28 L27 -21" fill="#22c55e" opacity="0.3" />

      {/* Eyes — narrow, intense, white on black (Sin City) */}
      <ellipse cx="14" cy="-16" rx="4" ry="2.5" fill="white" />
      <ellipse cx="23" cy="-15" rx="3.5" ry="2.5" fill="white" />
      {/* Pupils — small, focused */}
      <motion.ellipse
        cx="15" cy="-15.5" rx="1.8" ry="2" fill="black"
        animate={{ cx: [15, 16, 15, 14, 15] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      <motion.ellipse
        cx="24" cy="-14.5" rx="1.6" ry="2" fill="black"
        animate={{ cx: [24, 25, 24, 23, 24] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
      {/* Eye shine — sharp */}
      <circle cx="13.5" cy="-17" r="0.8" fill="white" />
      <circle cx="22.5" cy="-16" r="0.6" fill="white" />

      {/* Eyebrows — angry, furrowed */}
      <line x1="10" y1="-20" x2="17" y2="-19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="27" y1="-19" x2="20" y2="-19" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

      {/* Snout/nose — angular */}
      <path d="M26 -12 L30 -10 L26 -8" fill="#333" />
      <circle cx="30" cy="-10" r="1.5" fill="#22c55e" />

      {/* Mouth — snarl, showing teeth */}
      <path d="M24 -6 Q28 -4 31 -7" stroke="#555" strokeWidth="0.8" fill="none" />
      {/* Fang */}
      <path d="M26 -6 L27 -3 L28 -6" fill="white" />

      {/* Whiskers — stiff, sharp */}
      <motion.g
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 0.4, repeat: Infinity }}
        style={{ transformOrigin: "28px -10px" }}
      >
        <line x1="29" y1="-13" x2="40" y2="-16" stroke="#555" strokeWidth="0.6" />
        <line x1="30" y1="-10" x2="42" y2="-10" stroke="#555" strokeWidth="0.6" />
        <line x1="29" y1="-7" x2="40" y2="-4" stroke="#555" strokeWidth="0.6" />
      </motion.g>

      {/* Green headband — gym rat identity */}
      <path d="M7 -22 Q18 -28 29 -20" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Headband knot */}
      <circle cx="7" cy="-22" r="2" fill="#22c55e" />
      <line x1="5" y1="-22" x2="2" y2="-26" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="-22" x2="3" y2="-19" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />

      {/* Vein on arm — detail */}
      <path d="M-5 -4 Q-3 -1 -4 3" stroke="#444" strokeWidth="0.4" fill="none" />
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
              <motion.rect x="95" y="18" width="16" height="30" rx="3" fill="#22c55e"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "103px 33px" }} />
              <motion.rect x="85" y="22" width="10" height="22" rx="2" fill="#16a34a"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "90px 33px" }} />
              <motion.rect x="111" y="29" width="78" height="8" rx="4" fill="#d4d4d8"
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
                style={{ transformOrigin: "150px 33px" }} />
              <motion.rect x="189" y="18" width="16" height="30" rx="3" fill="#22c55e"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "197px 33px" }} />
              <motion.rect x="205" y="22" width="10" height="22" rx="2" fill="#16a34a"
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.3, duration: 0.4, ease: "backOut" }}
                style={{ transformOrigin: "210px 33px" }} />
              <motion.rect x="80" y="30" width="5" height="6" rx="1" fill="#a1a1aa"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
              <motion.rect x="215" y="30" width="5" height="6" rx="1" fill="#a1a1aa"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} />
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
          <motion.text x="150" y="85" textAnchor="middle" fontFamily="Arial, sans-serif"
            fontSize="38" fontWeight="900" fill="white" letterSpacing="3"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}>GYMRAT</motion.text>
        ) : (
          <text x="150" y="85" textAnchor="middle" fontFamily="Arial, sans-serif"
            fontSize="38" fontWeight="900" fill="white" letterSpacing="3">GYMRAT</text>
        )}

        {/* by Pablo Scarlatto */}
        {animated ? (
          <motion.text x="150" y="108" textAnchor="middle" fontFamily="Arial, sans-serif"
            fontSize="12" fill="#22c55e" letterSpacing="4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}>BY PABLO SCARLATTO</motion.text>
        ) : (
          <text x="150" y="108" textAnchor="middle" fontFamily="Arial, sans-serif"
            fontSize="12" fill="#22c55e" letterSpacing="4">BY PABLO SCARLATTO</text>
        )}

        {/* ENTRENAMIENTOS */}
        {animated ? (
          <motion.text x="150" y="125" textAnchor="middle" fontFamily="Arial, sans-serif"
            fontSize="8" fill="#555" letterSpacing="5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}>ENTRENAMIENTOS</motion.text>
        ) : (
          <text x="150" y="125" textAnchor="middle" fontFamily="Arial, sans-serif"
            fontSize="8" fill="#555" letterSpacing="5">ENTRENAMIENTOS</text>
        )}

        {/* Sin City muscular rat */}
        <SinCityRat animated={animated} />
      </svg>
    </Wrapper>
  );
}
