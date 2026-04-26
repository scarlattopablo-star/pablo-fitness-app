export type PlanSlug =
  | 'quema-grasa'
  | 'ganancia-muscular'
  | 'tonificacion'
  | 'principiante-total'
  | 'rendimiento-deportivo'
  | 'post-parto'
  | 'fuerza-funcional'
  | 'recomposicion-corporal'
  | 'plan-pareja'
  | 'competicion'
  | 'entrenamiento-casa'
  | 'kitesurf'
  | 'glutes-360'
  | 'direct-client';

// '21-dias' se usa para retos cortos (entry product). 0 en un precio = no disponible en esa duracion.
export type Duration = '1-mes' | '3-meses' | '6-meses' | '1-ano' | '21-dias';

export type NutritionalGoal = 'perder-grasa' | 'ganar-musculo' | 'mantenimiento';

export type ActivityLevel = 'sedentario' | 'moderado' | 'activo' | 'muy-activo';

export type Sex = 'hombre' | 'mujer';

// === Nutrition v2 ===
// NEAT laboral — afina TDEE mas alla del entreno
export type JobActivity = 'sedentario' | 'de-pie' | 'manual' | 'muy-activo';

// Metodo usado para calcular TMB (auditable en el plan)
export type BMRMethod = 'mifflin' | 'katch-mcardle' | 'harris-benedict';

// Ritmo de cambio corporal por semana
export type Pace = 'conservador' | 'estandar' | 'agresivo';

// Frecuencia de compra que el cliente puede sostener
export type ShoppingFrequency = 'semanal' | 'quincenal' | 'mensual';

export type MuscleGroup =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'piernas'
  | 'abdomen'
  | 'cardio';

export interface Plan {
  id: string;
  slug: PlanSlug;
  name: string;
  shortDescription: string;
  description: string;
  includes: string[];
  icon: string;
  color: string;
  prices: Record<Duration, number>;
  couplePrices: Record<Duration, number>;
  isCouple?: boolean;
}

export interface SurveyData {
  age: number;
  sex: Sex;
  weight: number; // kg
  height: number; // cm
  objective: PlanSlug;
  activityLevel: ActivityLevel;
  dietaryRestrictions: string[];
  nutritionalGoal?: NutritionalGoal;
  kitesurfLevel?: 'ninguna' | 'basica' | 'intermedia' | 'avanzada';

  // === Nutrition v2 — todos opcionales ===
  bodyFatPct?: number;
  trainingTime?: string;          // 'HH:MM' formato 24h
  jobActivity?: JobActivity;
  pathologies?: string[];
  intolerances?: string[];
  dislikedFoods?: string[];
  mealsPerDay?: number;            // 3-6
  foodBudgetMonthly?: number;
  foodBudgetCurrency?: string;     // 'UYU' | 'ARS' | 'USD' | ...
  country?: string;                // 'UY','AR','ES'...
  city?: string;
  usesSupplements?: boolean;
  currentSupplements?: string[];
  wantsSupplementAdvice?: boolean;
  cookingTimePerDay?: number;      // minutos
  shoppingFrequency?: ShoppingFrequency;
}

export interface MacroCalculation {
  tmb: number;
  tdee: number;
  targetCalories: number;
  protein: number; // grams
  fats: number; // grams
  carbs: number; // grams
}

// MacroCalculationV2 — extiende v1 con metadatos de auditoria del calculo.
// El motor v2 (nutrition-engine.ts) devuelve este shape.
export interface MacroCalculationV2 extends MacroCalculation {
  bmrMethod: BMRMethod;
  direction: 'deficit' | 'surplus' | 'maintenance';
  pace: Pace;
  dailyDelta: number;              // kcal/dia respecto a TDEE
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description: string;
  steps: string[];
  videoUrl: string;
  imageUrl?: string;
}

export interface TrainingDay {
  day: string;
  exercises: {
    exerciseId: string;
    name: string;
    sets: number;
    reps: string;
    rest: string;
    notes?: string;
  }[];
  instructions?: string;
}

export interface MealPlan {
  meals: {
    name: string;
    time: string;
    foods: string[];
    calories?: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }[];
  importantNotes: string[];
}

export interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    legs?: number;
  };
  photos?: {
    front?: string;
    side?: string;
    back?: string;
  };
  notes?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  surveyData?: SurveyData;
  macros?: MacroCalculation;
  activePlan?: {
    planSlug: PlanSlug;
    duration: Duration;
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'cancelled';
  };
  isAdmin?: boolean;
}
