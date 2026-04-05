"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dumbbell, Check, Camera, Upload,
  ArrowRight, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal } from "@/types";

const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentario: { label: "Sedentario", desc: "Trabajo de oficina, poco movimiento" },
  moderado: { label: "Moderado", desc: "Ejercicio ligero 1-3 días/semana" },
  activo: { label: "Activo", desc: "Ejercicio moderado 3-5 días/semana" },
  "muy-activo": { label: "Muy Activo", desc: "Ejercicio intenso 6-7 días/semana" },
};

const RESTRICTIONS = ["Ninguna", "Vegetariano", "Vegano", "Sin gluten (celíaco)", "Sin lactosa", "Sin frutos secos", "Diabetes", "Otra"];

export default function EncuestaDirectaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [step, setStep] = useState(1);
  const [detectedPlanSlug, setDetectedPlanSlug] = useState<PlanSlug>("direct-client" as PlanSlug);
  const [nutritionalGoal, setNutritionalGoal] = useState<NutritionalGoal | "">("");
  const needsGoal = PLANS_NEEDING_GOAL.includes(detectedPlanSlug);
  const totalSteps = needsGoal ? 6 : 5;

  // Survey fields
  const [sex, setSex] = useState<Sex | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [restrictions, setRestrictions] = useState<string[]>([]);

  // Training & schedule
  const [trainingDays, setTrainingDays] = useState("5");
  const [wakeHour, setWakeHour] = useState("7");
  const [sleepHour, setSleepHour] = useState("23");
  const [emphasis, setEmphasis] = useState("ninguno");

  // Body measurements (optional)
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [legs, setLegs] = useState("");

  // Photos
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.push("/login");
        return;
      }
      // Check if already has survey
      const { data: survey } = await supabase.from("surveys").select("id").eq("user_id", session.user.id).limit(1).single();
      if (survey) {
        router.push("/dashboard");
        return;
      }
      // Detect plan slug from subscription or free access code
      const { data: subData } = await supabase
        .from("subscriptions")
        .select("*, plans(slug)")
        .eq("user_id", session.user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (subData?.plans?.slug) {
        setDetectedPlanSlug(subData.plans.slug as PlanSlug);
      } else {
        const { data: codeData } = await supabase
          .from("free_access_codes")
          .select("plan_slug")
          .eq("used_by", session.user.id)
          .limit(1)
          .maybeSingle();
        if (codeData?.plan_slug) setDetectedPlanSlug(codeData.plan_slug as PlanSlug);
      }
      setUserId(session.user.id);
      setLoading(false);
    });
  }, [router]);

  const handleFinishSurvey = async () => {
    if (!userId || !sex || !activityLevel) return;

    const planSlug = detectedPlanSlug;
    const goal = needsGoal && nutritionalGoal ? nutritionalGoal : undefined;
    const macros = calculateMacros(sex, Number(weight), Number(height), Number(age), activityLevel, planSlug, goal);

    await supabase.from("surveys").insert({
      user_id: userId,
      age: Number(age), sex, weight: Number(weight), height: Number(height),
      activity_level: activityLevel, dietary_restrictions: restrictions,
      objective: planSlug,
      nutritional_goal: goal || null,
      tmb: macros.tmb, tdee: macros.tdee, target_calories: macros.targetCalories,
      protein: macros.protein, carbs: macros.carbs, fats: macros.fats,
      training_days: Number(trainingDays),
      wake_hour: Number(wakeHour),
      sleep_hour: Number(sleepHour),
      emphasis,
    });

    // Create initial progress entry as baseline
    await supabase.from("progress_entries").insert({
      user_id: userId,
      weight: Number(weight),
      chest: chest ? Number(chest) : null,
      waist: waist ? Number(waist) : null,
      hips: hips ? Number(hips) : null,
      arms: arms ? Number(arms) : null,
      legs: legs ? Number(legs) : null,
      notes: "Registro inicial (encuesta)",
    });

    // Auto-generate training + nutrition plans based on survey data
    await fetch("/api/generate-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planSlug }),
    });

    setStep(needsGoal ? 6 : 5);
  };

  const toggleRestriction = (r: string) => {
    if (r === "Ninguna") { setRestrictions(["Ninguna"]); return; }
    setRestrictions(prev => {
      const without = prev.filter(x => x !== "Ninguna");
      return without.includes(r) ? without.filter(x => x !== r) : [...without, r];
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Dumbbell className="h-8 w-8 text-primary animate-pulse" /></div>;
  }

  // Step mapping for dynamic goal step
  const stepGoal = needsGoal ? 1 : -1;
  const stepData = needsGoal ? 2 : 1;
  const stepMedidas = needsGoal ? 3 : 2;
  const stepActividad = needsGoal ? 4 : 3;
  const stepFotos = needsGoal ? 5 : 4;
  const stepFin = needsGoal ? 6 : 5;

  // STEP FIN: Done - show install app option
  if (step === stepFin) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">¡Encuesta Completa!</h1>
          <p className="text-muted mb-4">Tu entrenador va a preparar tu plan personalizado de entrenamiento y nutricion.</p>
          <p className="text-sm text-muted mb-6">Ingresa a tu plan para ver tus macros y descargar la app.</p>
          <a
            href="/dashboard"
            className="inline-block gradient-primary text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 mb-4 w-full text-center"
          >
            Ir a Mi Plan
          </a>
          <div className="glass-card rounded-xl p-4 text-left mt-3">
            <p className="font-bold text-sm mb-2">Descarga la app en tu celular</p>
            <div className="space-y-1 text-xs text-muted">
              <p><span className="text-primary font-bold">iPhone:</span> Safari → Compartir (⬆) → Agregar a Inicio</p>
              <p><span className="text-primary font-bold">Android:</span> Chrome → Menu (⋮) → Instalar app</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="text-muted hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Completá tu perfil</span>
            </div>
            <div className="w-full bg-card-border rounded-full h-1.5">
              <div className="gradient-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>
          <span className="text-sm text-muted">{step}/{totalSteps}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        {/* STEP GOAL: Objetivo nutricional (solo para planes sin objetivo definido) */}
        {needsGoal && step === stepGoal && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">¿Cual es tu objetivo?</h2>
            <p className="text-muted mb-8">Tu plan de nutricion se va a adaptar a lo que quieras lograr.</p>
            <div className="space-y-3">
              {([
                { value: "perder-grasa" as NutritionalGoal, label: "Perder grasa", desc: "Deficit calorico para bajar de peso y definir", icon: "🔥" },
                { value: "ganar-musculo" as NutritionalGoal, label: "Ganar masa muscular", desc: "Superavit calorico para aumentar musculo", icon: "💪" },
                { value: "mantenimiento" as NutritionalGoal, label: "Mantenimiento", desc: "Mantener tu peso actual y mejorar composicion corporal", icon: "⚖️" },
              ]).map((opt) => (
                <button key={opt.value} onClick={() => setNutritionalGoal(opt.value)}
                  className={`w-full text-left p-5 rounded-xl border transition-all flex items-center gap-4 ${nutritionalGoal === opt.value ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"}`}>
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-bold">{opt.label}</p>
                    <p className="text-sm text-muted">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep(stepData)} disabled={!nutritionalGoal}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${nutritionalGoal ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP DATA: Sex + Age */}
        {step === stepData && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Datos Personales</h2>
            <p className="text-muted mb-8">Necesitamos estos datos para tu plan personalizado.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Sexo</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["hombre", "mujer"] as Sex[]).map((s) => (
                    <button key={s} onClick={() => setSex(s)}
                      className={`p-4 rounded-xl border text-center font-medium transition-all ${sex === s ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"}`}>
                      {s === "hombre" ? "Hombre" : "Mujer"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Edad</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Ej: 28" min={14} max={99}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>
            </div>
            <button onClick={() => setStep(stepMedidas)} disabled={!sex || !age}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${sex && age ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP MEDIDAS: Weight + Height + Body Measurements */}
        {step === stepMedidas && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Tus Medidas</h2>
            <p className="text-muted mb-8">Para calcular tu plan de nutricion personalizado.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Peso (kg) *</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Ej: 75" min={30} max={250} step={0.1}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Altura (cm) *</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Ej: 175" min={100} max={250}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Medidas corporales <span className="text-muted font-normal">(opcional)</span></label>
                <p className="text-xs text-muted mb-3">Estas medidas sirven como base para medir tu progreso.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Pecho (cm)</label>
                    <input type="number" value={chest} onChange={(e) => setChest(e.target.value)} placeholder="Ej: 100" step={0.1}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Cintura (cm)</label>
                    <input type="number" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="Ej: 85" step={0.1}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Cadera (cm)</label>
                    <input type="number" value={hips} onChange={(e) => setHips(e.target.value)} placeholder="Ej: 95" step={0.1}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Brazos (cm)</label>
                    <input type="number" value={arms} onChange={(e) => setArms(e.target.value)} placeholder="Ej: 32" step={0.1}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Piernas (cm)</label>
                    <input type="number" value={legs} onChange={(e) => setLegs(e.target.value)} placeholder="Ej: 55" step={0.1}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary" />
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(stepActividad)} disabled={!weight || !height}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${weight && height ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP ACTIVIDAD: Activity + Restrictions */}
        {step === stepActividad && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Tu Actividad</h2>
            <p className="text-muted mb-8">Esto nos ayuda a calcular tu plan.</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Nivel de Actividad</label>
                <div className="space-y-2">
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                    <button key={level} onClick={() => setActivityLevel(level)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${activityLevel === level ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"}`}>
                      <p className="font-medium">{ACTIVITY_LABELS[level].label}</p>
                      <p className="text-sm text-muted">{ACTIVITY_LABELS[level].desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Dias de entrenamiento por semana</label>
                <div className="grid grid-cols-4 gap-2">
                  {["3", "4", "5", "6"].map((d) => (
                    <button key={d} onClick={() => setTrainingDays(d)}
                      className={`p-3 rounded-xl border text-center font-bold transition-all ${trainingDays === d ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"}`}>
                      {d} dias
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">¿Que parte de tu cuerpo queres mejorar mas?</label>
                <p className="text-xs text-muted mb-3">Tu rutina se adapta para darle mas foco a esa zona. Si no tenes preferencia, elegí Equilibrado.</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "ninguno", label: "Equilibrado", desc: "Todas las zonas por igual" },
                    { value: "pecho", label: "Pecho", desc: "Pecho y brazos" },
                    { value: "espalda", label: "Espalda", desc: "Espalda y hombros" },
                    { value: "piernas", label: "Piernas", desc: "Piernas y gluteos" },
                    { value: "abdomen", label: "Abdomen", desc: "Core y abdominales" },
                    { value: "tren-superior", label: "Tren Superior", desc: "Pecho, espalda, brazos" },
                  ].map((opt) => (
                    <button key={opt.value} onClick={() => setEmphasis(opt.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${emphasis === opt.value ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"}`}>
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-[10px] text-muted">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Tu horario</label>
                <p className="text-xs text-muted mb-3">Para calcular cuantas comidas necesitas (cada 3 horas).</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Me despierto a las</label>
                    <select value={wakeHour} onChange={(e) => setWakeHour(e.target.value)}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                      {[5,6,7,8,9,10].map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Me duermo a las</label>
                    <select value={sleepHour} onChange={(e) => setSleepHour(e.target.value)}
                      className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                      {[20,21,22,23,0,1].map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-3">Restricciones Alimentarias</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map((r) => (
                    <button key={r} onClick={() => toggleRestriction(r)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${restrictions.includes(r) ? "border-primary bg-primary/10 text-primary" : "border-card-border hover:border-muted"}`}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={() => setStep(stepFotos)} disabled={!activityLevel}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${activityLevel ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP FOTOS: Photos */}
        {step === stepFotos && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Fotos Iniciales</h2>
            <p className="text-muted mb-6">Subí 3 fotos de cuerpo entero para que tu entrenador vea tu punto de partida.</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {([
                { label: "Frente", file: photoFront, setter: setPhotoFront },
                { label: "Perfil", file: photoSide, setter: setPhotoSide },
                { label: "Espalda", file: photoBack, setter: setPhotoBack },
              ] as const).map((view) => (
                <label key={view.label}
                  className="aspect-[3/4] bg-card-bg border-2 border-dashed border-card-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 cursor-pointer overflow-hidden relative">
                  {view.file ? (
                    <>
                      <img src={URL.createObjectURL(view.file)} alt={view.label}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl" />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <Check className="h-8 w-8 text-primary" />
                        <span className="text-xs text-white mt-1">{view.label}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-muted" />
                      <span className="text-sm font-medium">{view.label}</span>
                      <span className="text-xs text-primary flex items-center gap-1"><Upload className="h-3 w-3" /> Subir</span>
                    </>
                  )}
                  <input type="file" accept="image/*" capture="environment" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) view.setter(f); }} />
                </label>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary font-medium">Tus fotos son privadas</p>
              <p className="text-xs text-muted mt-1">Solo vos y tu entrenador pueden verlas.</p>
            </div>

            <button onClick={handleFinishSurvey}
              className="w-full gradient-primary text-black font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 mb-3">
              Finalizar <Check className="h-5 w-5" />
            </button>
            <button onClick={handleFinishSurvey}
              className="w-full text-sm text-muted hover:text-white text-center py-2">
              Saltar fotos por ahora
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
