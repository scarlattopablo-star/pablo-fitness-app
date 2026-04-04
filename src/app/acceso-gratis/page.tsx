"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Gift, Check, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

function AccesoGratisForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code") || "";

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [planName, setPlanName] = useState("");
  const [duration, setDuration] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mode, setMode] = useState<"register" | "login">("register");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  useEffect(() => {
    if (!code) {
      setValidating(false);
      return;
    }
    fetch(`/api/free-access?code=${code}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setValid(true);
          setPlanName(data.plan_slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()));
          setDuration(data.duration);
        }
        setValidating(false);
      })
      .catch(() => setValidating(false));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        // Existing user: just log in and redirect
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setError(loginError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : loginError.message);
          setLoading(false);
          return;
        }
        window.location.href = "/dashboard";
        return;
      }

      // New user: register
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (authError) {
        // If user already exists, switch to login mode
        if (authError.message.toLowerCase().includes("already registered") || authError.message.toLowerCase().includes("already been registered")) {
          setMode("login");
          setError("Ya tenes cuenta con este email. Ingresa tu contraseña para acceder.");
          setLoading(false);
          return;
        }
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Atomically claim code (prevents race condition)
        const claimRes = await fetch("/api/free-access", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, userId: authData.user.id }),
        });
        if (!claimRes.ok) {
          setError("Este codigo ya fue utilizado.");
          setLoading(false);
          return;
        }

        // Create subscription via server-side API (bypasses RLS)
        const subRes = await fetch("/api/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: authData.user.id, duration, amountPaid: 0, currency: "UYU" }),
        });
        if (!subRes.ok) {
          const subErr = await subRes.json();
          setError(`Error creando suscripcion: ${subErr.error}`);
          setLoading(false);
          return;
        }

        setSuccess(true);
      }
    } catch {
      setError("Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Dumbbell className="h-8 w-8 text-primary animate-pulse" />
      </div>
    );
  }

  if (!valid) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-danger" />
          </div>
          <h1 className="text-2xl font-black mb-2">Código Inválido</h1>
          <p className="text-muted mb-6">Este código de acceso no es válido o ya fue utilizado.</p>
          <Link href="/planes" className="text-primary hover:underline">Ver planes disponibles</Link>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">¡Acceso Activado!</h1>
          <p className="text-muted mb-4">Tu plan {planName} esta listo.</p>
          <p className="text-sm text-muted mb-6">Completa la encuesta para que tu entrenador pueda armar tu plan personalizado.</p>
          <Link
            href="/encuesta-directa"
            className="inline-block gradient-primary text-black font-bold px-8 py-3 rounded-xl hover:opacity-90 w-full text-center mb-4"
          >
            Completar Encuesta
          </Link>
          <div className="glass-card rounded-xl p-4 text-left mb-4">
            <p className="font-bold text-sm mb-2">Descarga la app en tu celular</p>
            <p className="text-xs text-muted mb-2">Una vez dentro de tu plan podras instalar la app:</p>
            <div className="space-y-1 text-xs text-muted">
              <p><span className="text-primary font-bold">iPhone:</span> Safari → Compartir (⬆) → Agregar a Inicio</p>
              <p><span className="text-primary font-bold">Android:</span> Chrome → Menu (⋮) → Instalar app</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="block text-sm text-primary hover:underline"
          >
            Ir a Mi Plan
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-black">Acceso Gratis</h1>
          <p className="text-muted text-sm mt-2">
            Tenés acceso gratuito al plan <span className="text-primary font-bold">{planName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          {error && (
            <div className={`${mode === "login" ? "bg-primary/10 border-primary/30 text-primary" : "bg-danger/10 border-danger/30 text-danger"} border text-sm p-3 rounded-xl`}>{error}</div>
          )}

          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-2">Nombre Completo</label>
              <input
                type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="Tu nombre completo" required
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com" required
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "login" ? "Tu contraseña" : "Minimo 6 caracteres"} required minLength={6}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          {mode === "register" && (
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-card-border accent-primary" />
              <span className="text-xs text-muted">
                Acepto los <a href="/terminos" target="_blank" className="text-primary underline">Terminos y Condiciones</a> y la <a href="/privacidad" target="_blank" className="text-primary underline">Politica de Privacidad</a>
              </span>
            </label>
          )}
          <button type="submit" disabled={loading || (mode === "register" && !acceptedTerms)}
            className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
            {loading ? (mode === "login" ? "Ingresando..." : "Activando...") : (mode === "login" ? "Ingresar" : "Activar Acceso Gratis")}
          </button>
          {mode === "register" && (
            <p className="text-center text-sm text-muted">
              ¿Ya tenes cuenta?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }} className="text-primary hover:underline font-medium">
                Ingresa aca
              </button>
            </p>
          )}
          {mode === "login" && (
            <p className="text-center text-sm text-muted">
              ¿No tenes cuenta?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }} className="text-primary hover:underline font-medium">
                Registrate
              </button>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}

export default function AccesoGratisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Dumbbell className="h-8 w-8 text-primary animate-pulse" /></div>}>
      <AccesoGratisForm />
    </Suspense>
  );
}
