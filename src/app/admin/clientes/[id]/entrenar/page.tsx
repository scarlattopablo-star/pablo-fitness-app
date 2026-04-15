"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Dumbbell, Check, Loader2, Save, Info, Play, X, Clock,
} from "lucide-react";
import RestTimer from "@/components/rest-timer";
import { getExerciseById } from "@/lib/exercises-data";
import { getExerciseGif } from "@/lib/exercise-images";
import { supabase } from "@/lib/supabase";
import { RatLoader } from "@/components/rat-loader";

interface TrainingExercise {
  id: string;
  name: string;
  sets: number | string;
  reps: string | number;
  rest: string;
  notes?: string;
}

interface TrainingDay {
  day: string;
  exercises: TrainingExercise[];
  instructions?: string;
  estimatedCalories?: number;
}

interface ExerciseLog {
  weight: number;
  reps: number;
  date: string;
  prevWeight?: number;
}

const CARDIO_IDS = ["hiit-cinta", "hiit-casa", "burpees", "jumping-jacks", "high-knees", "saltar-cuerda"];

export default function AdminEntrenarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = use(params);
  const [clientName, setClientName] = useState("");
  const [trainingPlan, setTrainingPlan] = useState<TrainingDay[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<Record<string, { set: number; weight: number; reps: number; completed: boolean }[]>>({});
  const [savingSession, setSavingSession] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);
  const [restTimer, setRestTimer] = useState<{ exerciseId: string; seconds: number } | null>(null);
  const [expandedGif, setExpandedGif] = useState<{ src: string; name: string } | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("No hay sesion de admin");
        setLoading(false);
        return;
      }

      // Load client profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", clientId)
        .single();
      if (profile) setClientName(profile.full_name || "Cliente");

      // Load training plan via admin API
      const res = await fetch(`/api/admin/client-plans?clientId=${clientId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const { trainingPlan: tp } = await res.json();
        if (tp?.data?.days?.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setTrainingPlan(tp.data.days.map((d: any) => ({
            ...d,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            exercises: (d.exercises || []).map((ex: any) => ({
              ...ex,
              id: ex.exerciseId || ex.id,
              name: ex.name || getExerciseById(ex.exerciseId || ex.id)?.name || ex.id,
            })),
          })));
        }
      }

      // Load client exercise logs
      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("exercise_id, sets_data, date")
        .eq("user_id", clientId)
        .order("date", { ascending: false });

      if (logs) {
        const latest: Record<string, ExerciseLog> = {};
        logs.forEach((log: { exercise_id: string; sets_data: { weight: number; reps: number }[]; date: string }) => {
          if (!log.sets_data?.length) return;
          const maxSet = log.sets_data.reduce(
            (best, s) => s.weight > best.weight ? s : best,
            log.sets_data[0]
          );
          if (!latest[log.exercise_id]) {
            latest[log.exercise_id] = { weight: maxSet.weight, reps: maxSet.reps, date: log.date };
          } else if (!latest[log.exercise_id].prevWeight) {
            latest[log.exercise_id].prevWeight = maxSet.weight;
          }
        });
        setExerciseLogs(latest);
      }
    } catch {
      setError("Error cargando datos del cliente");
    }
    setLoading(false);
  };

  // ── Session logic (mirrors client exactly) ──

  const startSession = (dayName: string, exercises: TrainingExercise[]) => {
    const data: Record<string, { set: number; weight: number; reps: number; completed: boolean }[]> = {};
    exercises.forEach(ex => {
      const numSets = parseInt(String(ex.sets)) || 4;
      const lastWeight = exerciseLogs[ex.id]?.weight || 0;
      const lastReps = exerciseLogs[ex.id]?.reps || parseInt(String(ex.reps)) || 10;
      data[ex.id] = Array.from({ length: numSets }, (_, i) => ({
        set: i + 1,
        weight: lastWeight,
        reps: lastReps,
        completed: false,
      }));
    });
    setSessionData(data);
    setActiveSession(dayName);
    setSessionSaved(false);
    setRestTimer(null);
  };

  const toggleSetComplete = (exId: string, setIdx: number, restTime: string) => {
    const current = sessionData[exId];
    if (!current) return;
    const wasCompleted = current[setIdx]?.completed;
    const updated = current.map((s, i) =>
      i === setIdx ? { ...s, completed: !s.completed } : s
    );
    setSessionData(prev => ({ ...prev, [exId]: updated }));

    if (!wasCompleted) {
      const allDone = updated.every(s => s.completed);
      if (!allDone) {
        let secs = 60;
        const cleaned = restTime.replace(/[^0-9mins]/g, "");
        if (cleaned.includes("min")) secs = (parseInt(cleaned) || 2) * 60;
        else secs = parseInt(cleaned) || 60;
        setRestTimer({ exerciseId: exId, seconds: secs });
      } else {
        setRestTimer(null);
      }
    }
  };

  const updateSessionSet = (exId: string, setIdx: number, field: "weight" | "reps", value: number) => {
    setSessionData(prev => ({
      ...prev,
      [exId]: prev[exId].map((s, i) => i === setIdx ? { ...s, [field]: value } : s),
    }));
  };

  const saveSession = async (exercises: { id: string; name: string }[]) => {
    setSavingSession(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Sesion expirada");
        setSavingSession(false);
        return;
      }

      const payload = exercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: (sessionData[ex.id] || []).filter(s => s.weight > 0),
      }));

      const res = await fetch("/api/admin/log-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ clientId, exercises: payload }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || "Error guardando sesion");
        setSavingSession(false);
        return;
      }

      // Update local exercise logs
      for (const ex of exercises) {
        const sets = sessionData[ex.id];
        if (!sets) continue;
        const validSets = sets.filter(s => s.weight > 0);
        if (validSets.length === 0) continue;
        const maxSet = validSets.reduce((best, s) => s.weight > best.weight ? s : best, validSets[0]);
        const prevWeight = exerciseLogs[ex.id]?.weight;
        setExerciseLogs(prev => ({
          ...prev,
          [ex.id]: { weight: maxSet.weight, reps: maxSet.reps, date: new Date().toISOString(), prevWeight },
        }));
      }

      setSavingSession(false);
      setSessionSaved(true);
      setTimeout(() => {
        setActiveSession(null);
        setSessionData({});
        setSessionSaved(false);
      }, 1500);
    } catch {
      setError("Error de conexion");
      setSavingSession(false);
    }
  };

  const exerciseDetail = selectedExercise ? getExerciseById(selectedExercise) : null;

  // ── Render ──

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RatLoader size={64} />
      </div>
    );
  }

  if (error && !trainingPlan.length) {
    return (
      <div className="p-6">
        <Link href={`/admin/clientes/${clientId}`} className="flex items-center gap-2 text-muted hover:text-white mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al cliente
        </Link>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/admin/clientes/${clientId}`} className="text-muted hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-black">Entrenar como {clientName}</h1>
          <p className="text-xs text-muted">Los datos se guardan en la cuenta del cliente</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
          <Dumbbell className="h-5 w-5 text-primary" />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError("")} className="text-red-400 hover:text-white"><X className="h-4 w-4" /></button>
        </div>
      )}

      {trainingPlan.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <Dumbbell className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="text-muted">Este cliente no tiene plan de entrenamiento</p>
          <Link href={`/admin/clientes/${clientId}/plan-editor`} className="text-primary text-sm font-bold mt-2 inline-block hover:underline">
            Crear plan de entrenamiento →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {trainingPlan.map((day) => {
            const isSession = activeSession === day.day;
            return (
              <div key={day.day} className="glass-card rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-card-border flex items-center justify-between">
                  <div>
                    <h3 className="font-bold">{day.day}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      {day.instructions && <p className="text-xs text-muted">{day.instructions}</p>}
                      {day.estimatedCalories && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ~{day.estimatedCalories} kcal
                        </span>
                      )}
                    </div>
                  </div>
                  {!isSession && !activeSession && (
                    <button
                      onClick={() => startSession(day.day, day.exercises)}
                      className="gradient-primary text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5"
                    >
                      <Play className="h-3.5 w-3.5" /> Iniciar sesion
                    </button>
                  )}
                </div>

                {/* ── Normal view: exercise list with last weight ── */}
                {!isSession && (
                  <div className="divide-y divide-card-border/30">
                    {day.exercises.map((ex, i) => {
                      const log = exerciseLogs[ex.id];
                      const weightDiff = log?.prevWeight != null ? log.weight - log.prevWeight : null;
                      const exGif = getExerciseGif(ex.id);
                      return (
                        <div key={i} className="p-3 flex items-center gap-3">
                          {exGif && (
                            <button onClick={() => setExpandedGif({ src: exGif, name: ex.name })} className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 hover:ring-2 hover:ring-primary/50 transition-all">
                              <img src={exGif} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                            </button>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{ex.name}</p>
                            <p className="text-xs text-muted">{ex.sets} series x {ex.reps} | Descanso: {ex.rest}</p>
                            {ex.notes && <p className="text-[10px] text-primary/70 italic mt-0.5">{ex.notes}</p>}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {log ? (
                              <div className="flex items-center gap-1.5">
                                {weightDiff !== null && weightDiff !== 0 && (
                                  <span className={`text-[10px] font-bold ${weightDiff > 0 ? "text-primary" : "text-red-400"}`}>
                                    {weightDiff > 0 ? "+" : ""}{weightDiff}kg
                                  </span>
                                )}
                                <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-bold">
                                  {log.weight}kg
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted">Sin registro</span>
                            )}
                            <button onClick={() => setSelectedExercise(ex.id)} className="text-primary">
                              <Info className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Session mode: weight/reps inputs, checkboxes, timer ── */}
                {isSession && (() => {
                  const allExercises = day.exercises;
                  const totalEx = allExercises.filter(e => !CARDIO_IDS.includes(e.id)).length;
                  const completedEx = allExercises.filter(e => {
                    const sets = sessionData[e.id];
                    return sets && sets.length > 0 && sets.every(s => s.completed);
                  }).length;
                  return (
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <p className="text-xs text-primary font-bold">SESION EN CURSO (ADMIN)</p>
                        </div>
                        <span className="text-[10px] text-muted">{completedEx}/{totalEx} ejercicios</span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 rounded-full bg-card-bg overflow-hidden mb-4">
                        <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500" style={{ width: `${totalEx > 0 ? (completedEx / totalEx) * 100 : 0}%` }} />
                      </div>
                      <div className="space-y-4">
                        {allExercises.map((ex, i) => {
                          const log = exerciseLogs[ex.id];
                          const sets = sessionData[ex.id] || [];
                          const isCardioEx = CARDIO_IDS.includes(ex.id);
                          const allSetsComplete = sets.length > 0 && sets.every(s => s.completed);
                          const completedSets = sets.filter(s => s.completed).length;
                          return (
                            <div key={i} className={`rounded-xl p-3 transition-colors ${allSetsComplete ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-card-bg"}`}>
                              <div className="flex items-center gap-3 mb-2">
                                {(() => { const gif = getExerciseGif(ex.id); return gif ? (
                                  <button onClick={() => setExpandedGif({ src: gif, name: ex.name })} className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/10 hover:ring-2 hover:ring-primary/50 transition-all">
                                    <img src={gif} alt={ex.name} className="w-full h-full object-cover" loading="lazy" />
                                  </button>
                                ) : null; })()}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-sm truncate">{ex.name}</p>
                                    {allSetsComplete && <Check className="h-4 w-4 text-emerald-400 shrink-0" />}
                                  </div>
                                  <p className="text-[10px] text-muted">
                                    {isCardioEx ? ex.reps : `${ex.sets}x${ex.reps} | ${ex.rest}`}
                                    {!isCardioEx && sets.length > 0 && ` — ${completedSets}/${sets.length} series`}
                                  </p>
                                  {ex.notes && <p className="text-[9px] text-primary/70 italic">{ex.notes}</p>}
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {!isCardioEx && log && (
                                    <span className="text-[10px] text-muted">Ant: {log.weight}kg</span>
                                  )}
                                  <button onClick={() => setSelectedExercise(ex.id)} className="text-primary">
                                    <Info className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                              {isCardioEx ? (
                                <div className="flex items-center gap-2 text-xs text-primary font-medium py-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>Sin peso — solo tiempo</span>
                                </div>
                              ) : (
                                <div className="space-y-1.5">
                                  {sets.map((s, si) => (
                                    <div key={si} className={`flex items-center gap-2 rounded-lg px-1 py-0.5 transition-colors ${s.completed ? "bg-emerald-500/5" : ""}`}>
                                      <button
                                        onClick={() => toggleSetComplete(ex.id, si, ex.rest)}
                                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${s.completed ? "bg-emerald-500 border-emerald-500" : "border-card-border hover:border-primary"}`}
                                      >
                                        {s.completed && <Check className="h-3 w-3 text-black" />}
                                      </button>
                                      <span className="text-[10px] text-muted w-4 shrink-0">S{s.set}</span>
                                      <input
                                        type="number"
                                        inputMode="decimal"
                                        value={s.weight || ""}
                                        onChange={e => updateSessionSet(ex.id, si, "weight", Number(e.target.value))}
                                        placeholder="kg"
                                        className={`flex-1 bg-background border border-card-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary ${s.completed ? "opacity-60" : ""}`}
                                      />
                                      <span className="text-[10px] text-muted">x</span>
                                      <input
                                        type="number"
                                        inputMode="numeric"
                                        value={s.reps || ""}
                                        onChange={e => updateSessionSet(ex.id, si, "reps", Number(e.target.value))}
                                        placeholder="reps"
                                        className={`w-14 bg-background border border-card-border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-primary ${s.completed ? "opacity-60" : ""}`}
                                      />
                                    </div>
                                  ))}
                                  {restTimer?.exerciseId === ex.id && (
                                    <RestTimer
                                      seconds={restTimer.seconds}
                                      onComplete={() => setRestTimer(null)}
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => saveSession(day.exercises.map(ex => ({ id: ex.id, name: ex.name })))}
                          disabled={savingSession}
                          className="flex-1 gradient-primary text-black font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {sessionSaved ? (
                            <><Check className="h-5 w-5" /> Sesion guardada!</>
                          ) : savingSession ? (
                            <><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>
                          ) : (
                            <><Save className="h-5 w-5" /> Guardar sesion</>
                          )}
                        </button>
                        <button
                          onClick={() => { setActiveSession(null); setSessionData({}); setRestTimer(null); }}
                          className="px-4 py-3 text-muted text-sm rounded-xl hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Exercise detail modal */}
      {selectedExercise && exerciseDetail && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end md:items-center justify-center" onClick={() => setSelectedExercise(null)}>
          <div className="bg-card-bg rounded-t-2xl md:rounded-2xl w-full max-w-md max-h-[70vh] overflow-y-auto p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{exerciseDetail.name}</h3>
              <button onClick={() => setSelectedExercise(null)} className="text-muted hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            {exerciseDetail.description && <p className="text-sm text-muted mb-3">{exerciseDetail.description}</p>}
            {exerciseDetail.steps && exerciseDetail.steps.length > 0 && (
              <div>
                <p className="text-xs font-bold text-primary mb-2">PASOS</p>
                <ol className="space-y-1.5">
                  {exerciseDetail.steps.map((step: string, i: number) => (
                    <li key={i} className="text-sm text-muted flex gap-2">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded GIF modal */}
      {expandedGif && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setExpandedGif(null)}>
          <div className="max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <p className="text-center font-bold mb-3">{expandedGif.name}</p>
            <img src={expandedGif.src} alt={expandedGif.name} className="w-full rounded-xl" />
            <button onClick={() => setExpandedGif(null)} className="mt-3 w-full text-center text-muted text-sm">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
