"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Gift, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegistroGratisPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create Supabase auth account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error("No se pudo crear la cuenta");

      const userId = authData.user.id;

      // 2. Update profile
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", userId);

      // 3. Create trial subscription (7 days, $0)
      const res = await fetch("/api/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          duration: "7-dias",
          amountPaid: 0,
          currency: "UYU",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al crear suscripción");
      }

      setSuccess(true);

      // Redirect to dashboard after brief success message
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrarte";
      if (msg.includes("already registered")) {
        setError("Este email ya está registrado. Intentá iniciar sesión.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-sm animate-fade-in-up">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">¡Cuenta creada!</h1>
          <p className="text-muted mb-2">
            Tenés 7 días gratis para explorar la app.
          </p>
          <p className="text-muted text-sm">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Probá Gratis</h1>
          <p className="text-muted text-sm">
            7 días gratis para explorar la app. Sin tarjeta de crédito.
          </p>
        </div>

        {/* What's included */}
        <div className="glass-card p-4 rounded-2xl mb-6 space-y-2">
          <p className="text-xs text-muted uppercase tracking-wider font-medium mb-2">
            Incluido en la prueba
          </p>
          {[
            "Biblioteca de ejercicios con videos",
            "Rutina de ejemplo",
            "Ver la comunidad Gym Bro",
            "Explorar el ranking",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl bg-card-bg border border-card-border text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 rounded-xl bg-card-bg border border-card-border text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 rounded-xl bg-card-bg border border-card-border text-sm focus:outline-none focus:border-emerald-500/50 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-card-border accent-emerald-500"
            />
            <span className="text-xs text-muted">
              Acepto los{" "}
              <a href="/terminos" target="_blank" className="text-emerald-400 underline hover:opacity-80">
                Términos y Condiciones
              </a>{" "}
              y la{" "}
              <a href="/privacidad" target="_blank" className="text-emerald-400 underline hover:opacity-80">
                Política de Privacidad
              </a>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => setAcceptedPrivacy(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-card-border accent-emerald-500"
            />
            <span className="text-xs text-muted">
              Acepto que mis datos personales sean tratados conforme a la{" "}
              <a href="/privacidad" target="_blank" className="text-emerald-400 underline hover:opacity-80">
                Política de Privacidad
              </a>{" "}
              para la prestación del servicio de entrenamiento personalizado.
            </span>
          </label>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !acceptedTerms || !acceptedPrivacy}
            className="w-full h-12 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creando cuenta..." : "Empezar Prueba Gratis"}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-emerald-400 hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
