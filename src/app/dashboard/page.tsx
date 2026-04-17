"use client";

import Link from "next/link";
import {
  Flame, TrendingUp, Camera, Dumbbell,
  ArrowRight, Calendar, Target, Scale, UtensilsCrossed,
  Loader2, ChevronRight, Zap, CreditCard, Crown,
  Trophy, Star, Lightbulb,
} from "lucide-react";
import { getTodaysTip, CATEGORY_LABELS } from "@/lib/daily-tips";
import { getWeeklyChallenges, getDaysRemaining } from "@/lib/weekly-challenges";
import { RatLoader } from "@/components/rat-loader";
import { InstagramIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { getPhotoUrl } from "@/lib/upload-photo";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { OfflineBanner } from "@/components/offline-banner";
import { cacheData, getCachedData } from "@/lib/offline-cache";
import MuscleHeatmap from "@/components/muscle-heatmap";
import { Goal7dCard } from "@/components/goal-7d-card";
import { MonthlyChallengeCard } from "@/components/monthly-challenge-card";
import { EXERCISES } from "@/lib/exercises-data";

interface SurveyData {
  target_calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight: number;
  created_at: string;
}

interface GamificationData {
  xp: number;
  level: number;
  levelName: string;
  progress: number;
  streak: number;
  lastAchievement: { name: string; icon: string } | null;
  weekSessions: number;
  weekXp: number;
  weekRank: number | null;
}

const DAILY_MESSAGES = [
  "Los resultados se construyen dia a dia",
  "Cada entrenamiento te acerca a tu mejor version",
  "La disciplina supera a la motivacion",
  "Tu cuerpo puede, tu mente debe creerlo",
  "Hoy es un gran dia para superar tus limites",
  "El dolor de hoy es la fuerza de manana",
  "No busques excusas, busca resultados",
  "La constancia es la clave del exito",
  "Entrena como si no hubiera manana",
  "Cada gota de sudor cuenta",
  "Tu unico rival sos vos de ayer",
  "El progreso no es lineal, pero es progreso",
  "Confia en el proceso",
  "Hoy entrenas, manana agradeces",
  "Un dia mas cerca de tu objetivo",
  "La mejor inversion es en tu salud",
  "No pares hasta sentirte orgulloso",
  "El gimnasio nunca te falla",
  "Vos elegis si hoy cuenta o no",
  "Hacelo por vos, por tu mejor version",
];

export default function DashboardPage() {
  const { user, profile, subscription, isTrial, trialDaysLeft, hasActiveSubscription } = useAuth();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysActive, setDaysActive] = useState(0);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [weightLost, setWeightLost] = useState<number | null>(null);
  const [daysSinceProgress, setDaysSinceProgress] = useState(999);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [isDirectClient, setIsDirectClient] = useState(false);
  const [gamification, setGamification] = useState<GamificationData | null>(null);
  const [trainedMuscles, setTrainedMuscles] = useState<Record<string, number>>({});

  // Deterministic daily message
  const dailyMessage = (() => {
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    return DAILY_MESSAGES[Math.abs(hash) % DAILY_MESSAGES.length];
  })();

  useEffect(() => {
    if (user) loadData();
    if (profile?.avatar_url) {
      getPhotoUrl(profile.avatar_url).then(url => { if (url) setAvatarUrl(url); });
    }
    if (user) loadGamification();
    if (user) loadWeeklyMuscles();
  }, [user, profile]);

  const loadGamification = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/gamification?userId=${user.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const lastAchievement = data.earnedAchievements?.length
        ? data.earnedAchievements[data.earnedAchievements.length - 1]
        : null;
      setGamification({
        xp: data.xp || 0,
        level: data.level || 1,
        levelName: data.levelName || "Novato",
        progress: data.progress || 0,
        streak: data.streak || 0,
        lastAchievement: lastAchievement ? { name: lastAchievement.name, icon: lastAchievement.icon } : null,
        weekSessions: data.ranking?.sessions_count || 0,
        weekXp: data.ranking?.xp_earned || 0,
        weekRank: data.rankPosition || null,
      });
    } catch { /* silently fail */ }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      // Check if direct client (QR)
      const { data: qrCode } = await supabase
        .from("free_access_codes")
        .select("id")
        .eq("used_by", user.id)
        .eq("plan_slug", "direct-client")
        .limit(1)
        .maybeSingle();
      if (qrCode) setIsDirectClient(true);

      const [surveyRes, progressRes] = await Promise.all([
        supabase.from("surveys").select("*").eq("user_id", user.id)
          .order("created_at", { ascending: false }).limit(1).single(),
        supabase.from("progress_entries").select("weight, date, created_at")
          .eq("user_id", user.id).order("date", { ascending: false }).limit(1),
      ]);

      const surveyData = surveyRes.data;
      if (surveyData) {
        setSurvey(surveyData);
        setDaysActive(Math.floor((Date.now() - new Date(surveyData.created_at).getTime()) / 86400000));
        cacheData("dashboard", { survey: surveyData });
      }

      const progressEntries = progressRes.data;
      if (progressEntries?.length && progressEntries[0].weight) {
        setCurrentWeight(progressEntries[0].weight);
        if (surveyData?.weight) setWeightLost(Number((surveyData.weight - progressEntries[0].weight).toFixed(1)));
        setDaysSinceProgress(Math.floor((Date.now() - new Date(progressEntries[0].date || progressEntries[0].created_at).getTime()) / 86400000));
      } else {
        if (surveyData?.weight) setCurrentWeight(surveyData.weight);
        setDaysSinceProgress(999);
      }
    } catch {
      const cached = getCachedData<{ survey: SurveyData }>("dashboard");
      if (cached?.survey) { setSurvey(cached.survey); if (cached.survey.weight) setCurrentWeight(cached.survey.weight); }
    }
    setLoading(false);
  };

  const loadWeeklyMuscles = async () => {
    if (!user) return;
    try {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split("T")[0];

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("exercise_id")
        .eq("user_id", user.id)
        .gte("created_at", weekStart);

      if (logs && logs.length > 0) {
        const muscleMap: Record<string, number> = {};
        const exerciseMap = new Map(EXERCISES.map(e => [e.id, e.muscleGroup]));
        for (const log of logs) {
          const group = exerciseMap.get(log.exercise_id);
          if (group) muscleMap[group] = (muscleMap[group] || 0) + 1;
        }
        setTrainedMuscles(muscleMap);
      }
    } catch { /* silently fail */ }
  };

  const displayName = profile?.full_name?.split(" ")[0] || "Cliente";
  const planProgress = subscription
    ? Math.min(100, Math.round((daysActive / Math.max(1, Math.floor((new Date(subscription.end_date).getTime() - new Date(subscription.start_date).getTime()) / 86400000))) * 100))
    : Math.min(100, Math.round((daysActive / 90) * 100));

  // Time-based greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos dias" : hour < 19 ? "Buenas tardes" : "Buenas noches";

  const handleActivatePlan = async (duration: string, price: number) => {
    if (!user || !profile) return;
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: "Plan Personalizado",
          planSlug: "plan-personalizado",
          duration,
          price,
          email: profile.email || user.email,
          name: profile.full_name || "Cliente",
          userId: user.id,
        }),
      });
      const data = await response.json();
      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch {
      // silently fail
    }
    setCheckoutLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><RatLoader size={64} /></div>;

  return (
    <div>
      <OfflineBanner />

      {/* HERO — clean, no background image */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-primary font-semibold uppercase tracking-widest mb-1">{greeting}</p>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">{displayName}</h1>
            <p className="text-xs text-muted italic mt-1">{dailyMessage}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <span className="text-xl font-black text-black">{displayName.charAt(0)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {daysActive > 0 && (
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-muted">Dia {daysActive}</span>
              <span className="text-xs font-bold text-primary">{planProgress}%</span>
            </div>
            <div className="h-1.5 bg-card-border/50 rounded-full overflow-hidden">
              <div className="h-full gradient-primary rounded-full transition-all duration-1000" style={{ width: `${planProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* 7-day goal from onboarding */}
      {user && <Goal7dCard userId={user.id} />}

      {/* Monthly group challenge */}
      <MonthlyChallengeCard />

      {/* GAMIFICATION WIDGET */}
      {gamification && (
        <Link href="/dashboard/ranking" className="block mb-6 group">
          <div className="grid grid-cols-3 gap-2">
            {/* Streak */}
            <div className="card-premium rounded-2xl p-3 text-center group-hover:border-primary/20 transition-colors">
              <div className="text-2xl mb-1">{gamification.streak > 0 ? "🔥" : "💤"}</div>
              <p className="text-lg font-black text-primary">{gamification.streak}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider">{gamification.streak === 1 ? "Dia" : "Dias"} racha</p>
            </div>
            {/* Level */}
            <div className="card-premium rounded-2xl p-3 text-center group-hover:border-primary/20 transition-colors">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-lg font-black">{gamification.levelName}</p>
              <div className="mt-1 h-1 bg-card-border/50 rounded-full overflow-hidden">
                <div className="h-full gradient-primary rounded-full" style={{ width: `${Math.round(gamification.progress * 100)}%` }} />
              </div>
              <p className="text-[10px] text-muted mt-1">{gamification.xp} XP</p>
            </div>
            {/* Last Achievement */}
            <div className="card-premium rounded-2xl p-3 text-center group-hover:border-primary/20 transition-colors">
              <div className="text-2xl mb-1">{gamification.lastAchievement?.icon || "🏆"}</div>
              <p className="text-xs font-bold truncate">{gamification.lastAchievement?.name || "Sin logros"}</p>
              <p className="text-[10px] text-muted uppercase tracking-wider mt-1">Ultimo logro</p>
            </div>
          </div>
        </Link>
      )}

      {/* WEEKLY SUMMARY */}
      {gamification && gamification.weekSessions > 0 && (
        <div className="card-premium rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Tu Semana</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-xl font-black text-primary">{gamification.weekSessions}</p>
              <p className="text-[10px] text-muted">{gamification.weekSessions === 1 ? "Sesion" : "Sesiones"}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-amber-400">+{gamification.weekXp}</p>
              <p className="text-[10px] text-muted">XP ganado</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black">{gamification.weekRank ? `#${gamification.weekRank}` : "-"}</p>
              <p className="text-[10px] text-muted">Ranking</p>
            </div>
          </div>
        </div>
      )}

      {/* WEEKLY CHALLENGES */}
      {gamification && (() => {
        const challenges = getWeeklyChallenges();
        const daysLeft = getDaysRemaining();
        return (
          <div className="card-premium rounded-2xl p-4 mb-6 border border-accent/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🏆</span>
                <h3 className="font-bold text-sm">Retos de la Semana</h3>
              </div>
              <span className="text-[10px] text-muted">{daysLeft} {daysLeft === 1 ? "dia" : "dias"} restantes</span>
            </div>
            <div className="space-y-2.5">
              {challenges.map(challenge => {
                // Calculate progress based on challenge type
                let current = 0;
                if (challenge.type === "sessions") current = gamification.weekSessions || 0;
                else if (challenge.type === "streak") current = gamification.streak || 0;
                else if (challenge.type === "chat_message") current = 0; // would need chat count
                const progress = Math.min(current / challenge.target, 1);
                const completed = progress >= 1;

                return (
                  <div key={challenge.id} className={`rounded-xl p-3 ${completed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-card-bg"}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{challenge.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{challenge.title}</p>
                          {completed && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500 text-black font-bold">Completado!</span>}
                        </div>
                        <p className="text-[10px] text-muted">{challenge.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-accent">+{challenge.xpReward} XP</p>
                        <p className="text-[10px] text-muted">{current}/{challenge.target}</p>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 rounded-full bg-background overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-emerald-500" : "bg-accent"}`} style={{ width: `${progress * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* TRIAL COUNTDOWN BANNER */}
      {isTrial && trialDaysLeft <= 7 && trialDaysLeft > 0 && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-4 border border-warning/30 bg-warning/5">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-warning">Tu prueba gratuita vence en {trialDaysLeft} {trialDaysLeft === 1 ? "dia" : "dias"}</p>
            <p className="text-xs text-muted">Activa tu plan para no perder tu progreso y rutinas.</p>
          </div>
        </div>
      )}

      {/* UPGRADE BANNER — only for non-direct users without active subscription */}
      {!hasActiveSubscription && !isDirectClient && (
        <div className="card-premium rounded-2xl p-5 mb-6 border border-primary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-sm">Activa tu plan personalizado</h3>
            </div>
            <p className="text-xs text-muted mb-4">
              Entreno + nutricion adaptado a tu cuerpo. Oferta de lanzamiento con 30% OFF.
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => handleActivatePlan("3-meses", 4700)}
                disabled={checkoutLoading}
                className="btn-shimmer rounded-xl py-3 px-3 text-center text-black font-bold text-xs"
              >
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (
                  <>
                    <span className="block text-base font-black">$4.700</span>
                    <span className="block text-[10px] font-normal opacity-80">3 meses · 30% OFF</span>
                    <span className="block text-[10px] line-through opacity-50">$6.720</span>
                  </>
                )}
              </button>
              <button
                onClick={() => handleActivatePlan("1-mes", 3200)}
                disabled={checkoutLoading}
                className="btn-outline-premium rounded-xl py-3 px-3 text-center text-xs"
              >
                {checkoutLoading ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : (
                  <>
                    <span className="block text-base font-black">$3.200</span>
                    <span className="block text-[10px] opacity-60">1 mes</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[10px] text-muted text-center">Pago seguro con MercadoPago · Precios en pesos uruguayos</p>
          </div>
        </div>
      )}

      {/* ALERT */}
      {daysSinceProgress >= 7 && (
        <Link href="/dashboard/progreso"
          className="card-premium rounded-2xl p-4 mb-6 flex items-center gap-4 border-warning/20 group block"
        >
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <Camera className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-warning">Actualiza tu progreso</p>
            <p className="text-xs text-muted">
              {daysSinceProgress >= 999 ? "Registra tu primer progreso" : `Hace ${daysSinceProgress} dias`}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-warning group-hover:translate-x-1 transition-transform" />
        </Link>
      )}

      {/* STATS — horizontal scorecard */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { value: currentWeight ? `${currentWeight}` : "-", unit: "kg", label: "Peso", icon: Scale, color: "text-foreground" },
          { value: weightLost !== null ? `${weightLost > 0 ? "-" : "+"}${Math.abs(weightLost)}` : "-", unit: "kg", label: "Cambio", icon: TrendingUp, color: weightLost && weightLost > 0 ? "text-primary" : "text-foreground" },
          { value: `${daysActive}`, unit: "", label: "Dias", icon: Calendar, color: "text-foreground" },
        ].map(({ value, unit, label, icon: Icon, color }) => (
          <div key={label} className="card-premium rounded-2xl p-4 text-center">
            <Icon className="h-4 w-4 text-muted mx-auto mb-2" />
            <p className={`text-2xl font-black ${color}`}>{value}<span className="text-xs text-muted font-normal ml-0.5">{unit}</span></p>
            <p className="text-[10px] text-muted uppercase tracking-wider mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* MACROS */}
      {survey ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted">Macros Diarios</h2>
            <Link href="/dashboard/plan?v=nutricion" className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline">
              Ver plan <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Calories — large */}
          <div className="card-premium rounded-2xl p-5 mb-3 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Flame className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-primary stat-glow">{survey.target_calories.toLocaleString()}</p>
              <p className="text-xs text-muted">calorias por dia</p>
            </div>
          </div>

          {/* P / C / F */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: survey.protein, label: "Proteinas", color: "#ef4444", bg: "rgba(239,68,68,0.08)" },
              { value: survey.carbs, label: "Carbos", color: "#eab308", bg: "rgba(234,179,8,0.08)" },
              { value: survey.fats, label: "Grasas", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
            ].map(({ value, label, color, bg }) => (
              <div key={label} className="card-premium rounded-2xl p-4 text-center">
                <p className="text-2xl font-black" style={{ color }}>{value}<span className="text-xs text-muted font-normal">g</span></p>
                <p className="text-[10px] text-muted uppercase tracking-wider mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card-premium rounded-2xl p-8 mb-8 text-center">
          <Dumbbell className="h-8 w-8 text-primary mx-auto mb-3" />
          <p className="font-bold">Tu entrenador esta preparando tu plan</p>
          <p className="text-sm text-muted mt-1">Pronto veras tus macros y plan personalizado.</p>
        </div>
      )}

      {/* DAILY TIP */}
      {(() => {
        const tip = getTodaysTip();
        const cat = CATEGORY_LABELS[tip.category];
        return (
          <div className="card-premium rounded-2xl p-4 mb-6 border border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Lightbulb className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-accent font-bold">Tip del dia</span>
                  <span className="text-[10px] text-muted">{cat.emoji} {cat.label}</span>
                </div>
                <p className="font-bold text-sm mb-1">{tip.title}</p>
                <p className="text-xs text-muted leading-relaxed">{tip.content}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MUSCLE HEATMAP */}
      {Object.values(trainedMuscles).some(v => v > 0) && (
        <MuscleHeatmap trainedMuscles={trainedMuscles} />
      )}

      {/* QUICK ACTIONS — full width buttons */}
      <div className="space-y-3 mb-8">
        {[
          { href: "/dashboard/plan?v=entrenamiento", icon: Dumbbell, title: "Entrenamiento", sub: "Tu rutina personalizada", color: "text-primary", bg: "bg-primary/10" },
          { href: "/dashboard/plan?v=nutricion", icon: UtensilsCrossed, title: "Nutricion", sub: "Tus comidas y macros", color: "text-amber-400", bg: "bg-amber-400/10" },
          { href: "/dashboard/progreso", icon: TrendingUp, title: "Mi Progreso", sub: "Peso, medidas y fotos", color: "text-blue-400", bg: "bg-blue-400/10" },
        ].map(({ href, icon: Icon, title, sub, color, bg }) => (
          <Link key={href} href={href} className="card-premium rounded-2xl p-4 flex items-center gap-4 group block">
            <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm group-hover:text-primary transition-colors">{title}</p>
              <p className="text-xs text-muted">{sub}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      {/* TRAINER — inline, subtle */}
      <div className="flex items-center gap-4 py-4 border-t border-card-border/50">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-card-bg shrink-0">
          <img src="/logo-pablo.jpg" alt="PS" className="w-full h-full object-contain" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold">Pablo Scarlatto</p>
          <p className="text-[10px] text-muted">Entrenador Personal</p>
        </div>
        <a href="https://instagram.com/pabloscarlattoentrenamientos" target="_blank" rel="noopener noreferrer"
          className="btn-outline-premium px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5">
          <InstagramIcon className="h-3.5 w-3.5" /> Seguir
        </a>
      </div>
    </div>
  );
}
