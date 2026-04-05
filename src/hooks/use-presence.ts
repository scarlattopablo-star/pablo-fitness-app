"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  user_id: string;
  full_name: string;
  online_at: string;
}

export function usePresence(userId: string, fullName: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [channelRef, setChannelRef] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

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

    setChannelRef(channel);

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      setChannelRef(null);
    };
  }, [userId, fullName]);

  const isUserOnline = useCallback(
    (id: string) => onlineUsers.some((u) => u.user_id === id),
    [onlineUsers]
  );

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isUserOnline,
  };
}
