"use client";

// Nutrition v2 — F5: ruta de check-in semanal del cliente
//
// Flujo:
//   1. Carga GET /api/checkin → si daysSinceLast<7 muestra "ya hiciste tu check-in
//      esta semana, vuelve en X dias".
//   2. Si puede check-in: form con peso, medidas (opcional), 4 sliders
//      (energia/hambre/rendimiento/adherencia) y notas.
//   3. POST /api/checkin → guarda + genera sugerencia. Se muestra al cliente
//      un mensaje "Tu coach va a revisar y ajustar el plan si corresponde".

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, ScaleIcon, Smile, Frown, Activity, Target } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

type Status = "loading" | "ready" | "tooSoon" | "submitting" | "done" | "error";

export default function CheckInPage() {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const [daysSinceLast, setDaysSinceLast] = useState<number | null>(null);
  const [nextWeekNumber, setNextWeekNumber] = useState(1);

  // Form state
  const [weight, setWeight] = useState("");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [legs, setLegs] = useState("");
  const [energy, setEnergy] = useState(3);
  const [hunger, setHunger] = useState(3);
  const [performance, setPerformance] = useState(3);
  const [adherence, setAdherence] = useState(80);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          setStatus("error");
          setError("Sesion expirada. Recarga la pagina.");
          return;
        }
        const res = await fetch("/api/checkin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setError(data.error || "Error cargando check-in");
          return;
        }
        setNextWeekNumber(data.nextWeekNumber || 1);
        setDaysSinceLast(data.daysSinceLast);
        setStatus(data.canCheckIn ? "ready" : "tooSoon");
      } catch {
        setStatus("error");
        setError("Error de red");
      }
    })();
  }, [authLoading, user]);

  const handleSubmit = async () => {
    if (!user) return;
    setStatus("submitting");
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error("Sesion expirada");

      const measurements: Record<string, number> = {};
      if (chest) measurements.chest = Number(chest);
      if (waist) measurements.waist = Number(waist);
      if (hips) measurements.hips = Number(hips);
      if (arms) measurements.arms = Number(arms);
      if (legs) measurements.legs = Number(legs);

      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          weight: weight ? Number(weight) : undefined,
          measurements: Object.keys(measurements).length > 0 ? measurements : undefined,
          energy,
          hunger,
          performance,
          adherence_pct: adherence,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error guardando check-in");
      setStatus("done");
    } catch (e) {
      setStatus("ready");
      setError(e instanceof Error ? e.message : "Error desconocido");
    }
  };

  if (authLoading || status === "loading") {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      <Link href="/dashboard" className="flex items-center gap-2 text-muted hover:text-white mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Volver al dashboard
      </Link>

      <h1 className="text-2xl font-black mb-2">Check-in Semanal</h1>
      <p className="text-muted mb-6 text-sm">
        Tus datos ayudan a Pablo a ajustar tu plan para que sigas avanzando hacia tu objetivo.
      </p>

      {status === "tooSoon" && (
        <div className="glass-card rounded-2xl p-6 text-center">
          <Check className="h-10 w-10 text-success mx-auto mb-3" />
          <h2 className="font-bold text-lg mb-2">Ya hiciste tu check-in esta semana</h2>
          <p className="text-muted text-sm mb-4">
            Hace {daysSinceLast} dias que cargaste tus datos. Volve dentro de {7 - (daysSinceLast ?? 0)} dias.
          </p>
          <Link href="/dashboard/plan" className="text-primary hover:underline text-sm">
            Ver mi plan
          </Link>
        </div>
      )}

      {status === "done" && (
        <div className="glass-card rounded-2xl p-6 text-center border-l-4 border-success">
          <Check className="h-10 w-10 text-success mx-auto mb-3" />
          <h2 className="font-bold text-lg mb-2">Check-in guardado</h2>
          <p className="text-muted text-sm mb-4">
            Tu plan se ajusto automaticamente a partir de tus datos. Si hubo cambios,
            ya estan reflejados en tus calorias, macros y comidas.
          </p>
          <Link href="/dashboard/plan" className="inline-block gradient-primary text-black font-bold py-3 px-6 rounded-xl">
            Ver mi plan actualizado
          </Link>
        </div>
      )}

      {status === "error" && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-danger mb-4">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {(status === "ready" || status === "submitting") && (
        <div className="space-y-5">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ScaleIcon className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Peso (kg)</h3>
            </div>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 78.5"
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <h3 className="font-bold">Medidas (opcional, en cm)</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Pecho",   value: chest, setter: setChest },
                { label: "Cintura", value: waist, setter: setWaist },
                { label: "Cadera",  value: hips,  setter: setHips },
                { label: "Brazo",   value: arms,  setter: setArms },
                { label: "Pierna",  value: legs,  setter: setLegs },
              ].map(m => (
                <div key={m.label}>
                  <label className="text-xs text-muted">{m.label}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={m.value}
                    onChange={(e) => m.setter(e.target.value)}
                    placeholder="cm"
                    className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-primary text-sm"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold mb-4">¿Como te sentiste esta semana?</h3>
            {([
              { label: "Energia",     value: energy,      setter: setEnergy,      icon: Activity, low: "Muy baja", high: "Muy alta" },
              { label: "Hambre",      value: hunger,      setter: setHunger,      icon: Frown,    low: "Saciado",  high: "Mucha hambre" },
              { label: "Rendimiento", value: performance, setter: setPerformance, icon: Smile,    low: "Muy bajo", high: "Excelente" },
            ] as const).map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="mb-4 last:mb-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted" />
                      <span className="font-medium text-sm">{s.label}</span>
                    </div>
                    <span className="text-primary font-bold">{s.value}/5</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={s.value}
                    onChange={(e) => s.setter(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted/70 mt-1">
                    <span>{s.low}</span>
                    <span>{s.high}</span>
                  </div>
                </div>
              );
            })}

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-sm">Adherencia al plan</span>
                <span className="text-primary font-bold">{adherence}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={adherence}
                onChange={(e) => setAdherence(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted/70 mt-1">
                <span>No segui el plan</span>
                <span>Lo segui al 100%</span>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <label className="font-bold block mb-2">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Algo que quieras contarle a Pablo? Eventos sociales, cambios de rutina, dudas..."
              rows={3}
              maxLength={500}
              className="w-full bg-card-bg border border-card-border rounded-xl px-3 py-2 focus:outline-none focus:border-primary text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={status === "submitting" || (!weight && !notes)}
            className="w-full gradient-primary text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {status === "submitting" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
            {status === "submitting" ? "Enviando..." : `Enviar check-in semana ${nextWeekNumber}`}
          </button>

          <p className="text-xs text-muted text-center">
            Tu plan se ajusta automaticamente a partir de tus datos. Si hay cambios,
            quedan reflejados al instante.
          </p>
        </div>
      )}
    </div>
  );
}
