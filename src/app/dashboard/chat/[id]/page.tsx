"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  fetchMessages,
  sendMessage,
  markMessagesAsRead,
  getConversationPartner,
  checkUserBlocked,
  recordWarning,
} from "@/lib/chat-helpers";
import { checkMessage, WARNING_MESSAGES } from "@/lib/chat-moderation";
import { sendPushNotification } from "@/lib/push-notifications";
import MessageBubble from "@/components/chat/message-bubble";
import MessageInput from "@/components/chat/message-input";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  flagged: boolean;
  created_at: string;
}

interface Partner {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function ConversationPage() {
  const { id: conversationId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Load conversation data
  useEffect(() => {
    if (!user || !conversationId) return;

    async function load() {
      try {
        const [msgs, partnerData, blockStatus] = await Promise.all([
          fetchMessages(conversationId),
          getConversationPartner(conversationId, user!.id),
          checkUserBlocked(user!.id),
        ]);

        setMessages(msgs as Message[]);
        setPartner(partnerData);
        setBlocked(blockStatus.blocked);

        // Mark messages as read
        await markMessagesAsRead(conversationId, user!.id);
      } catch {
        router.push("/dashboard/chat");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, conversationId, router]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId || !user) return;

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead(conversationId, user.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user]);

  async function handleSend(content: string) {
    if (!user || !conversationId || blocked) return;

    // Check moderation
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
      // Still send the message but flagged
    }

    try {
      const msg = await sendMessage(conversationId, user.id, content);
      // Add optimistically (realtime will deduplicate)
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg as Message];
      });

      // Send push notification to partner
      if (partner) {
        sendPushNotification(
          partner.id,
          `${user.user_metadata?.full_name || "Gym Bro"}`,
          content.substring(0, 100),
          `/dashboard/chat/${conversationId}`
        );
      }
    } catch {
      // Ignore send errors
    }
  }

  // Group messages by date
  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hoy";
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";
    return date.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-muted text-sm">Cargando chat...</p>
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
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
          {partner?.full_name?.charAt(0)?.toUpperCase() || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{partner?.full_name || "Chat"}</p>
        </div>
      </div>

      {/* Warning banner */}
      {warning && (
        <div className="flex items-center gap-2 px-4 py-2 bg-warning/20 text-warning text-xs shrink-0">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <p>{warning}</p>
        </div>
      )}

      {/* Messages */}
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <div className="text-center text-muted text-sm py-8">
            Empezá la conversación con {partner?.full_name || "tu Gym Bro"}
          </div>
        )}

        {messages.map((msg, i) => {
          const showDate =
            i === 0 ||
            getDateLabel(msg.created_at) !== getDateLabel(messages[i - 1].created_at);

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="text-xs text-muted bg-card-bg px-3 py-1 rounded-full">
                    {getDateLabel(msg.created_at)}
                  </span>
                </div>
              )}
              <MessageBubble
                content={msg.content}
                isSent={msg.sender_id === user?.id}
                time={msg.created_at}
                flagged={msg.flagged}
              />
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
