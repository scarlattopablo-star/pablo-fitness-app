"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceUser {
  user_id: string;
  full_name: string;
  online_at: string;
}

interface UsePresenceOptions {
  channelName: string;
  userId: string;
  fullName: string;
}

export function usePresence({ channelName, userId, fullName }: UsePresenceOptions) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = new Map<string, PresenceUser>();

        // Deduplicate by user_id (multiple tabs = multiple entries)
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

    channelRef.current = channel;

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, userId, fullName]);

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
  };
}
