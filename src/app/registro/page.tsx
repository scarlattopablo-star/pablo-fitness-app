"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Dumbbell, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getPlanBySlug, DURATION_LABELS, formatPrice } from "@/lib/plans-data";

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Dumbbell className="h-8 w-8 text-primary animate-pulse" /></div>}>
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

      // 2. Update profile with phone
      if (phone) {
        await supabase
          .from("profiles")
          .update({ phone, full_name: fullName })
          .eq("id", authData.user.id);
      }

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
            tmb: survey.macros.tmb,
            tdee: survey.macros.tdee,
            target_calories: survey.macros.targetCalories,
            protein: survey.macros.protein,
            carbs: survey.macros.carbs,
            fats: survey.macros.fats,
          });
          localStorage.removeItem("pendingSurvey");
        } catch {
          // Silently fail if survey save fails
        }
      }

      // 3. Create MercadoPago preference and redirect to payment
      if (plan && price > 0) {
        const response = await fetch("/api/mercadopago/create-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planName: plan.name,
            planSlug: plan.slug,
            duration,
            price,
            email,
            name: fullName,
            userId: authData.user.id,
          }),
        });

        const data = await response.json();

        if (data.init_point) {
          // Redirect to MercadoPago checkout
          window.location.href = data.init_point;
          return;
        }
      }

      // If no plan selected or free, go to dashboard
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
            <label className="block text-sm font-medium mb-2">Teléfono (opcional)</label>
            <input
              type="tel"
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

          <button
            type="submit"
            disabled={loading || !acceptedTerms}
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
