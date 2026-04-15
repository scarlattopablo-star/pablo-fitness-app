"use client";

import Link from "next/link";
import { use, useState, useEffect } from "react";
import {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home, Wind,
  ArrowLeft, Check, ArrowRight, Clock, Target, Zap, Star,
  Shield as ShieldIcon,
} from "lucide-react";
import { getPlanBySlug, DURATION_LABELS, getDiscountPercentage, formatPrice } from "@/lib/plans-data";
import CountdownTimer from "@/components/countdown-timer";
import type { Duration } from "@/types";

const PROMO_END = "2026-04-30T23:59:59-03:00";

const CHECKOUT_TESTIMONIOS = [
  { name: "Martin R.", text: "Baje 12kg en 4 meses. El seguimiento personalizado hace toda la diferencia." },
  { name: "Lucia S.", text: "Nunca pense que iba a disfrutar entrenar. Pablo te cambia la mentalidad." },
  { name: "Diego M.", text: "La app es super completa y el chat directo con Pablo es lo mejor." },
];

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
              {/* Free month badge */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 text-center">
                <p className="text-sm font-bold text-emerald-400">Primer mes GRATIS</p>
                <p className="text-[10px] text-muted">Proba todo sin compromiso. Despues elegis si continuar.</p>
              </div>

              {/* Countdown */}
              <CountdownTimer
                targetDate={PROMO_END}
                label="Oferta termina en"
                variant="card"
                className="mb-4"
              />

              <h3 className="font-bold text-lg mb-4">Elegi tu duracion</h3>

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
                className="block w-full gradient-primary text-black font-bold text-center py-4 rounded-xl hover:opacity-90 transition-opacity text-lg"
              >
                {referralCode ? "Empezar Gratis con 15% OFF" : "Empeza tu Transformacion"} →
              </Link>

              <p className="text-xs text-muted text-center mt-3">
                Pago seguro con MercadoPago — Primer mes sin cargo
              </p>

              {/* Guarantee */}
              <div className="flex items-center gap-2 mt-4 p-3 bg-emerald-500/5 rounded-xl">
                <ShieldIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                <p className="text-[11px] text-muted">
                  <strong className="text-emerald-400">Garantia:</strong> Si no te convence, no pagas. Sin compromiso.
                </p>
              </div>

              {/* Cupos */}
              <div className="flex items-center gap-2 mt-3 text-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                <p className="text-[11px] text-red-400 font-medium">Solo 15 cupos disponibles este mes</p>
              </div>

              {/* Mini testimonials */}
              <div className="mt-5 space-y-3 border-t border-card-border pt-4">
                <p className="text-[10px] text-muted font-bold tracking-wider">LO QUE DICEN NUESTROS CLIENTES</p>
                {CHECKOUT_TESTIMONIOS.map((t, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] font-bold text-primary">{t.name[0]}</span>
                    </div>
                    <div>
                      <div className="flex gap-0.5 mb-0.5">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star key={s} className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted">&quot;{t.text}&quot;</p>
                      <p className="text-[9px] text-muted/50">{t.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
