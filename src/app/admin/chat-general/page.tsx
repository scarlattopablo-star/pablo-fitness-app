"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AlertTriangle, Users } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  fetchGeneralMessages,
  sendGeneralMessage,
} from "@/lib/chat-helpers";
import { sendGeneralPushNotification } from "@/lib/push-notifications";
import MessageInput from "@/components/chat/message-input";
import OnlineUsersPanel from "@/components/chat/online-users-panel";
import { usePresence } from "@/hooks/use-presence";

interface GeneralMessage {
  id: string;
  sender_id: string;
  content: string;
  flagged: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string | null;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoy";
  if (date.toDateString() === yesterday.toDateString()) return "Ayer";
  return date.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

export default function AdminChatGeneralPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewportHeight, setViewportHeight] = useState<string>("100dvh");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { onlineUsers, onlineCount } = usePresence({
    channelName: "general-chat-presence",
    userId: user?.id || "",
    fullName: profile?.full_name || "Admin",
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Mobile keyboard handling
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => setViewportHeight(`${vv.height}px`);
    vv.addEventListener("resize", handler);
    return () => vv.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    async function load() {
      try {
        const msgs = await fetchGeneralMessages();
        setMessages(msgs as GeneralMessage[]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("admin-general-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "general_messages" },
        async (payload) => {
          const newMsg = payload.new as GeneralMessage;
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", newMsg.sender_id)
            .single();

          const enriched = {
            ...newMsg,
            sender_name: senderProfile?.full_name || "Usuario",
            sender_avatar: senderProfile?.avatar_url || null,
          };

          setMessages((prev) => {
            if (prev.some((m) => m.id === enriched.id)) return prev;
            return [...prev, enriched];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  async function handleSend(content: string) {
    if (!user) return;

    // Admin sends without moderation
    try {
      const msg = await sendGeneralMessage(user.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            ...msg,
            sender_name: profile?.full_name || "Pablo",
            sender_avatar: null,
          } as GeneralMessage,
        ];
      });
      sendGeneralPushNotification(
        profile?.full_name || "Pablo",
        content.substring(0, 100)
      );
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted text-sm">Cargando chat general...</p>
      </div>
    );
  }

  return (
    <div
      className="flex -m-4 sm:-m-6 lg:-m-8"
      style={{ height: `calc(${viewportHeight} - 56px)` }}
    >
      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border bg-card-bg shrink-0">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">Chat General</p>
            <p className="text-xs text-muted">Todos los usuarios</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
            <span className="online-dot !w-2 !h-2 !animate-none" />
            {onlineCount} en linea
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="text-center text-muted text-sm py-8">
              No hay mensajes todavia
            </div>
          )}

          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id;
            const showDate =
              i === 0 || getDateLabel(msg.created_at) !== getDateLabel(messages[i - 1].created_at);
            const showName =
              !isMine && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="text-xs text-muted bg-card-bg px-3 py-1 rounded-full">
                      {getDateLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
                  {!isMine && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0 mr-2 mt-1">
                      {msg.sender_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2.5 ${
                      isMine
                        ? "gradient-primary text-black rounded-2xl rounded-br-sm"
                        : "glass-card rounded-2xl rounded-bl-sm"
                    } ${msg.flagged ? "opacity-60 line-through" : ""}`}
                  >
                    {showName && !isMine && (
                      <p className="text-xs font-semibold text-primary mb-1">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMine ? "text-black/50" : "text-muted"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="shrink-0">
          <MessageInput onSend={handleSend} />
        </div>
      </div>

      {/* Side panel with online users - always visible */}
      <div className="hidden md:flex flex-col w-72 border-l border-card-border bg-card-bg/50 shrink-0">
        <div className="px-4 py-3 border-b border-card-border">
          <div className="flex items-center gap-2">
            <span className="online-dot !w-2.5 !h-2.5" />
            <p className="text-sm font-semibold">Conectados ({onlineCount})</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <OnlineUsersPanel users={onlineUsers} currentUserId={user?.id || ""} isAdmin />
        </div>
      </div>
    </div>
  );
}
