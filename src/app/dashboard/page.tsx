"use client";

import Link from "next/link";
import {
  Flame, TrendingUp, Camera, Dumbbell,
  ArrowRight, Calendar, Target, Scale, UtensilsCrossed,
  Loader2, ChevronRight, Zap, CreditCard, Crown,
} from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { InstagramIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
import { getPhotoUrl } from "@/lib/upload-photo";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { OfflineBanner } from "@/components/offline-banner";
import { cacheData, getCachedData } from "@/lib/offline-cache";

interface SurveyData {
  target_calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight: number;
  created_at: string;
}

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

  useEffect(() => {
    if (user) loadData();
    if (profile?.avatar_url) {
      getPhotoUrl(profile.avatar_url).then(url => { if (url) setAvatarUrl(url); });
    }
  }, [user, profile]);

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
