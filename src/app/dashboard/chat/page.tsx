"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Bell, BellOff, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  fetchConversations,
  getOrCreateConversation,
  getUnreadCount,
  checkUserBlocked,
  searchUsers,
} from "@/lib/chat-helpers";
import {
  requestPushPermission,
  isPushSupported,
  getPushPermissionState,
} from "@/lib/push-notifications";
import UserSearch from "@/components/chat/user-search";
import ConversationItem from "@/components/chat/conversation-item";
import { supabase } from "@/lib/supabase";
import { usePresenceContext } from "@/hooks/use-presence";

interface Conversation {
  id: string;
  otherUser: { id: string; full_name: string; email: string; avatar_url: string | null };
  lastMessageAt: string;
  lastMessagePreview: string | null;
}

export default function ChatPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string; email: string; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [pushState, setPushState] = useState<string>("default");
  const [unreadConvIds, setUnreadConvIds] = useState<Set<string>>(new Set());
  const { isUserOnline, onlineCount } = usePresenceContext();

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const [convs, unreadRes, usersRes] = await Promise.all([
        fetchConversations(user.id),
        supabase.from("messages").select("conversation_id")
          .neq("sender_id", user.id).is("read_at", null),
        supabase.from("profiles").select("id, full_name, email, avatar_url")
          .neq("id", user.id).eq("is_admin", false).is("deleted_at", null)
          .order("full_name"),
      ]);

      setConversations(convs);

      if (unreadRes.data) {
        setUnreadConvIds(new Set(unreadRes.data.map((m) => m.conversation_id)));
      }

      if (usersRes.data) {
        // Exclude users that already have a conversation
        const convUserIds = new Set(convs.map((c: Conversation) => c.otherUser.id));
        setAllUsers(usersRes.data.filter(u => !convUserIds.has(u.id)));
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    loadConversations();

    // Check block status
    checkUserBlocked(user.id).then(({ blocked: b }) => setBlocked(b));

    // Auto-request push permission on first chat visit
    const currentPush = getPushPermissionState();
    setPushState(currentPush);
    if (currentPush === "default" && isPushSupported()) {
      requestPushPermission().then((granted) => {
        setPushState(granted ? "granted" : "denied");
      });
    }

    // Listen for new messages to refresh conversation list
    const channel = supabase
      .channel("chat-list")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadConversations]);

  async function handleStartChat(otherUserId: string) {
    if (!user) return;
    try {
      const conversationId = await getOrCreateConversation(user.id, otherUserId);
      router.push(`/dashboard/chat/${conversationId}`);
    } catch {
      // Ignore
    }
  }

  async function handleEnablePush() {
    const granted = await requestPushPermission();
    setPushState(granted ? "granted" : "denied");
  }

  if (blocked) {
    return (
      <div className="p-4 sm:p-6 max-w-2xl">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
            <BellOff className="h-8 w-8 text-danger" />
          </div>
          <h2 className="text-xl font-bold mb-2">Chat suspendido</h2>
          <p className="text-muted text-sm">
            Tu acceso al chat ha sido suspendido por uso de lenguaje inapropiado.
            Contacta al administrador si crees que es un error.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-heading font-bold">Gym Bro</h1>
      </div>

      {/* Tabs: General / Privado */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/dashboard/chat/general"
          className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl hover:bg-white/10 transition-colors"
        >
          <Users className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">General</span>
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <span className="online-dot !w-[6px] !h-[6px] !animate-none" />
            {onlineCount}
          </span>
        </Link>
        <div className="flex items-center gap-2 px-4 py-2.5 gradient-primary rounded-xl">
          <MessageCircle className="h-4 w-4 text-black" />
          <span className="text-sm font-bold text-black">Privado</span>
        </div>
      </div>

      {/* Push notification banner */}
      {isPushSupported() && pushState === "default" && (
        <button
          onClick={handleEnablePush}
          className="w-full flex items-center gap-3 glass-card rounded-xl p-3 mb-4 hover:bg-white/5 transition-colors"
        >
          <Bell className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm text-left flex-1">
            Activá las notificaciones para no perderte mensajes
          </span>
          <span className="text-xs text-primary font-semibold shrink-0">Activar</span>
        </button>
      )}

      {/* Search users */}
      {user && (
        <div className="mb-4">
          <UserSearch currentUserId={user.id} onStartChat={handleStartChat} />
        </div>
      )}

      {/* Conversations list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted text-sm">Cargando chats...</div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">Sin conversaciones</h3>
            <p className="text-sm text-muted">
              Buscá un compañero de gym para empezar a chatear
            </p>
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                id={conv.id}
                otherUser={conv.otherUser}
                lastMessagePreview={conv.lastMessagePreview}
                lastMessageAt={conv.lastMessageAt}
                hasUnread={unreadConvIds.has(conv.id)}
                isOnline={isUserOnline(conv.otherUser.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* All users list */}
      {!loading && allUsers.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted font-bold uppercase tracking-wider mb-2 px-1">
            Otros usuarios ({allUsers.length})
          </p>
          <div className="glass-card rounded-2xl overflow-hidden divide-y divide-card-border">
            {allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => handleStartChat(u.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {u.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  {isUserOnline(u.id) && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-card-bg" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{u.full_name}</p>
                  <p className="text-xs text-muted truncate">
                    {isUserOnline(u.id) ? "En linea" : "Desconectado"}
                  </p>
                </div>
                <MessageCircle className="h-4 w-4 text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
