"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowRight, Dumbbell, UtensilsCrossed, Smartphone,
  BarChart3, Zap, Target, Star, MessageCircle, Users,
  ChevronLeft, ChevronRight, GripVertical, X,
} from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import WhatsAppButton from "@/components/whatsapp-button";
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

// Transformation images data (shared between grid and hero)
const transformations = [
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
];

// Hero images that rotate
const heroImages = [
  "/images/pablo-curl.jpg",
  "/images/pablo-gym.jpg",
  "/images/pablo-gym2.jpg",
  "/images/pablo-row.jpg",
];

// Before/After comparison slider
function BeforeAfterSlider({ src, label }: { src: string; label: string }) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      e.preventDefault();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [updatePosition]);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-2xl overflow-hidden cursor-ew-resize select-none border border-card-border"
      onMouseDown={(e) => { dragging.current = true; updatePosition(e.clientX); }}
      onTouchStart={(e) => { dragging.current = true; updatePosition(e.touches[0].clientX); }}
    >
      {/* After (full background) */}
      <img src={src} alt={`${label} - Después`} className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "right center" }} />
      {/* Before (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={src} alt={`${label} - Antes`} className="absolute inset-0 h-full object-cover" style={{ width: `${containerRef.current?.offsetWidth || 400}px`, objectPosition: "left center" }} />
      </div>
      {/* Handle */}
      <div className="absolute top-0 bottom-0 z-10" style={{ left: `${position}%` }}>
        <div className="absolute top-0 bottom-0 w-0.5 bg-accent -translate-x-1/2" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg shadow-accent/40">
          <GripVertical className="h-5 w-5 text-black" />
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-xs font-bold text-white backdrop-blur-sm">ANTES</div>
      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-accent/90 text-xs font-bold text-black backdrop-blur-sm">DESPUES</div>
    </div>
  );
}

// Testimonials data
const testimonials = [
  { name: "Maria L.", result: "-12kg en 3 meses", quote: "Pablo me cambio la forma de entrenar. Nunca pense que iba a lograr estos resultados.", rating: 5 },
  { name: "Juan R.", result: "+8kg musculo", quote: "El plan de nutricion fue clave. Todo super personalizado y facil de seguir.", rating: 5 },
  { name: "Carolina A.", result: "-8kg en 2 meses", quote: "La app es increible, tengo todo en el celular. Los GIFs de ejercicios me salvan.", rating: 5 },
  { name: "Diego P.", result: "Definicion total", quote: "Mejor inversion que hice. El seguimiento semanal te mantiene enfocado.", rating: 5 },
  { name: "Lucia M.", result: "-15kg en 4 meses", quote: "Empece sin saber nada y hoy entreno con confianza. Pablo explica todo clarisimo.", rating: 5 },
  { name: "Martin S.", result: "Recomposicion", quote: "Pase de no hacer nada a entrenar 5 veces por semana. El chat directo con Pablo es un golazo.", rating: 4 },
];

