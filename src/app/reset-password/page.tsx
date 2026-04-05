"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Dumbbell, Eye, EyeOff, Check, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase automatically picks up the token from the URL hash
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if already in a session (link clicked)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-2xl font-black mb-2">Contraseña Actualizada</h1>
          <p className="text-muted mb-6">Tu contraseña se cambió correctamente.</p>
          <Link
            href="/login"
            className="inline-block gradient-primary text-black font-bold px-8 py-3 rounded-xl hover:opacity-90"
          >
            Iniciar Sesión
          </Link>
        </div>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted">Verificando enlace...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-24 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
          <h1 className="text-2xl font-black">Nueva Contraseña</h1>
          <p className="text-muted text-sm mt-2">Elegí tu nueva contraseña</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Nueva Contraseña</label>
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

          <div>
            <label className="block text-sm font-medium mb-2">Confirmar Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              minLength={6}
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Guardando..." : "Guardar Nueva Contraseña"}
          </button>
        </form>
      </div>
    </main>
  );
}
