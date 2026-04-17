"use client";

import { useEffect, useState } from "react";
import { Users, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FeedItem {
  userId: string;
  userFirstName: string;
  achievementId: string;
  achievementName: string;
  achievementIcon: string;
  achievementDescription: string;
  xpReward: number;
  earnedAt: string;
  isMe: boolean;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

export function CommunityFeed({ limit = 15 }: { limit?: number }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const res = await fetch(`/api/gamification/feed?limit=${limit}&days=14`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const data = await res.json();
        setItems(data.feed || []);
      } catch {
        setItems([]);
      }
      setLoading(false);
    };
    load();
  }, [limit]);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-4">
        <div className="h-3 w-24 bg-card-border/50 rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {[0, 1, 2].map(i => <div key={i} className="h-10 bg-card-bg rounded-lg animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-5 text-center">
        <Users className="h-6 w-6 text-muted mx-auto mb-2" />
        <p className="text-sm text-muted">Aun no hay logros en la comunidad</p>
        <p className="text-[10px] text-muted mt-1">Se el primero en romper un PR esta semana</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary" />
          Logros de la comunidad
        </h3>
        <span className="text-[10px] text-muted">Ultimos 14 dias</span>
      </div>

      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li
            key={`${it.userId}-${it.achievementId}-${i}`}
            className={`flex items-center gap-3 p-2.5 rounded-lg ${
              it.isMe ? "bg-primary/10 border border-primary/20" : "hover:bg-card-bg/50"
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-card-bg flex items-center justify-center text-lg shrink-0">
              {it.achievementIcon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug">
                <span className="font-bold">{it.isMe ? "Vos" : it.userFirstName}</span>
                <span className="text-muted"> desbloqueo </span>
                <span className="font-semibold">{it.achievementName}</span>
              </p>
              <p className="text-[10px] text-muted flex items-center gap-2">
                <span>{relativeTime(it.earnedAt)}</span>
                {it.xpReward > 0 && <span className="text-amber-400 font-semibold">+{it.xpReward}XP</span>}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
