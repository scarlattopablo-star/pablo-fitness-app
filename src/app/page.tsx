"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight, Dumbbell, UtensilsCrossed, Smartphone,
  BarChart3, Zap, Target, Star, MessageCircle, Users,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

// Scroll reveal with stagger support
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("animate-revealed"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return ref;
}

function ScrollReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useScrollReveal(delay);
  return (
    <div ref={ref} className={`animate-reveal ${className}`}>
      {children}
    </div>
  );
}

// Animated counter
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1500;
          const start = performance.now();
          const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// Parallax scroll hook
function useParallax(speed = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const scrollY = window.scrollY;
      ref.current.style.transform = `translateY(${scrollY * speed}px)`;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [speed]);

  return ref;
}

export default function HomePage() {
  const { t } = useI18n();
  const parallaxRef = useParallax(0.15);

  // Navbar shrink on scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="min-h-screen overflow-hidden">
      {/* NAVBAR — shrinks on scroll */}
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b border-accent/20 transition-all duration-300 ${scrolled ? "bg-background/90 h-14" : "bg-background/70 h-16"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className={`w-auto transition-all duration-300 ${scrolled ? "h-10" : "h-14"}`} style={{ filter: "invert(1) brightness(0.85) sepia(1) hue-rotate(100deg) saturate(3)", mixBlendMode: "screen" }} />
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

      {/* WHATSAPP FLOATING BUTTON — pulse animation */}
      <a
        href="https://wa.me/59897336318?text=Hola%20Pablo!%20Vi%20tu%20web%20y%20quiero%20info%20sobre%20los%20planes"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 transition-transform animate-whatsapp-pulse"
        aria-label="Chat por WhatsApp"
      >
        <MessageCircle className="h-7 w-7 text-white fill-white" />
      </a>

      {/* HERO — full viewport with parallax */}
      <section className="relative min-h-screen flex items-center px-4 overflow-hidden">
        {/* Parallax background */}
        <div ref={parallaxRef} className="absolute inset-0">
          <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-15" style={{ backgroundImage: "url(/images/gym-bg.png)", filter: "grayscale(100%)" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-accent/[0.04] rounded-full blur-[120px] animate-float-slow" />
        <div className="absolute bottom-1/4 left-0 w-[300px] h-[300px] bg-primary/[0.03] rounded-full blur-[100px] animate-float-slow-reverse" />

        <div className="relative max-w-6xl mx-auto w-full pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 animate-fade-in-up">
                <Star className="h-4 w-4 text-accent fill-accent" />
                <span className="text-sm font-bold text-accent">7 DIAS GRATIS</span>
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

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-300 mb-10">
                <Link href="/registro-gratis" className="btn-shimmer text-base px-8 py-4 rounded-full flex items-center justify-center gap-2 font-bold">
                  Empezar gratis <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/planes" className="btn-outline-premium text-base px-8 py-4 rounded-full flex items-center justify-center gap-2">
                  Ver planes
                </Link>
              </div>

              {/* Animated counters */}
              <div className="flex gap-8 animate-fade-in-up animate-delay-400">
                {[
                  { target: 42, suffix: "+", label: "Alumnos" },
                  { target: 100, suffix: "%", label: "Personalizado" },
                  { target: 24, suffix: "/7", label: "App" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <span className="block text-2xl font-black text-accent">
                      <AnimatedCounter target={item.target} suffix={item.suffix} />
                    </span>
                    <span className="text-[10px] text-muted uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero image with hover tilt */}
            <div className="hidden lg:block animate-fade-in-up animate-delay-300">
              <div className="relative group">
                <div className="card-premium rounded-3xl overflow-hidden border border-accent/30 transition-transform duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl group-hover:shadow-accent/10">
                  <img src="/images/transf-nueva-2.jpg" alt="Mejor transformacion" className="w-full object-contain" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-accent text-black font-black text-sm px-5 py-3 rounded-2xl shadow-lg shadow-accent/30 transition-transform duration-300 group-hover:translate-y-1">
                  Resultado real
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-muted/30 flex items-start justify-center p-1.5">
            <div className="w-1.5 h-2.5 bg-accent rounded-full animate-scroll-dot" />
          </div>
        </div>
      </section>

      {/* URGENCY BANNER */}
      <ScrollReveal>
        <div className="bg-accent/10 border-y border-accent/20 py-4 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <Users className="h-5 w-5 text-accent shrink-0 animate-pulse" />
            <p className="text-sm font-bold text-center">
              <span className="text-accent">Quedan 5 lugares</span>
              <span className="text-muted"> para planes personalizados este mes</span>
            </p>
          </div>
        </div>
      </ScrollReveal>

      {/* RESULTADOS — staggered reveal */}
      <section id="resultados" className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Resultados <span className="text-accent">Reales</span>
            </h2>
            <p className="text-sm text-muted mt-2">Transformaciones de alumnos reales</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { src: "/images/transf-nueva-1.jpg", result: "Quema de grasa" },
              { src: "/images/transf-nueva-3.jpg", result: "Quema de grasa" },
              { src: "/images/transf-nueva-4.jpg", result: "Quema de grasa" },
              { src: "/images/transf-nueva-5.jpg", result: "Tonificacion" },
              { src: "/images/transf-nueva-6.jpg", result: "Definicion" },
              { src: "/images/transf-hombre-musculo.jpg", result: "Ganancia muscular" },
              { src: "/images/transf-hombre-definicion.jpg", result: "Definicion" },
              { src: "/images/transf-mujer3-frente.jpg", result: "Quema de grasa" },
              { src: "/images/transf-mujer-lateral.jpg", result: "Recomposicion" },
              { src: "/images/transf-mujer4-espalda.jpg", result: "Tonificacion" },
              { src: "/images/transf-mujer2-frontal.jpg", result: "Quema de grasa" },
              { src: "/images/transf-mujer3-espalda.jpg", result: "Quema de grasa" },
            ].map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div className="card-premium rounded-xl overflow-hidden group border border-card-border/50 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5">
                  <img src={item.src} alt={item.result} className="w-full object-contain group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                  <div className="p-3 text-center border-t border-card-border/30">
                    <p className="text-accent font-bold text-xs">{item.result}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* QUE INCLUYE — staggered cards */}
      <section id="incluido" className="py-16 px-4 bg-card-bg/30">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Que <span className="text-accent">incluye</span>
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Dumbbell, title: "Plan de entrenamiento", desc: "Rutina personalizada dia por dia" },
              { icon: UtensilsCrossed, title: "Plan de nutricion", desc: "Comidas adaptadas a tu objetivo" },
              { icon: Smartphone, title: "App completa", desc: "Todo en tu celular, siempre disponible" },
              { icon: Zap, title: "GIFs de ejercicios", desc: "Tecnica correcta en cada movimiento" },
              { icon: BarChart3, title: "Seguimiento", desc: "Registro de peso y fotos de progreso" },
              { icon: Target, title: "Soporte directo", desc: "Chat con Pablo para dudas y ajustes" },
            ].map(({ icon: Icon, title, desc }, i) => (
              <ScrollReveal key={title} delay={i * 100}>
                <div className="card-premium rounded-xl p-5 text-center hover:border-accent/30 border border-transparent transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-accent/5 group">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="font-bold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted">{desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/[0.02]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/[0.04] rounded-full blur-[100px]" />
        <ScrollReveal className="max-w-2xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 tracking-tight">
            Empeza tu
            <br />
            <span className="text-gradient">transformacion hoy</span>
          </h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            7 dias gratis. Sin tarjeta. Sin compromiso. Entrena con un plan hecho para vos.
          </p>
          <Link href="/registro-gratis" className="btn-shimmer inline-flex items-center gap-2 text-lg px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform">
            Empezar gratis <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-4">
            <Link href="/planes" className="text-sm text-muted hover:text-primary transition-colors">
              o ver todos los planes →
            </Link>
          </div>
        </ScrollReveal>
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
