"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Dumbbell, UserPlus, Check, Eye, EyeOff, Camera, Upload,
  ArrowRight, ArrowLeft,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { calculateMacros } from "@/lib/harris-benedict";
import type { Sex, ActivityLevel } from "@/types";

const ACTIVITY_LABELS: Record<ActivityLevel, { label: string; desc: string }> = {
  sedentario: { label: "Sedentario", desc: "Trabajo de oficina, poco movimiento" },
  moderado: { label: "Moderado", desc: "Ejercicio ligero 1-3 días/semana" },
  activo: { label: "Activo", desc: "Ejercicio moderado 3-5 días/semana" },
  "muy-activo": { label: "Muy Activo", desc: "Ejercicio intenso 6-7 días/semana" },
};

const RESTRICTIONS = ["Ninguna", "Vegetariano", "Vegano", "Sin gluten (celíaco)", "Sin lactosa", "Sin frutos secos", "Diabetes", "Otra"];

function ClienteDirectoForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [step, setStep] = useState(1); // 1=register, 2=sex+age, 3=weight+height, 4=activity, 5=photos, 6=done

  // Registration
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  // Survey
  const [sex, setSex] = useState<Sex | "">("");
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | "">("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [arms, setArms] = useState("");
  const [legs, setLegs] = useState("");

  // Photos
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoSide, setPhotoSide] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);

  const totalSteps = 6;

  useEffect(() => {
    if (!code) { setValidating(false); return; }
    fetch(`/api/free-access?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid || data.plan_slug === "direct-client") setValid(true);
        setValidating(false);
      })
      .catch(() => setValidating(false));
  }, [code]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName, phone } },
      });
      if (authError) { setError(authError.message); setLoading(false); return; }
      if (data.user) {
        setUserId(data.user.id);
        // Mark code as used
        await supabase.from("free_access_codes")
          .update({ used: true, used_by: data.user.id })
          .eq("code", code);
        // Mark as direct client (no prices)
        await supabase.from("profiles")
          .update({ phone, full_name: fullName })
          .eq("id", data.user.id);
        setStep(2);
      }
    } catch { setError("Error inesperado."); }
    finally { setLoading(false); }
  };

  const handleFinishSurvey = async () => {
    if (!userId || !sex || !activityLevel) return;
    const macros = calculateMacros(sex, Number(weight), Number(height), Number(age), activityLevel, "quema-grasa");

    await supabase.from("surveys").insert({
      user_id: userId,
      age: Number(age), sex, weight: Number(weight), height: Number(height),
      activity_level: activityLevel, dietary_restrictions: restrictions,
      objective: "direct-client",
      tmb: macros.tmb, tdee: macros.tdee, target_calories: macros.targetCalories,
      protein: macros.protein, carbs: macros.carbs, fats: macros.fats,
    });

    // Create subscription so client appears in admin and has an active plan
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);
    await supabase.from("subscriptions").insert({
      user_id: userId,
      duration: "1-ano",
      amount_paid: 0,
      currency: "USD",
      start_date: new Date().toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
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

    setStep(6);
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

  // STEP 6: Done
  if (step === 6) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">¡Registro Completo!</h1>
          <p className="text-muted mb-4">Tu entrenador va a preparar tu plan personalizado de entrenamiento y nutrición.</p>
          <p className="text-sm text-muted mb-6">Te notificaremos cuando esté listo. Mientras tanto, podés descargar la app.</p>
          <Link
            href="/compra-exitosa"
            className="inline-block gradient-primary text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 mb-4"
          >
            Descargar App
          </Link>
          <br />
          <Link href="/login" className="text-sm text-primary hover:underline">
            Iniciar Sesión
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Header */}
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-4">
          {step > 1 && step < 6 && (
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
        {/* STEP 1: Register */}
        {step === 1 && (
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
              <button type="submit" disabled={loading}
                className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: Sex + Age */}
        {step === 2 && (
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
            <button onClick={() => setStep(3)} disabled={!sex || !age}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${sex && age ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP 3: Weight + Height + Body Measurements */}
        {step === 3 && (
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
            <button onClick={() => setStep(4)} disabled={!weight || !height}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${weight && height ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP 4: Activity + Restrictions */}
        {step === 4 && (
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
            <button onClick={() => setStep(5)} disabled={!activityLevel}
              className={`w-full mt-8 font-bold py-4 rounded-xl flex items-center justify-center gap-2 ${activityLevel ? "gradient-primary text-black hover:opacity-90" : "bg-card-border text-muted cursor-not-allowed"}`}>
              Siguiente <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* STEP 5: Photos */}
        {step === 5 && (
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

export default function ClienteDirectoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Dumbbell className="h-8 w-8 text-primary animate-pulse" /></div>}>
      <ClienteDirectoForm />
    </Suspense>
  );
}
