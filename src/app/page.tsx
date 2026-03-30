"use client";

import Link from "next/link";
import {
  Flame,
  Dumbbell,
  Sparkles,
  GraduationCap,
  Trophy,
  Heart,
  Shield,
  RefreshCw,
  Users,
  Medal,
  ArrowRight,
  CheckCircle,
  Star,
  ChevronRight,
} from "lucide-react";
import { PLANS } from "@/lib/plans-data";
import { InstagramIcon } from "@/components/icons";
import { LanguageSelector } from "@/components/language-selector";
import { useI18n } from "@/lib/i18n";

const ICON_MAP: Record<string, React.ElementType> = {
  Flame, Dumbbell, Sparkles, GraduationCap, Trophy,
  Heart, Shield, RefreshCw, Users, Medal,
};

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-card-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Dumbbell className="h-7 w-7 text-primary" />
            <span className="font-bold text-lg tracking-tight">
              PABLO SCARLATTO
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#planes" className="text-sm text-muted hover:text-white transition-colors">
              {t("nav.plans")}
            </a>
            <a href="#como-funciona" className="text-sm text-muted hover:text-white transition-colors">
              {t("nav.howItWorks")}
            </a>
            <a href="#testimonios" className="text-sm text-muted hover:text-white transition-colors">
              {t("nav.results")}
            </a>
            <LanguageSelector />
            <Link
              href="/planes"
              className="gradient-primary text-black font-semibold text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
            >
              {t("nav.startNow")}
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <LanguageSelector />
            <Link
              href="/planes"
              className="gradient-primary text-black font-semibold text-sm px-4 py-2 rounded-full"
            >
              {t("nav.start")}
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-dark" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm mb-8 animate-fade-in-up">
            <Star className="h-4 w-4" />
            {t("hero.badge")}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6 animate-fade-in-up animate-delay-100">
            {t("hero.title1")}
            <br />
            <span className="text-gradient">{t("hero.title2")}</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 animate-fade-in-up animate-delay-200">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animate-delay-300">
            <Link
              href="/planes"
              className="gradient-primary text-black font-bold text-lg px-8 py-4 rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {t("hero.viewPlans")} <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="https://instagram.com/pabloscarlattoentrenamientos"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-card-border text-white font-semibold text-lg px-8 py-4 rounded-full hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
            >
              <InstagramIcon className="h-5 w-5" /> Instagram
            </a>
          </div>
          <div className="flex justify-center gap-8 mt-12 text-sm text-muted animate-fade-in-up animate-delay-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("hero.online")}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("hero.personalized")}
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-primary" />
              {t("hero.tracking")}
            </div>
          </div>
        </div>
      </section>

      {/* PLANES */}
      <section id="planes" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {t("plans.title1")} <span className="text-gradient">{t("plans.title2")}</span>
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              {t("plans.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {PLANS.map((plan) => {
              const Icon = ICON_MAP[plan.icon] || Dumbbell;
              return (
                <Link
                  key={plan.slug}
                  href={`/planes/${plan.slug}`}
                  className="glass-card rounded-2xl p-6 hover-glow transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: plan.color }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-muted mb-4 line-clamp-2">
                    {plan.shortDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">
                      {t("plans.from")} ${plan.prices["1-mes"]}/{t("plans.month")}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="py-20 px-4 bg-card-bg/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {t("how.title1")} <span className="text-gradient">{t("how.title2")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className="text-center">
                <div className="text-5xl font-black text-primary/20 mb-4">
                  {String(num).padStart(2, "0")}
                </div>
                <h3 className="font-bold text-lg mb-2">{t(`how.step${num}.title`)}</h3>
                <p className="text-sm text-muted">{t(`how.step${num}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {t("features.title1")} <span className="text-gradient">{t("features.title2")}</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["macros", "videos", "photos", "nutrition", "training", "support"].map((key) => (
              <div
                key={key}
                className="glass-card rounded-2xl p-6 hover-glow transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{t(`features.${key}.title`)}</h3>
                <p className="text-sm text-muted">{t(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios" className="py-20 px-4 bg-card-bg/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              {t("testimonials.title1")} <span className="text-gradient">{t("testimonials.title2")}</span>
            </h2>
            <p className="text-muted">{t("testimonials.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Manuela G.",
                result: "Perdió 12kg en 6 meses",
                text: "El plan de quema grasa cambió mi vida. Las comidas son fáciles de preparar y el entrenamiento es desafiante pero alcanzable.",
              },
              {
                name: "Javier C.",
                result: "Ganó 8kg de músculo en 4 meses",
                text: "Increíble cómo el plan personalizado y los videos de ejercicios me ayudaron a ejecutar todo correctamente desde el primer día.",
              },
              {
                name: "Paulina B.",
                result: "Mejoró su rendimiento deportivo",
                text: "La nutrición con timing para mis carreras fue clave. Bajé mis tiempos y me siento con más energía que nunca.",
              },
            ].map((item) => (
              <div key={item.name} className="glass-card rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-muted mb-4">&ldquo;{item.text}&rdquo;</p>
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-primary">{item.result}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black mb-6">
            {t("cta.title1")} <span className="text-gradient">{t("cta.title2")}</span>
          </h2>
          <p className="text-muted mb-10 max-w-xl mx-auto">
            {t("cta.subtitle")}
          </p>
          <Link
            href="/planes"
            className="inline-flex items-center gap-2 gradient-primary text-black font-bold text-lg px-10 py-4 rounded-full hover:opacity-90 transition-opacity"
          >
            {t("cta.viewAll")} <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-card-border py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            <span className="font-bold">PABLO SCARLATTO ENTRENAMIENTOS</span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://instagram.com/pabloscarlattoentrenamientos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted hover:text-primary transition-colors"
            >
              <InstagramIcon className="h-5 w-5" />
            </a>
            <Link href="/planes" className="text-sm text-muted hover:text-white transition-colors">
              {t("nav.plans")}
            </Link>
            <Link href="/login" className="text-sm text-muted hover:text-white transition-colors">
              {t("footer.login")}
            </Link>
          </div>
          <p className="text-xs text-muted">
            &copy; 2026 {t("footer.rights")}
          </p>
        </div>
      </footer>
    </main>
  );
}
