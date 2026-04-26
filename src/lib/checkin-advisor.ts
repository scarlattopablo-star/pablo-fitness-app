// Nutrition v2 — F5: motor de sugerencias post check-in
//
// Dado el ultimo check-in y el historial reciente, propone ajustes al plan
// (calorias, cardio, macros, estrategia de comidas). NO los aplica
// directamente — siempre devuelve una "sugerencia" que el admin (Pablo)
// aprueba con un tap antes de que llegue al cliente.

export interface CheckinData {
  week_number: number;
  weight: number | null;
  energy: number | null;       // 1-5
  hunger: number | null;       // 1-5
  performance: number | null;  // 1-5
  adherence_pct: number | null; // 0-100
}

export interface PlanContext {
  startWeight: number;          // peso al inicio del plan
  currentTargetCalories: number;
  currentProtein: number;
  currentCarbs: number;
  currentFats: number;
  currentTrainingDays: number;
  goal: "perder-grasa" | "ganar-musculo" | "mantenimiento" | string;
  weeksOnPlan: number;          // semanas desde el inicio
}

export interface RevisionDelta {
  calories?: number;            // delta a sumar/restar
  protein?: number;
  carbs?: number;
  fats?: number;
  cardio?: number;              // sesiones extra/menos por semana
  meal_strategy?: string;       // 'high-volume','peri-workout-carbs', etc.
}

export interface RevisionSuggestion {
  delta: RevisionDelta;
  rationale: string;            // texto humano
  confidence: "alta" | "media" | "baja";
  needsReview: boolean;          // true cuando el cambio es grande o ambiguo
}

// Cuanto cambio se espera por semana segun goal y ritmo (% del peso inicial)
function expectedWeeklyDelta(goal: string, startWeight: number): number {
  if (goal === "perder-grasa") return -startWeight * 0.0075;       // -0.5% del peso/sem (estandar)
  if (goal === "ganar-musculo") return startWeight * 0.003;        // +0.3% (lento, calidad)
  return 0;                                                          // mantenimiento
}

export function suggestRevision(
  checkin: CheckinData,
  prevCheckin: CheckinData | null,
  ctx: PlanContext
): RevisionSuggestion | null {
  const expected = expectedWeeklyDelta(ctx.goal, ctx.startWeight);

  // === 1. Si la adherencia es baja (<70%), NO tocar macros — el problema es ejecucion ===
  if (checkin.adherence_pct != null && checkin.adherence_pct < 70) {
    return {
      delta: {},
      rationale: `Adherencia ${checkin.adherence_pct}% — antes de cambiar el plan, focus en seguirlo. Sugerencia: hablar con el cliente, ver que esta fallando. NO modificar calorias hasta que adherencia >= 80%.`,
      confidence: "alta",
      needsReview: true,
    };
  }

  // === 2. Hambre 5/5 ===
  if (checkin.hunger === 5) {
    if (ctx.goal === "perder-grasa") {
      return {
        delta: { meal_strategy: "high-volume" },
        rationale: "Hambre maxima. Antes de subir kcal, sumar volumen vegetal y proteina magra (cero calorias relevantes pero llenan). Si el problema persiste otra semana, considerar +75 kcal.",
        confidence: "media",
        needsReview: true,
      };
    }
  }

  // === 3. Energia o rendimiento muy bajos ===
  if ((checkin.energy != null && checkin.energy <= 2) || (checkin.performance != null && checkin.performance <= 2)) {
    if (ctx.goal === "perder-grasa") {
      // Posible deficit excesivo
      return {
        delta: { calories: 100, carbs: 25 },
        rationale: `Energia ${checkin.energy}/5, rendimiento ${checkin.performance}/5. Sugiero subir +100 kcal (+25g carbos) por una semana — si recupera energia, mantener; si no, reevaluar.`,
        confidence: "media",
        needsReview: true,
      };
    }
    return {
      delta: { meal_strategy: "peri-workout-carbs" },
      rationale: `Energia/rendimiento bajos sin deficit. Probar moviendo 20-30g de carbos al pre/post entreno.`,
      confidence: "baja",
      needsReview: true,
    };
  }

  // === 4. Progreso vs lo esperado ===
  if (checkin.weight != null && prevCheckin?.weight != null) {
    const actualDelta = checkin.weight - prevCheckin.weight;
    const ratio = expected !== 0 ? actualDelta / expected : 0;

    // Caso: deficit que no avanza (ratio cercano a 0 o negativo cuando deberia bajar)
    if (ctx.goal === "perder-grasa" && actualDelta >= -0.1 && ctx.weeksOnPlan >= 2) {
      return {
        delta: { calories: -100, cardio: 1 },
        rationale: `Estancamiento: peso casi igual (${actualDelta >= 0 ? "+" : ""}${actualDelta.toFixed(2)}kg) cuando se esperaba ${expected.toFixed(2)}kg. Sugiero -100 kcal y +1 sesion de cardio. Adherencia ${checkin.adherence_pct ?? "?"}% — confirmar antes de aplicar.`,
        confidence: "media",
        needsReview: true,
      };
    }

    // Caso: superavit sin ganancia (ganancia muscular)
    if (ctx.goal === "ganar-musculo" && actualDelta < expected * 0.5 && ctx.weeksOnPlan >= 2) {
      return {
        delta: { calories: 100, carbs: 25 },
        rationale: `Ganancia menor a la esperada (${actualDelta >= 0 ? "+" : ""}${actualDelta.toFixed(2)}kg vs esperado +${expected.toFixed(2)}kg). Sugiero +100 kcal para forzar superavit.`,
        confidence: "media",
        needsReview: true,
      };
    }

    // Caso: bajada muy agresiva (>1.5x lo esperado en deficit)
    if (ctx.goal === "perder-grasa" && actualDelta < expected * 1.5) {
      return {
        delta: { calories: 75 },
        rationale: `Bajada mas rapida de lo deseable (${actualDelta.toFixed(2)}kg). Riesgo de perder masa magra. Sugiero +75 kcal para suavizar el ritmo.`,
        confidence: "alta",
        needsReview: true,
      };
    }

    // Caso: progreso ok
    if (Math.abs(ratio - 1) < 0.5) {
      return {
        delta: {},
        rationale: `Progreso en linea con lo esperado (${actualDelta >= 0 ? "+" : ""}${actualDelta.toFixed(2)}kg). Mantener el plan otra semana.`,
        confidence: "alta",
        needsReview: false,
      };
    }
  }

  // === 5. Default: sin datos suficientes para sugerir ===
  return {
    delta: {},
    rationale: "Datos insuficientes para sugerir un cambio (falta peso previo o no hay senal clara). Mantener el plan.",
    confidence: "baja",
    needsReview: false,
  };
}
