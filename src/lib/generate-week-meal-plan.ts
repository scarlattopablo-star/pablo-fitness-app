// Nutrition v2 — F3: variedad semanal
//
// Genera 7 dias distintos con los MISMOS macros del dia base. La variedad
// se logra rotando proteinas, carbos y verduras dentro de la misma categoria,
// recalculando los gramos para mantener macros constantes.
//
// Estrategia: NO reescribir generate-meal-plan.ts (motor estable). En su lugar
// generamos el dia base con generateMealPlan() y luego aplicamos varyDayMeals()
// 6 veces mas con dayIndex 1..6 para producir martes..domingo.
//
// Resultado: WeekMenu con shape compatible con la UI actual (cada day es
// { meals, importantNotes }). El "dia activo" en la UI se elige con un
// selector y el componente existente lo renderiza sin cambios.

import { generateMealPlan, type MealPlanMeal, type MealFood } from "./generate-meal-plan";
import { FOOD_DATABASE, calculateFoodMacros, type FoodItem } from "./food-database";

export type WeekDay =
  | "lunes" | "martes" | "miercoles" | "jueves" | "viernes" | "sabado" | "domingo";

export const WEEK_DAYS: WeekDay[] = [
  "lunes", "martes", "miercoles", "jueves", "viernes", "sabado", "domingo",
];

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mie",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sab",
  domingo: "Dom",
};

export interface DayPlan {
  meals: MealPlanMeal[];
  importantNotes: string[];
}

export type WeekMenu = Record<WeekDay, DayPlan>;

// ============================================================
// Rotaciones por categoria
// ============================================================
//
// Cada arreglo lista food IDs alternativos. El dayIndex (0..6) elige cual
// usar. Rotaciones disenadas para distribuir cargas (carnes blancas / rojas /
// pescados) y respetar las restricciones del plan base.

const PROTEIN_ROTATION_ALMUERZO: string[] = [
  "pollo-pechuga", "carne-magra", "merluza", "pavo-pechuga", "tilapia", "salmon", "pollo-muslo",
];

const PROTEIN_ROTATION_CENA: string[] = [
  "merluza", "pollo-pechuga", "tilapia", "atun", "pavo-pechuga", "bondiola", "carne-molida",
];

const CARB_ROTATION_ALMUERZO: string[] = [
  "arroz-integral", "quinoa", "boniato", "papa", "fideos-integrales", "arroz-blanco", "mandioca",
];

const CARB_ROTATION_CENA: string[] = [
  "boniato", "papa", "arroz-integral", "quinoa", "lentejas", "garbanzos", "porotos-negros",
];

const VEGGIE_ROTATION_ALMUERZO: string[] = [
  "brocoli", "coliflor", "chauchas", "zucchini", "esparragos", "berenjena", "champinones",
];

const VEGGIE_ROTATION_CENA: string[] = [
  "espinaca", "rucula", "lechuga", "tomate", "morron", "pepino", "coliflor",
];

const FRUIT_ROTATION_DESAYUNO: string[] = [
  "banana", "frutilla", "arandanos", "kiwi", "manzana", "anana", "mango",
];

const DAIRY_ROTATION_SNACK: string[] = [
  "yogurt-descremado", "yogurt-griego", "queso-cottage", "queso-ricota", "yogurt-descremado", "queso-cottage", "yogurt-griego",
];

// Mapeo de restriccion → IDs prohibidos. Si el dia base tiene tofu en lugar
// de pollo (vegano), preservamos esa logica filtrando del pool de rotacion.
function isFoodAllowedFor(food: FoodItem, baseFood: FoodItem): boolean {
  // Si el food base es tofu (vegano), reemplazos solo dentro de proteina vegana
  if (baseFood.id === "tofu") return ["tofu", "lentejas", "garbanzos", "porotos-negros"].includes(food.id);
  // Si el food base es huevos (vegetariano), permitir lacteos y huevo
  if (baseFood.id === "huevo-entero") return ["huevo-entero", "clara-huevo", "queso-cottage", "queso-ricota", "yogurt-griego"].includes(food.id);
  // Si la base era integral (sin gluten implicito), no usar trigo
  if (baseFood.id === "galleta-arroz" || baseFood.id === "quinoa") {
    if (food.id.includes("trigo") || food.id.includes("fideos") || food.id.includes("pan-")) return false;
  }
  return true;
}

function getFoodSafe(id: string): FoodItem | null {
  return FOOD_DATABASE.find(f => f.id === id) ?? null;
}

// Reemplaza un MealFood manteniendo macros equivalentes (mismas kcal target).
// Si el reemplazo no es valido por restricciones, devuelve el original.
function swapFood(
  original: MealFood,
  candidateIds: string[],
  dayIndex: number,
  baseFoodFromOriginal: FoodItem | null
): MealFood {
  if (!baseFoodFromOriginal) return original;

  // Itera empezando por la posicion correspondiente al dayIndex
  for (let offset = 0; offset < candidateIds.length; offset++) {
    const idx = (dayIndex + offset) % candidateIds.length;
    const cand = getFoodSafe(candidateIds[idx]);
    if (!cand) continue;
    if (cand.id === baseFoodFromOriginal.id && offset === 0) continue; // forzar cambio en lunes->resto
    if (!isFoodAllowedFor(cand, baseFoodFromOriginal)) continue;

    // Calcular gramos del reemplazo manteniendo las kcal del original
    if (cand.calories <= 0) continue;
    let newGrams = (original.calories / cand.calories) * 100;

    // Pisos minimos por categoria (mismos que en generate-meal-plan)
    const MIN_GRAMS: Record<string, number> = {
      protein: 80, carb: 50, fat: 5, dairy: 100, fruit: 50, vegetable: 50, snack: 20,
    };
    const min = MIN_GRAMS[cand.category] ?? 20;
    newGrams = Math.max(min, Math.round(newGrams / 5) * 5);

    const macros = calculateFoodMacros(cand, newGrams);
    return {
      name: cand.name,
      grams: newGrams,
      unit: cand.unit,
      ...macros,
    };
  }

  return original;
}

