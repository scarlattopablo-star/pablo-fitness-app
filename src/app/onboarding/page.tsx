"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { Dumbbell, Users, TrendingUp, Rocket, ChevronRight, ChevronLeft, UtensilsCrossed } from "lucide-react";
import { useRouter } from "next/navigation";
import { GymRatLogo } from "@/components/gymrat-logo";

// --- SPLASH SCREEN (photo + animated logo, fades into carousel) ---

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 3500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      {/* Background photo of Pablo with overlay */}
      <div className="absolute inset-0">
        <img
          src="/images/gym-bg-fullscreen.png"
          alt=""
          className="w-full h-full object-cover object-top"
          style={{ filter: "brightness(1.2) contrast(1.1)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background from-10% via-background/30 via-50% to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <GymRatLogo animated size="lg" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="text-muted text-sm mt-6 tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
        >
          TU ENTRENADOR PERSONAL
        </motion.p>

        {/* Loading dots */}
        <motion.div
          className="flex gap-1.5 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-emerald-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- CAROUSEL SLIDES ---

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

const SLIDES: Slide[] = [
  {
    title: "Entrenamiento",
    subtitle: "Personalizado",
    description:
      "Rutinas adaptadas a tu objetivo: quemar grasa, ganar músculo o tonificar. Con videos demostrativos de cada ejercicio.",
    icon: <Dumbbell className="w-16 h-16 text-emerald-400" />,
    gradient: "from-blue-500/20 to-transparent",
  },
  {
    title: "Nutrición",
    subtitle: "A tu Medida",
    description:
      "Plan de nutrición con cálculo de macros personalizado. Cada comida pensada para tu objetivo y estilo de vida.",
    icon: <UtensilsCrossed className="w-16 h-16 text-emerald-400" />,
    gradient: "from-yellow-500/20 to-transparent",
  },
  {
    title: "Comunidad",
    subtitle: "Gym Bro",
    description:
      "Conectá con otros que entrenan como vos. Encontrá un compañero de entrenamiento, compartan rutinas y motívense juntos.",
    icon: <Users className="w-16 h-16 text-emerald-400" />,
    gradient: "from-purple-500/20 to-transparent",
  },
  {
    title: "Seguí tu",
    subtitle: "Progreso",
    description:
      "Registrá fotos, mediciones y peso. Competí en el ranking semanal y ganá badges por tus logros.",
    icon: <TrendingUp className="w-16 h-16 text-emerald-400" />,
    gradient: "from-orange-500/20 to-transparent",
  },
  {
    title: "Empezá",
    subtitle: "Ahora",
    description:
      "Elegí tu plan personalizado o probá gratis por 7 días. Tu transformación empieza hoy.",
    icon: <Rocket className="w-16 h-16 text-emerald-400" />,
    gradient: "from-emerald-500/20 to-transparent",
  },
];

const SWIPE_THRESHOLD = 50;

export default function OnboardingPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [hasSeenBefore, setHasSeenBefore] = useState(false);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const router = useRouter();
  const isLast = current === SLIDES.length - 1;

  useEffect(() => {
    setHasSeenBefore(localStorage.getItem("hasSeenOnboarding") === "true");
  }, []);

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= SLIDES.length) return;
      setDirection(next > current ? 1 : -1);
      setCurrent(next);
    },
    [current]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && current < SLIDES.length - 1) {
      go(current + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && current > 0) {
      go(current - 1);
    }
  };

  const finish = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    router.push("/planes");
  };

  const slide = SLIDES[current];

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      {/* SPLASH SCREEN — always shows, fades out after 3.5s */}
      {/* If user already saw carousel, splash redirects to /planes after fade */}
      <AnimatePresence>
        {showSplash && (
          <SplashScreen
            onFinish={() => {
              setShowSplash(false);
              if (hasSeenBefore) {
                router.push("/planes");
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-radial ${slide.gradient} pointer-events-none transition-all duration-700`}
      />

      {/* Skip button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={finish}
          className="text-xs text-muted hover:text-foreground transition-colors px-3 py-1.5 rounded-full border border-card-border/50"
        >
          Omitir
        </button>
      </div>

      {/* Logo fixed top */}
      <div className="pt-6 flex justify-center relative z-10">
        <GymRatLogo size="sm" />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="flex flex-col items-center text-center max-w-sm mx-auto select-none"
          >
            {/* Icon */}
            <div className="w-28 h-28 rounded-3xl bg-card-bg/50 border border-card-border/30 flex items-center justify-center mb-8 backdrop-blur-sm">
              {slide.icon}
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-black uppercase leading-tight mb-2">
              {slide.title}
            </h1>
            <h2 className="text-4xl sm:text-5xl font-black uppercase leading-tight text-emerald-400 mb-6">
              {slide.subtitle}
            </h2>

            {/* Description */}
            <p className="text-muted text-base sm:text-lg leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-6 pb-10 pt-6 relative z-10">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-emerald-400"
                  : "w-2 bg-card-border hover:bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-3">
          {current > 0 && (
            <button
              onClick={() => go(current - 1)}
              className="w-14 h-14 rounded-2xl border border-card-border/50 flex items-center justify-center text-muted hover:text-foreground hover:border-card-border transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={isLast ? finish : () => go(current + 1)}
            className="flex-1 h-14 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all bg-emerald-500 hover:bg-emerald-400 text-black"
          >
            {isLast ? (
              "Ver Planes"
            ) : (
              <>
                Siguiente
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
