"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { trackEvent } from "@/lib/track-event";

const PAINS = [
  "Entrenas y no ves cambios",
  "Te cuesta marcar abdomen",
  "Sentis que tu cuerpo no responde",
];

export default function PainPointsBlock() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trackEvent("pain_points_view");
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="identificacion"
      className="py-14 px-4 border-y border-card-border/40 bg-card-bg/20"
      aria-labelledby="pain-points-title"
    >
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-xs uppercase tracking-widest text-accent font-bold mb-3">
          Te sentis identificada?
        </p>
        <h2 id="pain-points-title" className="text-2xl sm:text-3xl font-black leading-tight mb-6">
          Si te pasa esto:
        </h2>
        <ul className="space-y-3 mb-6 max-w-md mx-auto text-left">
          {PAINS.map((p) => (
            <li key={p} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <span className="text-base sm:text-lg">{p}</span>
            </li>
          ))}
        </ul>
        <p className="text-lg sm:text-xl font-bold text-accent">
          Este programa es para vos.
        </p>
      </div>
    </section>
  );
}
