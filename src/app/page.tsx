"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import WhatsAppButton from "@/components/whatsapp-button";
import { LanguageSelector } from "@/components/language-selector";
import PainPointsBlock from "@/components/pain-points-block";
import Glutes360Offer, { CUPOS_RESTANTES, CUPOS_AGOTADOS, formatCierreMes } from "@/components/glutes-360-offer";
import { useI18n } from "@/lib/i18n";
import { trackEvent } from "@/lib/track-event";

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

// Defer non-critical media (bg video) until the page has loaded
function useAfterLoad() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const onLoad = () => setReady(true);
    if (document.readyState === "complete") {
      const id = setTimeout(onLoad, 0);
      return () => clearTimeout(id);
    }
    window.addEventListener("load", onLoad);
    const fallback = setTimeout(onLoad, 3500);
    return () => { window.removeEventListener("load", onLoad); clearTimeout(fallback); };
  }, []);
  return ready;
}

// Caso destacado + grilla de transformaciones
const featured = { src: "/images/hero-training.jpg", result: "Quema de grasa" };
const transformations = [
  { src: "/images/transf-nueva-1.jpg", result: "Quema de grasa" },
  { src: "/images/transf-hombre-musculo.jpg", result: "Ganancia muscular" },
  { src: "/images/transf-nueva-5.jpg", result: "Tonificación" },
  { src: "/images/transf-mujer-lateral.jpg", result: "Recomposición" },
  { src: "/images/transf-hombre-definicion.jpg", result: "Definición" },
  { src: "/images/transf-nueva-3.jpg", result: "Quema de grasa" },
  { src: "/images/transf-mujer4-espalda.jpg", result: "Tonificación" },
  { src: "/images/transf-nueva-6.jpg", result: "Definición" },
];

const proofThumbs = ["/images/transf-nueva-4.jpg", "/images/transf-mujer3-frente.jpg", "/images/pablo-gym.jpg"];

const testimonials = [
  { name: "María L.", result: "−12 kg en 3 meses", quote: "Pablo me cambió la forma de entrenar. Nunca pensé que iba a lograr estos resultados." },
  { name: "Juan R.", result: "+8 kg de músculo", quote: "El plan de nutrición fue clave. Todo súper personalizado y fácil de seguir." },
  { name: "Carolina A.", result: "−8 kg en 2 meses", quote: "Tengo todo en el celular. Los videos de los ejercicios me salvan." },
  { name: "Diego P.", result: "Definición", quote: "La mejor inversión que hice. El seguimiento semanal te mantiene enfocado." },
  { name: "Lucía M.", result: "−15 kg en 4 meses", quote: "Empecé sin saber nada y hoy entreno con confianza. Pablo explica todo clarísimo." },
  { name: "Martín S.", result: "Recomposición", quote: "Pasé de no hacer nada a entrenar 5 veces por semana. El chat directo con Pablo es un golazo." },
];

const incluye = [
  { title: "Plan de entrenamiento", desc: "Tu rutina día por día, armada según tu nivel, tu tiempo y si entrenás en casa o en el gym." },
  { title: "Plan de nutrición", desc: "Comidas con tus calorías y macros calculados. Podés cambiar alimentos sin romper el plan." },
  { title: "Técnica en video", desc: "Cada ejercicio con su demostración, para que lo hagas bien desde la primera serie." },
  { title: "Seguimiento", desc: "Registrás peso, cargas y fotos de progreso. Ves cómo avanzás semana a semana." },
  { title: "Chat con Pablo", desc: "Dudas, ajustes o un video de tu sentadilla: le escribís directo y te responde él." },
];

