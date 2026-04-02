"use client";

import { useState, useEffect } from "react";
import {
  Dumbbell, Plus, X, Check, Loader2, TrendingUp,
  ChevronDown, ChevronUp, Save,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { SubscriptionExpiredBanner } from "@/components/subscription-expired";
import { EXERCISES } from "@/lib/exercises-data";
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface SetData {
  set: number;
  weight: number;
  reps: number;
}

interface ExerciseLog {
  id: string;
  exercise_id: string;
  exercise_name: string;
  date: string;
  sets_data: SetData[];
  notes: string | null;
}

export default function EntrenamientoPage() {
  const { user, isExpired } = useAuth();
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Form state
  const [selectedExercise, setSelectedExercise] = useState("");
  const [sets, setSets] = useState<SetData[]>([
    { set: 1, weight: 0, reps: 10 },
    { set: 2, weight: 0, reps: 10 },
    { set: 3, weight: 0, reps: 10 },
    { set: 4, weight: 0, reps: 10 },
  ]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (user) loadLogs();
  }, [user]);

  const loadLogs = async () => {
    if (!user) return;
    try {
      setLoadError(false);
      const { data, error } = await supabase
        .from("exercise_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (data) setLogs(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !selectedExercise) return;
    setSaving(true);

    const exercise = EXERCISES.find(e => e.id === selectedExercise);
    const validSets = sets.filter(s => s.weight > 0);

    if (validSets.length === 0) { setSaving(false); return; }

    await supabase.from("exercise_logs").insert({
      user_id: user.id,
      exercise_id: selectedExercise,
      exercise_name: exercise?.name || selectedExercise,
      sets_data: validSets,
      notes: notes || null,
    });

    setSaved(true);
    setTimeout(() => {
      setShowForm(false);
      setSaved(false);
      setSelectedExercise("");
      setSets([
        { set: 1, weight: 0, reps: 10 },
        { set: 2, weight: 0, reps: 10 },
        { set: 3, weight: 0, reps: 10 },
        { set: 4, weight: 0, reps: 10 },
      ]);
      setNotes("");
      loadLogs();
    }, 1000);
    setSaving(false);
  };

  const updateSet = (index: number, field: "weight" | "reps", value: number) => {
    setSets(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const addSet = () => {
    setSets(prev => [...prev, { set: prev.length + 1, weight: prev[prev.length - 1]?.weight || 0, reps: 10 }]);
  };

  const removeSet = (index: number) => {
    if (sets.length <= 1) return;
    setSets(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, set: i + 1 })));
  };

  // Group logs by exercise for history view
  const exerciseHistory = logs.reduce((acc, log) => {
    if (!acc[log.exercise_id]) {
      acc[log.exercise_id] = { name: log.exercise_name, logs: [] };
    }
    acc[log.exercise_id].logs.push(log);
    return acc;
  }, {} as Record<string, { name: string; logs: ExerciseLog[] }>);

  // Get max weight for an exercise across all sessions
  const getMaxWeight = (exerciseLogs: ExerciseLog[]) => {
    let max = 0;
    exerciseLogs.forEach(log => {
      log.sets_data.forEach(s => { if (s.weight > max) max = s.weight; });
    });
    return max;
  };

  // Get latest weight for an exercise
  const getLatestWeight = (exerciseLogs: ExerciseLog[]) => {
    if (exerciseLogs.length === 0) return 0;
    const latest = exerciseLogs[0].sets_data;
    return latest.length > 0 ? Math.max(...latest.map(s => s.weight)) : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isExpired) return <SubscriptionExpiredBanner />;

  if (loadError) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center mt-10">
        <p className="text-danger font-bold mb-2">Error al cargar datos</p>
        <p className="text-sm text-muted mb-4">Verifica tu conexion e intenta de nuevo.</p>
        <button onClick={() => { setLoading(true); loadLogs(); }} className="gradient-primary text-black font-bold px-5 py-2 rounded-full text-sm">Reintentar</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">Mis Pesos</h1>
          <p className="text-muted text-sm">Registra los pesos de cada ejercicio</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="gradient-primary text-black font-semibold text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Registrar
        </button>
      </div>

      {/* Exercise History */}
      {Object.keys(exerciseHistory).length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Dumbbell className="h-10 w-10 text-muted mx-auto mb-3" />
          <p className="font-bold">Sin registros todavia</p>
          <p className="text-sm text-muted mt-1">Registra los pesos de tu entrenamiento para ver tu evolucion.</p>
          <button onClick={() => setShowForm(true)} className="text-primary text-sm font-semibold mt-3 hover:underline">
            Registrar mi primer ejercicio
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(exerciseHistory).map(([exId, data]) => (
            <div key={exId} className="glass-card rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedExercise(expandedExercise === exId ? null : exId)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{data.name}</p>
                    <p className="text-xs text-muted">{data.logs.length} sesiones</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{getLatestWeight(data.logs)}kg</p>
                    <p className="text-[10px] text-muted">Max: {getMaxWeight(data.logs)}kg</p>
                  </div>
                  {expandedExercise === exId ? <ChevronUp className="h-4 w-4 text-muted" /> : <ChevronDown className="h-4 w-4 text-muted" />}
                </div>
              </button>

              {expandedExercise === exId && (
                <div className="px-4 pb-4 border-t border-card-border/30">
                  {/* Weight evolution mini chart */}
                  {data.logs.length > 1 && (() => {
                    const chartData = [...data.logs].reverse().slice(-10).map(log => ({
                      date: new Date(log.date).toLocaleDateString("es", { day: "2-digit", month: "short" }),
                      peso: Math.max(...log.sets_data.map((s: SetData) => s.weight)),
                    }));
                    return (
                      <div className="mt-3 mb-3">
                        <ResponsiveContainer width="100%" height={80}>
                          <BarChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#888" }} />
                            <Tooltip
                              contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }}
                              formatter={(value) => [`${value} kg`, "Peso"]}
                            />
                            <Bar dataKey="peso" fill="#00f593" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}

                  {/* Session details */}
                  <div className="space-y-2">
                    {data.logs.slice(0, 5).map(log => (
                      <div key={log.id} className="bg-card-bg rounded-lg p-3">
                        <p className="text-xs text-muted mb-1">
                          {new Date(log.date).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {log.sets_data.map((s, i) => (
                            <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              S{s.set}: {s.weight}kg x{s.reps}
                            </span>
                          ))}
                        </div>
                        {log.notes && <p className="text-xs text-muted mt-1">{log.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Exercise Log Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80" onClick={() => setShowForm(false)}>
          <div className="glass-card rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Registrar Ejercicio</h3>
              <button onClick={() => setShowForm(false)} className="text-muted hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Exercise selector */}
              <div>
                <label className="block text-sm font-medium mb-2">Ejercicio</label>
                <select
                  value={selectedExercise}
                  onChange={e => setSelectedExercise(e.target.value)}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
                >
                  <option value="">Seleccionar ejercicio...</option>
                  {EXERCISES.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              {/* Sets */}
              {selectedExercise && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Series</label>
                    <div className="space-y-2">
                      {sets.map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-muted w-6">S{s.set}</span>
                          <div className="flex-1">
                            <input
                              type="number"
                              value={s.weight || ""}
                              onChange={e => updateSet(i, "weight", Number(e.target.value))}
                              placeholder="Peso (kg)"
                              className="w-full bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <span className="text-xs text-muted">x</span>
                          <div className="w-16">
                            <input
                              type="number"
                              value={s.reps}
                              onChange={e => updateSet(i, "reps", Number(e.target.value))}
                              className="w-full bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                            />
                          </div>
                          <button onClick={() => removeSet(i)} className="text-muted hover:text-danger">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button onClick={addSet} className="text-primary text-xs font-semibold mt-2 hover:underline flex items-center gap-1">
                      <Plus className="h-3 w-3" /> Agregar serie
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Notas (opcional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Ej: Subi peso, buena forma..."
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    onClick={handleSave}
                    disabled={saving || !selectedExercise || sets.every(s => s.weight === 0)}
                    className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saved ? (<><Check className="h-5 w-5" /> Guardado!</>) :
                     saving ? (<><Loader2 className="h-5 w-5 animate-spin" /> Guardando...</>) :
                     (<><Save className="h-5 w-5" /> Guardar Ejercicio</>)}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
