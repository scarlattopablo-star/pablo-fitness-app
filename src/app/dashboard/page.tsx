"use client";

import Link from "next/link";
import {
  Flame, TrendingUp, ClipboardList, Camera, Dumbbell,
  ArrowRight, Calendar, Target, Scale, UtensilsCrossed,
  TrendingDown, Loader2,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { useAuth } from "@/lib/auth-context";
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

interface ProgressEntry {
  weight: number | null;
  date: string;
}

const MOTIVATIONS = [
  "El dolor que sientes hoy sera la fuerza que sientes manana.",
  "No cuentes los dias, haz que los dias cuenten.",
  "Tu cuerpo puede soportar casi todo. Es tu mente la que tienes que convencer.",
  "El exito no se mide por lo que logras, sino por los obstaculos que superas.",
  "Cada repeticion te acerca mas a tu mejor version.",
  "La disciplina es el puente entre tus metas y tus logros.",
  "No te detengas cuando estes cansado, detenete cuando hayas terminado.",
];

export default function DashboardPage() {
  const { user, profile, subscription } = useAuth();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysActive, setDaysActive] = useState(0);
  const [currentWeight, setCurrentWeight] = useState<number | null>(null);
  const [weightLost, setWeightLost] = useState<number | null>(null);
  const [daysSinceProgress, setDaysSinceProgress] = useState(999);

  const motivation = MOTIVATIONS[new Date().getDate() % MOTIVATIONS.length];

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      const { data: surveyData } = await supabase
        .from("surveys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (surveyData) {
        setSurvey(surveyData);
        const start = new Date(surveyData.created_at);
        const now = new Date();
        setDaysActive(Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        cacheData("dashboard", { survey: surveyData });
      }

      const { data: progressEntries } = await supabase
        .from("progress_entries")
        .select("weight, date, created_at")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1);

      if (progressEntries && progressEntries.length > 0 && progressEntries[0].weight) {
        setCurrentWeight(progressEntries[0].weight);
        if (surveyData?.weight) {
          setWeightLost(Number((surveyData.weight - progressEntries[0].weight).toFixed(1)));
        }
        const lastDate = new Date(progressEntries[0].date || progressEntries[0].created_at);
        setDaysSinceProgress(Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
      } else {
        if (surveyData?.weight) setCurrentWeight(surveyData.weight);
        setDaysSinceProgress(999);
      }
    } catch {
      // Offline fallback
      const cached = getCachedData<{ survey: SurveyData }>("dashboard");
      if (cached?.survey) {
        setSurvey(cached.survey);
        if (cached.survey.weight) setCurrentWeight(cached.survey.weight);
      }
    }

    setLoading(false);
  };

  const displayName = profile?.full_name?.split(" ")[0] || user?.user_metadata?.full_name?.split(" ")[0] || "Cliente";

  // Calculate plan progress percentage
  const planProgress = subscription
    ? Math.min(100, Math.round((daysActive / Math.max(1, Math.floor((new Date(subscription.end_date).getTime() - new Date(subscription.start_date).getTime()) / (1000 * 60 * 60 * 24)))) * 100))
    : Math.min(100, Math.round((daysActive / 90) * 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background image - grayscale, blurred, faded */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.07]"
          style={{
            backgroundImage: "url(/images/gym-bg.png)",
            filter: "grayscale(100%) blur(2px)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
      </div>

      <OfflineBanner />
      {/* HERO HEADER */}
      <div className="relative rounded-2xl overflow-hidden mb-6 p-6 sm:p-8" style={{ background: "linear-gradient(135deg, #0f1a0f 0%, #0a0a0a 50%, #0a1a0a 100%)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <p className="text-xs font-bold text-primary tracking-widest mb-1">BIENVENIDO DE VUELTA</p>
        <h1 className="text-2xl sm:text-3xl font-black mb-1">Hola, {displayName}</h1>
        <p className="text-muted text-sm">Tu transformacion esta en marcha</p>
        <div className="mt-4 p-3 bg-primary/5 border border-primary/15 rounded-xl">
          <p className="text-sm text-primary/80 italic">&ldquo;{motivation}&rdquo; &mdash; Pablo Scarlatto</p>
        </div>
      </div>

      {/* PROGRESS BAR */}
      {daysActive > 0 && (
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Dia {daysActive} de tu plan
            </span>
            <span className="text-xs font-bold text-primary">{planProgress}% completado</span>
          </div>
          <div className="h-2 bg-card-border rounded-full overflow-hidden">
            <div className="h-full gradient-primary rounded-full transition-all duration-1000" style={{ width: `${planProgress}%` }} />
          </div>
        </div>
      )}

      {/* ALERT: Update progress */}
      {daysSinceProgress >= 20 && (
        <div className="rounded-2xl p-4 mb-6 flex items-center gap-3 border border-warning/25" style={{ background: "linear-gradient(135deg, rgba(245,158,11,.08), rgba(245,158,11,.03))" }}>
          <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center shrink-0">
            <Camera className="h-5 w-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-warning">Hora de actualizar tu progreso</p>
            <p className="text-xs text-muted">
              {daysSinceProgress >= 999
                ? "Aun no registraste tu primer progreso."
                : `Hace ${daysSinceProgress} dias que no actualizas.`}
              {" "}Subi fotos, peso y medidas.
            </p>
          </div>
          <Link href="/dashboard/progreso" className="bg-warning/15 text-warning text-xs font-semibold px-4 py-2 rounded-lg shrink-0 hover:bg-warning/25 transition-colors">
            Actualizar
          </Link>
        </div>
      )}

      {/* MACROS */}
      {survey ? (
        <>
          <h2 className="font-bold flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Tus Macros Diarios
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="glass-card rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
              <Flame className="h-6 w-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-black text-primary">{survey.target_calories.toLocaleString()}</p>
              <p className="text-[10px] text-muted font-medium">CALORIAS / DIA</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
              <Target className="h-6 w-6 text-red-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-red-400">{survey.protein}<span className="text-base">g</span></p>
              <p className="text-[10px] text-muted font-medium">PROTEINAS</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-yellow-500" />
              <UtensilsCrossed className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-yellow-400">{survey.carbs}<span className="text-base">g</span></p>
              <p className="text-[10px] text-muted font-medium">CARBOHIDRATOS</p>
            </div>
            <div className="glass-card rounded-2xl p-4 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
              <Scale className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-blue-400">{survey.fats}<span className="text-base">g</span></p>
              <p className="text-[10px] text-muted font-medium">GRASAS</p>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <Dumbbell className="h-8 w-8 text-primary mx-auto mb-2" />
          <p className="font-bold">Tu entrenador esta preparando tu plan</p>
          <p className="text-sm text-muted mt-1">Pronto veras tus macros y tu plan personalizado aca.</p>
        </div>
      )}

      {/* STATS */}
      <h2 className="font-bold flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Tu Progreso
      </h2>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-xl font-black">{currentWeight || "-"} <span className="text-xs text-muted">kg</span></p>
          <p className="text-[10px] text-muted">Peso Actual</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className={`text-xl font-black ${weightLost && weightLost > 0 ? "text-primary" : ""}`}>
            {weightLost !== null ? `${weightLost > 0 ? "-" : "+"}${Math.abs(weightLost)}` : "-"} <span className="text-xs text-muted">kg</span>
          </p>
          <p className="text-[10px] text-muted">Total Perdido</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center">
          <p className="text-xl font-black">{daysActive}</p>
          <p className="text-[10px] text-muted">Dias Activo</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <h2 className="font-bold flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Acciones Rapidas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <Link href="/dashboard/plan?v=entrenamiento" className="glass-card rounded-2xl p-5 hover-glow transition-all group">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <p className="font-bold group-hover:text-primary transition-colors">Mi Plan de Entrenamiento</p>
          <p className="text-xs text-muted mt-1">Tu rutina personalizada</p>
        </Link>
        <Link href="/dashboard/plan?v=nutricion" className="glass-card rounded-2xl p-5 hover-glow transition-all group">
          <div className="w-11 h-11 rounded-xl bg-warning/10 flex items-center justify-center mb-3">
            <UtensilsCrossed className="h-6 w-6 text-warning" />
          </div>
          <p className="font-bold group-hover:text-primary transition-colors">Mi Plan de Nutricion</p>
          <p className="text-xs text-muted mt-1">Tus comidas y macros del dia</p>
        </Link>
        <Link href="/dashboard/progreso" className="glass-card rounded-2xl p-5 hover-glow transition-all group">
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3">
            <Camera className="h-6 w-6 text-blue-400" />
          </div>
          <p className="font-bold group-hover:text-primary transition-colors">Registrar Progreso</p>
          <p className="text-xs text-muted mt-1">Subi fotos, peso y medidas</p>
        </Link>
      </div>

      {/* TRAINER */}
      <h2 className="font-bold flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Tu Entrenador
      </h2>
      <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shrink-0">
          <span className="text-xl font-black text-black">PS</span>
        </div>
        <div>
          <p className="font-bold">Pablo Scarlatto</p>
          <p className="text-xs text-muted">Entrenador Personal Certificado</p>
          <a
            href="https://instagram.com/pabloscarlattoentrenamientos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-1 hover:underline"
          >
            <InstagramIcon className="h-3 w-3" /> @pabloscarlattoentrenamientos
          </a>
        </div>
      </div>
    </div>
  );
}