export default function HomePage() {
  const { t } = useI18n();
  const mediaReady = useAfterLoad();
  const cierre = useMemo(() => formatCierreMes(), []);

  // Navbar compacta al hacer scroll
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="landing min-h-[100dvh] overflow-x-clip">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-[var(--l-accent)] focus:text-[var(--l-accent-ink)] focus:px-4 focus:py-2 focus:rounded-full">
        Saltar al contenido
      </a>

      {/* NAVBAR */}
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-[background-color,border-color,height] duration-300 border-b ${
          scrolled ? "h-16 bg-[var(--l-bg)]/85 backdrop-blur-xl border-[var(--l-line)]" : "h-20 bg-transparent border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center" aria-label="Pablo Scarlatto Entrenamientos, inicio">
            <img
              src="/logo-pablo.jpg"
              alt="Pablo Scarlatto"
              className={`w-auto transition-[height] duration-300 ${scrolled ? "h-11" : "h-14"}`}
              style={{ filter: "invert(1)", mixBlendMode: "screen" }}
            />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm">
            <a href="#resultados" className="text-[var(--l-muted)] hover:text-[var(--l-text)] transition-colors">Resultados</a>
            <a href="#incluido" className="text-[var(--l-muted)] hover:text-[var(--l-text)] transition-colors">Qué incluye</a>
            <Link href="/planes" className="text-[var(--l-muted)] hover:text-[var(--l-text)] transition-colors">Planes</Link>
            <span className="w-px h-4 bg-[var(--l-line-strong)]" />
            <LanguageSelector />
            <Link href="/login" className="text-[var(--l-muted)] hover:text-[var(--l-text)] transition-colors">{t("nav.login")}</Link>
            <Link href="/registro-gratis" className="l-btn !py-2.5 !px-5 text-sm">30 días gratis</Link>
          </div>
          <div className="flex md:hidden items-center gap-3 text-sm">
            <LanguageSelector />
            <Link href="/login" className="text-[var(--l-muted)]">{t("nav.login")}</Link>
            <Link href="/registro-gratis" className="l-btn !py-2 !px-4 text-sm">Gratis</Link>
          </div>
        </div>
      </nav>

      <WhatsAppButton />

      {/* HERO */}
      <section id="contenido" className="relative px-5 sm:px-8 pt-28 sm:pt-32 pb-20 lg:min-h-[100dvh] flex items-center">
        {/* Video de fondo, cargado después del load */}
        <div className="absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          {mediaReady && (
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              className="absolute inset-0 w-full h-full object-cover opacity-[0.07]"
              style={{ filter: "grayscale(100%)" }}
            >
              <source src="/videos/hero-bg-1.mp4" type="video/mp4" />
            </video>
          )}
          <div className="absolute inset-0" style={{ background: "radial-gradient(70% 60% at 80% 30%, rgba(62,207,138,0.10), transparent 70%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[var(--l-bg)]" />
        </div>

        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Copy */}
          <div className="lg:col-span-7">
            <p className="l-eyebrow mb-7 animate-fade-in-up">Coaching online de entrenamiento y nutrición</p>

            <h1 className="l-display l-hero-title animate-fade-in-up animate-delay-100">
              Transformate
              <span className="block">en <span className="text-[var(--l-accent)]">30 días</span></span>
            </h1>

            <p className="text-lg sm:text-xl text-[var(--l-muted)] max-w-[30rem] mt-8 leading-relaxed animate-fade-in-up animate-delay-200">
              Un plan de entrenamiento y comidas hecho para tu cuerpo, con Pablo del otro lado del chat. Sin dietas extremas.
            </p>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 mt-10 animate-fade-in-up animate-delay-300">
              <a
                href="#oferta-transformacion"
                onClick={() => trackEvent("cta_hero_click", { destino: "oferta" })}
                className="l-btn text-base"
              >
                Quiero empezar <ArrowRight className="h-5 w-5" />
              </a>
              <Link
                href="/planes"
                onClick={() => trackEvent("cta_hero_click", { destino: "planes" })}
                className="l-link text-base"
              >
                Ver todos los planes
              </Link>
            </div>

            {/* Prueba social con fotos reales */}
            <div className="flex items-center gap-4 mt-12 pt-8 l-rule max-w-md animate-fade-in-up animate-delay-400">
              <div className="flex -space-x-3">
                {proofThumbs.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="w-11 h-11 rounded-[0.8rem] object-cover ring-2 ring-[var(--l-bg)]"
                    loading="lazy"
                  />
                ))}
              </div>
              <p className="text-sm text-[var(--l-muted)] leading-snug">
                <span className="text-[var(--l-text)] font-semibold l-tabular">42 alumnos</span> entrenando hoy
                <br />con su plan en la app
              </p>
            </div>
          </div>

          {/* Foto */}
          <div className="lg:col-span-5 relative animate-fade-in-up animate-delay-200">
            <div className="relative aspect-[4/5] rounded-[1.75rem] overflow-hidden" style={{ boxShadow: "0 50px 100px -40px rgba(0,0,0,0.9), inset 0 0 0 1px var(--l-line)" }}>
              <img
                src="/images/pablo-row.jpg"
                alt="Pablo Scarlatto entrenando remo con mancuerna"
                fetchPriority="high"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover object-[62%_50%] scale-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between text-white">
                <div>
                  <p className="text-sm font-semibold">Pablo Scarlatto</p>
                  <p className="text-xs text-white/70">Entrenador personal · Uruguay</p>
                </div>
                <a
                  href="https://instagram.com/pabloscarlattoentrenamientos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-colors"
                  aria-label="Instagram de Pablo"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Chip de cupos, montado sobre la foto */}
            {!CUPOS_AGOTADOS && (
              <a
                href="#oferta-transformacion"
                className="absolute -left-3 sm:-left-8 top-8 flex items-center gap-3 rounded-2xl px-4 py-3 backdrop-blur-xl transition-transform hover:-translate-y-0.5"
                style={{ background: "rgba(18,21,19,0.82)", boxShadow: "inset 0 0 0 1px var(--l-line-strong), 0 20px 40px -20px rgba(0,0,0,0.8)" }}
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--l-accent)] opacity-60 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--l-accent)]" />
                </span>
                <span className="text-sm leading-tight">
                  <span className="font-semibold">Quedan <span className="l-tabular">{CUPOS_RESTANTES}</span> cupos</span>
                  <span className="block text-xs text-[var(--l-muted)]" suppressHydrationWarning>El reto cierra el {cierre}</span>
                </span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* IDENTIFICACIÓN */}
      <PainPointsBlock />

      {/* RESULTADOS — bento con caso destacado */}
      <section id="resultados" className="px-5 sm:px-8 py-24 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="l-eyebrow mb-4">Resultados</p>
              <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.02] max-w-xl">
                Gente común, con trabajo y poco tiempo.
              </h2>
            </div>
            <p className="text-[var(--l-muted)] max-w-xs">
              Transformaciones de alumnos que siguieron su plan, con fotos compartidas por ellos.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <ScrollReveal className="col-span-2 row-span-2">
              <figure className="l-tile group h-full relative">
                <img src={featured.src} alt={`Antes y después: ${featured.result}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" />
                <figcaption className="absolute left-4 bottom-4 rounded-full px-3.5 py-1.5 text-sm font-medium backdrop-blur-md" style={{ background: "rgba(11,13,12,0.72)" }}>
                  {featured.result}
                </figcaption>
              </figure>
            </ScrollReveal>
            {transformations.map((item, i) => (
              <ScrollReveal key={item.src} delay={(i % 4) * 70}>
                <figure className="l-tile group relative aspect-square">
                  <img src={item.src} alt={`Antes y después: ${item.result}`} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" />
                  <figcaption className="absolute left-3 bottom-3 rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md" style={{ background: "rgba(11,13,12,0.72)" }}>
                    {item.result}
                  </figcaption>
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS — muro */}
      <section className="px-5 sm:px-8 py-24">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="mb-12">
            <p className="l-eyebrow mb-4">Alumnos</p>
            <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.02] max-w-xl">Lo que cuentan después.</h2>
          </ScrollReveal>
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {testimonials.map((tm, i) => (
              <ScrollReveal key={tm.name} delay={(i % 3) * 90} className="break-inside-avoid mb-4">
                <figure className="l-tile p-6 sm:p-7">
                  <p className="l-display l-tabular text-3xl text-[var(--l-accent)] mb-4">{tm.result}</p>
                  <blockquote className={`${i % 3 === 0 ? "text-xl" : "text-base"} leading-relaxed`}>
                    &ldquo;{tm.quote}&rdquo;
                  </blockquote>
                  <figcaption className="flex items-center gap-3 mt-6 text-sm">
                    <span className="w-9 h-9 rounded-[0.7rem] bg-[var(--l-surface-2)] flex items-center justify-center text-xs font-semibold text-[var(--l-muted)]" style={{ boxShadow: "inset 0 0 0 1px var(--l-line)" }}>
                      {tm.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span className="font-medium">{tm.name}</span>
                  </figcaption>
                </figure>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* OFERTA */}
      <Glutes360Offer />

      {/* QUÉ INCLUYE — split con teléfono */}
      <section id="incluido" className="px-5 sm:px-8 py-24 scroll-mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-8">
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <p className="l-eyebrow mb-4">Qué incluye</p>
              <h2 className="text-4xl sm:text-5xl font-semibold leading-[1.02] mb-10">
                Todo tu plan, en el bolsillo.
              </h2>

              {/* Teléfono */}
              <div className="relative w-[250px] mx-auto lg:mx-0">
                <div className="absolute -inset-10 rounded-full blur-3xl" style={{ background: "rgba(62,207,138,0.10)" }} aria-hidden="true" />
                <div className="relative h-[500px] rounded-[2.6rem] p-2" style={{ background: "#161917", boxShadow: "inset 0 0 0 1px var(--l-line-strong), 0 40px 80px -30px rgba(0,0,0,0.9)" }}>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black z-10" />
                  <div className="w-full h-full rounded-[2.1rem] overflow-hidden bg-[var(--l-bg)] px-4 pt-10 pb-4 text-[var(--l-text)]" aria-hidden="true">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[9px] text-[var(--l-muted)]">Martes</p>
                        <p className="text-[13px] font-semibold">Hola, Lucía</p>
                      </div>
                      <span className="text-[9px] px-2 py-1 rounded-full bg-[var(--l-accent-soft)] text-[var(--l-accent)] font-semibold l-tabular">Racha 23</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-4">
                      {[{ v: "67,4", l: "kg" }, { v: "1.840", l: "kcal" }, { v: "142", l: "g prot." }].map((s) => (
                        <div key={s.l} className="rounded-xl bg-[var(--l-surface)] p-2" style={{ boxShadow: "inset 0 0 0 1px var(--l-line)" }}>
                          <p className="text-[12px] font-semibold l-tabular">{s.v}</p>
                          <p className="text-[8px] text-[var(--l-muted)]">{s.l}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[9px] text-[var(--l-muted)] mb-1.5">Hoy · Piernas y glúteos</p>
                    {[
                      { n: "Sentadilla búlgara", s: "4 × 10", done: true },
                      { n: "Hip thrust", s: "4 × 12", done: true },
                      { n: "Peso muerto rumano", s: "3 × 10", done: false },
                      { n: "Abducción en máquina", s: "3 × 15", done: false },
                    ].map((ex) => (
                      <div key={ex.n} className="flex items-center gap-2 py-2 border-b border-[var(--l-line)]">
                        <span className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${ex.done ? "bg-[var(--l-accent)]" : ""}`} style={ex.done ? undefined : { boxShadow: "inset 0 0 0 1.5px var(--l-line-strong)" }} />
                        <span className={`text-[10px] flex-1 ${ex.done ? "text-[var(--l-muted)] line-through" : ""}`}>{ex.n}</span>
                        <span className="text-[9px] text-[var(--l-muted)] l-tabular">{ex.s}</span>
                      </div>
                    ))}
                    <div className="mt-4 rounded-xl p-3 bg-[var(--l-surface)]" style={{ boxShadow: "inset 0 0 0 1px var(--l-line)" }}>
                      <p className="text-[9px] text-[var(--l-muted)] mb-1">Pablo · 10:32</p>
                      <p className="text-[10px] leading-snug">Buenísimo el video. Bajá un poco más y apretá glúteos arriba.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ol className="lg:col-span-6 lg:col-start-7">
            {incluye.map((item, i) => (
              <ScrollReveal key={item.title} delay={i * 60}>
                <li className="l-rule grid grid-cols-[3rem_1fr] gap-4 py-8">
                  <span className="l-display l-tabular text-3xl text-[var(--l-accent)]">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-[var(--l-muted)] leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </li>
              </ScrollReveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 sm:px-8 pt-16 pb-28">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative rounded-[1.75rem] overflow-hidden px-7 sm:px-14 py-16 sm:py-20" style={{ boxShadow: "inset 0 0 0 1px var(--l-line)" }}>
            <img src="/images/pablo-gym2.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--l-bg)] via-[var(--l-bg)]/85 to-[var(--l-bg)]/30" />
            <div className="relative max-w-xl">
              <h2 className="l-display l-cta-title">
                Empezá
                <span className="block text-[var(--l-accent)]">esta semana</span>
              </h2>
              <p className="text-[var(--l-muted)] text-lg mt-6 max-w-md">
                Acceso inmediato. Entrenamiento y nutrición incluidos. Pocos cupos por mes para poder seguirte de cerca.
              </p>
              <div className="flex flex-wrap items-center gap-x-7 gap-y-4 mt-10">
                <a
                  href="#oferta-transformacion"
                  onClick={() => trackEvent("cta_final_click", { destino: "oferta" })}
                  className="l-btn text-base"
                >
                  Unirme al reto <ArrowRight className="h-5 w-5" />
                </a>
                <Link href="/planes" className="l-link">Ver todos los planes</Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* FOOTER */}
      <footer className="l-rule px-5 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 text-sm">
          <div className="flex items-center gap-4">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-10 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
            <p className="text-xs text-[var(--l-muted)]">&copy; 2026 Pablo Scarlatto Entrenamientos</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[var(--l-muted)]">
            <Link href="/planes" className="hover:text-[var(--l-text)] transition-colors">Planes</Link>
            <Link href="/login" className="hover:text-[var(--l-text)] transition-colors">Ingresar</Link>
            <Link href="/terminos" className="hover:text-[var(--l-text)] transition-colors">Términos</Link>
            <Link href="/privacidad" className="hover:text-[var(--l-text)] transition-colors">Privacidad</Link>
            <a href="https://instagram.com/pabloscarlattoentrenamientos" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[var(--l-text)] transition-colors">
              Instagram <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