export default function HomePage() {
  const { t } = useI18n();
  const parallaxRef = useParallax(0.15);

  // Hero image rotation
  const [heroIndex, setHeroIndex] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setHeroIndex(i => (i + 1) % heroImages.length), 4000);
    return () => clearInterval(interval);
  }, []);

  // Modal slider for transformations
  const [sliderModal, setSliderModal] = useState<string | null>(null);

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
      <nav className={`fixed top-0 w-full z-50 backdrop-blur-md border-b border-accent/20 transition-all duration-300 ${scrolled ? "bg-background/90 h-16" : "bg-background/70 h-20"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className={`w-auto transition-all duration-300 ${scrolled ? "h-14" : "h-20"}`} style={{ filter: "invert(1) brightness(0.85) sepia(1) hue-rotate(100deg) saturate(3)", mixBlendMode: "screen" }} />
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
              30 dias gratis
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
        {/* Video background */}
        <div ref={parallaxRef} className="absolute inset-0">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-15"
            style={{ filter: "grayscale(100%)" }}
          >
            <source src="/videos/hero-bg-1.mp4" type="video/mp4" />
          </video>
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
                <span className="text-sm font-bold text-accent">30 DIAS GRATIS</span>
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

              {/* Social proof - avatar stack */}
              <div className="flex items-center gap-3 mb-6 animate-fade-in-up animate-delay-250">
                <div className="flex -space-x-2">
                  {["bg-emerald-500", "bg-accent", "bg-blue-500", "bg-pink-500", "bg-purple-500"].map((bg, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-background flex items-center justify-center text-[10px] font-bold text-white`}>
                      {["ML", "JR", "CA", "DP", "LM"][i]}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-bold text-accent">42+ alumnos activos</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up animate-delay-300 mb-10">
                <Link href="/registro-gratis" className="btn-shimmer text-base px-8 py-4 rounded-full flex items-center justify-center gap-2 font-bold">
                  Empezar gratis <ArrowRight className="h-5 w-5" />
                </Link>
                <Link href="/planes" className="btn-outline-premium text-base px-8 py-4 rounded-full flex items-center justify-center gap-2">
                  Ver planes
                </Link>
              </div>

              {/* Animated counters - enhanced */}
              <div className="flex gap-8 animate-fade-in-up animate-delay-400 border-t border-card-border/30 pt-6">
                {[
                  { target: 42, suffix: "+", label: "Alumnos", icon: Users },
                  { target: 100, suffix: "%", label: "Personalizado", icon: Target },
                  { target: 24, suffix: "/7", label: "App", icon: Smartphone },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <item.icon className="h-4 w-4 text-muted mx-auto mb-1" />
                    <span className="block text-3xl sm:text-4xl font-black text-accent">
                      <AnimatedCounter target={item.target} suffix={item.suffix} />
                    </span>
                    <span className="text-[10px] text-muted uppercase tracking-wider">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Hero image carousel */}
            <div className="hidden lg:block animate-fade-in-up animate-delay-300">
              <div className="relative group">
                <div className="absolute -inset-4 bg-accent/10 rounded-[3rem] blur-2xl opacity-60" />
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 transition-transform duration-500 group-hover:scale-[1.02]">
                  {heroImages.map((img, i) => (
                    <img key={img} src={img} alt="Pablo Scarlatto entrenando" className="w-full object-contain absolute inset-0 transition-opacity duration-1000" style={{ opacity: heroIndex === i ? 1 : 0, position: i === 0 ? "relative" : "absolute" }} />
                  ))}
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
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
            {transformations.map((item, i) => (
              <ScrollReveal key={i} delay={i * 80}>
                <div
                  className="card-premium rounded-xl overflow-hidden group border border-card-border/50 hover:border-accent/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 cursor-pointer"
                  onClick={() => setSliderModal(item.src)}
                >
                  <img src={item.src} alt={item.result} className="w-full object-contain group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                  <div className="p-3 text-center border-t border-card-border/30">
                    <p className="text-accent font-bold text-xs">{item.result}</p>
                    <p className="text-[10px] text-muted mt-0.5">Toca para comparar</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Lo que dicen mis <span className="text-accent">alumnos</span>
            </h2>
            <p className="text-sm text-muted mt-2">Historias reales de transformacion</p>
          </ScrollReveal>
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            {/* Scroll container */}
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 scrollbar-thin">
              {testimonials.map((t, i) => (
                <ScrollReveal key={i} delay={i * 100} className="min-w-[280px] max-w-[320px] snap-center shrink-0">
                  <div className="glass-card rounded-2xl p-6 h-full flex flex-col border border-card-border/50 hover:border-accent/30 transition-colors">
                    {/* Stars */}
                    <div className="flex gap-1 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={`h-4 w-4 ${j < t.rating ? "text-accent fill-accent" : "text-card-border"}`} />
                      ))}
                    </div>
                    {/* Quote */}
                    <p className="text-sm text-muted leading-relaxed mb-4 flex-1">&ldquo;{t.quote}&rdquo;</p>
                    {/* Client */}
                    <div className="flex items-center gap-3 border-t border-card-border/30 pt-4">
                      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                        {t.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{t.name}</p>
                        <p className="text-xs text-accent font-bold">{t.result}</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
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

      {/* APP PREVIEW — CSS phone mockups */}
      <section className="py-16 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-accent/[0.02]" />
        <div className="max-w-5xl mx-auto relative">
          <ScrollReveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Tu entrenamiento en el <span className="text-accent">bolsillo</span>
            </h2>
            <p className="text-sm text-muted mt-2">Todo lo que necesitas en una app</p>
          </ScrollReveal>

          <div className="flex justify-center items-end gap-4 sm:gap-8">
            {/* Phone Left - Ejercicios */}
            <ScrollReveal delay={100} className="hidden sm:block">
              <div className="relative" style={{ transform: "perspective(1000px) rotateY(8deg)" }}>
                <div className="absolute -inset-3 bg-primary/10 rounded-[2.5rem] blur-xl" />
                <div className="relative w-[160px] sm:w-[180px] h-[340px] sm:h-[380px] bg-[#1a1a1a] rounded-[2rem] border border-card-border p-1.5 shadow-xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#1a1a1a] rounded-b-xl z-10" />
                  <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-background p-3">
                    <div className="text-[9px] font-bold mb-2 text-center">Ejercicios</div>
                    {["Press banca", "Sentadilla", "Peso muerto", "Curl biceps"].map((ex, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5 p-1.5 rounded-lg bg-card-bg border border-card-border/30">
                        <div className="w-6 h-6 rounded bg-primary/20 flex-shrink-0" />
                        <div>
                          <div className="text-[7px] font-bold">{ex}</div>
                          <div className="text-[6px] text-muted">3x12</div>
                        </div>
                        <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Phone Center - Dashboard (largest) */}
            <ScrollReveal delay={0}>
              <div className="relative">
                <div className="absolute -inset-4 bg-accent/15 rounded-[3rem] blur-2xl" />
                <div className="relative w-[200px] sm:w-[240px] h-[420px] sm:h-[500px] bg-[#1a1a1a] rounded-[2.5rem] border-2 border-accent/30 p-2 shadow-2xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 bg-[#1a1a1a] rounded-b-2xl z-10" />
                  <div className="w-full h-full rounded-[2rem] overflow-hidden bg-background p-3">
                    <div className="text-[10px] font-bold mb-3 flex items-center justify-between">
                      <span>Dashboard</span>
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    {/* Stats row */}
                    <div className="flex gap-1.5 mb-3">
                      {[{ v: "Dia 23", l: "Racha" }, { v: "68kg", l: "Peso" }, { v: "1840", l: "kcal" }].map((s, i) => (
                        <div key={i} className="flex-1 bg-card-bg rounded-lg p-1.5 text-center border border-card-border/30">
                          <div className="text-[8px] font-black text-accent">{s.v}</div>
                          <div className="text-[6px] text-muted">{s.l}</div>
                        </div>
                      ))}
                    </div>
                    {/* Progress bar */}
                    <div className="mb-3">
                      <div className="text-[7px] text-muted mb-1">Progreso semanal</div>
                      <div className="h-2 rounded-full bg-card-bg overflow-hidden">
                        <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-primary to-accent" />
                      </div>
                    </div>
                    {/* Workout cards */}
                    {["Pecho + Triceps", "Espalda + Biceps", "Piernas"].map((w, i) => (
                      <div key={i} className="flex items-center gap-2 mb-1.5 p-2 rounded-lg bg-card-bg border border-card-border/30">
                        <Dumbbell className="h-3 w-3 text-accent flex-shrink-0" />
                        <div className="text-[7px] font-bold flex-1">{w}</div>
                        <div className={`text-[6px] px-1.5 py-0.5 rounded-full ${i === 0 ? "bg-accent/20 text-accent" : "bg-card-border/30 text-muted"}`}>
                          {i === 0 ? "Hoy" : i === 1 ? "Manana" : "Mie"}
                        </div>
                      </div>
                    ))}
                    {/* XP bar */}
                    <div className="mt-2 p-1.5 rounded-lg bg-accent/10 border border-accent/20">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[7px] font-bold text-accent">Nivel 5</div>
                        <div className="text-[6px] text-muted">320/500 XP</div>
                      </div>
                      <div className="h-1.5 rounded-full bg-card-bg overflow-hidden">
                        <div className="h-full w-[64%] rounded-full bg-accent" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Phone Right - Chat */}
            <ScrollReveal delay={200} className="hidden sm:block">
              <div className="relative" style={{ transform: "perspective(1000px) rotateY(-8deg)" }}>
                <div className="absolute -inset-3 bg-primary/10 rounded-[2.5rem] blur-xl" />
                <div className="relative w-[160px] sm:w-[180px] h-[340px] sm:h-[380px] bg-[#1a1a1a] rounded-[2rem] border border-card-border p-1.5 shadow-xl">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-5 bg-[#1a1a1a] rounded-b-xl z-10" />
                  <div className="w-full h-full rounded-[1.6rem] overflow-hidden bg-background p-3">
                    <div className="text-[9px] font-bold mb-2 text-center">Chat con Pablo</div>
                    {/* Chat bubbles */}
                    <div className="space-y-2">
                      <div className="bg-card-bg rounded-xl rounded-tl-sm p-2 max-w-[85%]">
                        <div className="text-[7px]">Hola Pablo! Tengo una duda con la sentadilla</div>
                        <div className="text-[5px] text-muted mt-0.5">10:30</div>
                      </div>
                      <div className="bg-primary/20 rounded-xl rounded-tr-sm p-2 max-w-[85%] ml-auto">
                        <div className="text-[7px]">Claro! Manda un video y te corrijo la tecnica</div>
                        <div className="text-[5px] text-muted mt-0.5 text-right">10:32</div>
                      </div>
                      <div className="bg-card-bg rounded-xl rounded-tl-sm p-2 max-w-[85%]">
                        <div className="text-[7px]">Genial, ahi va!</div>
                        <div className="text-[5px] text-muted mt-0.5">10:33</div>
                      </div>
                      <div className="bg-primary/20 rounded-xl rounded-tr-sm p-2 max-w-[85%] ml-auto">
                        <div className="text-[7px]">Perfecto! Baja un poco mas y apreta gluteos arriba</div>
                        <div className="text-[5px] text-muted mt-0.5 text-right">10:35</div>
                      </div>
                    </div>
                    {/* Input bar */}
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-card-bg rounded-full px-3 py-1.5 text-[7px] text-muted border border-card-border/30">
                        Escribe un mensaje...
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
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
            30 dias gratis. Sin tarjeta. Sin compromiso. Entrena con un plan hecho para vos.
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

      {/* SLIDER MODAL */}
      {sliderModal && (
        <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSliderModal(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors" onClick={() => setSliderModal(null)}>
            <X className="h-6 w-6 text-white" />
          </button>
          <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <p className="text-center text-sm text-muted mb-4">Arrastra para comparar antes y despues</p>
            <BeforeAfterSlider src={sliderModal} label="Transformacion" />
          </div>
        </div>
      )}

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

      {/* WhatsApp floating button */}
      <WhatsAppButton />
    </main>
  );
}
