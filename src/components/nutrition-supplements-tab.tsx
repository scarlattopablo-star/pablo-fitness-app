"use client";

// Nutrition v2 — F4: tab "Suplementos" en /dashboard/plan
//
// Muestra recomendaciones agrupadas por prioridad (esencial / recomendado /
// opcional). Cada item: dosis + timing + razon especifica al cliente +
// costo mensual. Si el cliente ya lo declaro en current_supplements, marca
// "Ya lo tomas" en verde.

import { Pill, Star, ThumbsUp, Plus, Check } from "lucide-react";
import type { SupplementRecommendation, SupplementPriority } from "@/lib/supplement-advisor";

interface Props {
  supplements: SupplementRecommendation[] | null;
}

const PRIORITY_CONFIG: Record<SupplementPriority, {
  label: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  borderClass: string;
  bgClass: string;
  textClass: string;
}> = {
  esencial: {
    label: "Esenciales",
    desc: "Para tu perfil, suman valor real",
    icon: Star,
    borderClass: "border-primary",
    bgClass: "bg-primary/5",
    textClass: "text-primary",
  },
  recomendado: {
    label: "Recomendados",
    desc: "Buena opcion segun tu plan",
    icon: ThumbsUp,
    borderClass: "border-accent",
    bgClass: "bg-accent/5",
    textClass: "text-accent",
  },
  opcional: {
    label: "Opcionales",
    desc: "Nice to have segun preferencia",
    icon: Plus,
    borderClass: "border-card-border",
    bgClass: "bg-card-bg",
    textClass: "text-muted",
  },
};

const PRIORITY_ORDER: SupplementPriority[] = ["esencial", "recomendado", "opcional"];

function EvidenceDots({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5 items-center" title={`Evidencia ${level}/5`}>
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-primary" : "bg-card-border"}`}
        />
      ))}
    </span>
  );
}

export function NutritionSupplementsTab({ supplements }: Props) {
  if (!supplements || supplements.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Pill className="h-10 w-10 text-muted mx-auto mb-3" />
        <p className="text-muted">
          No hay recomendaciones de suplementos para tu perfil. Si querias recibirlas,
          activa la opcion en la encuesta y regenera tu plan.
        </p>
      </div>
    );
  }

  // Agrupar por prioridad
  const grouped: Record<SupplementPriority, SupplementRecommendation[]> = {
    esencial: [],
    recomendado: [],
    opcional: [],
  };
  for (const s of supplements) grouped[s.priority].push(s);

  // Costo total esencial+recomendado
  const totalCost = supplements
    .filter(s => s.priority !== "opcional" && !s.alreadyTakes)
    .reduce((sum, s) => sum + (s.monthlyCostUyu ?? 0), 0);

  return (
    <div className="space-y-4">
      {totalCost > 0 && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-primary">
          <p className="text-xs text-muted">Costo mensual estimado de los esenciales + recomendados</p>
          <p className="text-2xl font-black text-primary mt-1">
            ~{totalCost.toLocaleString("es-UY")} UYU/mes
          </p>
          <p className="text-xs text-muted mt-1">
            Sin contar los que ya tomas. Precios estimados de mercado UY.
          </p>
        </div>
      )}

      {PRIORITY_ORDER.map(priority => {
        const items = grouped[priority];
        if (items.length === 0) return null;
        const cfg = PRIORITY_CONFIG[priority];
        const Icon = cfg.icon;

        return (
          <div key={priority} className={`glass-card rounded-2xl overflow-hidden border-l-4 ${cfg.borderClass}`}>
            <div className={`${cfg.bgClass} px-4 py-3 flex items-center gap-2`}>
              <Icon className={`h-5 w-5 ${cfg.textClass}`} />
              <div>
                <h3 className={`font-bold ${cfg.textClass}`}>{cfg.label}</h3>
                <p className="text-xs text-muted">{cfg.desc}</p>
              </div>
            </div>
            <ul className="divide-y divide-card-border">
              {items.map(s => (
                <li key={s.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold">{s.name}</h4>
                        {s.alreadyTakes && (
                          <span className="text-xs px-2 py-0.5 bg-success/10 text-success rounded-full font-medium flex items-center gap-1">
                            <Check className="h-3 w-3" /> Ya lo tomas
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {s.defaultDose} · {s.timing}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {s.monthlyCostUyu != null && (
                        <p className="text-sm font-bold">
                          ~{s.monthlyCostUyu.toLocaleString("es-UY")} UYU/mes
                        </p>
                      )}
                      <EvidenceDots level={s.evidenceLevel} />
                    </div>
                  </div>
                  <p className="text-sm text-muted">{s.reason}</p>
                  {s.notes && (
                    <p className="text-xs text-muted/70 mt-2 italic">{s.notes}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      <p className="text-xs text-muted text-center px-4">
        Esta lista es educativa. Antes de empezar cualquier suplemento, especialmente si tomas
        medicacion o tenes una patologia, consulta con tu medico.
      </p>
    </div>
  );
}
