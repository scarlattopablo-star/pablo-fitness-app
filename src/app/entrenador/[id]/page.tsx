"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Apple, Play, Phone, Eye } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";
import { getExerciseById } from "@/lib/exercises-data";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Vista de SOLO LECTURA del cliente para el entrenador suplente.
export default function EntrenadorClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"training" | "nutrition">("training");

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`/api/trainer/client?clientId=${clientId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const body = await res.json();
        if (!res.ok) setError(body.error || "Error cargando cliente");
        else setData(body);
      } catch {
        setError("Error de conexion");
      }
      setLoading(false);
    })();
  }, [clientId]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><RatLoader size={64} /></div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6">
        <Link href="/entrenador" className="flex items-center gap-2 text-muted hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      </div>
    );
  }

  const client = data.client || {};
  const days: any[] = data.trainingPlan?.data?.days || [];
  const np = data.nutritionPlan?.data;
  const mealGroups: { title?: string; meals: any[]; notes?: string[] }[] = np?.gymDay
    ? [
        { title: "Dia de gimnasio", meals: np.gymDay.meals || [], notes: np.gymDay.importantNotes },
        { title: "Dia de kitesurf", meals: np.kitesurfDay?.meals || [], notes: np.kitesurfDay?.importantNotes },
      ]
    : [{ meals: np?.meals || [], notes: np?.importantNotes }];
  const hasNutrition = mealGroups.some((g) => g.meals.length > 0);

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/entrenador" className="text-muted hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black truncate">{client.full_name || "Cliente"}</h1>
          {client.phone && (
            <a href={`tel:${client.phone}`} className="text-xs text-muted inline-flex items-center gap-1">
              <Phone className="h-3 w-3" /> {client.phone}
            </a>
          )}
        </div>
      </div>

      <Link href={`/entrenador/${clientId}/entrenar`}
        className="w-full flex items-center justify-center gap-2 gradient-primary text-black font-bold py-3 rounded-xl mb-4 hover:opacity-90">
        <Play className="h-4 w-4" /> Entrenar a {client.full_name?.split(" ")[0] || "cliente"}
      </Link>

      <p className="text-[11px] text-muted mb-4 flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> Solo lectura: el plan y la dieta los edita Pablo.
      </p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("training")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${tab === "training" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted"}`}>
          <Dumbbell className="h-4 w-4" /> Entrenamiento
        </button>
        <button onClick={() => setTab("nutrition")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${tab === "nutrition" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted"}`}>
          <Apple className="h-4 w-4" /> Dieta
        </button>
      </div>

      {tab === "training" ? (
        days.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted">Este cliente no tiene plan de entrenamiento</div>
        ) : (
          <div className="space-y-4">
            {days.map((day, di) => (
              <div key={di} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-card-border">
                  <h3 className="font-bold">{day.day}</h3>
                  {day.instructions && <p className="text-xs text-muted mt-1">{day.instructions}</p>}
                </div>
                <div className="divide-y divide-card-border/50">
                  {(day.exercises || []).map((ex: any, ei: number) => {
                    const exId = ex.exerciseId || ex.id;
                    return (
                      <div key={ei} className="p-3 px-4">
                        <p className="text-sm font-medium">{ex.name || getExerciseById(exId)?.name || exId}</p>
                        <p className="text-xs text-muted">
                          {ex.sets} x {ex.reps}{ex.rest ? ` · descanso ${ex.rest}` : ""}
                        </p>
                        {ex.notes && <p className="text-xs text-muted/80 mt-0.5 italic">{ex.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      ) : !hasNutrition ? (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted">Este cliente no tiene plan de nutricion</div>
      ) : (
        <div className="space-y-6">
          {mealGroups.map((group, gi) => (
            <div key={gi} className="space-y-3">
              {group.title && <h2 className="font-bold text-sm text-accent">{group.title}</h2>}
              {group.meals.map((meal: any, mi: number) => (
                <div key={mi} className="glass-card rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-sm">{meal.name}</h3>
                    {meal.time && <span className="text-xs text-muted">{meal.time}</span>}
                  </div>
                  <ul className="text-xs text-muted space-y-1">
                    {(meal.foods || []).map((f: any, fi: number) => (
                      <li key={fi}>• {typeof f === "string" ? f : f?.name}</li>
                    ))}
                  </ul>
                  {(meal.approxCalories || meal.approxProtein) && (
                    <p className="text-[11px] text-muted mt-2">
                      {meal.approxCalories ? `${meal.approxCalories} kcal` : ""}
                      {meal.approxProtein ? ` · P ${meal.approxProtein}g` : ""}
                      {meal.approxCarbs ? ` · C ${meal.approxCarbs}g` : ""}
                      {meal.approxFats ? ` · G ${meal.approxFats}g` : ""}
                    </p>
                  )}
                </div>
              ))}
              {group.notes && group.notes.length > 0 && (
                <div className="glass-card rounded-2xl p-4 text-xs text-muted space-y-1">
                  {group.notes.map((n, ni) => <p key={ni}>• {n}</p>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
