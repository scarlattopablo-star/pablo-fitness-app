"use client";

import { MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getOrCreateConversation, getUnreadCount } from "@/lib/chat-helpers";

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

interface WhatsAppButtonProps {
  variant?: "floating" | "inline" | "small";
  className?: string;
  label?: string;
}

export default function WhatsAppButton({
  variant = "floating",
  className = "",
  label = "Chat con Pablo",
}: WhatsAppButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  // Check unread messages from admin
  useEffect(() => {
    if (!user) return;
    getUnreadCount(user.id).then(setUnread);
  }, [user]);

  const handleOpen = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const conversationId = await getOrCreateConversation(user.id, ADMIN_ID);
      router.push(`/dashboard/chat/${conversationId}`);
    } catch {
      router.push("/dashboard/chat");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "small") {
    return (
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1 text-xs text-emerald-400 font-medium px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors shrink-0 ${className}`}
      >
        <MessageCircle className="h-3 w-3" />
        {label}
      </button>
    );
  }

  if (variant === "inline") {
    return (
      <button
        onClick={handleOpen}
        className={`flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl transition-colors ${className}`}
      >
        <MessageCircle className="h-5 w-5" />
        {label}
      </button>
    );
  }

  // Floating button
  return (
    <button
      onClick={handleOpen}
      disabled={loading}
      className={`fixed bottom-24 right-4 z-40 w-14 h-14 bg-emerald-500 hover:bg-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all hover:scale-110 disabled:opacity-70 ${className}`}
      aria-label="Chat con Pablo"
    >
      <MessageCircle className="h-7 w-7 text-white" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
