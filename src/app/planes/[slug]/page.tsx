"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home, Wind,
  ArrowLeft, Check, ArrowRight, Clock, Target, Zap,
} from "lucide-react";
import { getPlanBySlug, DURATION_LABELS, getDiscountPercentage, formatPrice } from "@/lib/plans-data";
import type { Duration } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home, Wind,
};

const DURATIONS: Duration[] = ["1-mes", "3-meses", "6-meses", "1-ano"];

export default function PlanDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const plan = getPlanBySlug(slug);
  const [selectedDuration, setSelectedDuration] = useState<Duration>("3-meses");
  const [referralCode, setReferralCode] = useState("");
  const [referrerName, setReferrerName] = useState("");

  useEffect(() => {
    const code = localStorage.getItem("referralCode");
    if (code) {
      setReferralCode(code);
      fetch(`/api/referral?code=${code}`)
        .then(r => r.json())
        .then(d => { if (d.valid) setReferrerName(d.referrerName); })
        .catch(() => {});
    }
  }, []);

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Plan no encontrado</h1>
          <Link href="/planes" className="text-primary hover:underline">
            Volver a planes
          </Link>
        </div>
      </div>
    );
  }

  const Icon = ICON_MAP[plan.icon] || Dumbbell;
  const price = plan.prices[selectedDuration];

  return (
    <main className="min-h-screen pb-20">
      {/* HEADER */}
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/planes" className="text-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="font-bold">{plan.name}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* LEFT: Info */}
          <div className="lg:col-span-3">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
              style={{ backgroundColor: `${plan.color}20` }}
            >
              <Icon className="h-8 w-8" style={{ color: plan.color }} />
            </div>

            <h1 className="text-3xl sm:text-4xl font-black mb-4">{plan.name}</h1>
            <p className="text-lg text-muted mb-8">{plan.description}</p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="glass-card rounded-xl p-4 text-center">
                <Clock className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted">Duración</p>
                <p className="font-bold text-sm">Flexible</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <Target className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted">Nivel</p>
                <p className="font-bold text-sm">Todos</p>
              </div>
              <div className="glass-card rounded-xl p-4 text-center">
                <Zap className="h-5 w-5 text-primary mx-auto mb-2" />
                <p className="text-xs text-muted">Incluye</p>
                <p className="font-bold text-sm">Completo</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">Qué incluye</h2>
            <ul className="space-y-3 mb-8">
              {plan.includes.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <h2 className="text-xl font-bold mb-4">Cómo funciona</h2>
            <div className="space-y-4">
              {[
                "Elegís este plan y la duración que prefieras",
                "Completás una encuesta rápida (edad, peso, altura, nivel de actividad)",
                "Creás tu cuenta y completás el pago de forma segura",
                "Calculamos automáticamente tus calorías y macros de forma personalizada",
                "Recibís tu plan de entrenamiento y nutrición 100% personalizado",
                "Accedés a videos de cada ejercicio y seguís tu progreso",
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <p className="text-muted pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Pricing Card */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl p-6 sticky top-24">
              <h3 className="font-bold text-lg mb-4">Elegí tu duración</h3>

              <div className="space-y-2 mb-6">
                {DURATIONS.map((d) => {
                  const p = plan.prices[d];
                  const discount = getDiscountPercentage(d);
                  const monthly = d === "1-mes" ? p :
                    d === "3-meses" ? Math.round(p / 3) :
                    d === "6-meses" ? Math.round(p / 6) :
                    Math.round(p / 12);

                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDuration(d)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        selectedDuration === d
                          ? "border-primary bg-primary/5"
                          : "border-card-border hover:border-muted"
                      }`}
                    >
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{DURATION_LABELS[d]}</span>
                          {discount > 0 && (
                            <span className="text-xs bg-primary text-black px-2 py-0.5 rounded-full font-bold">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        {d !== "1-mes" && (
                          <p className="text-xs text-muted">${formatPrice(monthly)}/mes</p>
                        )}
                      </div>
                      <span className="font-bold text-lg">${formatPrice(p)}</span>
                    </button>
                  );
                })}
              </div>

              {plan.isCouple && (
                <p className="text-xs text-muted text-center mb-4">
                  * Este plan incluye 2 personas
                </p>
              )}

              {/* Referral discount banner */}
              {referralCode && referrerName && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <span className="text-xl">🎁</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-primary">15% OFF por invitacion de {referrerName}</p>
                    <p className="text-[10px] text-muted">Descuento aplicado automaticamente</p>
                  </div>
                </div>
              )}

              <div className="border-t border-card-border pt-4 mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-muted">Plan {plan.name}</span>
                  {referralCode ? (
                    <div className="flex items-center gap-2">
                      <span className="text-muted line-through text-sm">${formatPrice(price)}</span>
                      <span className="font-bold text-primary">${formatPrice(Math.round(price * 0.85))}</span>
                    </div>
                  ) : (
                    <span className="font-bold">${formatPrice(price)}</span>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted">Duración</span>
                  <span>{DURATION_LABELS[selectedDuration]}</span>
                </div>
                {referralCode && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-primary text-sm font-medium">Descuento referido</span>
                    <span className="text-primary text-sm font-bold">-${formatPrice(price - Math.round(price * 0.85))}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/encuesta?plan=${plan.slug}&duration=${selectedDuration}${referralCode ? `&ref=${referralCode}` : ""}`}
                className="block w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {referralCode ? "Comenzar con 15% OFF" : "Comenzar Ahora"} <ArrowRight className="h-5 w-5" />
              </Link>

              <p className="text-xs text-muted text-center mt-3">
                Pago seguro con MercadoPago
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
