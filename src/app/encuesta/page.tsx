"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Dumbbell, Check } from "lucide-react";
import { calculateMacros } from "@/lib/harris-benedict";
import { getPlanBySlug, DURATION_LABELS } from "@/lib/plans-data";
import type { Sex, ActivityLevel, PlanSlug, MacroCalculation } from "@/types";

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
  const [macros, setMacros] = useState<MacroCalculation | null>(null);

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const planSlug = (searchParams?.get("plan") || "quema-grasa") as PlanSlug;
  const duration = searchParams?.get("duration") || "3-meses";
  const plan = getPlanBySlug(planSlug);

  const totalSteps = 4;

  const canProceed = () => {
    switch (step) {
      case 1: return sex !== "" && age !== "" && Number(age) > 0;
      case 2: return weight !== "" && height !== "" && Number(weight) > 0 && Number(height) > 0;
      case 3: return activityLevel !== "";
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 3 && sex && activityLevel) {
      const result = calculateMacros(
        sex,
        Number(weight),
        Number(height),
        Number(age),
        activityLevel,
        planSlug
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
          ) : (
            <button onClick={() => setStep(step - 1)} className="text-muted hover:text-white transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
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
        {plan && (
          <div className="glass-card rounded-xl p-4 mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Plan seleccionado</p>
              <p className="font-bold">{plan.name} - {DURATION_LABELS[duration]}</p>
            </div>
            <span className="text-primary font-bold text-lg">
              ${plan.prices[duration as keyof typeof plan.prices]}
            </span>
          </div>
        )}

        {/* STEP 1: Datos básicos */}
        {step === 1 && (
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

        {/* STEP 2: Medidas */}
        {step === 2 && (
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

        {/* STEP 3: Actividad y restricciones */}
        {step === 3 && (
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

        {/* STEP 4: Results */}
        {step === 4 && macros && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-black" />
              </div>
              <h2 className="text-2xl font-black mb-2">Tu Plan Personalizado</h2>
              <p className="text-muted">Basado en el método Harris-Benedict</p>
            </div>

            {/* Macro Cards */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="glass-card rounded-xl p-5 text-center col-span-2">
                <p className="text-sm text-muted mb-1">Calorías Diarias</p>
                <p className="text-4xl font-black text-primary">{macros.targetCalories}</p>
                <p className="text-xs text-muted mt-1">kcal/día</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted mb-1">Proteínas</p>
                <p className="text-2xl font-black text-red-400">{macros.protein}g</p>
                <p className="text-xs text-muted">{macros.protein * 4} kcal</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted mb-1">Carbohidratos</p>
                <p className="text-2xl font-black text-yellow-400">{macros.carbs}g</p>
                <p className="text-xs text-muted">{macros.carbs * 4} kcal</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted mb-1">Grasas</p>
                <p className="text-2xl font-black text-blue-400">{macros.fats}g</p>
                <p className="text-xs text-muted">{macros.fats * 9} kcal</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <p className="text-xs text-muted mb-1">TMB</p>
                <p className="text-2xl font-black">{macros.tmb}</p>
                <p className="text-xs text-muted">kcal base</p>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 mb-8">
              <h3 className="font-bold mb-2">Resumen</h3>
              <div className="space-y-1 text-sm text-muted">
                <p>Sexo: {sex === "hombre" ? "Hombre" : "Mujer"} | Edad: {age} años</p>
                <p>Peso: {weight}kg | Altura: {height}cm</p>
                <p>Actividad: {activityLevel && ACTIVITY_LABELS[activityLevel as ActivityLevel]?.label}</p>
                <p>Restricciones: {restrictions.length > 0 ? restrictions.join(", ") : "Ninguna"}</p>
                <p>TDEE: {macros.tdee} kcal | Objetivo: {macros.targetCalories} kcal</p>
              </div>
            </div>

            <Link
              href={`/registro?plan=${planSlug}&duration=${duration}`}
              className="block w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Continuar al Pago <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Navigation */}
        {step < 4 && (
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
