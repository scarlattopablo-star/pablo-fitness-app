"use client";

// Nutrition v2 — F2: tab "Presupuesto" en /dashboard/plan
//
// Muestra el costo semanal/mensual estimado contra el presupuesto que el
// cliente declaro. Estado tipo semaforo (verde/amarillo/rojo) y, si excede,
// propone downgrades concretos (ej: salmon → merluza, ahorra X UYU/mes).

import { Wallet, AlertTriangle, CheckCircle, ArrowDownRight, RefreshCw } from "lucide-react";
import type { BudgetReport, BudgetStatus } from "@/lib/budget-validator";

interface Props {
  budget: BudgetReport | null;
}

const STATUS_CONFIG: Record<BudgetStatus, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgClass: string;
  borderClass: string;
}> = {
  ok: {
    label: "Dentro de presupuesto",
    icon: CheckCircle,
    color: "text-success",
    bgClass: "bg-success/10",
    borderClass: "border-success",
  },
  tight: {
    label: "Margen ajustado",
    icon: AlertTriangle,
    color: "text-warning",
    bgClass: "bg-warning/10",
    borderClass: "border-warning",
  },
  over: {
    label: "Supera el presupuesto",
    icon: AlertTriangle,
    color: "text-danger",
    bgClass: "bg-danger/10",
    borderClass: "border-danger",
  },
};

export function NutritionBudgetTab({ budget }: Props) {
  if (!budget) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Wallet className="h-10 w-10 text-muted mx-auto mb-3" />
        <p className="text-muted">
          Para ver el presupuesto, agregá tu pais y presupuesto mensual en la encuesta. Si ya lo cargaste, regenera tu plan desde el admin.
        </p>
      </div>
    );
  }

  const { pricedList, userBudgetMonthly, status, overBy, marginPct, suggestedDowngrades } = budget;
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  const currency = pricedList.currency;

  return (
    <div className="space-y-4">
      {/* Semaforo de estado */}
      <div className={`glass-card rounded-2xl p-5 border-l-4 ${cfg.borderClass} ${cfg.bgClass}`}>
        <div className="flex items-center gap-3 mb-3">
          <Icon className={`h-6 w-6 ${cfg.color}`} />
          <h3 className={`font-bold ${cfg.color}`}>{cfg.label}</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted">Costo de esta lista ({pricedList.periodDays} dias)</p>
            <p className="font-bold text-lg">{pricedList.listTotal.toLocaleString("es-UY")} {currency}</p>
            <p className="text-[10px] text-muted/70">{pricedList.periodLabel.toLowerCase()}</p>
          </div>
          <div>
            <p className="text-muted">Equivalente mensual</p>
            <p className="font-bold text-lg">{pricedList.monthlyCost.toLocaleString("es-UY")} {currency}</p>
            <p className="text-[10px] text-muted/70">extrapolado a 30 dias</p>
          </div>
          {userBudgetMonthly != null && (
            <>
              <div>
                <p className="text-muted">Tu presupuesto mensual</p>
                <p className="font-bold text-lg">{userBudgetMonthly.toLocaleString("es-UY")} {currency}</p>
              </div>
              <div>
                <p className="text-muted">{status === "over" ? "Te pasas por (mes)" : "Margen disponible"}</p>
                <p className={`font-bold text-lg ${cfg.color}`}>
                  {status === "over"
                    ? `+${overBy.toLocaleString("es-UY")} ${currency}`
                    : `${Math.round(marginPct * 100)}%`
                  }
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Downgrades sugeridos */}
      {status !== "ok" && suggestedDowngrades.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownRight className="h-5 w-5 text-primary" />
            <h3 className="font-bold">Cambios sugeridos para ahorrar</h3>
          </div>
          <p className="text-xs text-muted mb-4">
            Reemplazos dentro de la misma categoria. Mantenes los macros, bajas el costo.
          </p>
          <ul className="space-y-3">
            {suggestedDowngrades.slice(0, 5).map((d) => (
              <li
                key={`${d.fromFoodId}-${d.toFoodId}`}
                className="flex items-start gap-3 p-3 bg-card-bg rounded-xl border border-card-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="line-through text-muted">{d.fromName}</span>{" "}
                    <span className="text-muted">→</span>{" "}
                    <span className="font-bold text-primary">{d.toName}</span>
                  </p>
                  <p className="text-xs text-muted mt-1">{d.reason}</p>
                </div>
                <span className="text-success font-bold text-sm shrink-0">
                  -{d.monthlyCostSavings.toLocaleString("es-UY")} {d.currency}/mes
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted mt-4 text-center">
            Para aplicar estos cambios, contacta a Pablo desde el chat o usa la funcion de
            cambiar alimento en cada comida del plan.
          </p>
        </div>
      )}

      {/* Items sin precio */}
      {pricedList.itemsWithoutPrice.length > 0 && (
        <div className="glass-card rounded-2xl p-4 border-l-4 border-muted">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className="h-4 w-4 text-muted" />
            <p className="font-bold text-sm">Algunos productos no tienen precio en tu region</p>
          </div>
          <p className="text-xs text-muted mb-2">
            Los precios mostrados son estimaciones. Estos {pricedList.itemsWithoutPrice.length} items quedaron sin costear:
          </p>
          <p className="text-xs text-muted">
            {pricedList.itemsWithoutPrice.slice(0, 5).join(", ")}
            {pricedList.itemsWithoutPrice.length > 5 && ` y ${pricedList.itemsWithoutPrice.length - 5} mas`}
          </p>
        </div>
      )}

      <p className="text-xs text-muted text-center">
        Precios estimados. Pueden variar segun super y temporada.
      </p>
    </div>
  );
}
