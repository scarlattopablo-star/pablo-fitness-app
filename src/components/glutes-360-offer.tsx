"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, Sparkles, MessageCircle, ArrowRight, XCircle } from "lucide-react";
import { trackEvent } from "@/lib/track-event";
import {
  formatFinDeCupos,
  diasHastaCierre,
  CUPOS_AGOTADOS_ESTE_MES,
  CUPOS_RESTANTES_ESTE_MES,
  formatProximoCohorte,
  getWaitlistWhatsAppUrl,
} from "@/lib/reto-glutes-360-plan";

// El flujo formal de compra: /planes/glutes-360 usa la pagina de detalle + encuesta + MercadoPago
// que ya existe para todos los planes. WhatsApp queda como fallback "hablar primero".
const CHECKOUT_URL = "/planes/glutes-360";

const WA_RETO_URL =
  "https://wa.me/59897336318?text=" +
  encodeURIComponent("Hola, quiero info del reto Gluteos 360");

const INCLUYE = [
  "Rutina simple en la app",
  "Guia de alimentacion flexible",
  "Seguimiento personalizado",
  "Acceso inmediato",
];

export default function Glutes360Offer() {
  const ref = useRef<HTMLElement>(null);
  const [viewed, setViewed] = useState(false);
  // Cohorte mensual: cierra el 1ro de cada mes. Se recalcula en cliente.
  const cierre = useMemo(() => formatFinDeCupos(), []);
  const diasRestantes = useMemo(() => diasHastaCierre(), []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewed) {
          trackEvent("scroll_oferta");
          setViewed(true);
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [viewed]);

  const onReservar = () => {
    trackEvent("cta_oferta_click", { origen: "glutes_360_card" });
  };

  return (
    <section
      id="oferta-glutes-360"
      ref={ref}
      className="py-20 px-4 relative overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0 bg-accent/[0.03]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/[0.05] rounded-full blur-[120px]" />

      <div className="relative max-w-2xl mx-auto">
        <div className="card-premium rounded-3xl border border-accent/30 shadow-2xl shadow-accent/10 p-6 sm:p-10 text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full bg-accent/15 border border-accent/30">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Nuevo reto
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
            Gluteos 360
            <br />
            <span className="text-gradient">21 dias</span>
          </h2>
          <p className="text-muted text-sm sm:text-base mb-8 max-w-md mx-auto">
            Para mujeres que quieren resultados reales con un metodo simple.
          </p>

          <ul className="space-y-3 mb-8 max-w-sm mx-auto text-left">
            {INCLUYE.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check className="h-5 w-5 text-accent shrink-0" />
                <span className="text-base">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mb-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">
              Precio por este mes
            </div>
            <div className="text-5xl sm:text-6xl font-black">
              <span className="text-accent">$599</span>
              <span className="text-lg sm:text-2xl text-muted font-bold ml-1">
                UYU
              </span>
            </div>
          </div>

          {CUPOS_AGOTADOS_ESTE_MES ? (
            <>
              <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-sm font-bold">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400">Sin cupos este mes</span>
                <span className="text-muted">· Proximo cohorte: {formatProximoCohorte()}</span>
              </div>

              <a
                href={getWaitlistWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("cta_oferta_click", { origen: "waitlist_landing" })}
                className="btn-shimmer inline-flex items-center justify-center gap-2 text-base sm:text-lg px-10 py-4 rounded-full font-bold w-full sm:w-auto"
              >
                <MessageCircle className="h-5 w-5" />
                Anotarme para el proximo cohorte
              </a>

              <p className="text-xs text-muted mt-4">
                Te aviso apenas se libere un cupo — sin compromiso.
              </p>
            </>
          ) : (
            <>
              <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-8 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm font-bold">
                <Clock className="h-4 w-4 text-accent animate-pulse" />
                <span className="text-accent">
                  Ultimos {CUPOS_RESTANTES_ESTE_MES} {CUPOS_RESTANTES_ESTE_MES === 1 ? "cupo" : "cupos"} este mes
                </span>
                <span className="text-muted">· Cierra el {cierre} ({diasRestantes} {diasRestantes === 1 ? "dia" : "dias"})</span>
              </div>

              <Link
                href={CHECKOUT_URL}
                onClick={onReservar}
                className="btn-shimmer inline-flex items-center justify-center gap-2 text-base sm:text-lg px-10 py-4 rounded-full font-bold w-full sm:w-auto"
              >
                Reservar mi lugar <ArrowRight className="h-5 w-5" />
              </Link>

              <div className="mt-4 text-sm">
                <a
                  href={WA_RETO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_click", { variant: "oferta_secundario" })}
                  className="inline-flex items-center gap-1.5 text-muted hover:text-accent transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>O prefiero hablar primero con Pablo</span>
                </a>
              </div>

              <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-5 text-xs text-muted">
                <span>✓ Pago seguro MercadoPago</span>
                <span>✓ Acceso inmediato</span>
                <span>✓ Cupos limitados</span>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
