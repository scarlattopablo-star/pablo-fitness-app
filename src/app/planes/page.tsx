"use client";

import Link from "next/link";
import {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal,
  ArrowLeft, ChevronRight, Check,
} from "lucide-react";
import { PLANS, DURATION_LABELS, DURATION_DESCRIPTIONS, getDiscountPercentage } from "@/lib/plans-data";
import { useState } from "react";
import type { Duration } from "@/types";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal,
};

const DURATIONS: Duration[] = ["1-mes", "3-meses", "6-meses", "1-ano"];

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
        {/* TITLE */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-black mb-4">
            ELEGÍ TU <span className="text-gradient">PLAN</span>
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Todos los planes incluyen entrenamiento + nutrición personalizada con
            cálculo de macros Harris-Benedict, videos de ejercicios y seguimiento de progreso.
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
                className="glass-card rounded-2xl overflow-hidden hover-glow transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="p-6 flex-1">
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
                      <span className="text-3xl font-black text-primary">${price}</span>
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
                    className="block w-full gradient-primary text-black font-semibold text-center py-3 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Elegir Plan
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
      </div>
    </main>
  );
}
