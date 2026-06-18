"use client";

import { useEffect } from "react";

// El registro gratuito fue descontinuado: ahora todos los planes se compran.
// Mantenemos la ruta para no romper links viejos, pero redirige a /planes.
export default function RegistroGratisPage() {
  useEffect(() => {
    window.location.replace("/planes");
  }, []);

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
      <p className="text-muted text-sm">Llevandote a los planes...</p>
    </div>
  );
}
