"use client";

import Link from "next/link";
import {
  Flame, TrendingUp, ClipboardList, Camera,
  ArrowRight, Calendar, Target, AlertCircle, Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface SurveyData {
  target_calories: number;
  protein: number;
  carbs: number;
  fats: number;
  weight: number;
  created_at: string;
}

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysActive, setDaysActive] = useState(0);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Load survey data (macros)
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
    }

    setLoading(false);
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Cliente";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black">Hola, {displayName}</h1>
        <p className="text-muted">Tu resumen de progreso</p>
      </div>

      {/* Macros */}
      {survey ? (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold">Tus Macros Personalizados</p>
                <p className="text-sm text-muted">Calculados para tu objetivo</p>
              </div>
            </div>
            <Link href="/dashboard/plan" className="text-primary text-sm hover:underline flex items-center gap-1">
              Ver plan <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card-bg rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Calorías/día</p>
              <p className="text-xl font-black text-primary">{survey.target_calories}</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Proteínas</p>
              <p className="text-xl font-black text-red-400">{survey.protein}g</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Carbos</p>
              <p className="text-xl font-black text-yellow-400">{survey.carbs}g</p>
            </div>
            <div className="bg-card-bg rounded-xl p-3 text-center">
              <p className="text-xs text-muted">Grasas</p>
              <p className="text-xl font-black text-blue-400">{survey.fats}g</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <p className="text-muted">Tu entrenador está preparando tu plan personalizado.</p>
          <p className="text-sm text-muted mt-1">Pronto verás tus macros y tu plan acá.</p>
        </div>
      )}

      {/* Photo + Weight Reminder - every 20 days */}
      {daysActive > 0 && daysActive % 20 < 3 && (
        <div className="glass-card rounded-2xl p-5 mb-6 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <Camera className="h-6 w-6 text-primary shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">¡Es momento de registrar tu progreso!</p>
              <p className="text-sm text-muted mt-1">
                Llevás {daysActive} días de entrenamiento. Para ver cómo avanzás:
              </p>
              <ul className="text-sm text-muted mt-2 space-y-1">
                <li>&#8226; Subí 3 fotos nuevas (frente, perfil y espalda)</li>
                <li>&#8226; Registrá tu peso actual</li>
                <li>&#8226; Anotá tus medidas (pecho, cintura, cadera, brazos)</li>
              </ul>
              <p className="text-xs text-muted mt-2">Todos los campos son opcionales, completá lo que puedas.</p>
              <Link
                href="/dashboard/progreso"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-3 font-medium"
              >
                Registrar progreso ahora <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-5">
          <Calendar className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{daysActive}</p>
          <p className="text-xs text-muted">Días activo</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <Target className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{survey?.weight || "-"}kg</p>
          <p className="text-xs text-muted">Peso inicial</p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <TrendingUp className="h-5 w-5 text-primary mb-2" />
          <p className="text-2xl font-black">{survey?.target_calories || "-"}</p>
          <p className="text-xs text-muted">Calorías diarias</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="font-bold text-lg mb-4">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/plan" className="glass-card rounded-2xl p-5 hover-glow transition-all group">
          <ClipboardList className="h-6 w-6 text-primary mb-3" />
          <p className="font-bold group-hover:text-primary transition-colors">Ver Mi Plan</p>
          <p className="text-sm text-muted">Entrenamiento y nutrición</p>
        </Link>
        <Link href="/dashboard/progreso" className="glass-card rounded-2xl p-5 hover-glow transition-all group">
          <Camera className="h-6 w-6 text-primary mb-3" />
          <p className="font-bold group-hover:text-primary transition-colors">Registrar Progreso</p>
          <p className="text-sm text-muted">Subir fotos y peso</p>
        </Link>
        <Link href="/dashboard/ejercicios" className="glass-card rounded-2xl p-5 hover-glow transition-all group">
          <Target className="h-6 w-6 text-primary mb-3" />
          <p className="font-bold group-hover:text-primary transition-colors">Ejercicios</p>
          <p className="text-sm text-muted">Videos y técnica correcta</p>
        </Link>
      </div>
    </div>
  );
}
