// Nutrition Engine v2
// Motor nutricional con TMB de mayor precision (Mifflin-St Jeor / Katch-McArdle),
// TDEE ajustado por actividad laboral y deficit/superavit por ritmo objetivo.
//
// Disenado como capa ADITIVA: NO reemplaza harris-benedict.ts (que sigue siendo
// el fallback). Se usa cuando la encuesta v2 provee datos extra (% graso,
// trabajo, ritmo objetivo, ...).
//
// Fuentes:
// - Mifflin MD, et al. "A new predictive equation for resting energy expenditure
//   in healthy individuals." Am J Clin Nutr. 1990 Feb;51(2):241-7. (mas preciso
//   que Harris-Benedict 1919 segun ADA Position Paper 2014.)
// - Katch FI, McArdle WD. "Nutrition, Weight Control, and Exercise." (1983)
//   Cuando hay %graso confiable, predice mejor que Mifflin (descuenta masa grasa).
// - ACSM/ISSN Position Stands sobre deficits caloricos y ritmo de perdida.

import type {
  Sex,
  ActivityLevel,
  PlanSlug,
  NutritionalGoal,
  JobActivity,
  BMRMethod,
  Pace,
  MacroCalculationV2,
} from "@/types";
import { PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";

// ============================================================
// 1. BMR — Tasa Metabolica Basal
// ============================================================

interface BMRInput {
  sex: Sex;
  weight: number;   // kg
  height: number;   // cm
  age: number;
  bodyFatPct?: number | null; // 0-60
}

interface BMRResult {
  value: number;
  method: BMRMethod;
}

export function calculateBMR(input: BMRInput): BMRResult {
  // Katch-McArdle: usa masa magra (mas preciso si %graso es confiable)
  if (
    input.bodyFatPct !== undefined &&
    input.bodyFatPct !== null &&
    input.bodyFatPct >= 3 &&
    input.bodyFatPct <= 50
  ) {
    const lbm = input.weight * (1 - input.bodyFatPct / 100);
    return { value: Math.round(370 + 21.6 * lbm), method: "katch-mcardle" };
  }

  // Default moderno: Mifflin-St Jeor (1990)
  const base = 10 * input.weight + 6.25 * input.height - 5 * input.age;
  const value = input.sex === "hombre" ? base + 5 : base - 161;
  return { value: Math.round(value), method: "mifflin" };
}

// ============================================================
// 2. TDEE — Gasto energetico total
// ============================================================

// Multiplicadores tradicionales por nivel de actividad fisica de entreno.
// (Coinciden con harris-benedict.ts para mantener consistencia.)
const TRAINING_FACTORS: Record<ActivityLevel, number> = {
  "sedentario": 1.2,
  "moderado": 1.375,
  "activo": 1.55,
  "muy-activo": 1.725,
};

// Bono adicional por NEAT laboral. Se aplica como SUMA pequenia al multiplicador
// (no multiplicacion) para no inflar TDEE en sedentarios que entrenan duro.
// Empirica: trabajo manual suma ~0.10 al factor; muy-activo ~0.15.
const JOB_NEAT_BONUS: Record<JobActivity, number> = {
  "sedentario": 0,
  "de-pie": 0.05,
  "manual": 0.10,
  "muy-activo": 0.15,
};

interface TDEEInput {
  bmr: number;
  activityLevel: ActivityLevel;
  jobActivity?: JobActivity | null;
}

export function calculateTDEE(input: TDEEInput): number {
  const trainingFactor = TRAINING_FACTORS[input.activityLevel];
  const jobBonus = input.jobActivity ? JOB_NEAT_BONUS[input.jobActivity] : 0;
  return Math.round(input.bmr * (trainingFactor + jobBonus));
}

// ============================================================
// 3. Ajuste calorico — deficit / superavit
// ============================================================

// Ritmo de cambio semanal como % del peso corporal.
// 0.5%/sem = conservador, sostenible. 0.75% = estandar (default Pablo).
// 1% = agresivo, solo a corto plazo o con coach.
const PACE_PCT_PER_WEEK: Record<Pace, number> = {
  "conservador": 0.005,
  "estandar": 0.0075,
  "agresivo": 0.01,
};

// 1 kg de grasa ≈ 7700 kcal (regla clinica clasica).
const KCAL_PER_KG_FAT = 7700;

interface CaloricAdjustmentInput {
  tdee: number;
  weight: number;
  pace: Pace;
  direction: "deficit" | "surplus" | "maintenance";
}

export function calculateCaloricAdjustment(input: CaloricAdjustmentInput): {
  targetCalories: number;
  dailyDelta: number;
} {
  if (input.direction === "maintenance") {
    return { targetCalories: input.tdee, dailyDelta: 0 };
  }

  const weeklyKgChange = input.weight * PACE_PCT_PER_WEEK[input.pace];
  const weeklyKcal = weeklyKgChange * KCAL_PER_KG_FAT;
  const dailyKcal = weeklyKcal / 7;

  // Limites de seguridad: no mas de -25% TDEE en deficit, +20% en superavit.
  const maxDeficit = Math.round(input.tdee * 0.25);
  const maxSurplus = Math.round(input.tdee * 0.20);
  const cappedDelta = Math.min(
    dailyKcal,
    input.direction === "deficit" ? maxDeficit : maxSurplus
  );

  const sign = input.direction === "deficit" ? -1 : 1;
  const dailyDelta = Math.round(sign * cappedDelta);
  const targetCalories = Math.max(1200, input.tdee + dailyDelta);

  return { targetCalories, dailyDelta };
}

// ============================================================
// 4. Macros — proteina / grasas / carbos
// ============================================================

// Proteina: 2.0 g/kg es el default Pablo (suficiente para hipertrofia,
// alineado con ISSN 1.6-2.2 g/kg). Si hay deficit agresivo subimos a 2.2 g/kg
// para preservar masa magra. Si hay %graso, calculamos sobre masa magra
// usando 2.4 g/kg LBM (mas preciso en obesos).
function calculateProtein(
  weight: number,
  pace: Pace,
  direction: "deficit" | "surplus" | "maintenance",
  bodyFatPct?: number | null
): number {
  if (bodyFatPct && bodyFatPct >= 3 && bodyFatPct <= 50) {
    const lbm = weight * (1 - bodyFatPct / 100);
    return Math.round(lbm * 2.4);
  }
  if (direction === "deficit" && pace === "agresivo") {
    return Math.round(weight * 2.2);
  }
  return Math.round(weight * 2.0);
}

// Grasas: 25% en deficit, 30% en mantenimiento/superavit (mantenemos regla viejo).
function calculateFats(targetCalories: number, isDeficit: boolean): number {
  const pct = isDeficit ? 0.25 : 0.30;
  return Math.round((targetCalories * pct) / 9);
}

// Carbos: el resto.
function calculateCarbs(targetCalories: number, protein: number, fats: number): number {
  const proteinKcal = protein * 4;
  const fatsKcal = fats * 9;
  const carbsKcal = targetCalories - proteinKcal - fatsKcal;
  return Math.max(50, Math.round(carbsKcal / 4));
}

// ============================================================
// 5. API publica — calculo end-to-end
// ============================================================

interface MacrosV2Input {
  sex: Sex;
  weight: number;
  height: number;
  age: number;
  activityLevel: ActivityLevel;
  objective: PlanSlug;
  // Extras v2 (todos opcionales — el motor degrada elegantemente)
  bodyFatPct?: number | null;
  jobActivity?: JobActivity | null;
  nutritionalGoal?: NutritionalGoal | null;
  pace?: Pace;
}

// Mapeo objetivo → direccion calorica. Espeja la logica de harris-benedict.ts
// para que un cambio de motor no cambie la direccion del plan.
const DEFICIT_OBJECTIVES: PlanSlug[] = [
  "quema-grasa",
  "tonificacion",
  "recomposicion-corporal",
  "post-parto",
  "competicion",
];
const SURPLUS_OBJECTIVES: PlanSlug[] = [
  "ganancia-muscular",
  "fuerza-funcional",
  "rendimiento-deportivo",
];

function resolveDirection(
  objective: PlanSlug,
  nutritionalGoal?: NutritionalGoal | null
): "deficit" | "surplus" | "maintenance" {
  // Si el objetivo tiene direccion clara, manda.
  if (DEFICIT_OBJECTIVES.includes(objective)) return "deficit";
  if (SURPLUS_OBJECTIVES.includes(objective)) return "surplus";
  // Si el plan necesita goal del cliente, usar nutritionalGoal.
  if (PLANS_NEEDING_GOAL.includes(objective) && nutritionalGoal) {
    if (nutritionalGoal === "perder-grasa") return "deficit";
    if (nutritionalGoal === "ganar-musculo") return "surplus";
    return "maintenance";
  }
  // Fallback: kitesurf y otros sin objetivo claro → mantenimiento.
  return "maintenance";
}

export function calculateMacrosV2(input: MacrosV2Input): MacroCalculationV2 {
  const bmr = calculateBMR({
    sex: input.sex,
    weight: input.weight,
    height: input.height,
    age: input.age,
    bodyFatPct: input.bodyFatPct,
  });

  const tdee = calculateTDEE({
    bmr: bmr.value,
    activityLevel: input.activityLevel,
    jobActivity: input.jobActivity,
  });

  const direction = resolveDirection(input.objective, input.nutritionalGoal);
  const pace: Pace = input.pace || "estandar";

  const { targetCalories, dailyDelta } = calculateCaloricAdjustment({
    tdee,
    weight: input.weight,
    pace,
    direction,
  });

  const protein = calculateProtein(input.weight, pace, direction, input.bodyFatPct);
  const isDeficit = direction === "deficit";
  const fats = calculateFats(targetCalories, isDeficit);
  const carbs = calculateCarbs(targetCalories, protein, fats);

  return {
    tmb: bmr.value,
    tdee,
    targetCalories,
    protein,
    carbs,
    fats,
    bmrMethod: bmr.method,
    direction,
    pace,
    dailyDelta,
  };
}

// ============================================================
// 6. Compatibilidad con motor v1 (harris-benedict.ts)
// ============================================================

// Decide si los datos disponibles permiten usar el motor v2 con beneficio real.
// Si no hay ningun dato extra, conviene usar el motor v1 (consistencia con
// planes ya generados a clientes existentes).
export function shouldUseV2Engine(survey: {
  body_fat_pct?: number | null;
  job_activity?: string | null;
}): boolean {
  if (survey.body_fat_pct !== null && survey.body_fat_pct !== undefined) return true;
  if (survey.job_activity) return true;
  return false;
}
