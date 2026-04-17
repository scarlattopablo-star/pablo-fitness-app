"use client";

import { useState, useEffect } from "react";
import { Trophy, Flame, Zap, Medal, Star, Crown, Target, Award, Share2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getLevelForXp, LEVELS } from "@/lib/gamification";
import { CommunityFeed } from "@/components/community-feed";
import { RankingShareModal } from "@/components/ranking-share-modal";

interface RankingEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  xp: number;
  sessions?: number;
  level?: number;
  levelName?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: string;
  earned: boolean;
  earned_at?: string;
}

interface GamificationData {
  xp: number;
  level: number;
  levelName: string;
  progress: number;
  xpToNext: number;
  nextLevel: { level: number; name: string; minXp: number } | null;
  streak: number;
  maxStreak: number;
  allAchievements: Achievement[];
}

const RANK_ICONS = [Crown, Medal, Award];
const RANK_COLORS = ["text-yellow-400", "text-gray-300", "text-orange-400"];

export default function RankingPage() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<"weekly" | "alltime">("weekly");
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankRes, gamRes] = await Promise.all([
        fetch(`/api/gamification/leaderboard?type=${tab}`).then(r => r.json()),
        user ? fetch(`/api/gamification?userId=${user.id}`).then(r => r.json()) : null,
      ]);
      setRankings(rankRes.rankings || []);
      if (gamRes) setGamification(gamRes);
    } catch {}
    setLoading(false);
  };

  const myRank = rankings.find(r => r.userId === user?.id);

  return (
    <div className="p-4 sm:p-6 max-w-2xl">
      {/* Header with user stats */}
      {gamification && (
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-black font-black text-xl">
              {gamification.level}
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{gamification.levelName}</p>
              <p className="text-xs text-muted">{gamification.xp} XP total</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-orange-400">
                <Flame className="h-5 w-5" />
                <span className="font-black text-lg">{gamification.streak}</span>
              </div>
              <p className="text-[10px] text-muted">racha</p>
            </div>
          </div>

          {/* XP Progress bar */}
          {gamification.nextLevel && (
            <div>
              <div className="flex justify-between text-[10px] text-muted mb-1">
                <span>Nivel {gamification.level}</span>
                <span>{gamification.xpToNext} XP para nivel {gamification.nextLevel.level}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-card-border overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(gamification.progress * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Share my ranking CTA */}
      {gamification && myRank && (
        <button
          onClick={() => setShareOpen(true)}
          className="w-full mb-6 glass-card rounded-2xl p-3 flex items-center justify-between hover:border-primary/30 border border-transparent transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Share2 className="h-4 w-4 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">Compartir mi puesto</p>
              <p className="text-[10px] text-muted">Genera imagen para IG Stories</p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary">#{myRank.rank}</span>
        </button>
      )}

      {gamification && myRank && profile && (
        <RankingShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          userName={profile.full_name || "Atleta"}
          rank={myRank.rank}
          totalUsers={rankings.length}
          level={gamification.level}
          levelName={gamification.levelName}
          xp={gamification.xp}
          streak={gamification.streak}
          weekXp={myRank.xp}
        />
      )}

      {/* Community achievements feed */}
      <div className="mb-6">
        <CommunityFeed limit={10} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("weekly")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === "weekly" ? "gradient-primary text-black" : "glass-card text-muted"
          }`}
        >
          <Zap className="h-4 w-4" /> Semanal
        </button>
        <button
          onClick={() => setTab("alltime")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
            tab === "alltime" ? "gradient-primary text-black" : "glass-card text-muted"
          }`}
        >
          <Trophy className="h-4 w-4" /> General
        </button>
      </div>

      {/* My position */}
      {myRank && (
        <div className="glass-card rounded-xl p-3 mb-4 border border-primary/30">
          <div className="flex items-center gap-3">
            <span className="text-primary font-black text-lg w-8 text-center">#{myRank.rank}</span>
            <div className="flex-1">
              <p className="font-bold text-sm">Tu posicion</p>
              <p className="text-xs text-muted">{myRank.xp} XP{myRank.sessions ? ` · ${myRank.sessions} sesiones` : ""}</p>
            </div>
            <Star className="h-5 w-5 text-primary" />
          </div>
        </div>
      )}

      {/* Rankings list */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted text-sm">Cargando ranking...</div>
        ) : rankings.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="font-bold mb-1">Sin ranking aun</p>
            <p className="text-sm text-muted">Entrena para aparecer en el ranking!</p>
          </div>
        ) : (
          <div className="divide-y divide-card-border">
            {rankings.map((entry) => {
              const isMe = entry.userId === user?.id;
              const RankIcon = entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : null;
              const rankColor = entry.rank <= 3 ? RANK_COLORS[entry.rank - 1] : "text-muted";

              return (
                <div
                  key={entry.userId}
                  className={`flex items-center gap-3 px-4 py-3 ${isMe ? "bg-primary/5" : ""}`}
                >
                  {/* Rank */}
                  <div className="w-8 text-center">
                    {RankIcon ? (
                      <RankIcon className={`h-5 w-5 mx-auto ${rankColor}`} />
                    ) : (
                      <span className="text-sm font-bold text-muted">{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {entry.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>

                  {/* Name + stats */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm truncate ${isMe ? "text-primary" : ""}`}>
                      {isMe ? "Vos" : entry.name}
                    </p>
                    <p className="text-xs text-muted">
                      {tab === "weekly"
                        ? `${entry.sessions || 0} sesiones esta semana`
                        : `Nivel ${entry.level}: ${entry.levelName}`}
                    </p>
                  </div>

                  {/* XP */}
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">{entry.xp}</p>
                    <p className="text-[10px] text-muted">XP</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Achievements section */}
      {gamification && gamification.allAchievements.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> Logros
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {gamification.allAchievements.map((a) => (
              <div
                key={a.id}
                className={`glass-card rounded-xl p-3 text-center transition-all ${
                  a.earned ? "" : "opacity-30 grayscale"
                }`}
              >
                <span className="text-2xl block mb-1">{a.icon}</span>
                <p className="text-[10px] font-bold truncate">{a.name}</p>
                <p className="text-[9px] text-primary">+{a.xp_reward} XP</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
