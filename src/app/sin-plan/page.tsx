"use client";

import Link from "next/link";
import { ArrowRight, Dumbbell, Sparkles, Clock, Target, Utensils } from "lucide-react";

export default function SinPlanPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Sparkles className="h-10 w-10 text-black" />
        </div>

        <h1 className="text-2xl font-black mb-3">
          Tu plan personalizado te espera
        </h1>
        <p className="text-muted mb-8">
          Estamos listos para armar tu entrenamiento y nutricion a medida.
          Solo falta un paso para que empieces a transformarte.
        </p>

        <div className="glass-card rounded-2xl p-5 mb-8 text-left">
          <p className="text-sm font-bold mb-4 text-center">Lo que vas a recibir:</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Rutina de entrenamiento</p>
                <p className="text-xs text-muted">Personalizada segun tu objetivo</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Utensils className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Plan de nutricion con macros</p>
                <p className="text-xs text-muted">Calorias, proteinas, carbos y grasas</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Seguimiento de tu progreso</p>
                <p className="text-xs text-muted">Fotos, medidas y peso semana a semana</p>
              </div>
            </div>
          </div>
        </div>

        <Link
          href="/planes"
          className="block w-full gradient-primary text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 text-lg"
        >
          Elegir mi Plan <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-6 text-sm text-muted">
          ¿Ya pagaste y no ves tu plan?{" "}
          <a
            href="https://instagram.com/pabloscarlattoentrenamientos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Contactame por Instagram
          </a>
        </p>

        <div className="mt-10 flex items-center justify-center gap-2 text-muted">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-xs">Pablo Scarlatto Entrenamientos</span>
        </div>
      </div>
    </main>
  );
}
