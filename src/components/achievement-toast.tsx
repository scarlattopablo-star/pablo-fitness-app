"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";

interface AchievementToastData {
  icon: string;
  title: string;
  subtitle: string;
  type: "badge" | "levelup" | "streak";
}

export function triggerAchievementToast(data: AchievementToastData) {
  window.dispatchEvent(new CustomEvent("achievement-toast", { detail: data }));
}

export default function AchievementToast() {
  const [toast, setToast] = useState<AchievementToastData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as AchievementToastData;
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(detail);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      timerRef.current = setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener("achievement-toast", handler);
    return () => window.removeEventListener("achievement-toast", handler);
  }, []);

  if (!toast) return null;

  const borderColor = toast.type === "levelup" ? "border-amber-400/50" : "border-primary/30";
  const glowColor = toast.type === "levelup" ? "shadow-amber-400/20" : "shadow-primary/20";

  return (
    <div className="fixed top-2 left-2 right-2 z-[100] animate-fade-in-up md:left-auto md:right-4 md:max-w-sm">
      <div className={`glass-card rounded-2xl p-3 border ${borderColor} shadow-lg ${glowColor} cursor-pointer active:scale-[0.98] transition-transform`}
        onClick={dismissToast}>
        <div className="flex items-center gap-3">
          <div className="text-3xl shrink-0">{toast.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">{toast.title}</p>
            <p className="text-xs text-muted">{toast.subtitle}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); dismissToast(); }}
            className="text-muted hover:text-white shrink-0 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
