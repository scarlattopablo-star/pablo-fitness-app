"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, AlertTriangle, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  fetchGeneralMessages,
  sendGeneralMessage,
  checkUserBlocked,
  recordWarning,
} from "@/lib/chat-helpers";
import { checkMessage, WARNING_MESSAGES } from "@/lib/chat-moderation";
import { sendGeneralPushNotification } from "@/lib/push-notifications";
import MessageInput from "@/components/chat/message-input";

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

export default function GeneralChatPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<GeneralMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const [msgs, blockStatus] = await Promise.all([
          fetchGeneralMessages(),
          checkUserBlocked(user!.id),
        ]);
        setMessages(msgs as GeneralMessage[]);
        setBlocked(blockStatus.blocked);
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
      .channel("general-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "general_messages" },
        async (payload) => {
          const newMsg = payload.new as GeneralMessage;

          // Fetch sender info
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
    if (!user || blocked) return;

    const modResult = checkMessage(content);
    if (modResult.flagged) {
      const warningCount = await recordWarning(user.id, modResult.reason);
      if (warningCount >= 3) {
        setBlocked(true);
        setWarning(WARNING_MESSAGES.blocked);
        return;
      }
      setWarning(warningCount === 1 ? WARNING_MESSAGES.first : WARNING_MESSAGES.second);
      setTimeout(() => setWarning(null), 6000);
    }

    try {
      const msg = await sendGeneralMessage(user.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [
          ...prev,
          {
            ...msg,
            sender_name: profile?.full_name || "Yo",
            sender_avatar: null,
          } as GeneralMessage,
        ];
      });

      // Push notification to all other users
      sendGeneralPushNotification(
        profile?.full_name || "Gym Bro",
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
    <div className="flex flex-col h-[calc(100vh-60px)] md:h-screen max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border bg-card-bg shrink-0">
        <Link href="/dashboard/chat" className="p-1 hover:bg-white/10 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
          <Users className="h-5 w-5 text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Chat General</p>
          <p className="text-xs text-muted">Todos los Gym Bros</p>
        </div>
      </div>

      {/* Warning */}
      {warning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/20 text-warning text-xs shrink-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>{warning}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="text-center text-muted text-sm py-8">
            Se el primero en escribir en el chat general
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
                  } ${msg.flagged ? "opacity-60" : ""}`}
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
        <MessageInput onSend={handleSend} disabled={blocked} />
      </div>
    </div>
  );
}
