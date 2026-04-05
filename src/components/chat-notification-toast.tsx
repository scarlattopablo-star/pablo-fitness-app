"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface ToastData {
  id: string;
  senderName: string;
  message: string;
  url: string;
}

/**
 * Global toast notification for chat messages.
 * Shows a WhatsApp-style popup + plays sound when a message arrives
 * and the user is NOT on that specific chat page.
 */
export default function ChatNotificationToast() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [toast, setToast] = useState<ToastData | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload audio + listen for SW push messages
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notification.wav");
    audioRef.current.volume = 0.7;

    // When SW receives a push while app is open, it sends us a message
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_RECEIVED") {
        playSound();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSWMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playSound = useCallback(() => {
    // Try HTML Audio first
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // iOS Safari fallback: use AudioContext (works after user interaction)
        try {
          const ctx = new (window.AudioContext || (window as unknown as Record<string,unknown>).webkitAudioContext as typeof AudioContext)();
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
    // Vibrate if supported (not on iOS but works on Android)
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
  }, []);

  const showToast = useCallback((data: ToastData) => {
    // Clear previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setToast(data);
    playSound();

    // Auto-dismiss after 5 seconds
    timerRef.current = setTimeout(() => setToast(null), 5000);
  }, [playSound]);

  const dismissToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast(null);
  }, []);

  const handleTap = useCallback(() => {
    if (!toast) return;
    dismissToast();
    router.push(toast.url);
  }, [toast, dismissToast, router]);

  // Listen for private messages
  useEffect(() => {
    if (!user) return;

    console.log("[Toast] Setting up realtime listener for user:", user.id);

    const channel = supabase
      .channel("global-msg-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          console.log("[Toast] Private message received:", payload.new);
          const msg = payload.new as { id: string; sender_id: string; conversation_id: string; content: string };
          if (msg.sender_id === user.id) return;
          if (pathname?.includes(msg.conversation_id)) return;

          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.sender_id)
            .single();

          showToast({
            id: msg.id,
            senderName: senderProfile?.full_name || "Gym Bro",
            message: msg.content.substring(0, 80),
            url: `/dashboard/chat/${msg.conversation_id}`,
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "general_messages" },
        async (payload) => {
          console.log("[Toast] General message received:", payload.new);
          const msg = payload.new as { id: string; sender_id: string; content: string };
          if (msg.sender_id === user.id) return;
          if (pathname?.includes("/chat/general")) return;

          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", msg.sender_id)
            .single();

          showToast({
            id: msg.id,
            senderName: senderProfile?.full_name || "Gym Bro",
            message: msg.content.substring(0, 80),
            url: "/dashboard/chat/general",
          });
        }
      )
      .subscribe((status) => {
        console.log("[Toast] Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, pathname, showToast]);

  if (!toast) return null;

  return (
    <div
      className="fixed top-2 left-2 right-2 z-[100] animate-fade-in-up md:left-auto md:right-4 md:max-w-sm"
      onClick={handleTap}
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
