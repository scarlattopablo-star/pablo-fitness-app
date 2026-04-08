"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Gift, Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { RatLoader } from "@/components/rat-loader";
import { supabase } from "@/lib/supabase";

function AccesoGratisForm() {
  const router = useRouter();

  // Read code from URL without useSearchParams (fails in WhatsApp/Instagram browser)
  const [code, setCode] = useState<string | null>(null);
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

  // Read code from URL safely (compatible with in-app browsers: WhatsApp, Instagram, etc.)
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
    if (!code) {
      setValidating(false);
      return;
    }
    // Safety timeout: if validation takes > 5s, stop loading
    const timeout = setTimeout(() => setValidating(false), 5000);
    fetch(`/api/free-access?code=${code}`)
      .then(r => {
        if (!r.ok) { setValidating(false); clearTimeout(timeout); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.valid) {
          setValid(true);
          setPlanName(data.plan_slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()));
          setDuration(data.duration);
        }
        setValidating(false);
        clearTimeout(timeout);
      })
      .catch(() => { setValidating(false); clearTimeout(timeout); });
    return () => clearTimeout(timeout);
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (mode === "login") {
        // Existing user: log in, claim code, create subscription, then redirect
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
          setError(loginError.message === "Invalid login credentials"
            ? "Email o contraseña incorrectos"
            : loginError.message);
          setLoading(false);
          return;
        }

        if (loginData.user && code) {
          // Claim code for existing user
          const claimRes = await fetch("/api/free-access", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, userId: loginData.user.id }),
          });

          if (claimRes.ok) {
            // Create subscription if they don't already have one active
            await fetch("/api/create-subscription", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: loginData.user.id, duration, amountPaid: 0, currency: "UYU" }),
            });
          }
        }

        setSuccess(true);
        return;
      }

      // New user: register
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/encuesta-directa`,
        },
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

  // Auto-redirect when success — must be BEFORE any conditional returns (React hooks rules)
  useEffect(() => {
    if (!success) return;
    let cancelled = false;

    async function redirect() {
      // Wait a moment for session to be established after signup
      await new Promise(r => setTimeout(r, 500));
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (session?.user) {
        const { data: survey } = await supabase
          .from("surveys")
          .select("id")
          .eq("user_id", session.user.id)
          .limit(1)
          .maybeSingle();
        router.push(survey ? "/dashboard" : "/encuesta-directa");
      } else {
        // If no session (e.g., email confirmation pending), try waiting a bit more
        await new Promise(r => setTimeout(r, 1500));
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (retrySession?.user) {
          const { data: survey } = await supabase
            .from("surveys")
            .select("id")
            .eq("user_id", retrySession.user.id)
            .limit(1)
            .maybeSingle();
          router.push(survey ? "/dashboard" : "/encuesta-directa");
        } else {
          router.push("/encuesta-directa");
        }
      }
    }

    redirect();
    return () => { cancelled = true; };
  }, [success, router]);

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RatLoader size={64} />
      </div>
    );
  }

  if (!valid && !validating) {
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
          <h1 className="text-2xl font-black mb-2">¡Cuenta Creada!</h1>
          <p className="text-muted mb-6">Tu plan {planName} esta reservado.</p>

          <div className="glass-card rounded-2xl p-6 mb-6 text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <span className="text-xl">📧</span>
              </div>
              <div>
                <p className="font-bold text-sm">Revisa tu email</p>
                <p className="text-xs text-primary font-medium">{email}</p>
              </div>
            </div>
            <p className="text-xs text-muted leading-relaxed">
              Te enviamos un email de confirmacion. <strong className="text-foreground">Toca el link del email</strong> para activar tu cuenta y entrar directamente a completar tu encuesta.
            </p>
            <div className="mt-4 bg-warning/10 border border-warning/20 rounded-xl p-3">
              <p className="text-xs text-warning font-bold">Si no lo ves, revisa la carpeta de spam o correo no deseado.</p>
            </div>
          </div>

          <a href="/login" className="text-primary text-sm hover:underline font-medium">
            Ya confirme mi email → Iniciar sesion
          </a>
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
  return <AccesoGratisForm />;
}
