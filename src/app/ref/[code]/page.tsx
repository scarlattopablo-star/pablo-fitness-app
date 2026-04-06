"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { Dumbbell, Gift, ArrowRight, Loader2, Percent } from "lucide-react";

function RefContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [referrerName, setReferrerName] = useState("");

  useEffect(() => {
    fetch(`/api/referral?code=${code}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setValid(true);
          setReferrerName(data.referrerName);
          // Save referral code for checkout
          localStorage.setItem("referralCode", code.toUpperCase());
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
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
          <h1 className="text-2xl font-black mb-2">Codigo no valido</h1>
          <p className="text-muted mb-6">Este codigo de referido no existe.</p>
          <Link href="/planes" className="text-primary hover:underline">Ver planes disponibles</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md text-center">
        {/* Header */}
        <div className="mb-6">
          <Dumbbell className="h-8 w-8 text-primary mx-auto mb-3" />
          <p className="text-sm text-muted">Pablo Scarlatto Entrenamientos</p>
        </div>

        {/* Discount card */}
        <div className="glass-card rounded-3xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 gradient-primary text-black font-black text-sm px-4 py-2 rounded-bl-2xl flex items-center gap-1">
            <Percent className="h-4 w-4" />
            15% OFF
          </div>

          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl font-black mb-2">
            {referrerName} te invita
          </h1>
          <p className="text-muted mb-4">
            Tenes un <span className="text-primary font-bold">15% de descuento</span> en tu primer plan de entrenamiento personalizado.
          </p>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium mb-2">Tu plan incluye:</p>
            <ul className="text-xs text-muted space-y-1.5 text-left">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Rutina de entrenamiento personalizada
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Plan de nutricion con macros calculados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Seguimiento de progreso con fotos
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> Chat directo con tu entrenador
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span> App propia en tu celular
              </li>
            </ul>
          </div>

          <Link
            href="/planes"
            className="block w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 transition-opacity text-lg flex items-center justify-center gap-2"
          >
            Ver Planes con Descuento <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <p className="text-xs text-muted">
          El descuento se aplica automaticamente al elegir tu plan.
        </p>
      </div>
    </main>
  );
}

export default function RefPage({ params }: { params: Promise<{ code: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>}>
      <RefContent params={params} />
    </Suspense>
  );
}
