"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  /** Target date string (ISO or any parseable format) */
  targetDate: string;
  /** Label shown before the timer */
  label?: string;
  /** Style variant */
  variant?: "banner" | "inline" | "card";
  /** Additional CSS classes */
  className?: string;
}

function getTimeRemaining(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

export default function CountdownTimer({ targetDate, label, variant = "inline", className = "" }: CountdownTimerProps) {
  const [time, setTime] = useState(getTimeRemaining(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (time.expired) return null;

  const digits = [
    { value: time.days, label: "d" },
    { value: time.hours, label: "h" },
    { value: time.minutes, label: "m" },
    { value: time.seconds, label: "s" },
  ];

  if (variant === "banner") {
    return (
      <div className={`bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-2xl p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            {label && <span className="text-sm font-bold">{label}</span>}
          </div>
          <div className="flex items-center gap-1.5">
            {digits.map((d, i) => (
              <div key={i} className="flex items-center gap-0.5">
                <span className="bg-black/30 text-primary font-mono font-black text-lg px-2 py-1 rounded-lg min-w-[2.5rem] text-center">
                  {String(d.value).padStart(2, "0")}
                </span>
                <span className="text-[10px] text-muted font-bold">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`bg-red-500/10 border border-red-500/20 rounded-xl p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-red-400" />
            {label && <span className="text-xs font-bold text-red-400">{label}</span>}
          </div>
          <div className="flex items-center gap-1">
            {digits.map((d, i) => (
              <span key={i} className="text-sm font-mono font-bold text-red-400">
                {String(d.value).padStart(2, "0")}{d.label}{i < digits.length - 1 ? " " : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // inline
  return (
    <span className={`inline-flex items-center gap-1 text-red-400 font-mono font-bold text-sm ${className}`}>
      <Clock className="h-3.5 w-3.5" />
      {digits.map((d, i) => (
        <span key={i}>
          {String(d.value).padStart(2, "0")}{d.label}{i < digits.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
