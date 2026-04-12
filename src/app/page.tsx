"use client";

import Link from "next/link";
import {
  ArrowRight, Dumbbell, UtensilsCrossed, Smartphone,
  BarChart3, Zap, Target, Star,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/70 border-b border-card-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-10 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#resultados" className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest font-medium">
              Resultados
            </a>
            <a href="#incluido" className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest font-medium">
              Que incluye
            </a>
            <div className="w-px h-4 bg-card-border" />
            <LanguageSelector />
            <Link href="/login" className="text-xs text-muted hover:text-foreground transition-colors font-medium">
              {t("nav.login")}
            </Link>
            <Link href="/registro-gratis" className="btn-shimmer text-sm px-5 py-2 rounded-full">
              7 dias gratis
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-3">
            <LanguageSelector />
            <Link href="/login" className="text-xs text-muted font-medium">{t("nav.login")}</Link>
            <Link href="/registro-gratis" className="btn-shimmer text-xs px-4 py-2 rounded-full">Gratis</Link>
          </div>
        </div>
      </nav>

      {/* HERO — full viewport, clean */}
      <section className="relative min-h-screen flex items-center px-4">
        {/* Background */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15" style={{ backgroundImage: "url(/images/gym-bg.png)", filter: "grayscale(100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]" />

        <div className="relative max-w-6xl mx-auto w-full pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              {/* Free trial badge */}
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 animate-fade-in-up">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-sm font-bold text-primary">7 DIAS GRATIS</span>
                <span className="text-xs text-muted">sin compromiso</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1] mb-6 animate-fade-in-up animate-delay-100 tracking-tight">
                Entrenamiento
                <br />
                + Nutricion
                <br />
                <span className="text-gradient">Personalizada</span>
              </h1>

              <p className="text-base sm:text-lg text-muted max-w-md mb-8 animate-fade-in-up animate-delay-200 leading-relaxed">
                Pablo Scarlatto · Entrenador personal de fitness y musculacion · Campeon de fisicoculturismo 2019
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-300 mb-10">
                <Link href="/registro-gratis" className="btn-shimmer text-base px-8 py-4 rounded-full flex items-center justify-center gap-2 font-bold">
                  Empezar gratis <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/planes" className="btn-outline-premium text-base px-8 py-4 rounded-full flex items-center justify-center gap-2">
                  Ver planes
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-8 animate-fade-in-up animate-delay-400">
                {[
                  { value: "42+", label: "Alumnos" },
                  { value: "100%", label: "Personalizado" },
                  { value: "24/7", label: "App" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <span className="block text-2xl font-black text-primary">{item.value}</span>
                    <span className="text-[10px] text-muted uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Transformation highlight */}
            <div className="hidden lg:block animate-fade-in-up animate-delay-300">
              <div className="relative">
                <div className="card-premium rounded-3xl overflow-hidden border border-primary/20">
                  <img src="/images/transf-hombre-musculo.jpg" alt="Transformacion" className="w-full object-cover" />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-primary text-black font-black text-sm px-5 py-3 rounded-2xl shadow-lg shadow-primary/20">
                  Resultado real
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTADOS — compact horizontal scroll on mobile */}
      <section id="resultados" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Resultados <span className="text-gradient">Reales</span>
            </h2>
            <p className="text-sm text-muted mt-2">Transformaciones de alumnos reales</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { src: "/images/transf-hombre-musculo.jpg", result: "Ganancia muscular" },
              { src: "/images/transf-mujer3-frente.jpg", result: "Quema de grasa" },
              { src: "/images/transf-hombre-definicion.jpg", result: "Definicion" },
              { src: "/images/transf-mujer-lateral.jpg", result: "Recomposicion" },
            ].map((item, i) => (
              <div key={i} className="card-premium rounded-xl overflow-hidden group">
                <div className="relative">
                  <img src={item.src} alt={item.result} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                    <p className="text-primary font-bold text-xs">{item.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUE INCLUYE — compact grid */}
      <section id="incluido" className="py-16 px-4 bg-card-bg/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Que <span className="text-gradient">incluye</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Dumbbell, title: "Plan de entrenamiento", desc: "Rutina personalizada dia por dia" },
              { icon: UtensilsCrossed, title: "Plan de nutricion", desc: "Comidas adaptadas a tu objetivo" },
              { icon: Smartphone, title: "App completa", desc: "Todo en tu celular, siempre disponible" },
              { icon: Zap, title: "GIFs de ejercicios", desc: "Tecnica correcta en cada movimiento" },
              { icon: BarChart3, title: "Seguimiento", desc: "Registro de peso y fotos de progreso" },
              { icon: Target, title: "Soporte directo", desc: "Chat con Pablo para dudas y ajustes" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-premium rounded-xl p-5 text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold text-sm mb-1">{title}</h3>
                <p className="text-xs text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            Empeza tu
            <br />
            <span className="text-gradient">transformacion hoy</span>
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            7 dias gratis. Sin tarjeta. Sin compromiso. Entrena con un plan hecho para vos.
          </p>
          <Link href="/registro-gratis" className="btn-shimmer inline-flex items-center gap-2 text-lg px-10 py-4 rounded-full font-bold">
            Empezar gratis <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-4">
            <Link href="/planes" className="text-sm text-muted hover:text-primary transition-colors">
              o ver todos los planes →
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-card-border/50 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-12 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          <div className="flex items-center gap-5">
            <a href="https://instagram.com/pabloscarlattoentrenamientos" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors">
              <InstagramIcon className="h-4 w-4" />
            </a>
            <Link href="/planes" className="text-xs text-muted hover:text-foreground transition-colors">Planes</Link>
            <Link href="/login" className="text-xs text-muted hover:text-foreground transition-colors">Ingresar</Link>
            <Link href="/terminos" className="text-xs text-muted hover:text-foreground transition-colors">Terminos</Link>
            <Link href="/privacidad" className="text-xs text-muted hover:text-foreground transition-colors">Privacidad</Link>
          </div>
          <p className="text-[10px] text-muted/60">&copy; 2026 Pablo Scarlatto Entrenamientos</p>
        </div>
      </footer>
    </main>
  );
}
