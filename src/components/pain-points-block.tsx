"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/track-event";

const PAINS = [
  "Entrenás y no ves cambios",
  "Te cuesta marcar abdomen",
  "Sentís que tu cuerpo no responde",
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
      className="px-5 sm:px-8 pt-24 pb-28"
      aria-labelledby="pain-points-title"
    >
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-8">
        <div className="md:col-span-4">
          <p className="l-eyebrow mb-4">¿Te suena?</p>
          <h2 id="pain-points-title" className="text-3xl sm:text-4xl font-semibold leading-[1.05]">
            Si te pasa alguna de estas, el programa es para vos.
          </h2>
        </div>
        <ol className="md:col-span-7 md:col-start-6">
          {PAINS.map((p, i) => (
            <li key={p} className="l-rule flex items-baseline gap-6 py-6 last:border-b last:border-[var(--l-line)]">
              <span className="l-display l-tabular text-2xl text-[var(--l-accent)] w-8 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-xl sm:text-2xl font-medium tracking-tight">{p}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
