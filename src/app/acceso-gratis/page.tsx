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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        // Mark code as used
        await supabase
          .from("free_access_codes")
          .update({ used: true, used_by: authData.user.id })
          .eq("code", code);

        // Create subscription
        const endDate = new Date();
        if (duration === "1-mes") endDate.setMonth(endDate.getMonth() + 1);
        else if (duration === "3-meses") endDate.setMonth(endDate.getMonth() + 3);
        else if (duration === "6-meses") endDate.setMonth(endDate.getMonth() + 6);
        else endDate.setFullYear(endDate.getFullYear() + 1);

        await supabase.from("subscriptions").insert({
          user_id: authData.user.id,
          duration,
          amount_paid: 0,
          currency: "USD",
          start_date: new Date().toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          status: "active",
        });

        setSuccess(true);
      }
    } catch {
      setError("Error inesperado. Intentá de nuevo.");
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
          <p className="text-muted mb-6">Tu plan {planName} está listo. Iniciá sesión para acceder.</p>
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
            <div className="bg-danger/10 border border-danger/30 text-danger text-sm p-3 rounded-xl">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Nombre Completo</label>
            <input
              type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre completo" required
              className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary"
            />
          </div>
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
                placeholder="Mínimo 6 caracteres" required minLength={6}
                className="w-full bg-card-bg border border-card-border rounded-xl px-4 py-3 pr-12 focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full gradient-primary text-black font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50">
            {loading ? "Activando..." : "Activar Acceso Gratis"}
          </button>
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
