"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, Users, Search, ArrowLeft, AlertTriangle, Send, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import {
  fetchAllClientsForChat,
  fetchGeneralMessages,
  sendGeneralMessage,
  fetchMessages,
  sendMessage,
  getOrCreateConversation,
  markMessagesAsRead,
} from "@/lib/chat-helpers";
import { sendGeneralPushNotification, sendPushNotification } from "@/lib/push-notifications";
import { usePresence } from "@/hooks/use-presence";

interface ClientItem {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  conversationId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unread: number;
}

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  flagged?: boolean;
  created_at: string;
  sender_name?: string;
  read_at?: string | null;
}

type ActiveChat = { type: "general" } | { type: "private"; clientId: string; clientName: string; conversationId: string };

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("es-UY", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-UY", { day: "numeric", month: "short" });
}

function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

export default function AdminChatPage() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [activeChat, setActiveChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { isUserOnline, onlineCount } = usePresence(
    user?.id || "",
    profile?.full_name || "Admin"
  );

  // Load all clients
  useEffect(() => {
    if (!user) return;
    fetchAllClientsForChat(user.id).then((data) => {
      setClients(data);
      setLoadingClients(false);
    });
  }, [user]);

  // Realtime: refresh client list on new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("admin-chat-refresh")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        fetchAllClientsForChat(user.id).then(setClients);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat || !user) return;
    setLoadingMessages(true);
    setMessages([]);

    if (activeChat.type === "general") {
      fetchGeneralMessages().then((msgs) => {
        setMessages(msgs as ChatMessage[]);
        setLoadingMessages(false);
      });
    } else {
      fetchMessages(activeChat.conversationId).then((msgs) => {
        setMessages(msgs as ChatMessage[]);
        setLoadingMessages(false);
        markMessagesAsRead(activeChat.conversationId, user.id);
        // Clear unread for this client
        setClients((prev) => prev.map((c) => c.id === activeChat.clientId ? { ...c, unread: 0 } : c));
      });
    }
  }, [activeChat, user]);

  // Realtime messages for active chat
  useEffect(() => {
    if (!activeChat || !user) return;

    const table = activeChat.type === "general" ? "general_messages" : "messages";
    const filter = activeChat.type === "private" ? `conversation_id=eq.${activeChat.conversationId}` : undefined;

    const channel = supabase
      .channel(`admin-active-chat-${activeChat.type === "general" ? "general" : activeChat.conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table, ...(filter ? { filter } : {}) },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          // For general chat, fetch sender name
          if (activeChat.type === "general") {
            const { data: p } = await supabase.from("profiles").select("full_name").eq("id", newMsg.sender_id).single();
            newMsg.sender_name = p?.full_name || "Usuario";
          }
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if private
          if (activeChat.type === "private" && newMsg.sender_id !== user.id) {
            markMessagesAsRead(activeChat.conversationId, user.id);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChat, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "42px";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text]);

  async function handleSelectClient(client: ClientItem) {
    if (!user) return;
    let convId = client.conversationId;
    if (!convId) {
      convId = await getOrCreateConversation(user.id, client.id);
      setClients((prev) => prev.map((c) => c.id === client.id ? { ...c, conversationId: convId } : c));
    }
    setActiveChat({ type: "private", clientId: client.id, clientName: client.full_name, conversationId: convId! });
  }

  async function handleSend() {
    if (!text.trim() || !user || !activeChat) return;
    const content = text.trim();
    setText("");

    if (activeChat.type === "general") {
      const msg = await sendGeneralMessage(user.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, { ...msg, sender_name: profile?.full_name || "Pablo" } as ChatMessage];
      });
      sendGeneralPushNotification(profile?.full_name || "Pablo", content.substring(0, 100));
    } else {
      const msg = await sendMessage(activeChat.conversationId, user.id, content);
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg as ChatMessage];
      });
      sendPushNotification(activeChat.clientId, profile?.full_name || "Pablo", content.substring(0, 100), `/dashboard/chat/${activeChat.conversationId}`);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Filter clients by search
  const filteredClients = searchQuery
    ? clients.filter((c) => c.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : clients;

  // Sort: online first, then by last message, then alphabetical
  const sortedClients = [...filteredClients].sort((a, b) => {
    const aOnline = isUserOnline(a.id) ? 1 : 0;
    const bOnline = isUserOnline(b.id) ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline;
    if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return a.full_name.localeCompare(b.full_name);
  });

  const isActiveChatGeneral = activeChat?.type === "general";
  const isActiveChatClient = (id: string) => activeChat?.type === "private" && activeChat.clientId === id;

  return (
    <div className="flex h-full">
      {/* ===== SIDEBAR ===== */}
      <div className={`${activeChat ? "hidden md:flex" : "flex"} flex-col w-full md:w-[360px] md:min-w-[360px] border-r border-card-border bg-background`}>
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-card-border">
          <h2 className="text-lg font-bold mb-3">Chats</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente..."
              className="w-full bg-card-bg border border-card-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-muted" />
              </button>
            )}
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto">
          {/* General chat item */}
          <button
            onClick={() => setActiveChat({ type: "general" })}
            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-card-border ${isActiveChatGeneral ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
          >
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-black" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Chat General</p>
                <span className="text-[10px] text-muted">{onlineCount} en linea</span>
              </div>
              <p className="text-xs text-muted truncate">Grupo de todos los usuarios</p>
            </div>
          </button>

          {/* Client list */}
          {loadingClients ? (
            <div className="p-8 text-center text-muted text-sm">Cargando...</div>
          ) : sortedClients.length === 0 ? (
            <div className="p-8 text-center text-muted text-sm">
              {searchQuery ? "Sin resultados" : "No hay clientes"}
            </div>
          ) : (
            sortedClients.map((client) => {
              const online = isUserOnline(client.id);
              const isActive = isActiveChatClient(client.id);
              return (
                <button
                  key={client.id}
                  onClick={() => handleSelectClient(client)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-card-border/50 ${isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {client.full_name?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <span className={`${online ? "online-dot" : "offline-dot"} absolute -bottom-0.5 -right-0.5 border-2 border-background`} />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{client.full_name}</p>
                      {client.lastMessageAt && (
                        <span className="text-[10px] text-muted shrink-0 ml-2">{formatDate(client.lastMessageAt)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted truncate">
                        {client.lastMessagePreview || (online ? "En linea" : client.email)}
                      </p>
                      {client.unread > 0 && (
                        <span className="ml-2 bg-primary text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                          {client.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ===== CHAT PANEL ===== */}
      <div className={`${activeChat ? "flex" : "hidden md:flex"} flex-col flex-1 min-w-0 bg-background`}>
        {!activeChat ? (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-1">Pablo Scarlatto Chat</h3>
              <p className="text-sm text-muted">Selecciona un chat para empezar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border bg-card-bg shrink-0">
              <button onClick={() => setActiveChat(null)} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </button>
              {activeChat.type === "general" ? (
                <>
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5 text-black" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Chat General</p>
                    <p className="text-xs text-muted">{onlineCount} en linea</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {activeChat.clientName?.[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <span className={`${isUserOnline(activeChat.clientId) ? "online-dot" : "offline-dot"} absolute -bottom-0.5 -right-0.5 border-2 border-card-bg !w-[8px] !h-[8px]`} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeChat.clientName}</p>
                    <p className="text-xs text-muted">
                      {isUserOnline(activeChat.clientId) ? "En linea" : "Desconectado"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
              {loadingMessages ? (
                <div className="text-center text-muted text-sm py-8">Cargando mensajes...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted text-sm py-8">
                  {activeChat.type === "general" ? "No hay mensajes en el chat general" : `Inicia una conversacion con ${activeChat.clientName}`}
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMine = msg.sender_id === user?.id;
                  const showDate = i === 0 || getDateLabel(msg.created_at) !== getDateLabel(messages[i - 1].created_at);
                  const showName = activeChat.type === "general" && !isMine && (i === 0 || messages[i - 1].sender_id !== msg.sender_id);

                  return (
                    <div key={msg.id}>
                      {showDate && (
                        <div className="text-center my-4">
                          <span className="text-[11px] text-muted bg-card-bg/80 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm">
                            {getDateLabel(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1.5`}>
                        {!isMine && activeChat.type === "general" && (
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold shrink-0 mr-1.5 mt-1">
                            {msg.sender_name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className={`max-w-[70%] px-3 py-2 shadow-sm ${
                          isMine
                            ? "gradient-primary text-black rounded-2xl rounded-br-sm"
                            : "bg-card-bg border border-card-border rounded-2xl rounded-bl-sm"
                        } ${msg.flagged ? "opacity-50" : ""}`}>
                          {showName && (
                            <p className="text-[11px] font-semibold text-primary mb-0.5">{msg.sender_name}</p>
                          )}
                          <p className="text-[13px] whitespace-pre-wrap break-words leading-snug">{msg.content}</p>
                          <p className={`text-[10px] mt-0.5 text-right ${isMine ? "text-black/40" : "text-muted"}`}>
                            {formatTime(msg.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="flex items-end gap-2 p-3 border-t border-card-border bg-card-bg shrink-0" style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribi un mensaje..."
                rows={1}
                className="flex-1 bg-transparent border border-card-border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-primary transition-colors max-h-32"
                style={{ minHeight: "42px" }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity active:scale-95"
              >
                <Send className="h-4 w-4 text-black" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
