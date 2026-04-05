"use client";

import Link from "next/link";
import {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy, Heart,
  Shield, RefreshCw, Users, Medal, Home, ArrowRight, Star,
  ChevronRight, Zap, Target, BarChart3, Smartphone, UtensilsCrossed,
} from "lucide-react";
import { PLANS, formatPrice } from "@/lib/plans-data";
import { InstagramIcon } from "@/components/icons";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal, Home,
};

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen overflow-hidden">
      {/* NAVBAR — minimal, floating */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-background/70 border-b border-card-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-10 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#planes" className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest font-medium">
              {t("nav.plans")}
            </a>
            <a href="#como-funciona" className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest font-medium">
              {t("nav.howItWorks")}
            </a>
            <a href="#testimonios" className="text-xs text-muted hover:text-foreground transition-colors uppercase tracking-widest font-medium">
              {t("nav.results")}
            </a>
            <div className="w-px h-4 bg-card-border" />
            <LanguageSelector />
            <Link href="/login" className="text-xs text-muted hover:text-foreground transition-colors font-medium">
              {t("nav.login")}
            </Link>
            <Link href="/planes" className="btn-shimmer text-sm px-5 py-2 rounded-full">
              {t("nav.startNow")}
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-3">
            <LanguageSelector />
            <Link href="/login" className="text-xs text-muted font-medium">{t("nav.login")}</Link>
            <Link href="/planes" className="btn-shimmer text-xs px-4 py-2 rounded-full">{t("nav.start")}</Link>
          </div>
        </div>
      </nav>

      {/* HERO — dramatic, asymmetric */}
      <section className="relative pt-28 sm:pt-36 pb-24 sm:pb-32 px-4">
        {/* Background layers */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20" style={{ backgroundImage: "url(/images/gym-bg.png)", filter: "grayscale(100%)" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute top-32 right-0 w-[500px] h-[500px] bg-primary/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px]" />

        <div className="relative max-w-6xl mx-auto">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="badge-gold inline-flex items-center gap-2 mb-8 animate-fade-in-up">
              <Zap className="h-3 w-3" />
              {t("hero.badge")}
            </div>

            {/* Title — huge */}
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black leading-[0.95] mb-8 animate-fade-in-up animate-delay-100 tracking-tight">
              {t("hero.title1")}
              <br />
              <span className="text-gradient">{t("hero.title2")}</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted max-w-lg mb-10 animate-fade-in-up animate-delay-200 leading-relaxed">
              {t("hero.subtitle")}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animate-delay-300">
              <Link href="/planes" className="btn-shimmer text-lg px-8 py-4 rounded-full flex items-center justify-center gap-2">
                {t("hero.viewPlans")} <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="https://instagram.com/pabloscarlattoentrenamientos" target="_blank" rel="noopener noreferrer"
                className="btn-outline-premium text-lg px-8 py-4 rounded-full flex items-center justify-center gap-2">
                <InstagramIcon className="h-5 w-5" /> Instagram
              </a>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap gap-6 mt-14 animate-fade-in-up animate-delay-400">
              {[
                { label: t("hero.online"), value: "100%" },
                { label: t("hero.personalized"), value: "75+" },
                { label: t("hero.tracking"), value: "24/7" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-2xl font-black text-primary stat-glow">{item.value}</span>
                  <span className="text-xs text-muted uppercase tracking-wider">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="line-accent max-w-5xl mx-auto" />

      {/* PLANES — horizontal cards */}
      <section id="planes" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <span className="badge-primary mb-4 inline-block">{t("nav.plans")}</span>
            <h2 className="text-4xl sm:text-5xl font-black mb-4 tracking-tight">
              {t("plans.title1")} <span className="text-gradient">{t("plans.title2")}</span>
            </h2>
            <p className="text-muted max-w-lg">{t("plans.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PLANS.slice(0, 6).map((plan, i) => {
              const Icon = ICON_MAP[plan.icon] || Dumbbell;
              const isPopular = plan.slug === "ganancia-muscular";
              return (
                <Link key={plan.slug} href={`/planes/${plan.slug}`}
                  className={`card-premium rounded-2xl p-6 group relative ${isPopular ? "border-primary/30" : ""}`}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {isPopular && <div className="badge-gold absolute top-4 right-4">Popular</div>}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${plan.color}15` }}>
                      <Icon className="h-6 w-6" style={{ color: plan.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base mb-1 group-hover:text-primary transition-colors">{plan.name}</h3>
                      <p className="text-xs text-muted mb-3 line-clamp-2">{plan.shortDescription}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-sm">{t("plans.from")} ${formatPrice(plan.prices["1-mes"])}<span className="text-muted font-normal">/{t("plans.month")}</span></span>
                        <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          {PLANS.length > 6 && (
            <div className="text-center mt-8">
              <Link href="/planes" className="btn-outline-premium inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm">
                Ver los {PLANS.length} planes <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* DIVIDER */}
      <div className="line-accent max-w-5xl mx-auto" />

      {/* COMO FUNCIONA — Timeline vertical */}
      <section id="como-funciona" className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-primary mb-4 inline-block">{t("nav.howItWorks")}</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              {t("how.title1")} <span className="text-gradient">{t("how.title2")}</span>
            </h2>
          </div>
          <div className="space-y-0">
            {[1, 2, 3, 4].map((num, i) => (
              <div key={num} className="flex gap-6">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="timeline-dot" />
                  {i < 3 && <div className="timeline-line flex-1 min-h-[80px]" />}
                </div>
                {/* Content */}
                <div className="pb-12">
                  <span className="text-xs text-primary font-bold uppercase tracking-widest">Paso {num}</span>
                  <h3 className="font-bold text-lg mt-1 mb-2">{t(`how.step${num}.title`)}</h3>
                  <p className="text-sm text-muted leading-relaxed">{t(`how.step${num}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES — icon + text rows */}
      <section className="py-24 px-4 bg-card-bg/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-primary mb-4 inline-block">Incluido</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              {t("features.title1")} <span className="text-gradient">{t("features.title2")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            {[
              { icon: Target, key: "macros" },
              { icon: Dumbbell, key: "videos" },
              { icon: BarChart3, key: "photos" },
              { icon: UtensilsCrossed, key: "nutrition" },
              { icon: Zap, key: "training" },
              { icon: Smartphone, key: "support" },
            ].map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{t(`features.${key}.title`)}</h3>
                  <p className="text-sm text-muted leading-relaxed">{t(`features.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS — offset layout with large quotes */}
      <section id="testimonios" className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="badge-primary mb-4 inline-block">{t("nav.results")}</span>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
              {t("testimonials.title1")} <span className="text-gradient">{t("testimonials.title2")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Manuela G.", result: "Perdio 12kg en 6 meses", text: "El plan de quema grasa cambio mi vida. Las comidas son faciles de preparar y el entrenamiento es desafiante pero alcanzable." },
              { name: "Javier C.", result: "Gano 8kg de musculo en 4 meses", text: "Increible como el plan personalizado y los videos de ejercicios me ayudaron a ejecutar todo correctamente desde el primer dia." },
              { name: "Paulina B.", result: "Mejoro su rendimiento deportivo", text: "La nutricion con timing para mis carreras fue clave. Baje mis tiempos y me siento con mas energia que nunca." },
            ].map((item, i) => (
              <div key={item.name} className={`card-premium rounded-2xl p-6 ${i === 1 ? "md:-translate-y-4" : ""}`}>
                {/* Large quote mark */}
                <span className="text-5xl font-black text-primary/15 leading-none block mb-2">&ldquo;</span>
                <p className="text-sm text-muted mb-6 leading-relaxed">{item.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-black font-bold text-xs">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-primary">{item.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL — clean, powerful */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl sm:text-6xl font-black mb-6 tracking-tight">
            {t("cta.title1")}
            <br />
            <span className="text-gradient">{t("cta.title2")}</span>
          </h2>
          <p className="text-muted mb-10 max-w-md mx-auto leading-relaxed">{t("cta.subtitle")}</p>
          <Link href="/planes" className="btn-shimmer inline-flex items-center gap-2 text-lg px-10 py-4 rounded-full">
            {t("cta.viewAll")} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER — compact, single row */}
      <footer className="border-t border-card-border/50 py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center">
            <img src="/logo-pablo.jpg" alt="Pablo Scarlatto" className="h-8 w-auto" style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
          </div>
          <div className="flex items-center gap-5">
            <a href="https://instagram.com/pabloscarlattoentrenamientos" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-primary transition-colors">
              <InstagramIcon className="h-4 w-4" />
            </a>
            <Link href="/planes" className="text-xs text-muted hover:text-foreground transition-colors">{t("nav.plans")}</Link>
            <Link href="/login" className="text-xs text-muted hover:text-foreground transition-colors">{t("footer.login")}</Link>
            <Link href="/terminos" className="text-xs text-muted hover:text-foreground transition-colors">Terminos</Link>
            <Link href="/privacidad" className="text-xs text-muted hover:text-foreground transition-colors">Privacidad</Link>
          </div>
          <p className="text-[10px] text-muted/60">&copy; 2026 {t("footer.rights")}</p>
        </div>
      </footer>
    </main>
  );
}
