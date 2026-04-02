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

function round5(n: number): number {
  return Math.max(10, Math.round(n / 5) * 5);
}

function buildFood(foodId: string, grams: number): MealFood {
  const food = getFood(foodId);
  const g = Math.max(10, grams);
  const macros = calculateFoodMacros(food, g);
  return { name: food.name, grams: g, unit: food.unit, ...macros };
}

function buildFoodByUnit(foodId: string, units: number, gramsPerUnit: number): MealFood {
  const food = getFood(foodId);
  const totalGrams = Math.max(1, units) * gramsPerUnit;
  const macros = calculateFoodMacros(food, totalGrams);
  return { name: `${Math.max(1, units)} ${food.name}`, grams: totalGrams, unit: food.unit, ...macros };
}

// Calculate grams of a food to hit a target macro, using its per-100g value
function gramsFor(food: FoodItem, target: number, macro: "protein" | "carbs" | "fat"): number {
  const per100 = food[macro];
  if (per100 <= 0 || target <= 0) return 0;
  return round5((target / per100) * 100);
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

// Remaining macro budget after placed foods
function remaining(target: { p: number; c: number; f: number }, placed: MealFood[]) {
  const totals = sumMacros(placed);
  return {
    p: Math.max(0, target.p - totals.protein),
    c: Math.max(0, target.c - totals.carbs),
    f: Math.max(0, target.f - totals.fat),
  };
}

export function generateMealPlan(
  targetCalories: number,
  protein: number,
  carbs: number,
  fats: number,
  wakeHour: number = 7,
  sleepHour: number = 23
): { meals: MealPlanMeal[]; importantNotes: string[] } {
  const awakeHours = (sleepHour > wakeHour ? sleepHour : sleepHour + 24) - wakeHour;
  const numMeals = Math.min(6, Math.max(4, Math.floor(awakeHours / 3) + 1));

  // Meal times
  const mealTimes: string[] = [];
  for (let i = 0; i < numMeals; i++) {
    if (i === numMeals - 1) {
      const lastHour = sleepHour - 2;
      mealTimes.push(`${lastHour < 10 ? "0" : ""}${lastHour}:00`);
    } else {
      const h = (wakeHour + i * 3) % 24;
      mealTimes.push(`${h < 10 ? "0" : ""}${h}:00`);
    }
  }

  // Distribution per meal count (6 slots: DESAYUNO, COMIDA2, ALMUERZO, MERIENDA, CENA, COLACION)
  const distTemplates: Record<number, number[]> = {
    4: [0.25, 0.00, 0.30, 0.15, 0.30, 0.00],
    5: [0.22, 0.12, 0.26, 0.12, 0.28, 0.00],
    6: [0.20, 0.10, 0.25, 0.10, 0.25, 0.10],
  };
  const dist = distTemplates[numMeals] || distTemplates[6];

  const targets = dist.map(d => ({
    p: Math.round(protein * d),
    c: Math.round(carbs * d),
    f: Math.round(fats * d),
  }));

  // === MEAL 1: DESAYUNO ===
  // Strategy: eggs (protein+fat) → subtract → oats for remaining carbs. No blind banana.
  const t0 = targets[0];
  const m1Eggs = Math.max(1, Math.min(3, Math.round(t0.p / 6.5))); // cap at 3 eggs
  const m1Egg = buildFoodByUnit("huevo-entero", m1Eggs, 50);
  const r0 = remaining(t0, [m1Egg]);
  const m1OatGrams = gramsFor(getFood("avena"), r0.c, "carbs");
  const m1Oat = buildFood("avena", m1OatGrams);
  const desayunoFoods: MealFood[] = [m1Egg, m1Oat];
  const r0b = remaining(t0, desayunoFoods);
  // Only add banana if there's carb budget left (>10g)
  if (r0b.c > 10) {
    desayunoFoods.push(buildFoodByUnit("banana", 1, 120));
  }
  // Add fat source only if under fat budget
  const r0c = remaining(t0, desayunoFoods);
  if (r0c.f > 5) {
    desayunoFoods.push(buildFood("mani", round5(r0c.f / 0.50 * 100 / 100)));
  }

  // === MEAL 2: COMIDA 2 - Snack ===
  const t1 = targets[1];
  const m2Yogurt = buildFood("yogurt-descremado", 200);
  const r1 = remaining(t1, [m2Yogurt]);
  const snack1Foods: MealFood[] = [m2Yogurt];
  if (r1.c > 5) {
    snack1Foods.push(buildFood("avena", gramsFor(getFood("avena"), r1.c, "carbs")));
  }
  const r1b = remaining(t1, snack1Foods);
  if (r1b.f > 3) {
    snack1Foods.push(buildFood("almendras", gramsFor(getFood("almendras"), r1b.f, "fat")));
  }

  // === MEAL 3: ALMUERZO ===
  const t2 = targets[2];
  // Vegetables first (fixed, low macro impact)
  const m3Veg = buildFood("brocoli", 150);
  const r2 = remaining(t2, [m3Veg]);
  // Protein source: chicken. Size by remaining protein after veg
  const m3Chicken = buildFood("pollo-pechuga", gramsFor(getFood("pollo-pechuga"), r2.p, "protein"));
  const r2b = remaining(t2, [m3Veg, m3Chicken]);
  // Carb source: brown rice. Size by remaining carbs
  const m3Rice = buildFood("arroz-integral", gramsFor(getFood("arroz-integral"), r2b.c, "carbs"));
  const almuerzoFoods: MealFood[] = [m3Chicken, m3Rice, m3Veg];
  // Olive oil only if fat budget allows
  const r2c = remaining(t2, almuerzoFoods);
  if (r2c.f > 5) {
    const oilGrams = Math.min(14, round5(r2c.f / 1.0 * 100 / 100)); // 1g fat per 1g oil
    almuerzoFoods.push(buildFood("aceite-oliva", oilGrams));
  }

  // === MEAL 4: MERIENDA ===
  const t3 = targets[3];
  // Whey protein as protein source (low fat, low carb)
  const m4Whey = buildFood("whey-protein", gramsFor(getFood("whey-protein"), t3.p, "protein"));
  const r3 = remaining(t3, [m4Whey]);
  const snack2Foods: MealFood[] = [m4Whey];
  // Rice cakes for carbs
  if (r3.c > 5) {
    const numCakes = Math.max(1, Math.min(4, Math.round(r3.c / 7.4)));
    snack2Foods.push(buildFoodByUnit("galleta-arroz", numCakes, 9));
  }
  // Banana only if carb budget still has room
  const r3b = remaining(t3, snack2Foods);
  if (r3b.c > 15) {
    snack2Foods.push(buildFoodByUnit("banana", 1, 120));
  }

  // === MEAL 5: CENA ===
  const t4 = targets[4];
  const m5Veg = buildFood("espinaca", 100);
  const r4 = remaining(t4, [m5Veg]);
  // Use merluza (low fat) instead of salmon to avoid fat overshoot
  const m5Fish = buildFood("merluza", gramsFor(getFood("merluza"), r4.p, "protein"));
  const r4b = remaining(t4, [m5Veg, m5Fish]);
  // Sweet potato for carbs
  const m5Boniato = buildFood("boniato", gramsFor(getFood("boniato"), r4b.c, "carbs"));
  const cenaFoods: MealFood[] = [m5Fish, m5Boniato, m5Veg];
  // Olive oil if fat budget remains
  const r4c = remaining(t4, cenaFoods);
  if (r4c.f > 3) {
    const oilGrams = Math.min(14, round5(r4c.f / 1.0 * 100 / 100));
    cenaFoods.push(buildFood("aceite-oliva", oilGrams));
  }

  // === MEAL 6: COLACION NOCTURNA ===
  const t5 = targets[5];
  const m6Cottage = buildFood("queso-cottage", gramsFor(getFood("queso-cottage"), t5.p, "protein"));
  const snack3Foods: MealFood[] = [m6Cottage];
  const r5 = remaining(t5, snack3Foods);
  if (r5.c > 5) {
    const numCakes = Math.max(1, Math.min(3, Math.round(r5.c / 7.4)));
    snack3Foods.push(buildFoodByUnit("galleta-arroz", numCakes, 9));
  }

  // Build all meal options
  const allMealOptions = [
    { name: "DESAYUNO", foods: desayunoFoods },
    { name: "COMIDA 2", foods: snack1Foods },
    { name: "ALMUERZO", foods: almuerzoFoods },
    { name: "MERIENDA", foods: snack2Foods },
    { name: "CENA", foods: cenaFoods },
    { name: "COLACION NOCTURNA", foods: snack3Foods },
  ];

  // Select meals based on count, cena always last
  const picksByCount: Record<number, number[]> = {
    4: [0, 2, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 5, 4], // Colacion before Cena so Cena is last
  };
  const picks = picksByCount[numMeals] || picksByCount[6];

  const selectedMeals: MealPlanMeal[] = picks.map((idx, i) => {
    const m = mealFromFoods(allMealOptions[idx].name, allMealOptions[idx].foods);
    m.time = mealTimes[i] || "";
    return m;
  });

  return {
    meals: selectedMeals,
    importantNotes: [
      "COMER CADA 3 HORAS",
      `OBJETIVO DIARIO: ${targetCalories} kcal | ${protein}g proteina | ${carbs}g carbos | ${fats}g grasas`,
      "TOMAR 3 LITROS DE AGUA AL DIA",
      "NO AZUCAR, ENDULZAR CON EDULCORANTE",
      "NO ALCOHOL",
    ],
  };
}
