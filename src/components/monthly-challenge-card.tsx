"use client";

import { useEffect, useState } from "react";
import { Trophy, Gift, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Challenge {
  id: string;
  month: string;
  title: string;
  description: string;
  metric: string;
  target_value: number;
  prize: string | null;
}

interface LeaderEntry {
  rank: number;
  userId: string;
  name: string;
  progress: number;
  completed: boolean;
  isMe: boolean;
}

interface Data {
  challenge: Challenge | null;
  leaderboard: LeaderEntry[];
  myProgress: number;
  myRank: number | null;
  totalParticipants: number;
}

const METRIC_LABELS: Record<string, string> = {
  sessions: "sesiones",
  xp: "XP",
  streak: "dias de racha",
  volume: "kg de volumen",
};

export function MonthlyChallengeCard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const res = await fetch("/api/challenges/current", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        setData(await res.json());
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, []);

  if (loading || !data || !data.challenge) return null;

  const { challenge, leaderboard, myProgress, myRank, totalParticipants } = data;
  const pct = Math.min(100, Math.round((myProgress / challenge.target_value) * 100));
  const completed = myProgress >= challenge.target_value;
  const metricLabel = METRIC_LABELS[challenge.metric] || challenge.metric;

  return (
    <div className="rounded-2xl p-4 mb-6 border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-card-bg to-card-bg">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Reto del mes</p>
            <p className="font-bold text-sm leading-tight">{challenge.title}</p>
          </div>
        </div>
        {totalParticipants > 0 && (
          <span className="text-[10px] text-muted whitespace-nowrap">{totalParticipants} compiten</span>
        )}
      </div>

      <p className="text-xs text-muted mb-3">{challenge.description}</p>

      {challenge.prize && (
        <div className="flex items-center gap-2 text-xs mb-3 p-2 rounded-lg bg-black/30">
          <Gift className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold">Premio:</span>
          <span className="text-muted">{challenge.prize}</span>
        </div>
      )}

      {/* My progress */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-bold">
            Tu progreso: {myProgress}/{challenge.target_value} {metricLabel}
          </span>
          <span className={`text-[11px] font-bold ${completed ? "text-amber-400" : "text-muted"}`}>
            {completed ? "Cumplido!" : `${pct}%`}
          </span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {myRank != null && (
          <p className="text-[10px] text-muted mt-1">
            Vas #{myRank} de {totalParticipants}
          </p>
        )}
      </div>

      {/* Top 5 */}
      {leaderboard.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">Top 5</p>
          <ul className="space-y-1">
            {leaderboard.map(e => (
              <li
                key={e.userId}
                className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs ${
                  e.isMe ? "bg-amber-500/10 border border-amber-500/25" : ""
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`font-black w-5 ${e.rank === 1 ? "text-amber-400" : "text-muted"}`}>
                    #{e.rank}
                  </span>
                  <span className={e.isMe ? "font-bold" : ""}>{e.isMe ? "Vos" : e.name}</span>
                  {e.completed && <Check className="h-3 w-3 text-amber-400" />}
                </span>
                <span className="font-semibold">{e.progress}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
