"use client";

// Pantalla que recibe a la clienta del reto Gluteos 360 justo despues de la encuesta.
// Objetivo: fijar expectativa realista, bajar ansiedad y activar compromiso antes
// de entrar al onboarding general. Se ve una sola vez (flag en localStorage).

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight, Dumbbell, Flame, Droplet, Ban, UtensilsCrossed,
  Target, Clock, Check,
} from "lucide-react";
import Glutes360Timeline from "@/components/glutes-360-timeline";
import { trackEvent } from "@/lib/track-event";

const NEXT_URL_FALLBACK = "/onboarding?next=" + encodeURIComponent("/dashboard/bienvenida");
const SEEN_KEY = "hasSeenRetoBriefing_v1";

const ESTRUCTURA = [
  { icon: Dumbbell, label: "3× semana", desc: "Gluteo foco" },
  { icon: Target,   label: "2× semana", desc: "Core + abdomen" },
  { icon: Flame,    label: "1× semana", desc: "HIIT corto" },
  { icon: Clock,    label: "1 dia",     desc: "Descanso activo" },
];

const EJERCICIOS_ESTRELLA = [
  {
    nombre: "Hip thrust",
    desc: "El rey del gluteo. 84% de activacion (vs 52% de sentadilla).",
    emoji: "🏋️‍♀️",
  },
  {
    nombre: "Peso muerto rumano",
    desc: "Gluteo mayor + isquios. Estira y contrae con carga.",
    emoji: "💪",
  },
  {
    nombre: "Abduccion (banda o polea)",
    desc: "Gluteo medio — la forma redondeada del costado.",
    emoji: "⚡",
  },
];

const REGLAS = [
  { icon: UtensilsCrossed, text: "Proteina en TODAS las comidas (100–130g al dia)" },
  { icon: Droplet,         text: "2.5 L de agua por dia" },
  { icon: Ban,             text: "Sin alcohol por 21 dias (acelera el resultado x2)" },
];

const HITOS = [
  { dia: "Dia 7",   txt: "Gluteo mas firme al tacto (activacion + DOMS)" },
  { dia: "Dia 14",  txt: "Cintura mas marcada, menos hinchazon" },
  { dia: "Dia 21",  txt: "Cambio visible en fotos lado/atras" },
];

export default function RetoBriefingPage() {
  // Tracking de entrada
  useEffect(() => {
    trackEvent("scroll_oferta", { pantalla: "reto_briefing" });
  }, []);

  // Leer ?next= de la URL si el flujo lo pasa; si no, fallback al onboarding clasico.
  const sp = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const nextUrl = sp?.get("next") || NEXT_URL_FALLBACK;

  const onContinue = () => {
    try { localStorage.setItem(SEEN_KEY, "true"); } catch { /* noop */ }
    trackEvent("cta_final_click", { destino: "onboarding_post_briefing" });
  };

  return (
    <main className="min-h-screen pb-16">
      {/* HERO */}
      <section className="relative overflow-hidden pt-16 pb-10 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.06] to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/[0.08] rounded-full blur-[120px] pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full bg-accent/15 border border-accent/30">
            <span className="text-xs font-bold text-accent uppercase tracking-wider">
              Bienvenida al reto
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05] mb-4">
            Gluteos 360
            <br />
            <span className="text-gradient">21 dias que cambian el cuerpo</span>
          </h1>
          <p className="text-muted max-w-xl mx-auto">
            Antes de arrancar, te dejo clarisimo como son las proximas 3 semanas para que sepas exactamente que esperar.
          </p>
        </div>
      </section>

      {/* TIMELINE 3 SEMANAS */}
      <Glutes360Timeline />

      {/* ESTRUCTURA SEMANAL */}
      <section className="py-10 px-4 bg-card-bg/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black mb-1">Tu semana</h2>
          <p className="text-center text-sm text-muted mb-8">6 dias de movimiento + 1 descanso</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {ESTRUCTURA.map((e) => (
              <div key={e.label} className="card-premium rounded-xl p-4 text-center border border-card-border/40">
                <e.icon className="h-5 w-5 text-accent mx-auto mb-2" />
                <p className="font-black text-sm">{e.label}</p>
                <p className="text-[11px] text-muted mt-0.5">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EJERCICIOS ESTRELLA */}
      <section className="py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black mb-1">Tus 3 ejercicios estrella</h2>
          <p className="text-center text-sm text-muted mb-8">
            Los que mas trabajo hacen por el gluteo — les vas a aprender a tomar el punto.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {EJERCICIOS_ESTRELLA.map((ex) => (
              <div key={ex.nombre} className="card-premium rounded-2xl p-5 border border-card-border/40">
                <div className="text-3xl mb-2">{ex.emoji}</div>
                <h3 className="font-bold mb-1">{ex.nombre}</h3>
                <p className="text-xs text-muted leading-relaxed">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HITOS — QUE VAS A VER Y CUANDO */}
      <section className="py-10 px-4 bg-card-bg/30">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black mb-8">Lo que vas a ver y cuando</h2>
          <div className="space-y-3">
            {HITOS.map((h) => (
              <div key={h.dia} className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-card-border/40">
                <div className="shrink-0 w-16 h-16 rounded-xl bg-accent/10 border border-accent/30 flex flex-col items-center justify-center">
                  <span className="text-[9px] uppercase tracking-wider text-muted">Dia</span>
                  <span className="text-xl font-black text-accent leading-none mt-0.5">{h.dia.replace("Dia ", "")}</span>
                </div>
                <p className="text-sm leading-relaxed">{h.txt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REGLAS NO NEGOCIABLES */}
      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-center text-2xl sm:text-3xl font-black mb-1">3 reglas no negociables</h2>
          <p className="text-center text-sm text-muted mb-8">Sin esto, los ejercicios rinden la mitad.</p>
          <div className="space-y-2">
            {REGLAS.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-card-bg border border-card-border/40">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <r.icon className="h-5 w-5 text-accent" />
                </div>
                <p className="text-sm font-medium flex-1">{r.text}</p>
                <Check className="h-4 w-4 text-accent shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/[0.04] pointer-events-none" />
        <div className="relative max-w-xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-3">Ya esta todo claro?</h2>
          <p className="text-muted mb-8">
            Desde ahora, cada dia cuenta. Dale play a tus 21 dias.
          </p>
          <Link
            href={nextUrl}
            onClick={onContinue}
            className="btn-shimmer inline-flex items-center gap-2 text-lg px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform"
          >
            Empezar ahora <ArrowRight className="h-5 w-5" />
          </Link>
          <p className="text-[11px] text-muted mt-4">
            Vas a ver unos 5 slides cortos de la app y despues entras al dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}
