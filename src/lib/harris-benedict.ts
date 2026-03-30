import type { Sex, ActivityLevel, PlanSlug, MacroCalculation } from '@/types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  'sedentario': 1.2,
  'moderado': 1.375,
  'activo': 1.55,
  'muy-activo': 1.725,
};

const OBJECTIVE_ADJUSTMENTS: Record<string, number> = {
  'quema-grasa': -0.20,
  'ganancia-muscular': 0.15,
  'tonificacion': -0.10,
  'principiante-total': 0,
  'rendimiento-deportivo': 0.10,
  'post-parto': -0.10,
  'fuerza-funcional': 0.05,
  'recomposicion-corporal': -0.10,
  'plan-pareja': 0,
  'competicion': -0.15,
};

export function calculateTMB(sex: Sex, weight: number, height: number, age: number): number {
  if (sex === 'hombre') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  }
  return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
}

export function calculateTDEE(tmb: number, activityLevel: ActivityLevel): number {
  return tmb * ACTIVITY_FACTORS[activityLevel];
}

export function calculateMacros(
  sex: Sex,
  weight: number,
  height: number,
  age: number,
  activityLevel: ActivityLevel,
  objective: PlanSlug
): MacroCalculation {
  const tmb = calculateTMB(sex, weight, height, age);
  const tdee = calculateTDEE(tmb, activityLevel);

  const adjustment = OBJECTIVE_ADJUSTMENTS[objective] ?? 0;
  const targetCalories = Math.round(tdee * (1 + adjustment));

  const protein = Math.round(weight * 2);
  const proteinCalories = protein * 4;

  const fatPercentage = objective === 'quema-grasa' ? 0.25 : 0.30;
  const fatCalories = Math.round(targetCalories * fatPercentage);
  const fats = Math.round(fatCalories / 9);

  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / 4);

  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    targetCalories,
    protein,
    fats,
    carbs,
  };
}
