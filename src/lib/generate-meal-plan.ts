import { FOOD_DATABASE, calculateFoodMacros, type FoodItem } from "./food-database";

export interface MealFood {
  name: string;
  grams: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealPlanMeal {
  name: string;
  time?: string;
  foods: string[];
  foodDetails: MealFood[];
  approxCalories: number;
  approxProtein: number;
  approxCarbs: number;
  approxFats: number;
}

function getFood(id: string): FoodItem {
  return FOOD_DATABASE.find(f => f.id === id)!;
}

function round10(n: number): number {
  return Math.round(n / 10) * 10 || 10;
}

function buildFoodEntry(foodId: string, grams: number): MealFood {
  const food = getFood(foodId);
  const macros = calculateFoodMacros(food, grams);
  return {
    name: food.name,
    grams,
    unit: food.unit,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  };
}

function buildFoodEntryByUnit(foodId: string, units: number, gramsPerUnit: number): MealFood {
  const food = getFood(foodId);
  const totalGrams = units * gramsPerUnit;
  const macros = calculateFoodMacros(food, totalGrams);
  return {
    name: `${units} ${food.name}`,
    grams: totalGrams,
    unit: food.unit,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
  };
}

function sumMacros(foods: MealFood[]) {
  return {
    calories: foods.reduce((s, f) => s + f.calories, 0),
    protein: Math.round(foods.reduce((s, f) => s + f.protein, 0) * 10) / 10,
    carbs: Math.round(foods.reduce((s, f) => s + f.carbs, 0) * 10) / 10,
    fat: Math.round(foods.reduce((s, f) => s + f.fat, 0) * 10) / 10,
  };
}

function mealFromFoods(name: string, foodDetails: MealFood[]): MealPlanMeal {
  const totals = sumMacros(foodDetails);
  return {
    name,
    foods: foodDetails.map(f => `${f.grams}g ${f.name}`),
    foodDetails,
    approxCalories: totals.calories,
    approxProtein: Math.round(totals.protein),
    approxCarbs: Math.round(totals.carbs),
    approxFats: Math.round(totals.fat),
  };
}

export function generateMealPlan(
  targetCalories: number,
  protein: number,
  carbs: number,
  fats: number
): { meals: MealPlanMeal[]; importantNotes: string[] } {
  // Distribute macros across 6 meals: 20%, 10%, 25%, 10%, 25%, 10%
  const dist = [0.20, 0.10, 0.25, 0.10, 0.25, 0.10];

  const pPerMeal = dist.map(d => Math.round(protein * d));
  const cPerMeal = dist.map(d => Math.round(carbs * d));
  const fPerMeal = dist.map(d => Math.round(fats * d));

  // MEAL 1: DESAYUNO (20%)
  const m1Eggs = Math.max(1, Math.round(pPerMeal[0] / 6.5)); // each egg ~6.5g protein
  const m1EggFood = buildFoodEntryByUnit("huevo-entero", m1Eggs, 50);
  const m1OatGrams = round10(cPerMeal[0] / 0.66); // oats 66g carbs per 100g
  const m1Oat = buildFoodEntry("avena", m1OatGrams);
  const m1Banana = buildFoodEntryByUnit("banana", 1, 120);
  const desayunoFoods = [m1EggFood, m1Oat, m1Banana];
  if (fPerMeal[0] > m1EggFood.fat + m1Oat.fat + 2) {
    desayunoFoods.push(buildFoodEntry("mani", 16)); // 1 cucharada
  }

  // MEAL 2: COMIDA 2 - Snack (10%)
  const m2Yogurt = buildFoodEntry("yogurt-descremado", 200);
  const m2OatGrams = round10(Math.max(10, (cPerMeal[1] - m2Yogurt.carbs) / 0.66));
  const m2Oat = buildFoodEntry("avena", m2OatGrams);
  const snack1Foods: MealFood[] = [m2Yogurt, m2Oat];
  if (pPerMeal[1] > m2Yogurt.protein + m2Oat.protein + 5) {
    const extraP = pPerMeal[1] - m2Yogurt.protein - m2Oat.protein;
    const claraGrams = round10(extraP / 0.11);
    snack1Foods.push(buildFoodEntry("clara-huevo", claraGrams));
  }
  if (fPerMeal[1] > 5) {
    snack1Foods.push(buildFoodEntry("almendras", round10(fPerMeal[1] / 0.50)));
  }

  // MEAL 3: COMIDA 3 - Almuerzo (25%)
  const m3ProteinGrams = round10(pPerMeal[2] / 0.31); // chicken 31g protein per 100g
  const m3Chicken = buildFoodEntry("pollo-pechuga", m3ProteinGrams);
  const m3CarbGrams = round10(cPerMeal[2] / 0.28); // rice 28g carbs per 100g
  const m3Rice = buildFoodEntry("arroz-integral", m3CarbGrams);
  const m3Veg = buildFoodEntry("brocoli", 150);
  const almuerzoFoods: MealFood[] = [m3Chicken, m3Rice, m3Veg];
  if (fPerMeal[2] > m3Chicken.fat + m3Rice.fat + 2) {
    almuerzoFoods.push(buildFoodEntry("aceite-oliva", 14)); // 1 cucharada
  }

  // MEAL 4: COMIDA 4 - Snack (10%)
  const m4Claras = round10(pPerMeal[3] / 0.11);
  const m4Clara = buildFoodEntry("clara-huevo", m4Claras);
  const m4Rice = buildFoodEntryByUnit("galleta-arroz", Math.max(1, Math.round(cPerMeal[3] / 7.4)), 9); // each rice cake ~7.4g carbs
  const snack2Foods: MealFood[] = [m4Clara, m4Rice];
  if (cPerMeal[3] > 15) {
    snack2Foods.push(buildFoodEntryByUnit("banana", 1, 120));
  }

  // MEAL 5: COMIDA 5 - Cena (25%)
  const m5ProteinGrams = round10(pPerMeal[4] / 0.20); // salmon 20g protein per 100g
  const m5Fish = buildFoodEntry("salmon", m5ProteinGrams);
  const m5CarbGrams = round10(cPerMeal[4] / 0.21); // sweet potato 21g carbs per 100g
  const m5Boniato = buildFoodEntry("boniato", m5CarbGrams);
  const m5Veg = buildFoodEntry("espinaca", 100);
  const cenaFoods: MealFood[] = [m5Fish, m5Boniato, m5Veg];
  if (fPerMeal[4] > m5Fish.fat + 2) {
    cenaFoods.push(buildFoodEntry("aceite-oliva", 14));
  }

  // MEAL 6: COMIDA 6 - Snack nocturno (10%)
  const m6Cottage = buildFoodEntry("queso-cottage", round10(pPerMeal[5] / 0.11));
  const snack3Foods: MealFood[] = [m6Cottage];
  if (cPerMeal[5] > 5) {
    snack3Foods.push(buildFoodEntryByUnit("galleta-arroz", Math.max(1, Math.round(cPerMeal[5] / 7.4)), 9));
  }

  const meals: MealPlanMeal[] = [
    mealFromFoods("DESAYUNO", desayunoFoods),
    mealFromFoods("COMIDA 2", snack1Foods),
    mealFromFoods("COMIDA 3 (ALMUERZO)", almuerzoFoods),
    mealFromFoods("COMIDA 4", snack2Foods),
    mealFromFoods("COMIDA 5 (CENA)", cenaFoods),
    mealFromFoods("COMIDA 6", snack3Foods),
  ];

  return {
    meals,
    importantNotes: [
      "COMER CADA 3 HORAS",
      `OBJETIVO DIARIO: ${targetCalories} kcal | ${protein}g proteina | ${carbs}g carbos | ${fats}g grasas`,
      "TOMAR 3 LITROS DE AGUA AL DIA",
      "NO AZUCAR, ENDULZAR CON EDULCORANTE",
      "NO ALCOHOL",
      "Datos nutricionales basados en USDA FoodData Central",
    ],
  };
}
