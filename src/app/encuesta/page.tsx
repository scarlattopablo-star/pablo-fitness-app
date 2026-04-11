"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Dumbbell, Check, Camera, Upload, Sparkles, Target, Utensils, Clock } from "lucide-react";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import { getPlanBySlug, DURATION_LABELS, formatPrice } from "@/lib/plans-data";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal, MacroCalculation } from "@/types";

const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentario: { label: "Sedentario", desc: "Trabajo de oficina, poco movimiento" },
  moderado: { label: "Moderado", desc: "Ejercicio ligero 1-3 días/semana" },
  activo: { label: "Activo", desc: "Ejercicio moderado 3-5 días/semana" },
  "muy-activo": { label: "Muy Activo", desc: "Ejercicio intenso 6-7 días/semana" },
};

const RESTRICTIONS = [
  "Ninguna",
  "Vegetariano",
  "Vegano",
  "Sin gluten (celíaco)",
  "Sin lactosa",
  "Sin frutos secos",
  "Diabetes",
  "Otra",
];

export default function EncuestaPage() {
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [emphasis, setEmphasis] = useState("ninguno");
  const [macros, setMacros] = useState<MacroCalculation | null>(null);
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);

  const [nutritionalGoal, setNutritionalGoal] = useState<NutritionalGoal | "">("");
  const [kitesurfLevel, setKitesurfLevel] = useState("");

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const planSlug = (searchParams?.get("plan") || "quema-grasa") as PlanSlug;
  const duration = searchParams?.get("duration") || "3-meses";
  const plan = getPlanBySlug(planSlug);

  const needsGoal = PLANS_NEEDING_GOAL.includes(planSlug);
  const isKitesurf = planSlug === "kitesurf";
  const totalSteps = (needsGoal ? 6 : 5) + (isKitesurf ? 1 : 0);

  // Mapeo de pasos: si needsGoal, paso 1=objetivo, 2=datos, 3=medidas, 4=actividad, 5=fotos, 6=fin
  // Si no needsGoal: 1=datos, 2=medidas, 3=actividad, 4=fotos, 5=fin
  // Si kitesurf: agrega paso extra de nivel kitesurf antes de fotos
  const stepGoal = needsGoal ? 1 : -1;
  const stepData = needsGoal ? 2 : 1;
  const stepMedidas = needsGoal ? 3 : 2;
  const stepActividad = needsGoal ? 4 : 3;
  const stepKitesurf = isKitesurf ? (needsGoal ? 5 : 4) : -1;
  const stepFotos = (needsGoal ? 5 : 4) + (isKitesurf ? 1 : 0);
  const stepFin = (needsGoal ? 6 : 5) + (isKitesurf ? 1 : 0);

  const canProceed = () => {
    if (step === stepGoal) return nutritionalGoal !== "";
    if (step === stepData) return sex !== "" && age !== "" && Number(age) > 0;
    if (step === stepMedidas) return weight !== "" && height !== "" && Number(weight) > 0 && Number(height) > 0;
    if (step === stepActividad) return activityLevel !== "";
    if (step === stepKitesurf) return kitesurfLevel !== "";
    if (step === stepFotos) return true;
    return true;
  };

  const handleNext = () => {
    if (step === stepFotos && sex && activityLevel) {
      const result = calculateMacros(
        sex,
        Number(weight),
        Number(height),
        Number(age),
        activityLevel,
        planSlug,
        needsGoal && nutritionalGoal ? nutritionalGoal : undefined
      );
      setMacros(result);
    }
    setStep(step + 1);
  };

  const toggleRestriction = (r: string) => {
    if (r === "Ninguna") {
      setRestrictions(["Ninguna"]);
      return;
    }
    setRestrictions((prev) => {
      const without = prev.filter((x) => x !== "Ninguna");
      return without.includes(r) ? without.filter((x) => x !== r) : [...without, r];
    });
  };

  return (
    <main className="min-h-screen pb-20">
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          {step === 1 ? (
            <Link href={`/planes/${planSlug}`} className="text-muted hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : step < stepFin ? (
            <button onClick={() => setStep(step - 1)} className="text-muted hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Encuesta Personal</span>
            </div>
            <div className="w-full bg-card-border rounded-full h-1.5">
              <div
                className="gradient-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-sm text-muted">{step}/{totalSteps}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        {plan && step < stepFin && (
          <div className="glass-card rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Plan seleccionado</p>
              <p className="font-bold">{plan.name} - {DURATION_LABELS[duration]}</p>
            </div>
            <span className="text-primary font-bold text-lg">
              ${formatPrice(plan.prices[duration as keyof typeof plan.prices])}
            </span>
          </div>
        )}

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
                <button
                  key={opt.value}
                  onClick={() => setNutritionalGoal(opt.value)}
                  className={`w-full text-left p-5 rounded-xl border transition-all flex items-center gap-4 ${
                    nutritionalGoal === opt.value ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"
                  }`}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-bold">{opt.label}</p>
                    <p className="text-sm text-muted">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP DATA: Datos básicos */}
        {step === stepData && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Datos Personales</h2>
            <p className="text-muted mb-8">Necesitamos estos datos para calcular tus macros.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Sexo</label>
                <div className="grid grid-cols-2 gap-3">
                  {(["hombre", "mujer"] as Sex[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSex(s)}
                      className={`p-4 rounded-xl border text-center font-medium transition-all ${
                        sex === s ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"
                      }`}
                    >
                      {s === "hombre" ? "Hombre" : "Mujer"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Edad</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Ej: 28"
                  min={14}
                  max={99}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP MEDIDAS: Medidas */}
        {step === stepMedidas && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Tus Medidas</h2>
            <p className="text-muted mb-8">Con estos datos calculamos tu Tasa Metabólica Basal.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Peso (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="Ej: 75"
                  min={30}
                  max={250}
                  step={0.1}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Altura (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Ej: 175"
                  min={100}
                  max={250}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP ACTIVIDAD: Actividad y restricciones */}
        {step === stepActividad && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Tu Actividad</h2>
            <p className="text-muted mb-8">Esto define tu gasto calórico diario.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Nivel de Actividad Física</label>
                <div className="space-y-2">
                  {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setActivityLevel(level)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        activityLevel === level ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"
                      }`}
                    >
                      <p className="font-medium">{ACTIVITY_LABELS[level].label}</p>
                      <p className="text-sm text-muted">{ACTIVITY_LABELS[level].desc}</p>
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
                <label className="block text-sm font-medium mb-3">Restricciones Alimentarias</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => toggleRestriction(r)}
                      className={`px-4 py-2 rounded-full text-sm border transition-all ${
                        restrictions.includes(r)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-card-border hover:border-muted"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP KITESURF: Kitesurf experience level */}
        {step === stepKitesurf && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Tu Experiencia en Kitesurf</h2>
            <p className="text-muted mb-8">Adaptamos tu plan según tu nivel en el agua.</p>
            <div className="space-y-2">
              {[
                { value: "ninguna", label: "Sin experiencia", desc: "Nunca practiqué kitesurf" },
                { value: "basica", label: "Principiante", desc: "Algunas clases tomadas, control básico" },
                { value: "intermedia", label: "Intermedio", desc: "Navego con regularidad, algunos saltos" },
                { value: "avanzada", label: "Avanzado", desc: "Saltos altos, trucos y maniobras" },
              ].map((opt) => (
                <button key={opt.value} onClick={() => setKitesurfLevel(opt.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    kitesurfLevel === opt.value ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"
                  }`}>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-sm text-muted">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP FOTOS: Photos */}
        {step === stepFotos && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Fotos Iniciales</h2>
            <p className="text-muted mb-6">
              Subí 3 fotos de cuerpo entero para registrar tu punto de partida.
              Cada 20 días te pediremos nuevas fotos para comparar tu progreso.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {([
                { label: "Frente", desc: "De frente, cuerpo entero", file: photoFront, setter: setPhotoFront },
                { label: "Perfil", desc: "De costado, cuerpo entero", file: photoSide, setter: setPhotoSide },
                { label: "Espalda", desc: "De espalda, cuerpo entero", file: photoBack, setter: setPhotoBack },
              ] as const).map((view) => (
                <label
                  key={view.label}
                  className="aspect-[3/4] bg-card-bg border-2 border-dashed border-card-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors cursor-pointer overflow-hidden relative"
                >
                  {view.file ? (
                    <>
                      <img
                        src={URL.createObjectURL(view.file)}
                        alt={view.label}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                        <Check className="h-8 w-8 text-primary" />
                        <span className="text-xs text-white mt-1">{view.label}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Camera className="h-8 w-8 text-muted" />
                      <span className="text-sm font-medium">{view.label}</span>
                      <span className="text-[10px] text-muted text-center px-2">{view.desc}</span>
                      <span className="text-xs text-primary flex items-center gap-1">
                        <Upload className="h-3 w-3" /> Subir foto
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) view.setter(f);
                    }}
                  />
                </label>
              ))}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
              <p className="text-sm text-primary font-medium">
                Tus fotos son privadas
              </p>
              <p className="text-xs text-muted mt-1">
                Solo vos y tu entrenador pueden verlas. No se comparten ni se publican en ningún lado.
              </p>
            </div>

            <div className="glass-card rounded-xl p-4 mb-6">
              <p className="text-sm text-muted">
                <strong className="text-white">Consejos para las fotos:</strong>
              </p>
              <ul className="text-sm text-muted mt-2 space-y-1">
                <li>&#8226; Usa ropa ajustada o ropa interior</li>
                <li>&#8226; Buena iluminacion, fondo neutro</li>
                <li>&#8226; Mismo lugar y hora para futuras comparaciones</li>
                <li>&#8226; Postura relajada y natural</li>
              </ul>
            </div>

            <button
              onClick={() => handleNext()}
              className="w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-3"
            >
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>

            <button
              onClick={() => { handleNext(); }}
              className="w-full text-sm text-muted hover:text-white text-center py-2"
            >
              Saltar este paso
            </button>
          </div>
        )}

        {/* STEP FIN: Encuesta completada - Invitar al pago (SIN mostrar macros) */}
        {step === stepFin && macros && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-10 w-10 text-black" />
              </div>
              <h2 className="text-2xl font-black mb-2">¡Ya estamos preparando tu plan!</h2>
              <p className="text-muted">
                Con tus datos vamos a armar un entrenamiento y nutricion 100% personalizado para vos.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6 mb-6">
              <p className="text-sm font-bold mb-4 text-center">Tu plan va a incluir:</p>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Rutina de entrenamiento personalizada</p>
                    <p className="text-xs text-muted">Ejercicios adaptados a tu nivel y objetivo</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Utensils className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Tus macros y plan de nutricion</p>
                    <p className="text-xs text-muted">Calorias, proteinas, carbohidratos y grasas calculados para vos</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Seguimiento de tu progreso</p>
                    <p className="text-xs text-muted">Fotos, medidas y peso para ver tu transformacion</p>
                  </div>
                </div>
              </div>
            </div>

            {plan && (
              <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted">Plan seleccionado</p>
                  <p className="font-bold">{plan.name} - {DURATION_LABELS[duration]}</p>
                </div>
                <span className="text-primary font-bold text-lg">
                  ${formatPrice(plan.prices[duration as keyof typeof plan.prices])}
                </span>
              </div>
            )}

            <button
              onClick={() => {
                // Guardar encuesta en localStorage (macros calculados pero NO mostrados)
                localStorage.setItem("pendingSurvey", JSON.stringify({
                  sex, age: Number(age), weight: Number(weight), height: Number(height),
                  activityLevel, restrictions, emphasis, planSlug,
                  ...(nutritionalGoal ? { nutritionalGoal } : {}),
                  ...(kitesurfLevel ? { kitesurfLevel } : {}),
                  macros: {
                    tmb: macros.tmb, tdee: macros.tdee,
                    targetCalories: macros.targetCalories,
                    protein: macros.protein, carbs: macros.carbs, fats: macros.fats,
                  },
                }));
                window.location.href = `/registro?plan=${planSlug}&duration=${duration}`;
              }}
              className="block w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
            >
              Continuar al Pago <ArrowRight className="h-5 w-5" />
            </button>

            <p className="text-xs text-muted text-center mt-3">
              Pago seguro con MercadoPago
            </p>
          </div>
        )}

        {/* Navigation */}
        {step < stepFin && step !== stepFotos && (
          <div className="mt-10">
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`w-full font-bold text-center py-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
                canProceed()
                  ? "gradient-primary text-black hover:opacity-90"
                  : "bg-card-border text-muted cursor-not-allowed"
              }`}
            >
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
