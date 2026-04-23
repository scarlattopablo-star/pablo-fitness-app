"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame, Plus, Loader2, Check, X, Trash2, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  ACTIVITY_PRESETS,
  estimateKcal,
  INTENSITY_LABELS,
  type ActivityIntensity,
  getActivityById,
} from "@/lib/extra-activity-calc";

interface ExtraActivityRow {
  id: string;
  date: string;
  activity_type: string;
  label: string;
  duration_min: number;
  intensity: ActivityIntensity;
  kcal_burned: number;
}

interface Props {
  userId: string;
  weightKg?: number | null;
  // Cuando se registra una actividad, el padre puede refrescar stats.
  onLogged?: () => void;
}

// Registro rapido de actividades fuera del plan (correr, futbol, kitesurf, etc.).
// Suma XP via gamification_events, NO modifica target_calories del plan.
// Se muestra en el dashboard como card compacta expandible.
export default function ExtraActivityLogger({ userId, weightKg, onLogged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [activityId, setActivityId] = useState<string>("correr");
  const [duration, setDuration] = useState<number>(30);
  const [intensity, setIntensity] = useState<ActivityIntensity>("media");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [todayRows, setTodayRows] = useState<ExtraActivityRow[]>([]);

  const preset = useMemo(() => getActivityById(activityId), [activityId]);
  const kcalPreview = useMemo(
    () => estimateKcal({ activityId, durationMin: duration, intensity, weightKg }),
    [activityId, duration, intensity, weightKg]
  );

  // Sync preset default minutes al cambiar de actividad.
  useEffect(() => {
    setDuration(preset.defaultMinutes);
  }, [preset]);

  const loadToday = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("extra_activities")
      .select("id, date, activity_type, label, duration_min, intensity, kcal_burned")
      .eq("user_id", userId)
      .eq("date", today)
      .order("created_at", { ascending: false });
    setTodayRows((data as ExtraActivityRow[]) ?? []);
  };

  useEffect(() => {
    loadToday();

  }, [userId]);

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setToast("");
    try {
      const { error } = await supabase.from("extra_activities").insert({
        user_id: userId,
        date: new Date().toISOString().split("T")[0],
        activity_type: preset.id,
        label: preset.label,
        duration_min: duration,
        intensity,
        kcal_burned: kcalPreview,
        notes: notes.trim() || null,
      });
      if (error) throw error;

      // Suma XP — 10 base + 5 si duracion >= 45min + 5 si intensidad alta.
      const xp = 10 + (duration >= 45 ? 5 : 0) + (intensity === "alta" ? 5 : 0);
      await supabase.from("gamification_events").insert({
        user_id: userId,
        event_type: "extra_activity",
        xp_earned: xp,
        metadata: { activity_type: preset.id, duration_min: duration, intensity, kcal: kcalPreview },
      });

      setToast(`✓ Registrado: ${kcalPreview} kcal · +${xp} XP`);
      setNotes("");
      await loadToday();
      onLogged?.();
      setTimeout(() => setToast(""), 3000);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Borrar esta actividad?")) return;
    await supabase.from("extra_activities").delete().eq("id", id);
    await loadToday();
  };

  const totalKcalHoy = todayRows.reduce((sum, r) => sum + r.kcal_burned, 0);

  return (
    <div className="card-premium rounded-2xl p-4 mb-6 border border-card-border/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Actividad extra</h3>
            <p className="text-[11px] text-muted">
              {todayRows.length > 0
                ? `${todayRows.length} registro${todayRows.length === 1 ? "" : "s"} hoy · ${totalKcalHoy} kcal`
                : "Sumá lo que hiciste por fuera del plan"}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-card-bg hover:bg-accent/10 flex items-center justify-center transition-colors">
          {expanded ? <X className="h-4 w-4 text-muted" /> : <Plus className="h-4 w-4 text-accent" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 animate-fade-in-up">
          {/* Preset picker */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-2">Actividad</label>
            <div className="grid grid-cols-4 gap-2">
              {ACTIVITY_PRESETS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivityId(a.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    activityId === a.id
                      ? "border-accent bg-accent/10"
                      : "border-card-border hover:border-muted"
                  }`}
                >
                  <div className="text-2xl mb-0.5">{a.emoji}</div>
                  <div className="text-[10px] font-semibold">{a.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Duration slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Duracion</label>
              <span className="text-sm font-bold text-accent">{duration} min</span>
            </div>
            <input
              type="range"
              min={5}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          {/* Intensity */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-2">Intensidad</label>
            <div className="grid grid-cols-3 gap-2">
              {(["baja", "media", "alta"] as ActivityIntensity[]).map((i) => (
                <button
                  key={i}
                  onClick={() => setIntensity(i)}
                  className={`py-2 rounded-lg border text-xs font-semibold transition-all ${
                    intensity === i
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-card-border hover:border-muted text-muted"
                  }`}
                >
                  {INTENSITY_LABELS[i]}
                </button>
              ))}
            </div>
          </div>

          {/* Notas opcionales */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted block mb-2">Nota (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={100}
              placeholder="Ej: corri con Juan en la rambla"
              className="w-full bg-card-bg border border-card-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {/* Preview */}
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted uppercase tracking-wider">Quemaras aprox</p>
              <p className="text-2xl font-black text-accent flex items-center gap-1.5">
                <Flame className="h-5 w-5" /> {kcalPreview} kcal
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted uppercase tracking-wider">XP</p>
              <p className="text-sm font-bold text-amber-400 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5" />
                +{10 + (duration >= 45 ? 5 : 0) + (intensity === "alta" ? 5 : 0)}
              </p>
            </div>
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="w-full btn-shimmer flex items-center justify-center gap-2 py-3 rounded-xl font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {saving ? "Guardando..." : "Registrar actividad"}
          </button>

          {toast && (
            <p className="text-xs text-center text-accent bg-accent/10 py-2 rounded-lg">{toast}</p>
          )}
        </div>
      )}

      {/* Hoy */}
      {todayRows.length > 0 && (
        <div className="mt-4 pt-4 border-t border-card-border/40 space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted mb-2">Hoy</p>
          {todayRows.map((r) => (
            <div key={r.id} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-card-bg/50">
              <span className="text-lg">{getActivityById(r.activity_type).emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {r.label} <span className="text-muted font-normal">· {r.duration_min} min · {INTENSITY_LABELS[r.intensity]}</span>
                </p>
                <p className="text-[10px] text-orange-400 font-bold">{r.kcal_burned} kcal</p>
              </div>
              <button
                onClick={() => remove(r.id)}
                className="w-7 h-7 rounded-full hover:bg-red-500/10 flex items-center justify-center text-muted hover:text-red-400 transition-colors"
                aria-label="Borrar"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
