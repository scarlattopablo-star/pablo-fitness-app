"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export interface PresenceUser {
  user_id: string;
  full_name: string;
  online_at: string;
}

interface PresenceValue {
  onlineUsers: PresenceUser[];
  onlineCount: number;
  isUserOnline: (id: string) => boolean;
}

const defaultValue: PresenceValue = { onlineUsers: [], onlineCount: 0, isUserOnline: () => false };
const PresenceContext = createContext<PresenceValue>(defaultValue);

function usePresenceChannel(userId: string, fullName: string): PresenceValue {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!userId || !fullName) return;

    const channel = supabase.channel("app-presence", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = new Map<string, PresenceUser>();
        for (const presences of Object.values(state)) {
          for (const p of presences) {
            if (!users.has(p.user_id)) {
              users.set(p.user_id, p);
            }
          }
        }
        setOnlineUsers(Array.from(users.values()));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            full_name: fullName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [userId, fullName]);

  const isUserOnline = useCallback(
    (id: string) => onlineUsers.some((u) => u.user_id === id),
    [onlineUsers]
  );

  return { onlineUsers, onlineCount: onlineUsers.length, isUserOnline };
}

// Provider — wraps dashboard layout, subscribes once
export function PresenceProvider({ userId, fullName, children }: { userId: string; fullName: string; children: ReactNode }) {
  const value = usePresenceChannel(userId, fullName);
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

// For components inside PresenceProvider (client dashboard)
export function usePresenceContext(): PresenceValue {
  return useContext(PresenceContext);
}

// Standalone hook for admin (not wrapped in PresenceProvider)
export function usePresence(userId: string, fullName: string): PresenceValue {
  return usePresenceChannel(userId, fullName);
}
