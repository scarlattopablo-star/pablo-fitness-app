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
  | 'entrenamiento-casa';

export type Duration = '1-mes' | '3-meses' | '6-meses' | '1-ano';

export type ActivityLevel = 'sedentario' | 'moderado' | 'activo' | 'muy-activo';

export type Sex = 'hombre' | 'mujer';

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
}

export interface MacroCalculation {
  tmb: number;
  tdee: number;
  targetCalories: number;
  protein: number; // grams
  fats: number; // grams
  carbs: number; // grams
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
