"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Eye, EyeOff, Mail, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login")) {
          setError("Email o contraseña incorrectos.");
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if admin
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", data.user.id)
          .single();

        if (profile?.is_admin) {
          router.push("/admin");
        } else {
          // Check if user has completed a survey
          const { data: survey } = await supabase
            .from("surveys")
            .select("id")
            .eq("user_id", data.user.id)
            .limit(1)
            .single();

          if (!survey) {
            // No survey - send to survey flow
            router.push("/encuesta-directa");
          } else {
            router.push("/dashboard");
          }
        }
      }
    } catch {
      setError("Error inesperado. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError("");

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setResetError(error.message);
    } else {
      setResetSent(true);
    }
    setResetLoading(false);
  };

  if (showReset) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-36 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
            </Link>
            <h1 className="text-2xl font-black">Recuperar Contraseña</h1>
            <p className="text-muted text-sm mt-2">Te enviaremos un email para crear una nueva contraseña</p>
          </div>

          {resetSent ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-black" />
              </div>
              <h2 className="font-bold text-lg mb-2">Email Enviado</h2>
              <p className="text-sm text-muted mb-6">
                Revisá tu bandeja de entrada en <strong className="text-white">{resetEmail}</strong>.
                Hace click en el link del email para crear tu nueva contraseña.
              </p>
              <button
                onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(""); }}
                className="text-primary hover:underline text-sm"
              >
                Volver al login
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="glass-card rounded-2xl p-6 space-y-4">
              {resetError && (
                <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl">
                  {resetError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={resetLoading}
                className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Mail className="h-4 w-4" />
                {resetLoading ? "Enviando..." : "Enviar Email de Recuperación"}
              </button>
            </form>
          )}

          <p className="text-center mt-6">
            <button
              onClick={() => { setShowReset(false); setResetError(""); }}
              className="text-sm text-muted hover:text-white transition-colors flex items-center gap-1 mx-auto"
            >
              <ArrowLeft className="h-4 w-4" /> Volver al login
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-36 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
          <h1 className="text-2xl font-black">Iniciar Sesión</h1>
          <p className="text-muted text-sm mt-2">Accedé a tu plan personalizado</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

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
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
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

          <button
            type="button"
            onClick={() => { setShowReset(true); setResetEmail(email); }}
            className="text-sm text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          ¿No tenés cuenta?{" "}
          <Link href="/registro" className="text-primary hover:underline">
            Registrate
          </Link>
        </p>

        <p className="text-center mt-8">
          <Link href="/" className="text-sm text-muted hover:text-white transition-colors">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
