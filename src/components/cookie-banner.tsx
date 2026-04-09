"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4">
      <div className="max-w-lg mx-auto glass-card border border-card-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-xs text-muted flex-1">
          Usamos cookies esenciales para el funcionamiento de la app.{" "}
          Ver nuestra{" "}
          <Link href="/cookies" className="text-primary underline hover:opacity-80">
            Política de Cookies
          </Link>.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/cookies"
            className="px-4 py-2 text-xs font-medium text-muted border border-card-border rounded-xl hover:text-white transition-colors"
          >
            Ver más
          </Link>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-xs font-bold gradient-primary text-black rounded-xl hover:opacity-90 transition-opacity"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
