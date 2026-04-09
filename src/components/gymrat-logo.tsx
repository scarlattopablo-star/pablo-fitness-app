"use client";

import { motion } from "framer-motion";

interface GymRatLogoProps {
  animated?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
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
      </svg>
    </Wrapper>
  );
}
