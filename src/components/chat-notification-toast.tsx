"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X } from "lucide-react";

interface ToastData {
  senderName: string;
  message: string;
  url: string;
}

// Call this from anywhere to show a toast
export function triggerChatNotification(data: ToastData) {
  window.dispatchEvent(new CustomEvent("chat-notification", { detail: data }));
}

export default function ChatNotificationToast() {
  const router = useRouter();
  const [toast, setToast] = useState<ToastData | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.wav");
    audioRef.current.volume = 0.7;
    audioRef.current.load();
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        try {
          const Ctx = window.AudioContext || (window as unknown as Record<string, unknown>).webkitAudioContext as typeof AudioContext;
          const ctx = new Ctx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 880;
          gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          osc.stop(ctx.currentTime + 0.3);
        } catch { /* ignore */ }
      });
    }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }, []);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  // Listen for the custom event
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ToastData;
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast(detail);
      playSound();
      timerRef.current = setTimeout(() => setToast(null), 5000);
    };
    window.addEventListener("chat-notification", handler);
    return () => window.removeEventListener("chat-notification", handler);
  }, [playSound]);

  if (!toast) return null;

  return (
    <div
      className="fixed top-2 left-2 right-2 z-[100] animate-fade-in-up md:left-auto md:right-4 md:max-w-sm"
      onClick={() => { dismissToast(); router.push(toast.url); }}
    >
      <div className="glass-card rounded-2xl p-3 border border-primary/30 shadow-lg shadow-black/30 cursor-pointer active:scale-[0.98] transition-transform">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
            <MessageCircle className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{toast.senderName}</p>
            <p className="text-xs text-muted truncate">{toast.message}</p>
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
