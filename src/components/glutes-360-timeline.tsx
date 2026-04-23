"use client";

import { Sparkles, TrendingUp, Target } from "lucide-react";

// Timeline visual de las 3 semanas del reto. Se usa en:
//  · /planes/glutes-360 (pre-venta, convierte)
//  · /reto-briefing (post-encuesta, orienta)
// Variante compact = version reducida para card sticky.

interface Props {
  variant?: "full" | "compact";
}

const SEMANAS = [
  {
    n: 1,
    titulo: "Activacion",
    emoji: "🔥",
    color: "from-orange-500/20 to-transparent",
    dot: "bg-orange-400",
    sets: "3 sets · tecnica",
    sensacion: "Gluteo duro al tacto",
    visible: "DOMS, ropa ajusta igual",
    tips: "Foco en apretar, no en cantidad. Mind-muscle connection.",
  },
  {
    n: 2,
    titulo: "Volumen",
    emoji: "💪",
    color: "from-pink-500/20 to-transparent",
    dot: "bg-pink-400",
    sets: "4 sets · mas trabajo",
    sensacion: "Gluteo se para al costado",
    visible: "Cintura mas marcada, menos hinchazon",
    tips: "Suma 1 set. Si llegas al tope con tecnica, subi peso 5%.",
  },
  {
    n: 3,
    titulo: "Intensidad",
    emoji: "✨",
    color: "from-accent/20 to-transparent",
    dot: "bg-accent",
    sets: "5 sets · tempo 3-1-1",
    sensacion: "Cambio en fotos lado/atras",
    visible: "Abdomen mas plano, gluteo redondo",
    tips: "Tempo lento = mas tiempo bajo tension = adaptacion real.",
  },
];

export default function Glutes360Timeline({ variant = "full" }: Props) {
  const isCompact = variant === "compact";

  return (
    <section className={isCompact ? "py-6" : "py-12 px-4"}>
      <div className={isCompact ? "" : "max-w-4xl mx-auto"}>
        {!isCompact && (
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
              <Sparkles className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                Como funcionan tus 21 dias
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              3 semanas que te <span className="text-accent">cambian el cuerpo</span>
            </h2>
            <p className="text-sm text-muted mt-2 max-w-xl mx-auto">
              Cada semana sube la exigencia — asi el cuerpo no se acostumbra y los cambios se notan.
            </p>
          </div>
        )}

        <div className={`grid gap-4 ${isCompact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}`}>
          {SEMANAS.map((s, i) => (
            <div
              key={s.n}
              className="relative card-premium rounded-2xl p-5 border border-card-border/50 hover:border-accent/30 transition-all duration-300"
            >
              {/* Numero grande de fondo */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${s.color} pointer-events-none`} />

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-card-bg border border-card-border/50 flex items-center justify-center text-xl`}>
                    {s.emoji}
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted font-bold">
                      Semana {s.n}
                    </p>
                    <h3 className="font-black text-lg leading-none">{s.titulo}</h3>
                  </div>
                </div>

                {!isCompact && (
                  <>
                    <p className="text-xs font-bold text-accent mb-1">{s.sets}</p>
                    <p className="text-sm mb-3 leading-relaxed">
                      Vas a sentir: <strong>{s.sensacion}</strong>
                    </p>
                    <p className="text-xs text-muted mb-3 leading-relaxed">{s.visible}</p>
                    <div className="border-t border-card-border/30 pt-3">
                      <p className="text-[10px] uppercase tracking-wider text-muted font-bold mb-1 flex items-center gap-1.5">
                        <Target className="h-3 w-3" /> Tip
                      </p>
                      <p className="text-xs leading-relaxed">{s.tips}</p>
                    </div>
                  </>
                )}

                {isCompact && (
                  <p className="text-xs text-muted leading-snug">{s.visible}</p>
                )}
              </div>

              {/* Progression arrow between cards */}
              {i < SEMANAS.length - 1 && !isCompact && (
                <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-background border border-card-border items-center justify-center">
                  <TrendingUp className="h-3 w-3 text-accent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
