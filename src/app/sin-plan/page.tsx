"use client";

import Link from "next/link";
import { Lock, ArrowRight, Dumbbell } from "lucide-react";

export default function SinPlanPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-card-bg border border-card-border flex items-center justify-center mx-auto mb-6">
          <Lock className="h-10 w-10 text-muted" />
        </div>

        <h1 className="text-2xl font-black mb-3">No tenés un plan activo</h1>
        <p className="text-muted mb-8">
          Para acceder a tu entrenamiento y nutrición personalizada, necesitás comprar un plan primero.
        </p>

        <Link
          href="/planes"
          className="block w-full gradient-primary text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Ver Planes <ArrowRight className="h-5 w-5" />
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
