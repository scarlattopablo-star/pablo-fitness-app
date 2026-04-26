"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Dumbbell, Check, Camera, Upload, Sparkles, Target, Utensils, Clock } from "lucide-react";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import { calculateMacrosV2 } from "@/lib/nutrition-engine";
import { getPlanBySlug, DURATION_LABELS, formatPrice } from "@/lib/plans-data";
import { supabase } from "@/lib/supabase";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal, MacroCalculation, MacroCalculationV2, JobActivity, ShoppingFrequency } from "@/types";

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

// === Nutrition v2 — opciones de pasos opcionales ===
const JOB_ACTIVITIES: { value: JobActivity; label: string; desc: string }[] = [
  { value: "sedentario", label: "Sedentario", desc: "Oficina, pocas horas de pie" },
  { value: "de-pie", label: "De pie", desc: "Atencion al publico, comercio" },
  { value: "manual", label: "Manual", desc: "Construccion, almacen, repartidor" },
  { value: "muy-activo", label: "Muy activo", desc: "Entrenador, mudanzas, oficio fisico" },
];

const PATHOLOGIES_OPTIONS = [
  "Hipertension",
  "Diabetes tipo 1",
  "Diabetes tipo 2",
  "Hipotiroidismo",
  "Hipertiroidismo",
  "Colesterol alto",
  "Acido urico",
  "Higado graso",
  "Sindrome ovario poliquistico",
  "Reflujo",
];

const INTOLERANCES_OPTIONS = [
  "Gluten",
  "Lactosa",
  "Frutos secos",
  "Mariscos",
  "Soja",
  "Huevo",
];

const COUNTRIES = [
  { value: "UY", label: "Uruguay", currency: "UYU" },
  { value: "AR", label: "Argentina", currency: "ARS" },
  { value: "ES", label: "Espana", currency: "EUR" },
  { value: "BR", label: "Brasil", currency: "BRL" },
  { value: "CL", label: "Chile", currency: "CLP" },
  { value: "MX", label: "Mexico", currency: "MXN" },
  { value: "OTRO", label: "Otro", currency: "USD" },
];

const SUPPLEMENTS_OPTIONS = [
  "Whey protein",
  "Creatina",
  "Omega 3",
  "Multivitaminico",
  "Magnesio",
  "Vitamina D",
  "Cafeina",
  "Pre-entreno",
  "BCAAs",
  "Glutamina",
];

