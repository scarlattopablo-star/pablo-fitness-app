"use client";

import { X, Dumbbell, UtensilsCrossed, TrendingUp, MessageCircle, Crown } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  feature?: string;
}

const BENEFITS = [
  { icon: Dumbbell, text: "Plan de entrenamiento personalizado" },
  { icon: UtensilsCrossed, text: "Plan de nutrición con macros" },
  { icon: TrendingUp, text: "Seguimiento de progreso completo" },
  { icon: MessageCircle, text: "Chat directo con Pablo" },
];

export function PaywallModal({ open, onClose, feature }: PaywallModalProps) {
  const { trialDaysLeft } = useAuth();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 mb-4 sm:mb-0 bg-card-bg border border-card-border rounded-3xl p-6 animate-fade-in-up">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Crown className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-center mb-1">
          Desbloqueá {feature || "esta función"}
        </h2>
        <p className="text-muted text-sm text-center mb-6">
          {trialDaysLeft > 0
            ? `Te quedan ${trialDaysLeft} días de prueba. Contratá un plan para acceso completo.`
            : "Contratá un plan personalizado para acceder a todas las funcionalidades."}
        </p>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {BENEFITS.map((b) => (
            <div key={b.text} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-card-bg border border-card-border/50 flex items-center justify-center flex-shrink-0">
                <b.icon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-sm">{b.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/planes"
          onClick={onClose}
          className="block w-full h-12 rounded-2xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-colors"
        >
          Ver Planes
        </Link>

        <button
          onClick={onClose}
          className="block w-full text-center text-xs text-muted mt-3 hover:text-foreground transition-colors"
        >
          Seguir con la prueba gratuita
        </button>
      </div>
    </div>
  );
}
