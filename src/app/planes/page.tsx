"use client";

import Link from "next/link";
import {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home, Wind,
  ArrowLeft, ChevronRight, Check, Gift, Star, Shield as ShieldCheck, Clock, TrendingUp,
} from "lucide-react";
import { PLANS, DURATION_LABELS, DURATION_DESCRIPTIONS, getDiscountPercentage, formatPrice } from "@/lib/plans-data";
import { useState, useEffect } from "react";
import type { Duration } from "@/types";
import CountdownTimer from "@/components/countdown-timer";
import { ScarcityCounter } from "@/components/scarcity-counter";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home, Wind,
};

const DURATIONS: Duration[] = ["1-mes", "3-meses", "6-meses", "1-ano"];

// Oferta de lanzamiento — extendida hasta fin de mayo 2026
const PROMO_END = "2026-05-31T23:59:59-03:00";

const TESTIMONIOS_MINI = [
  { name: "Martin R.", text: "Baje 12kg en 4 meses. El plan es brutal.", avatar: "/testimonials/martin.jpg" },
  { name: "Lucia S.", text: "Nunca pense que iba a disfrutar entrenar. Pablo te cambia la mentalidad.", avatar: "/testimonials/lucia.jpg" },
  { name: "Diego M.", text: "La app es super completa, el chat con Pablo hace la diferencia.", avatar: "/testimonials/diego.jpg" },
];

export default function PlanesPage() {
  const [selectedDuration, setSelectedDuration] = useState<Duration>("3-meses");

  return (
    <main className="min-h-screen pb-20">
      {/* HEADER */}
      <div className="glass-card border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-muted hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-primary" />
            <span className="font-bold">PLANES</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10">
        {/* PROMO BANNER */}
        <CountdownTimer
          targetDate={PROMO_END}
          label="Oferta de lanzamiento — Primer mes GRATIS en todos los planes"
          variant="banner"
          className="mb-8"
        />

        {/* SOCIAL PROOF */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-7 h-7 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                  <span className="text-[9px] font-bold text-primary">{["M", "L", "D", "S"][i - 1]}</span>
                </div>
              ))}
            </div>
            <span><strong className="text-white">42+</strong> personas ya entrenan con Pablo</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted">
            <Trophy className="h-4 w-4 text-yellow-400" />
            <span>Campeon Fisicoculturismo 2019</span>
          </div>
        </div>

        {/* SCARCITY — cupos limitados este mes */}
        <ScarcityCounter />

        {/* ROTATING TESTIMONIAL */}
        <TestimonioRotativo />

        {/* TITLE */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            ELEGÍ TU <span className="text-gradient">PLAN</span>
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Todos los planes incluyen entrenamiento + nutricion personalizada con
            calculo de macros personalizado, videos de ejercicios y seguimiento de progreso.
            <span className="block mt-2 text-primary font-bold">Primer mes GRATIS — sin tarjeta de credito.</span>
          </p>
        </div>

        {/* DURATION SELECTOR */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex glass-card rounded-2xl p-1.5 gap-1">
            {DURATIONS.map((d) => {
              const discount = getDiscountPercentage(d);
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDuration(d)}
                  className={`relative px-4 sm:px-6 py-3 rounded-xl text-sm font-medium transition-all ${
                    selectedDuration === d
                      ? "gradient-primary text-black"
                      : "text-muted hover:text-white"
                  }`}
                >
                  {DURATION_LABELS[d]}
                  {discount > 0 && (
                    <span className={`absolute -top-2 -right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      selectedDuration === d ? "bg-black text-primary" : "bg-primary text-black"
                    }`}>
                      -{discount}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-center text-sm text-muted mb-8">
          {DURATION_DESCRIPTIONS[selectedDuration]}
        </p>

        {/* FREE TRIAL CARD */}
        <div className="max-w-lg mx-auto mb-10">
          <Link
            href="/registro-gratis"
            className="block glass-card rounded-2xl p-5 border-emerald-500/30 hover:border-emerald-500/50 transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-300" />
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold">Primer Mes GRATIS</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-black animate-pulse">
                    GRATIS
                  </span>
                </div>
                <p className="text-sm text-muted">
                  30 dias completos para probar todo. Sin tarjeta de credito. Sin compromiso.
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted group-hover:text-emerald-400 transition-colors flex-shrink-0" />
            </div>
          </Link>
        </div>

        {/* PLANS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const Icon = ICON_MAP[plan.icon] || Dumbbell;
            const price = plan.prices[selectedDuration];
            const monthlyPrice = selectedDuration === "1-mes" ? price :
              selectedDuration === "3-meses" ? Math.round(price / 3) :
              selectedDuration === "6-meses" ? Math.round(price / 6) :
              Math.round(price / 12);

            return (
              <div
                key={plan.slug}
                className={`glass-card rounded-2xl overflow-hidden hover-glow transition-all duration-300 hover:-translate-y-1 flex flex-col relative ${
                  (plan.slug === "quema-grasa" || plan.slug === "ganancia-muscular") ? "ring-2 ring-primary/50" : ""
                }`}
              >
                {(plan.slug === "quema-grasa" || plan.slug === "ganancia-muscular") && (
                  <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent text-black text-[10px] font-black text-center py-1 tracking-wider">
                    MAS POPULAR
                  </div>
                )}
                <div className={`p-6 flex-1 ${(plan.slug === "quema-grasa" || plan.slug === "ganancia-muscular") ? "pt-8" : ""}`}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: plan.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted mb-4">{plan.shortDescription}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-primary">${formatPrice(price)}</span>
                      <span className="text-sm text-muted">/ {DURATION_LABELS[selectedDuration].toLowerCase()}</span>
                    </div>
                    {selectedDuration !== "1-mes" && (
                      <p className="text-xs text-muted mt-1">
                        ${monthlyPrice}/mes
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {plan.includes.slice(0, 4).map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-muted">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-6 pt-0 space-y-2">
                  <Link
                    href={`/planes/${plan.slug}?duration=${selectedDuration}`}
                    className="block w-full gradient-primary text-black font-bold text-center py-3 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Empezar Gratis
                  </Link>
                  <Link
                    href={`/planes/${plan.slug}`}
                    className="flex items-center justify-center gap-1 text-sm text-muted hover:text-primary transition-colors py-2"
                  >
                    Ver detalles <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        {/* GUARANTEE */}
        <div className="mt-12 max-w-lg mx-auto text-center">
          <div className="glass-card rounded-2xl p-6">
            <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
            <h3 className="font-bold mb-1">Garantia de Satisfaccion</h3>
            <p className="text-sm text-muted">
              Si despues de tu mes gratis no estas conforme, simplemente no pagas. Sin preguntas, sin compromiso.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function TestimonioRotativo() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx(prev => (prev + 1) % TESTIMONIOS_MINI.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const t = TESTIMONIOS_MINI[idx];

  return (
    <div className="max-w-md mx-auto mb-8 transition-opacity duration-500">
      <div className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">{t.name[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} className="h-3 w-3 text-yellow-400 fill-yellow-400" />
            ))}
          </div>
          <p className="text-sm text-muted truncate">&quot;{t.text}&quot;</p>
          <p className="text-[10px] text-muted/60">— {t.name}</p>
        </div>
      </div>
    </div>
  );
}
