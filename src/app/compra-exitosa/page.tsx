"use client";

import Link from "next/link";
import { CheckCircle, Download, Smartphone, ArrowRight, Dumbbell } from "lucide-react";
import { PWAInstallButton } from "@/components/pwa-install";

export default function CompraExitosaPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-black" />
        </div>

        <h1 className="text-3xl font-black mb-3">¡Compra Exitosa!</h1>
        <p className="text-muted mb-8">
          Tu plan está listo. Descargá la app para acceder a tu entrenamiento y nutrición personalizada.
        </p>

        {/* Install App Card */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <Smartphone className="h-6 w-6 text-black" />
            </div>
            <div className="text-left">
              <p className="font-bold">PS Entrenamientos</p>
              <p className="text-xs text-muted">Instalá la app en tu celular</p>
            </div>
          </div>

          <PWAInstallButton />

          <p className="text-xs text-muted mt-3">
            Tocá el botón para instalar la app. Podrás acceder a tu plan sin abrir el navegador.
          </p>
        </div>

        {/* Manual Instructions */}
        <div className="glass-card rounded-2xl p-5 mb-6 text-left">
          <p className="font-bold text-sm mb-3">¿No aparece el botón de instalar?</p>
          <div className="space-y-2 text-sm text-muted">
            <div className="flex gap-2">
              <span className="text-primary font-bold">iPhone:</span>
              <span>Safari → Compartir → Agregar a Inicio</span>
            </div>
            <div className="flex gap-2">
              <span className="text-primary font-bold">Android:</span>
              <span>Chrome → Menú (⋮) → Instalar app</span>
            </div>
          </div>
        </div>

        {/* Go to Dashboard */}
        <Link
          href="/dashboard"
          className="block w-full border border-primary text-primary font-bold py-4 rounded-xl hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          Ir a Mi Plan <ArrowRight className="h-5 w-5" />
        </Link>

        <p className="mt-6 text-xs text-muted">
          También podés acceder desde{" "}
          <Link href="/login" className="text-primary hover:underline">
            Iniciar Sesión
          </Link>{" "}
          en cualquier momento.
        </p>

        {/* Footer */}
        <div className="mt-10 flex items-center justify-center gap-2 text-muted">
          <Dumbbell className="h-4 w-4 text-primary" />
          <span className="text-xs">Pablo Scarlatto Entrenamientos</span>
        </div>
      </div>
    </main>
  );
}
