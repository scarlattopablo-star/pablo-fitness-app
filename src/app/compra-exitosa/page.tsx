"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, Dumbbell, Smartphone } from "lucide-react";

export default function CompraExitosaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-black" />
        </div>

        <h1 className="text-3xl font-black mb-3">¡Registro Exitoso!</h1>
        <p className="text-muted mb-8">
          Tu plan esta listo. Ingresa a tu cuenta para ver tu entrenamiento y nutricion personalizada.
        </p>

        <Link
          href="/login"
          className="block w-full gradient-primary text-black font-bold py-4 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-4"
        >
          Iniciar Sesion <ArrowRight className="h-5 w-5" />
        </Link>

        {/* Install instructions */}
        <div className="glass-card rounded-2xl p-5 mb-6 text-left">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="h-5 w-5 text-primary" />
            <p className="font-bold text-sm">Descarga la app en tu celular</p>
          </div>
          <p className="text-xs text-muted mb-3">Una vez dentro de tu plan, podras instalar la app:</p>
          <div className="space-y-2 text-sm text-muted">
            <div className="flex gap-2">
              <span className="text-primary font-bold">iPhone:</span>
              <span>Safari → Compartir (⬆) → Agregar a Inicio</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold">Android:</span>
              <span>Chrome → Menu (⋮) → Instalar app</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-muted">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-xs">Pablo Scarlatto Entrenamientos</span>
        </div>
      </div>
    </main>
  );
}
