"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Phone, Eye, Mail, MessageCircle, Dumbbell, TrendingUp } from "lucide-react";
import { PLANS } from "@/lib/plans-data";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";
import { getExerciseById } from "@/lib/exercises-data";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Vista de SOLO LECTURA del cliente para el entrenador suplente (contacto, datos y entrenamiento; sin dieta).
export default function EntrenadorClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"training" | "progress">("training");

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
  const survey = data.survey || {};
  const days: any[] = data.trainingPlan?.data?.days || [];
  const progress: any[] = data.progress || [];
  const latestWeightEntry = progress.find((p) => p.weight != null);
  const currentWeight = latestWeightEntry?.weight ?? survey.weight;

  // Evolucion de fuerza: primer vs ultimo peso maximo registrado por ejercicio
  const strength = (() => {
    const byEx = new Map<string, { name: string; first: number; last: number; lastDate: string; sessions: number }>();
    const logs: any[] = [...(data.logs || [])].reverse(); // del mas viejo al mas nuevo
    for (const log of logs) {
      const sets = (log.sets_data || []) as { weight: number; reps: number }[];
      if (!sets.length) continue;
      const max = Math.max(...sets.map((s) => Number(s.weight) || 0));
      if (!max) continue;
      const prev = byEx.get(log.exercise_id);
      if (!prev) byEx.set(log.exercise_id, { name: log.exercise_name || log.exercise_id, first: max, last: max, lastDate: log.date, sessions: 1 });
      else byEx.set(log.exercise_id, { ...prev, last: max, lastDate: log.date, sessions: prev.sessions + 1 });
    }
    return [...byEx.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  })();
  const phoneDigits = String(client.phone || "").replace(/[^0-9]/g, "");
  const objectiveName = PLANS.find((p) => p.slug === survey.objective)?.name
    || (survey.objective === "direct-client" ? "Personalizado" : survey.objective);
  const stats: { label: string; value: string }[] = [
    currentWeight ? { label: "Peso", value: `${currentWeight} kg` } : null,
    survey.height ? { label: "Altura", value: `${survey.height} cm` } : null,
    survey.age ? { label: "Edad", value: `${survey.age} años` } : null,
    survey.sex ? { label: "Sexo", value: survey.sex === "mujer" ? "Mujer" : "Hombre" } : null,
    survey.training_days ? { label: "Dias/semana", value: String(survey.training_days) } : null,
    survey.activity_level ? { label: "Actividad", value: survey.activity_level } : null,
  ].filter(Boolean) as { label: string; value: string }[];
  const pathologies: string[] = Array.isArray(survey.pathologies) ? survey.pathologies.filter(Boolean) : [];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <Link href="/entrenador" className="text-muted hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black truncate flex-1">{client.full_name || "Cliente"}</h1>
      </div>

      {/* Contacto */}
      <div className="glass-card rounded-2xl p-4 mb-4 space-y-2">
        {client.email && (
          <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm hover:text-primary">
            <Mail className="h-4 w-4 text-muted" /> {client.email}
          </a>
        )}
        {client.phone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted" />
            <a href={`tel:${client.phone}`} className="hover:text-primary">{client.phone}</a>
            {phoneDigits && (
              <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full hover:bg-emerald-500/20">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            )}
          </div>
        )}
        {!client.email && !client.phone && <p className="text-xs text-muted">Sin datos de contacto</p>}
      </div>

      {/* Datos fisicos */}
      {(stats.length > 0 || objectiveName) && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          {objectiveName && (
            <p className="text-xs text-muted mb-3">Objetivo: <span className="text-white font-semibold">{objectiveName}</span>
              {survey.emphasis ? <span> · enfasis {survey.emphasis}</span> : null}
            </p>
          )}
          <div className="grid grid-cols-3 gap-2">
            {stats.map((st) => (
              <div key={st.label} className="bg-white/[0.03] rounded-xl p-2 text-center">
                <p className="text-sm font-bold">{st.value}</p>
                <p className="text-[10px] text-muted uppercase tracking-wide">{st.label}</p>
              </div>
            ))}
          </div>
          {latestWeightEntry?.date && (
            <p className="text-[10px] text-muted mt-2">Ultimo peso registrado: {new Date(latestWeightEntry.date + "T12:00:00").toLocaleDateString("es")}</p>
          )}
          {pathologies.length > 0 && (
            <div className="mt-3 bg-warning/5 border border-warning/20 rounded-xl p-3">
              <p className="text-[11px] font-bold text-warning mb-1">A tener en cuenta</p>
              <p className="text-xs text-muted">{pathologies.join(", ")}</p>
            </div>
          )}
        </div>
      )}

      <Link href={`/entrenador/${clientId}/entrenar`}
        className="w-full flex items-center justify-center gap-2 gradient-primary text-black font-bold py-3 rounded-xl mb-4 hover:opacity-90">
        <Play className="h-4 w-4" /> Entrenar a {client.full_name?.split(" ")[0] || "cliente"}
      </Link>

      <p className="text-[11px] text-muted mb-4 flex items-center gap-1.5">
        <Eye className="h-3.5 w-3.5" /> Solo lectura: el plan lo edita Pablo.
      </p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("training")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${tab === "training" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted"}`}>
          <Dumbbell className="h-4 w-4" /> Entrenamiento
        </button>
        <button onClick={() => setTab("progress")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold ${tab === "progress" ? "bg-primary/15 text-primary" : "bg-white/5 text-muted"}`}>
          <TrendingUp className="h-4 w-4" /> Progreso
        </button>
      </div>

      {tab === "progress" ? (
        <div className="space-y-4">
          {/* Fuerza */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h3 className="font-bold text-sm">Evolucion de cargas</h3>
              <p className="text-[11px] text-muted">Peso maximo: primera vez → ultima vez</p>
            </div>
            {strength.length === 0 ? (
              <p className="p-4 text-xs text-muted">Todavia no hay sesiones registradas</p>
            ) : (
              <div className="divide-y divide-card-border/50">
                {strength.map((ex) => {
                  const diff = ex.last - ex.first;
                  return (
                    <div key={ex.name} className="p-3 px-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{ex.name}</p>
                        <p className="text-[11px] text-muted">
                          {ex.sessions} {ex.sessions === 1 ? "sesion" : "sesiones"} · ultima {new Date(ex.lastDate).toLocaleDateString("es")}
                        </p>
                      </div>
                      <p className="text-xs text-muted whitespace-nowrap">{ex.first} → <span className="text-white font-bold">{ex.last} kg</span></p>
                      {diff !== 0 && (
                        <span className={`text-[11px] font-bold whitespace-nowrap ${diff > 0 ? "text-primary" : "text-danger"}`}>
                          {diff > 0 ? "+" : ""}{diff} kg
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Peso y medidas */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-card-border">
              <h3 className="font-bold text-sm">Peso y medidas</h3>
            </div>
            {progress.length === 0 ? (
              <p className="p-4 text-xs text-muted">Sin registros de progreso</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-muted border-b border-card-border">
                      <th className="text-left p-3 font-medium">Fecha</th>
                      <th className="text-right p-3 font-medium">Peso</th>
                      <th className="text-right p-3 font-medium">Pecho</th>
                      <th className="text-right p-3 font-medium">Cintura</th>
                      <th className="text-right p-3 font-medium">Cadera</th>
                      <th className="text-right p-3 font-medium">Brazo</th>
                      <th className="text-right p-3 font-medium">Pierna</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.map((p, i) => (
                      <tr key={i} className="border-b border-card-border/40 last:border-0">
                        <td className="p-3 whitespace-nowrap">{new Date(p.date + "T12:00:00").toLocaleDateString("es")}</td>
                        <td className="p-3 text-right font-semibold">{p.weight ?? "-"}</td>
                        <td className="p-3 text-right text-muted">{p.chest ?? "-"}</td>
                        <td className="p-3 text-right text-muted">{p.waist ?? "-"}</td>
                        <td className="p-3 text-right text-muted">{p.hips ?? "-"}</td>
                        <td className="p-3 text-right text-muted">{p.arms ?? "-"}</td>
                        <td className="p-3 text-right text-muted">{p.legs ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : days.length === 0 ? (
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
        )}
    </div>
  );
}