const SHOPPING_FREQUENCIES: { value: ShoppingFrequency; label: string }[] = [
  { value: "semanal", label: "Semanal" },
  { value: "quincenal", label: "Cada 15 dias" },
  { value: "mensual", label: "Mensual" },
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

  // === Nutrition v2 — campos opcionales ===
  const [bodyFatPct, setBodyFatPct] = useState("");
  const [jobActivity, setJobActivity] = useState<JobActivity | "">("");
  const [trainingTime, setTrainingTime] = useState("");
  const [pathologies, setPathologies] = useState<string[]>([]);
  const [intolerances, setIntolerances] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState("");
  const [mealsPerDay, setMealsPerDay] = useState<number | null>(null);
  const [country, setCountry] = useState("UY");
  const [city, setCity] = useState("");
  const [foodBudgetMonthly, setFoodBudgetMonthly] = useState("");
  const [foodBudgetCurrency, setFoodBudgetCurrency] = useState("UYU");
  const [cookingTimePerDay, setCookingTimePerDay] = useState("");
  const [shoppingFrequency, setShoppingFrequency] = useState<ShoppingFrequency | "">("");
  const [usesSupplements, setUsesSupplements] = useState<boolean | null>(null);
  const [currentSupplements, setCurrentSupplements] = useState<string[]>([]);
  const [wantsSupplementAdvice, setWantsSupplementAdvice] = useState<boolean | null>(null);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const planSlug = (searchParams?.get("plan") || "quema-grasa") as PlanSlug;
  const duration = searchParams?.get("duration") || "3-meses";
  // flow=trial → el user YA tiene cuenta (viene de /registro-gratis). Guardamos survey + sub y vamos a onboarding.
  const flow = searchParams?.get("flow") || "";
  const isTrialFlow = flow === "trial";
  const plan = getPlanBySlug(planSlug);
  const isRetoGlutes = planSlug === "glutes-360";
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState("");

  // El reto Gluteos 360 ya define el foco (gluteos + abdomen) — no preguntamos.
  useEffect(() => {
    if (isRetoGlutes) setEmphasis("piernas");
  }, [isRetoGlutes]);

  const needsGoal = PLANS_NEEDING_GOAL.includes(planSlug);
  const isKitesurf = planSlug === "kitesurf";
  // Pasos extras opcionales (skipeables): perfil avanzado, salud/comida, presupuesto/suplementos
  const totalSteps = (needsGoal ? 9 : 8) + (isKitesurf ? 1 : 0);

  // Mapeo de pasos:
  //   1 (opt). objetivo nutricional (si needsGoal)
  //   N. datos basicos (sex+age)
  //   N+1. medidas (peso+altura)
  //   N+2. actividad (entreno + restricciones)
  //   N+3. perfil avanzado [SKIPEABLE]: %graso + trabajo + horario entreno
  //   N+4. salud y comida [SKIPEABLE]: patologias + intolerancias + comidas/dia
  //   N+5. presupuesto y suplementos [SKIPEABLE]: pais + budget + cocina + supps
  //   N+6 (opt). kitesurf level (si isKitesurf)
  //   N+7. fotos
  //   N+8. fin (CTA pago)
  const stepGoal = needsGoal ? 1 : -1;
  const stepData = needsGoal ? 2 : 1;
  const stepMedidas = needsGoal ? 3 : 2;
  const stepActividad = needsGoal ? 4 : 3;
  const stepPerfilExtra = needsGoal ? 5 : 4;
  const stepSaludComida = needsGoal ? 6 : 5;
  const stepPresupuesto = needsGoal ? 7 : 6;
  const stepKitesurf = isKitesurf ? (needsGoal ? 8 : 7) : -1;
  const stepFotos = (needsGoal ? 8 : 7) + (isKitesurf ? 1 : 0);
  const stepFin = (needsGoal ? 9 : 8) + (isKitesurf ? 1 : 0);

  const canProceed = () => {
    if (step === stepGoal) return nutritionalGoal !== "";
    if (step === stepData) return sex !== "" && age !== "" && Number(age) > 0;
    if (step === stepMedidas) return weight !== "" && height !== "" && Number(weight) > 0 && Number(height) > 0;
    if (step === stepActividad) return activityLevel !== "";
    // Pasos opcionales — siempre se puede avanzar (skip incluido)
    if (step === stepPerfilExtra) return true;
    if (step === stepSaludComida) return true;
    if (step === stepPresupuesto) return true;
    if (step === stepKitesurf) return kitesurfLevel !== "";
    if (step === stepFotos) return true;
    return true;
  };

  // Decide motor v2 vs v1: usa v2 SOLO si el cliente completo datos extra que
  // realmente afinen el calculo (%graso o jobActivity).
  const shouldUseV2 = (bodyFatPct !== "" && Number(bodyFatPct) > 0) || jobActivity !== "";

  const handleNext = () => {
    if (step === stepFotos && sex && activityLevel) {
      let result: MacroCalculation | MacroCalculationV2;
      if (shouldUseV2) {
        result = calculateMacrosV2({
          sex,
          weight: Number(weight),
          height: Number(height),
          age: Number(age),
          activityLevel,
          objective: planSlug,
          bodyFatPct: bodyFatPct ? Number(bodyFatPct) : undefined,
          jobActivity: jobActivity || undefined,
          nutritionalGoal: needsGoal && nutritionalGoal ? nutritionalGoal : undefined,
        });
      } else {
        result = calculateMacros(
          sex,
          Number(weight),
          Number(height),
          Number(age),
          activityLevel,
          planSlug,
          needsGoal && nutritionalGoal ? nutritionalGoal : undefined
        );
      }
      setMacros(result);
    }
    setStep(step + 1);
  };

  const toggleInList = (list: string[], setList: (l: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter(x => x !== value) : [...list, value]);
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const found = COUNTRIES.find(c => c.value === newCountry);
    if (found) setFoodBudgetCurrency(found.currency);
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

              {!isRetoGlutes && (
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
              )}

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

        {/* STEP PERFIL EXTRA (opcional): %graso, trabajo, horario entreno */}
        {step === stepPerfilExtra && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Perfil Avanzado</h2>
            <p className="text-muted mb-2">Datos opcionales que afinan el calculo de tus calorias y macros.</p>
            <p className="text-xs text-primary mb-8">Podes saltarlo — usaremos formulas estandar.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Porcentaje de grasa corporal (opcional)</label>
                <p className="text-xs text-muted mb-3">Si lo conoces (balanza, plicometro o DEXA), nos permite usar Katch-McArdle: la formula mas precisa.</p>
                <input
                  type="number"
                  value={bodyFatPct}
                  onChange={(e) => setBodyFatPct(e.target.value)}
                  placeholder="Ej: 18"
                  min={3}
                  max={50}
                  step={0.1}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Tipo de trabajo</label>
                <p className="text-xs text-muted mb-3">Tu trabajo afecta el gasto calorico tanto como el entreno.</p>
                <div className="grid grid-cols-2 gap-2">
                  {JOB_ACTIVITIES.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setJobActivity(opt.value)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        jobActivity === opt.value ? "border-primary bg-primary/5" : "border-card-border hover:border-muted"
                      }`}
                    >
                      <p className="font-medium text-sm">{opt.label}</p>
                      <p className="text-[10px] text-muted">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Horario habitual de entrenamiento (opcional)</label>
                <p className="text-xs text-muted mb-3">Distribuimos tus comidas alrededor del entreno para mejor rendimiento.</p>
                <input
                  type="time"
                  value={trainingTime}
                  onChange={(e) => setTrainingTime(e.target.value)}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP SALUD Y COMIDA (opcional): patologias, intolerancias, comidas/dia */}
        {step === stepSaludComida && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Salud y Comidas</h2>
            <p className="text-muted mb-2">Para evitar alimentos que no podes consumir y adaptar el plan a tus condiciones.</p>
            <p className="text-xs text-primary mb-8">Todo opcional — si no aplica, saltalo.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Patologias o condiciones medicas</label>
                <div className="flex flex-wrap gap-2">
                  {PATHOLOGIES_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => toggleInList(pathologies, setPathologies, p)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        pathologies.includes(p)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-card-border hover:border-muted"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Intolerancias o alergias alimentarias</label>
                <div className="flex flex-wrap gap-2">
                  {INTOLERANCES_OPTIONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => toggleInList(intolerances, setIntolerances, i)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                        intolerances.includes(i)
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-card-border hover:border-muted"
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alimentos que NO consumis</label>
                <p className="text-xs text-muted mb-3">Separados por coma. Ej: pescado, palta, brocoli.</p>
                <input
                  type="text"
                  value={dislikedFoods}
                  onChange={(e) => setDislikedFoods(e.target.value)}
                  placeholder="Ej: pescado, palta, brocoli"
                  maxLength={200}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Cuantas comidas al dia preferis</label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 4, 5, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMealsPerDay(n)}
                      className={`p-3 rounded-xl border text-center font-medium transition-all ${
                        mealsPerDay === n ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP PRESUPUESTO (opcional): pais, budget, cocina, suplementos */}
        {step === stepPresupuesto && (
          <div className="animate-fade-in-up">
            <h2 className="text-2xl font-black mb-2">Presupuesto y Suplementos</h2>
            <p className="text-muted mb-2">Adaptamos la lista de compras a tu bolsillo y rutina.</p>
            <p className="text-xs text-primary mb-8">Opcional — si lo dejas en blanco no calculamos presupuesto.</p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Pais</label>
                <div className="grid grid-cols-3 gap-2">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => handleCountryChange(c.value)}
                      className={`p-2 rounded-xl border text-center text-sm font-medium transition-all ${
                        country === c.value ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ciudad (opcional)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Montevideo"
                  maxLength={50}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Presupuesto mensual de comida ({foodBudgetCurrency})
                </label>
                <p className="text-xs text-muted mb-3">Te avisamos si el plan se pasa y proponemos ajustes.</p>
                <input
                  type="number"
                  value={foodBudgetMonthly}
                  onChange={(e) => setFoodBudgetMonthly(e.target.value)}
                  placeholder="Ej: 8000"
                  min={0}
                  step={100}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tiempo de cocina por dia (minutos)</label>
                <input
                  type="number"
                  value={cookingTimePerDay}
                  onChange={(e) => setCookingTimePerDay(e.target.value)}
                  placeholder="Ej: 30"
                  min={0}
                  max={240}
                  step={5}
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">Frecuencia de compras</label>
                <div className="grid grid-cols-3 gap-2">
                  {SHOPPING_FREQUENCIES.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setShoppingFrequency(opt.value)}
                      className={`p-3 rounded-xl border text-center font-medium text-sm transition-all ${
                        shoppingFrequency === opt.value ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">¿Usas suplementos actualmente?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: "Si" },
                    { value: false, label: "No" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setUsesSupplements(opt.value)}
                      className={`p-3 rounded-xl border text-center font-medium transition-all ${
                        usesSupplements === opt.value ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {usesSupplements === true && (
                <div>
                  <label className="block text-sm font-medium mb-3">¿Cuales?</label>
                  <div className="flex flex-wrap gap-2">
                    {SUPPLEMENTS_OPTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleInList(currentSupplements, setCurrentSupplements, s)}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          currentSupplements.includes(s)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-card-border hover:border-muted"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-3">¿Queres que te recomendemos suplementos?</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: "Si, recomienden" },
                    { value: false, label: "No, gracias" },
                  ].map((opt) => (
                    <button
                      key={String(opt.value)}
                      onClick={() => setWantsSupplementAdvice(opt.value)}
                      className={`p-3 rounded-xl border text-center font-medium text-sm transition-all ${
                        wantsSupplementAdvice === opt.value ? "border-primary bg-primary/5 text-primary" : "border-card-border hover:border-muted"
                      }`}
                    >
                      {opt.label}
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
              disabled={finishing}
              onClick={async () => {
                // Campos v2 — solo se incluyen si el usuario los completo (snake_case
                // porque van directo a la columna en supabase).
                const dislikedFoodsArray = dislikedFoods
                  .split(",")
                  .map(s => s.trim())
                  .filter(s => s.length > 0);
                const extraSurveyFields = {
                  ...(bodyFatPct ? { body_fat_pct: Number(bodyFatPct) } : {}),
                  ...(jobActivity ? { job_activity: jobActivity } : {}),
                  ...(trainingTime ? { training_time: trainingTime } : {}),
                  ...(pathologies.length > 0 ? { pathologies } : {}),
                  ...(intolerances.length > 0 ? { intolerances } : {}),
                  ...(dislikedFoodsArray.length > 0 ? { disliked_foods: dislikedFoodsArray } : {}),
                  ...(mealsPerDay ? { meals_per_day: mealsPerDay } : {}),
                  ...(country ? { country } : {}),
                  ...(city ? { city } : {}),
                  ...(foodBudgetMonthly ? { food_budget_monthly: Number(foodBudgetMonthly) } : {}),
                  ...(foodBudgetCurrency ? { food_budget_currency: foodBudgetCurrency } : {}),
                  ...(cookingTimePerDay ? { cooking_time_per_day: Number(cookingTimePerDay) } : {}),
                  ...(shoppingFrequency ? { shopping_frequency: shoppingFrequency } : {}),
                  ...(usesSupplements !== null ? { uses_supplements: usesSupplements } : {}),
                  ...(currentSupplements.length > 0 ? { current_supplements: currentSupplements } : {}),
                  ...(wantsSupplementAdvice !== null ? { wants_supplement_advice: wantsSupplementAdvice } : {}),
                  ...("bmrMethod" in macros ? { bmr_method: (macros as MacroCalculationV2).bmrMethod } : {}),
                };

                const payload = {
                  sex, age: Number(age), weight: Number(weight), height: Number(height),
                  activityLevel, restrictions, emphasis, planSlug,
                  ...(nutritionalGoal ? { nutritionalGoal } : {}),
                  ...(kitesurfLevel ? { kitesurfLevel } : {}),
                  macros: {
                    tmb: macros.tmb, tdee: macros.tdee,
                    targetCalories: macros.targetCalories,
                    protein: macros.protein, carbs: macros.carbs, fats: macros.fats,
                  },
                  extraSurveyFields,
                };

                // FLOW TRIAL: user YA tiene cuenta. Persistimos survey + creamos sub + onboarding.
                if (isTrialFlow) {
                  setFinishing(true);
                  setFinishError("");
                  try {
                    const { data: sessionData } = await supabase.auth.getSession();
                    const session = sessionData?.session;
                    if (!session?.user) {
                      // No hay sesion — mandar al login con volver aca.
                      window.location.href = "/login?next=" + encodeURIComponent(window.location.pathname + window.location.search);
                      return;
                    }
                    const userId = session.user.id;

                    await supabase.from("surveys").insert({
                      user_id: userId,
                      age: payload.age,
                      sex: payload.sex,
                      weight: payload.weight,
                      height: payload.height,
                      activity_level: payload.activityLevel,
                      dietary_restrictions: payload.restrictions || [],
                      objective: payload.planSlug || "quema-grasa",
                      nutritional_goal: payload.nutritionalGoal || null,
                      tmb: payload.macros.tmb,
                      tdee: payload.macros.tdee,
                      target_calories: payload.macros.targetCalories,
                      protein: payload.macros.protein,
                      carbs: payload.macros.carbs,
                      fats: payload.macros.fats,
                      ...payload.extraSurveyFields,
                    });

                    const subRes = await fetch("/api/create-subscription", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({
                        userId,
                        duration: duration || "1-mes",
                        trialDays: 30,
                        amountPaid: 0,
                        currency: "UYU",
                      }),
                    });
                    if (!subRes.ok) {
                      const err = await subRes.json().catch(() => ({}));
                      throw new Error(err.error || "No pudimos activar tu prueba");
                    }

                    // Auto-generar training_plan + nutrition_plan basado en la survey.
                    // Si falla, seguimos igual al onboarding — Pablo puede generarlo
                    // a mano despues desde el admin.
                    fetch("/api/admin/generate-plans-for-user", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ userId, overwrite: false }),
                    }).catch(() => { /* silent: no bloquear el flujo del cliente */ });

                    // Antes del dashboard: splash + 5 slides (onboarding) → bienvenida (meta + foto + push) → dashboard.
                    // Si es el reto Gluteos 360, insertamos el briefing PRIMERO: reto-briefing -> onboarding -> bienvenida -> dashboard.
                    const onboardingUrl = "/onboarding?next=" + encodeURIComponent("/dashboard/bienvenida");
                    const finalUrl = isRetoGlutes
                      ? "/reto-briefing?next=" + encodeURIComponent(onboardingUrl)
                      : onboardingUrl;
                    window.location.href = finalUrl;
                  } catch (e) {
                    setFinishError(e instanceof Error ? e.message : "Error al finalizar");
                    setFinishing(false);
                  }
                  return;
                }

                // FLOW PAGO: dejamos survey en localStorage y seguimos al registro → MercadoPago.
                localStorage.setItem("pendingSurvey", JSON.stringify(payload));
                window.location.href = `/registro?plan=${planSlug}&duration=${duration}`;
              }}
              className="block w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2 text-lg"
            >
              {isTrialFlow
                ? (finishing ? "Activando tu prueba..." : "Empezar mi prueba gratis")
                : "Continuar al Pago"} <ArrowRight className="h-5 w-5" />
            </button>

            {finishError && (
              <p className="text-red-400 text-sm text-center mt-3">{finishError}</p>
            )}

            <p className="text-xs text-muted text-center mt-3">
              {isTrialFlow ? "Sin tarjeta · 30 dias gratis" : "Pago seguro con MercadoPago"}
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
            {(step === stepPerfilExtra || step === stepSaludComida || step === stepPresupuesto) && (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full text-sm text-muted hover:text-white text-center py-3 mt-2"
              >
                Saltar este paso
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
