"use client";

import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { InstagramIcon } from "@/components/icons";

export function SubscriptionExpiredBanner() {
  const { subscription } = useAuth();

  const endDate = subscription?.end_date
    ? new Date(subscription.end_date).toLocaleDateString("es", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto mt-10">
      <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
        <Lock className="h-8 w-8 text-warning" />
      </div>
      <h2 className="text-xl font-black mb-2">Tu suscripción venció</h2>
      {endDate && (
        <p className="text-sm text-muted mb-4">
          Tu plan finalizó el {endDate}
        </p>
      )}
      <p className="text-sm text-muted mb-6">
        Renová tu plan para seguir accediendo a tu entrenamiento, nutrición y progreso.
      </p>
      <Link
        href="/planes"
        className="inline-flex items-center gap-2 gradient-primary text-black font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
      >
        Renovar Plan <ArrowRight className="h-4 w-4" />
      </Link>
      <div className="mt-4">
        <a
          href="https://instagram.com/pabloscarlatto"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors"
        >
          <InstagramIcon className="h-4 w-4" />
          Contactame por Instagram
        </a>
      </div>
    </div>
  );
}