// Detecta a que rotation pool pertenece un MealFood segun nombre de comida y posicion
interface RotationContext {
  mealName: string;        // "DESAYUNO","ALMUERZO","CENA",...
  isProtein: boolean;
  isCarb: boolean;
  isVeggie: boolean;
  isFruit: boolean;
  isDairy: boolean;
}

function detectFoodRole(food: FoodItem, mealName: string): RotationContext {
  return {
    mealName: mealName.toUpperCase(),
    isProtein: food.category === "protein",
    isCarb: food.category === "carb",
    isVeggie: food.category === "vegetable",
    isFruit: food.category === "fruit",
    isDairy: food.category === "dairy",
  };
}

function getRotationPool(role: RotationContext): string[] | null {
  if (role.isProtein) {
    if (role.mealName.includes("ALMUERZO")) return PROTEIN_ROTATION_ALMUERZO;
    if (role.mealName.includes("CENA")) return PROTEIN_ROTATION_CENA;
    return null; // desayuno/snack: no rotar proteina (huevos/whey/tofu son base)
  }
  if (role.isCarb) {
    if (role.mealName.includes("ALMUERZO")) return CARB_ROTATION_ALMUERZO;
    if (role.mealName.includes("CENA")) return CARB_ROTATION_CENA;
    return null;
  }
  if (role.isVeggie) {
    if (role.mealName.includes("ALMUERZO")) return VEGGIE_ROTATION_ALMUERZO;
    if (role.mealName.includes("CENA")) return VEGGIE_ROTATION_CENA;
    return null;
  }
  if (role.isFruit) {
    if (role.mealName.includes("DESAYUNO")) return FRUIT_ROTATION_DESAYUNO;
    return null;
  }
  if (role.isDairy) {
    if (role.mealName.includes("COMIDA 2") || role.mealName.includes("MERIENDA") || role.mealName.includes("COLACION")) {
      return DAIRY_ROTATION_SNACK;
    }
    return null;
  }
  return null;
}

// Aplica la variacion a un dia completo
function varyDay(baseDay: DayPlan, dayIndex: number): DayPlan {
  if (dayIndex === 0) return baseDay; // lunes = dia base

  const variedMeals: MealPlanMeal[] = baseDay.meals.map(meal => {
    if (!meal.foodDetails || meal.foodDetails.length === 0) return meal;

    const newFoodDetails: MealFood[] = meal.foodDetails.map(fd => {
      // Buscar el food original en el catalogo para conocer su categoria
      const baseFood = FOOD_DATABASE.find(f => f.name === fd.name) ?? null;
      if (!baseFood) return fd;

      const role = detectFoodRole(baseFood, meal.name);
      const pool = getRotationPool(role);
      if (!pool) return fd; // categoria no rotamos (ej: aceite, huevos)

      return swapFood(fd, pool, dayIndex, baseFood);
    });

    // Recalcular totales
    const totals = newFoodDetails.reduce(
      (acc, f) => ({
        calories: acc.calories + f.calories,
        protein: acc.protein + f.protein,
        carbs: acc.carbs + f.carbs,
        fat: acc.fat + f.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      ...meal,
      foods: newFoodDetails.map(f => `${f.grams}g ${f.name}`),
      foodDetails: newFoodDetails,
      approxCalories: Math.round(totals.calories),
      approxProtein: Math.round(totals.protein),
      approxCarbs: Math.round(totals.carbs),
      approxFats: Math.round(totals.fat),
    };
  });

  return {
    meals: variedMeals,
    importantNotes: baseDay.importantNotes, // las notas son las mismas
  };
}

// ============================================================
// API publica
// ============================================================

export function generateWeekMealPlan(
  targetCalories: number,
  protein: number,
  carbs: number,
  fats: number,
  wakeHour: number = 7,
  sleepHour: number = 23,
  dietaryRestrictions: string[] = [],
  objective: string = "",
  nutritionalGoal: string = ""
): { weekMenu: WeekMenu; baseDay: DayPlan } {
  // 1) Generar el dia base (lunes) con el motor existente
  const baseDay = generateMealPlan(
    targetCalories, protein, carbs, fats,
    wakeHour, sleepHour, dietaryRestrictions, objective, nutritionalGoal
  );

  // 2) Producir 7 dias variados
  const weekMenu: WeekMenu = {
    lunes:     varyDay(baseDay, 0),
    martes:    varyDay(baseDay, 1),
    miercoles: varyDay(baseDay, 2),
    jueves:    varyDay(baseDay, 3),
    viernes:   varyDay(baseDay, 4),
    sabado:    varyDay(baseDay, 5),
    domingo:   varyDay(baseDay, 6),
  };

  return { weekMenu, baseDay };
}

// Aplana el WeekMenu en un array unico de meals para shopping list (usa los
// 7 dias distintos para acumular cantidades reales).
export function flattenWeekMealsForShopping(weekMenu: WeekMenu): MealPlanMeal[] {
  const all: MealPlanMeal[] = [];
  for (const day of WEEK_DAYS) {
    all.push(...weekMenu[day].meals);
  }
  return all;
}
