"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clock, Sparkles, MessageCircle, ArrowRight, XCircle, Dumbbell, UtensilsCrossed } from "lucide-react";
import { trackEvent } from "@/lib/track-event";

// Cupos por mes — ajustar manualmente segun disponibilidad
const CUPOS_RESTANTES: number = 5;
const CUPOS_AGOTADOS = false;

const CHECKOUT_URL = "/planes/reto-transformacion";

const WA_RETO_URL =
  "https://wa.me/59897336318?text=" +
  encodeURIComponent("Hola Pablo, quiero info del Reto Transformacion 30 dias");

const WA_WAITLIST_URL =
  "https://wa.me/59897336318?text=" +
  encodeURIComponent("Hola Pablo, me anoto para el proximo Reto Transformacion 30 dias");

function formatProximoCohorte(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

function diasHastaProximoCohorte(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCierreMes(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

const INCLUYE = [
  { icon: Dumbbell, text: "Plan de entrenamiento 30 dias (casa o gym)" },
  { icon: UtensilsCrossed, text: "Plan de nutricion con macros calculados" },
  { icon: Check, text: "Seguimiento semanal de progreso en la app" },
  { icon: Check, text: "Chat directo con Pablo para dudas" },
];

export default function Glutes360Offer() {
  const ref = useRef<HTMLElement>(null);
  const [viewed, setViewed] = useState(false);
  const cierre = useMemo(() => formatCierreMes(), []);
  const diasRestantes = useMemo(() => diasHastaProximoCohorte(), []);

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

  return (
    <section
      id="oferta-transformacion"
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
              Reto del mes
            </span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-3">
            Reto Transformacion
            <br />
            <span className="text-gradient">30 dias</span>
          </h2>
          <p className="text-muted text-sm sm:text-base mb-8 max-w-md mx-auto">
            Para hombres y mujeres que quieren resultados reales. Entrenamiento + nutricion incluidos.
          </p>

          <ul className="space-y-3 mb-8 max-w-sm mx-auto text-left">
            {INCLUYE.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-accent shrink-0" />
                <span className="text-base">{text}</span>
              </li>
            ))}
          </ul>

          <div className="mb-5">
            <div className="text-xs text-muted uppercase tracking-wider mb-1">
              Precio unico — acceso completo
            </div>
            <div className="text-5xl sm:text-6xl font-black">
              <span className="text-accent">$990</span>
              <span className="text-lg sm:text-2xl text-muted font-bold ml-1">
                UYU
              </span>
            </div>
          </div>

          {CUPOS_AGOTADOS ? (
            <>
              <div className="inline-flex flex-wrap items-center justify-center gap-2 mb-6 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/30 text-sm font-bold">
                <XCircle className="h-4 w-4 text-red-400" />
                <span className="text-red-400">Sin cupos este mes</span>
                <span className="text-muted">· Proximo inicio: {formatProximoCohorte()}</span>
              </div>

              <a
                href={WA_WAITLIST_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent("cta_oferta_click", { origen: "waitlist_transformacion" })}
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
                  Ultimos {CUPOS_RESTANTES} {CUPOS_RESTANTES === 1 ? "cupo" : "cupos"} este mes
                </span>
                <span className="text-muted">· Cierra el {cierre} ({diasRestantes} {diasRestantes === 1 ? "dia" : "dias"})</span>
              </div>

              <Link
                href={CHECKOUT_URL}
                onClick={() => trackEvent("cta_oferta_click", { origen: "transformacion_card" })}
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
