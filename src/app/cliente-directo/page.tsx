"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dumbbell, UserPlus, Check, Eye, EyeOff, Camera, Upload,
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

function ClienteDirectoForm() {
  const [code, setCode] = useState<string | null>(null);

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [step, setStep] = useState(1);
  const [nutritionalGoal, setNutritionalGoal] = useState<NutritionalGoal | "">("");

  // Registration
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userId, setUserId] = useState("");

  // Survey
  const [sex, setSex] = useState<Sex | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState("5");
  const [wakeHour, setWakeHour] = useState("7");
  const [sleepHour, setSleepHour] = useState("23");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [legs, setLegs] = useState("");

  // Code data
  const [codeDuration, setCodeDuration] = useState("1-ano");
  const [codePlanSlug, setCodePlanSlug] = useState("direct-client");

  // Photos
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);

  const needsGoal = PLANS_NEEDING_GOAL.includes(codePlanSlug as PlanSlug);
  const totalSteps = needsGoal ? 7 : 6;

  // Step mapping: register is always 1, then optionally goal, then data steps
  const stepRegister = 1;
  const stepGoalCD = needsGoal ? 2 : -1;
  const stepDataCD = needsGoal ? 3 : 2;
  const stepMedidasCD = needsGoal ? 4 : 3;
  const stepActividadCD = needsGoal ? 5 : 4;
  const stepFotosCD = needsGoal ? 6 : 5;
  const stepFinCD = needsGoal ? 7 : 6;

  // Read code from URL without useSearchParams (fails in WhatsApp browser)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setCode(params.get("code") || "");
    } catch {
      setCode("");
    }
  }, []);

  useEffect(() => {
    if (code === null) return; // URL not read yet
    if (!code) { setValidating(false); return; }
    // Safety timeout: if validation takes > 5s, stop loading
    const timeout = setTimeout(() => setValidating(false), 5000);
    fetch(`/api/free-access?code=${code}`)
      .then(r => {
        if (!r.ok) { setValidating(false); clearTimeout(timeout); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.valid || data.plan_slug === "direct-client") {
          setValid(true);
          if (data.duration && data.duration !== "custom") setCodeDuration(data.duration);
          if (data.plan_slug) setCodePlanSlug(data.plan_slug);
        }
        setValidating(false);
        clearTimeout(timeout);
      })
      .catch(() => { setValidating(false); clearTimeout(timeout); });
    return () => clearTimeout(timeout);
  }, [code]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      // Check if user was previously deleted/banned — restore if so
      await fetch("/api/restore-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).catch(() => {});

      const { data, error: authError } = await supabase.auth.signUp({
        email, password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: `${window.location.origin}/encuesta-directa`,
        },
      });
      if (authError) {
        if (authError.message.includes("already registered")) {
          // Try logging in instead (user was restored)
          const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
          if (loginErr) {
            setError("Este email ya esta registrado. Intenta iniciar sesion desde /login.");
            setLoading(false);
            return;
          }
          if (loginData.user) {
            setUserId(loginData.user.id);
            await fetch("/api/free-access", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ code, userId: loginData.user.id }),
            }).catch(() => {});
            setStep(needsGoal ? stepGoalCD : stepDataCD);
            setLoading(false);
            return;
          }
        }
        setError(authError.message);
        setLoading(false);
        return;
      }
      if (!data.user) {
        setError("No se pudo crear la cuenta. Intenta con otro email.");
        setLoading(false);
        return;
      }
      setUserId(data.user.id);
      // Mark code as used via server-side API (bypasses RLS)
      await fetch("/api/free-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, userId: data.user.id }),
      });
      // Update profile
      await supabase.from("profiles")
        .update({ phone, full_name: fullName })
        .eq("id", data.user.id);
      setStep(needsGoal ? stepGoalCD : stepDataCD);
    } catch { setError("Error inesperado. Intenta de nuevo."); }
    finally { setLoading(false); }
  };

  const handleFinishSurvey = async () => {
    if (!userId || !sex || !activityLevel) return;
    setLoading(true);
    setError("");
    try {
    const w = Number(weight), h = Number(height), a = Number(age);
    if (w < 30 || w > 300 || h < 100 || h > 250 || a < 14 || a > 100) {
      setError("Verifica que los datos de peso, altura y edad sean correctos.");
      setLoading(false);
      return;
    }
    // BMI sanity check: reject physically impossible combinations
    const bmi = w / ((h / 100) ** 2);
    if (bmi < 10 || bmi > 70) {
      setError("La combinacion de peso y altura no parece correcta. Verifica los datos.");
      setLoading(false);
      return;
    }
    const planSlug = (codePlanSlug || "direct-client") as PlanSlug;
    const goal = needsGoal && nutritionalGoal ? nutritionalGoal : undefined;
    const macros = calculateMacros(sex, w, h, a, activityLevel, planSlug, goal);

    // Save survey via server-side API (bypasses RLS)
    const surveyRes = await fetch("/api/encuesta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        full_name: fullName, email,
        age: Number(age), sex, weight: Number(weight), height: Number(height),
        activity_level: activityLevel, dietary_restrictions: restrictions,
        objective: planSlug,
        nutritional_goal: goal || null,
        tmb: macros.tmb, tdee: macros.tdee, target_calories: macros.targetCalories,
        protein: macros.protein, carbs: macros.carbs, fats: macros.fats,
        training_days: Number(trainingDays),
        wake_hour: Number(wakeHour),
        sleep_hour: Number(sleepHour),
      }),
    });
    if (!surveyRes.ok) {
      const surveyErr = await surveyRes.json().catch(() => ({ error: "unknown" }));
      setError(`Error al guardar encuesta: ${surveyErr.error || "intenta de nuevo"}`);
      setLoading(false);
      return;
    }

    // Create subscription via server-side API (bypasses RLS)
    const subRes = await fetch("/api/create-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, duration: codeDuration, amountPaid: 0, currency: "UYU" }),
    });
    if (!subRes.ok) {
      const subErr = await subRes.json().catch(() => ({ error: "unknown" }));
      setError(`Error al crear suscripcion: ${subErr.error || "intenta de nuevo"}`);
      setLoading(false);
      return;
    }

    // Auto-generate training + nutrition plans based on survey data
    const planRes = await fetch("/api/generate-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, planSlug }),
    });
    if (!planRes.ok) {
      const planErr = await planRes.json().catch(() => ({ error: "unknown" }));
      setError(`Error al generar planes: ${planErr.error || "intenta de nuevo"}`);
      setLoading(false);
      return;
    }

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

    setStep(stepFinCD);
    } catch (err) { setError(`Error: ${err instanceof Error ? err.message : "intenta de nuevo"}`); }
    finally { setLoading(false); }
  };

  const toggleRestriction = (r: string) => {
    if (r === "Ninguna") { setRestrictions(["Ninguna"]); return; }
    setRestrictions(prev => {
      const without = prev.filter(x => x !== "Ninguna");
      return without.includes(r) ? without.filter(x => x !== r) : [...without, r];
    });
  };

  if (validating) {
    return <div className="min-h-screen flex items-center justify-center"><Dumbbell className="h-8 w-8 text-primary animate-pulse" /></div>;
  }

  if (!valid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-2xl font-black mb-2">Código Inválido</h1>
          <p className="text-muted mb-6">Este código no es válido o ya fue utilizado.</p>
          <Link href="/" className="text-primary hover:underline">Ir al inicio</Link>
        </div>
      </main>
    );
  }

  // STEP FIN: Done
  if (step === stepFinCD) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">¡Registro Completo!</h1>
          <p className="text-muted mb-4">Tu entrenador va a preparar tu plan personalizado de entrenamiento y nutricion.</p>
          <p className="text-sm text-muted mb-6">Ingresa a tu plan para ver tus macros y descargar la app.</p>
          <Link
            href="/dashboard"
            className="inline-block gradient-primary text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 mb-4 w-full text-center"
          >
            Ir a Mi Plan
          </Link>
          <div className="glass-card rounded-xl p-4 mt-4 text-left">
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
          {step > 1 && step < stepFinCD && (
            <button onClick={() => setStep(step - 1)} className="text-muted hover:text-white"><ArrowLeft className="h-5 w-5" /></button>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Pablo Scarlatto Entrenamientos</span>
            </div>
            <div className="w-full bg-card-border rounded-full h-1.5">
              <div className="gradient-primary h-1.5 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </div>
          <span className="text-sm text-muted">{step}/{totalSteps}</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        {/* STEP REGISTER */}
        {step === stepRegister && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <UserPlus className="h-10 w-10 text-primary mx-auto mb-3" />
              <h2 className="text-2xl font-black">Bienvenido</h2>
              <p className="text-muted text-sm mt-1">Creá tu cuenta para recibir tu plan personalizado</p>
            </div>
            <form onSubmit={handleRegister} className="glass-card rounded-2xl p-6 space-y-4">
              {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl">{error}</div>}
              <div>
                <label className="block text-sm font-medium mb-2">Nombre Completo</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" required
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+598 99 123 456"
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Contraseña</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" required minLength={6}
                    className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-card-border accent-primary" />
                <span className="text-xs text-muted">
                  Acepto los <a href="/terminos" target="_blank" className="text-primary underline">Terminos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-primary underline">Politica de Privacidad</a>
                </span>
              </label>
              <button type="submit" disabled={loading || !acceptedTerms}
                className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>
          </div>
        )}

        {/* STEP GOAL: Objetivo nutricional (solo para planes sin objetivo definido) */}
        {needsGoal && step === stepGoalCD && (
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
            <button onClick={() => setStep(stepDataCD)} disabled={!nutritionalGoal}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${nutritionalGoal ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP DATA: Sex + Age */}
        {step === stepDataCD && (
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
            <button onClick={() => setStep(stepMedidasCD)} disabled={!sex || !age}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${sex && age ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP MEDIDAS: Weight + Height + Body Measurements */}
        {step === stepMedidasCD && (
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
                <p className="text-xs text-muted mb-3">Para medir tu progreso desde el dia 1.</p>
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
            <button onClick={() => setStep(stepActividadCD)} disabled={!weight || !height}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${weight && height ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP ACTIVIDAD: Activity + Restrictions */}
        {step === stepActividadCD && (
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
            <button onClick={() => setStep(stepFotosCD)} disabled={!activityLevel}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${activityLevel ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP FOTOS: Photos */}
        {step === stepFotosCD && (
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
              <p className="text-sm text-primary font-medium">🔒 Tus fotos son privadas</p>
              <p className="text-xs text-muted mt-1">Solo vos y tu entrenador pueden verlas.</p>
            </div>

            {error && <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl mb-4">{error}</div>}
            <button onClick={handleFinishSurvey} disabled={loading}
              className="w-full gradient-primary text-black font-bold py-4 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 mb-3 disabled:opacity-50">
              {loading ? "Generando tu plan..." : "Finalizar"} {!loading && <Check className="h-5 w-5" />}
            </button>
            <button onClick={handleFinishSurvey} disabled={loading}
              className="w-full text-sm text-muted hover:text-white text-center py-2 disabled:opacity-50">
              {loading ? "Procesando..." : "Saltar fotos por ahora"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

function PageErrorFallback() {
  const openInBrowser = () => {
    // Android: intent to open in default browser
    const url = window.location.href;
    try {
      window.location.href = `intent:${url}#Intent;end`;
    } catch {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-danger" />
        </div>
        <h2 className="text-xl font-black mb-2">Abri el link en tu navegador</h2>
        <p className="text-muted text-sm mb-6">
          Este enlace no funciona desde la camara. Copia el link y pegalo en Chrome o Safari.
        </p>
        <button onClick={openInBrowser}
          className="gradient-primary text-black font-bold px-6 py-3 rounded-xl hover:opacity-90 mb-3 w-full">
          Abrir en navegador
        </button>
        <button onClick={() => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
          }
        }}
          className="text-primary text-sm hover:underline">
          Copiar link
        </button>
      </div>
    </div>
  );
}

class PageBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <PageErrorFallback />;
    return this.props.children;
  }
}

export default function ClienteDirectoPage() {
  return (
    <PageBoundary>
      <ClienteDirectoForm />
    </PageBoundary>
  );
}
