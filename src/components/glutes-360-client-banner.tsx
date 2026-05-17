"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Sparkles, X, Clock, ArrowRight, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/track-event";

const CUPOS_RESTANTES: number = 5;
const CUPOS_AGOTADOS = false;
const RETO_URL = "/planes/reto-transformacion";
const WA_WAITLIST_URL =
  "https://wa.me/59897336318?text=" +
  encodeURIComponent("Hola Pablo, me anoto para el proximo Reto Transformacion 30 dias");

function getDismissKey(): string {
  const now = new Date();
  return `reto_transformacion_banner_dismissed_${now.getFullYear()}_${now.getMonth()}`;
}

function formatCierreMes(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

export default function Glutes360ClientBanner() {
  const [dismissed, setDismissed] = useState(true);
  const [cierre] = useState(() => formatCierreMes());
  const [dismissKey] = useState(() => getDismissKey());

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
            Sumate al <span className="text-accent">Reto Transformacion 30 dias</span>
          </h3>
          {CUPOS_AGOTADOS ? (
            <>
              <p className="text-xs text-muted mb-3">
                <span className="text-red-400 font-bold">Sin cupos este mes.</span> Proximo inicio el 1 del mes.
              </p>
              <a
                href={WA_WAITLIST_URL}
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
                <span className="text-accent font-bold">Ultimos {CUPOS_RESTANTES} {CUPOS_RESTANTES === 1 ? "cupo" : "cupos"}</span> · Cierra el {cierre}
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
