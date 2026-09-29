"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, MessageCircle, ArrowRight } from "lucide-react";
import { trackEvent } from "@/lib/track-event";

// Cupos por mes — ajustar manualmente segun disponibilidad
export const CUPOS_RESTANTES: number = 5;
export const CUPOS_AGOTADOS = false;

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

export function formatCierreMes(): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return last.toLocaleDateString("es-UY", { day: "numeric", month: "long" });
}

const INCLUYE = [
  "Plan de entrenamiento de 30 días, en casa o en el gym",
  "Plan de nutrición con tus macros calculados",
  "Seguimiento semanal de progreso en la app",
  "Chat directo con Pablo para dudas y ajustes",
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
      className="px-5 sm:px-8 py-24 scroll-mt-24"
    >
      <div className="max-w-6xl mx-auto">
        <div
          className="relative rounded-[1.75rem] overflow-hidden grid grid-cols-1 lg:grid-cols-12"
          style={{
            background:
              "radial-gradient(120% 90% at 100% 0%, rgba(62,207,138,0.16) 0%, rgba(62,207,138,0) 55%), var(--l-surface)",
            boxShadow: "inset 0 0 0 1px var(--l-line-strong), 0 40px 80px -40px rgba(0,0,0,0.8)",
          }}
        >
          {/* Izquierda — qué es */}
          <div className="lg:col-span-7 p-7 sm:p-12">
            <p className="l-eyebrow mb-6">Reto del mes</p>
            <h2 className="l-display l-offer-title">
              Reto Transformación
              <span className="block text-[var(--l-accent)]">30 días</span>
            </h2>
            <p className="text-[var(--l-muted)] text-base sm:text-lg mt-6 max-w-md">
              Para hombres y mujeres que quieren resultados reales. Entrenamiento y nutrición en un solo plan.
            </p>

            <ul className="mt-10 max-w-lg">
              {INCLUYE.map((text) => (
                <li key={text} className="l-rule flex items-start gap-3 py-4">
                  <Check className="h-5 w-5 text-[var(--l-accent)] shrink-0 mt-0.5" strokeWidth={2.25} />
                  <span className="text-base">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Derecha — precio y acción */}
          <div className="lg:col-span-5 p-7 sm:p-12 flex flex-col justify-between gap-10 border-t lg:border-t-0 lg:border-l border-[var(--l-line)] bg-black/20">
            <div>
              <p className="text-sm text-[var(--l-muted)]">Pago único, acceso completo</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="l-display l-tabular text-[5.5rem] sm:text-[6.5rem]">$990</span>
                <span className="text-lg text-[var(--l-muted)] font-medium">UYU</span>
              </div>
            </div>

            {CUPOS_AGOTADOS ? (
              <div>
                <p className="text-sm mb-5">
                  <span className="text-red-400 font-semibold">Sin cupos este mes.</span>{" "}
                  {/* Fecha calculada con new Date(): en el HTML estatico queda la del build,
                      el cliente la recalcula — suprimir el mismatch de hidratacion */}
                  <span className="text-[var(--l-muted)]" suppressHydrationWarning>Próximo inicio: {formatProximoCohorte()}.</span>
                </p>
                <a
                  href={WA_WAITLIST_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("cta_oferta_click", { origen: "waitlist_transformacion" })}
                  className="l-btn w-full text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Anotarme para el próximo grupo
                </a>
                <p className="text-sm text-[var(--l-muted)] mt-4">
                  Te aviso apenas se libere un cupo, sin compromiso.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold">
                      Quedan <span className="l-tabular">{CUPOS_RESTANTES}</span> {CUPOS_RESTANTES === 1 ? "cupo" : "cupos"}
                    </span>
                    {/* Idem: fechas del build vs. cliente — sin esto hay mismatch de hidratacion */}
                    <span className="text-[var(--l-muted)] l-tabular" suppressHydrationWarning>
                      Cierra el {cierre} · {diasRestantes} {diasRestantes === 1 ? "día" : "días"}
                    </span>
                  </div>
                  <div className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <span
                        key={i}
                        className="h-1.5 flex-1 rounded-full"
                        style={{ background: i < 12 - CUPOS_RESTANTES ? "var(--l-accent)" : "var(--l-line-strong)" }}
                      />
                    ))}
                  </div>
                </div>

                <Link
                  href={CHECKOUT_URL}
                  onClick={() => trackEvent("cta_oferta_click", { origen: "transformacion_card" })}
                  className="l-btn w-full text-base"
                >
                  Reservar mi lugar <ArrowRight className="h-5 w-5" />
                </Link>

                <a
                  href={WA_RETO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent("whatsapp_click", { variant: "oferta_secundario" })}
                  className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--l-muted)] hover:text-[var(--l-text)] transition-colors py-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Prefiero hablar primero con Pablo
                </a>

                <p className="text-xs text-[var(--l-muted)] text-center mt-4">
                  Pago seguro con MercadoPago · Acceso inmediato
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
