"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";
import { getPlanBySlug, DURATION_LABELS, formatPrice } from "@/lib/plans-data";

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><RatLoader size={64} /></div>}>
      <RegistroForm />
    </Suspense>
  );
}

function RegistroForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedComms, setAcceptedComms] = useState(false);

  const searchParams = useSearchParams();
  const planSlug = searchParams.get("plan") || "";
  const duration = searchParams.get("duration") || "3-meses";
  const plan = getPlanBySlug(planSlug);
  const price = plan?.prices[duration as keyof typeof plan.prices] || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create account in Supabase
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("Este email ya está registrado. Intentá iniciar sesión.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError("Error al crear la cuenta. Intentá de nuevo.");
        setLoading(false);
        return;
      }

      // 1.5 Auto-confirm email (bypass SMTP issues)
      const confirmRes = await fetch("/api/confirm-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authData.user.id }),
      });

      if (!confirmRes.ok) {
        console.warn("Email confirm failed, continuing anyway...");
      }

      // 1.6 Sign in immediately after confirming (retry once if needed)
      for (let attempt = 0; attempt < 2; attempt++) {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 1000));
        const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
        if (signInData?.session?.access_token) break;
      }

      // 2. Ensure profile exists and update with phone
      await supabase
        .from("profiles")
        .upsert({ id: authData.user.id, email, full_name: fullName, ...(phone ? { phone } : {}) }, { onConflict: "id" });

      // 2.5 Save pending survey from /encuesta if it exists
      const pendingSurvey = localStorage.getItem("pendingSurvey");
      if (pendingSurvey) {
        try {
          const survey = JSON.parse(pendingSurvey);
          await supabase.from("surveys").insert({
            user_id: authData.user.id,
            age: survey.age,
            sex: survey.sex,
            weight: survey.weight,
            height: survey.height,
            activity_level: survey.activityLevel,
            dietary_restrictions: survey.restrictions || [],
            objective: survey.planSlug || planSlug || "quema-grasa",
            nutritional_goal: survey.nutritionalGoal || null,
            tmb: survey.macros.tmb,
            tdee: survey.macros.tdee,
            target_calories: survey.macros.targetCalories,
            protein: survey.macros.protein,
            carbs: survey.macros.carbs,
            fats: survey.macros.fats,
            // Campos v2 (encuesta extendida) — spread solo lo que el usuario completo
            ...(survey.extraSurveyFields || {}),
          });
          localStorage.removeItem("pendingSurvey");
        } catch {
          // Silently fail if survey save fails
        }
      }

      // 3. Create MercadoPago preference and redirect to payment
      if (plan && price > 0) {
        const referralCode = localStorage.getItem("referralCode") || "";
        const finalPrice = referralCode ? Math.round(price * 0.85) : price;

        const response = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planName: plan.name,
            planSlug: plan.slug,
            duration,
            price: finalPrice,
            email,
            name: fullName,
            userId: authData.user.id,
            referralCode,
          }),
        });

        const data = await response.json();

        if (data.init_point) {
          // Redirect to MercadoPago checkout
          window.location.href = data.init_point;
          return;
        }
      }

      // If no plan selected or free, show success then redirect to dashboard
      window.location.href = "/compra-exitosa";
    } catch (err) {
      setError("Error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-36 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
          <h1 className="text-2xl font-black">Crear Cuenta</h1>
          <p className="text-muted text-sm mt-2">Registrate para acceder a tu plan</p>
        </div>

        {plan && (
          <div className="glass-card rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted">Plan seleccionado</p>
              <p className="font-bold">{plan.name} - {DURATION_LABELS[duration]}</p>
            </div>
            <span className="text-primary font-bold text-lg">${formatPrice(price)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Nombre Completo</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo"
              required
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Teléfono</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+598 99 123 456"
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-card-border accent-primary"
            />
            <span className="text-xs text-muted">
              Acepto los{" "}
              <a href="/terminos" target="_blank" className="text-primary underline hover:opacity-80">
                Terminos y Condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacidad" target="_blank" className="text-primary underline hover:opacity-80">
                Politica de Privacidad
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-card-border accent-primary"
            />
            <span className="text-xs text-muted">
              Acepto que mis datos personales sean tratados conforme a la{" "}
              <a href="/privacidad" target="_blank" className="text-primary underline hover:opacity-80">
                Política de Privacidad
              </a>{" "}
              para la prestación del servicio de entrenamiento personalizado.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedComms}
              onChange={(e) => setAcceptedComms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-card-border accent-primary"
            />
            <span className="text-xs text-muted">
              Acepto recibir comunicaciones sobre mi plan de entrenamiento por email, notificaciones push, chat y WhatsApp.
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !acceptedTerms || !acceptedPrivacy || !acceptedComms}
            className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Procesando..." : plan ? `Crear Cuenta y Pagar $${formatPrice(price)}` : "Crear Cuenta"}
          </button>

          <p className="text-xs text-muted text-center">
            {plan ? "Serás redirigido a MercadoPago para completar el pago" : ""}
          </p>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
