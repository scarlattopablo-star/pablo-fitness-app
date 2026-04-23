"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Sparkles, X, Clock, ArrowRight, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/track-event";
import {
  formatFinDeCupos,
  CUPOS_AGOTADOS_ESTE_MES,
  CUPOS_RESTANTES_ESTE_MES,
  formatProximoCohorte,
  getWaitlistWhatsAppUrl,
} from "@/lib/reto-glutes-360-plan";

// Una key por mes: cada mes la cohorte es "nueva" y el banner vuelve a aparecer aunque el cliente lo haya cerrado.
function getDismissKey(): string {
  const now = new Date();
  return `glutes360_banner_dismissed_${now.getFullYear()}_${now.getMonth()}`;
}

// Cliente existente ya tiene cuenta — va directo a la pagina del reto (usa checkout MP compartido).
const RETO_URL = "/planes/glutes-360";

export default function Glutes360ClientBanner() {
  const [dismissed, setDismissed] = useState(true); // evita flash hasta leer localStorage
  const cierre = useMemo(() => formatFinDeCupos(), []);
  const dismissKey = useMemo(() => getDismissKey(), []);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(dismissKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [dismissKey]);

  const onDismiss = () => {
    try {
      localStorage.setItem(dismissKey, "1");
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  const onClick = () => {
    trackEvent("cta_oferta_click", { origen: "dashboard_banner" });
  };

  if (dismissed) return null;

  return (
    <div className="relative mb-6 rounded-2xl overflow-hidden border border-accent/30 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent p-4 sm:p-5">
      <button
        onClick={onDismiss}
        aria-label="Cerrar"
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/60 hover:bg-background/90 flex items-center justify-center text-muted hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-accent" />
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <div className="inline-flex items-center gap-1.5 mb-1 px-2 py-0.5 rounded-full bg-accent/20 text-[10px] font-bold text-accent uppercase tracking-wider">
            <Clock className="h-2.5 w-2.5" />
            Nuevo reto
          </div>
          <h3 className="font-black text-base sm:text-lg leading-tight mb-1">
            Sumate al reto <span className="text-accent">Gluteos 360 · 21 dias</span>
          </h3>
          {CUPOS_AGOTADOS_ESTE_MES ? (
            <>
              <p className="text-xs text-muted mb-3">
                <span className="text-red-400 font-bold">Sin cupos este mes.</span> Proximo cohorte: {formatProximoCohorte()}.
              </p>
              <a
                href={getWaitlistWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackEvent("cta_oferta_click", { origen: "dashboard_banner_waitlist" });
                  onClick();
                }}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm px-4 py-2 rounded-full transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Anotarme para el proximo
              </a>
            </>
          ) : (
            <>
              <p className="text-xs text-muted mb-3">
                <span className="text-accent font-bold">Ultimos {CUPOS_RESTANTES_ESTE_MES} {CUPOS_RESTANTES_ESTE_MES === 1 ? "cupo" : "cupos"}</span> · Cierra el {cierre}
              </p>
              <Link
                href={RETO_URL}
                onClick={onClick}
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-black font-bold text-sm px-4 py-2 rounded-full transition-colors"
              >
                Quiero sumarme <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
