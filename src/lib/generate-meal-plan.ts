// Generador de plan nutricional personalizado
// Fuentes nutricionales:
// - USDA FoodData Central (valores nutricionales)
// - Academy of Nutrition and Dietetics (AND): Position Papers on Vegetarian/Vegan Diets (2016, updated 2021)
// - ADA (American Diabetes Association): Standards of Medical Care in Diabetes (2024)
// - Celiac Disease Foundation: Gluten-Free Diet Guidelines
// - NIH/NIDDK: Lactose Intolerance Management
// - ACSM: Nutrition and Athletic Performance Joint Position Statement (2016)
//
// Sustituciones basadas en equivalencia macro por grupo alimentario:
// - Vegetariano: reemplazar carnes por tofu, legumbres, huevos, lácteos (AND Position Paper)
// - Vegano: reemplazar todo animal por tofu, legumbres, semillas, leche vegetal (AND Position Paper)
// - Sin gluten: reemplazar avena/pan/pasta por arroz, quinoa, boniato (Celiac Disease Foundation)
// - Sin lactosa: reemplazar lácteos por alternativas vegetales o sin lactosa (NIH/NIDDK)
// - Sin frutos secos: reemplazar frutos secos por semillas (no tree nuts) (FARE Guidelines)
// - Diabetes: priorizar carbohidratos complejos, bajo IG, más fibra (ADA Standards of Care)

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
  return Math.max(20, Math.round(n / 5) * 5);
}

function buildFood(foodId: string, grams: number): MealFood {
  const food = getFood(foodId);
  const g = Math.max(20, grams);
  const macros = calculateFoodMacros(food, g);
  return { name: food.name, grams: g, unit: food.unit, ...macros };
}

function buildFoodByUnit(foodId: string, units: number, gramsPerUnit: number): MealFood {
  const food = getFood(foodId);
  const totalGrams = Math.max(1, units) * gramsPerUnit;
  const macros = calculateFoodMacros(food, totalGrams);
  return { name: `${Math.max(1, units)} ${food.name}`, grams: totalGrams, unit: food.unit, ...macros };
}

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

function remaining(target: { p: number; c: number; f: number }, placed: MealFood[]) {
  const totals = sumMacros(placed);
  return {
    p: Math.max(0, target.p - totals.protein),
    c: Math.max(0, target.c - totals.carbs),
    f: Math.max(0, target.f - totals.fat),
  };
}

// ============================================================
// Restriction-aware food selection
// Based on AND Position Papers, ADA Standards, Celiac Foundation, NIH/NIDDK
// ============================================================

interface RestrictionFlags {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  lactoseFree: boolean;
  nutFree: boolean;
  diabetes: boolean;
}

function parseRestrictions(restrictions: string[]): RestrictionFlags {
  const r = restrictions.map(s => s.toLowerCase());
  return {
    vegetarian: r.some(s => s.includes("vegetariano")),
    vegan: r.some(s => s.includes("vegano")),
    glutenFree: r.some(s => s.includes("gluten") || s.includes("celiaco") || s.includes("celíaco")),
    lactoseFree: r.some(s => s.includes("lactosa")),
    nutFree: r.some(s => s.includes("frutos secos")),
    diabetes: r.some(s => s.includes("diabetes")),
  };
}

// Protein sources by restriction
// AND Position Paper: legumes + tofu provide complete amino acid profiles when combined
function getProteinMain(flags: RestrictionFlags): string {
  if (flags.vegan) return "tofu";            // Tofu firme: 17g protein/100g
  if (flags.vegetarian) return "huevo-entero"; // Eggs: complete protein
  return "pollo-pechuga";                      // Default: chicken breast
}

function getProteinAlt(flags: RestrictionFlags): string {
  if (flags.vegan) return "lentejas";          // Lentejas: 9g protein/100g + iron
  if (flags.vegetarian) return "tofu";
  return "merluza";
}

// Carb sources - diabetes uses low-GI (ADA: prefer whole grains, IG < 55)
function getCarbMain(flags: RestrictionFlags): string {
  if (flags.glutenFree && flags.diabetes) return "quinoa";     // GF + low GI
  if (flags.glutenFree) return "arroz-integral";                // GF
  if (flags.diabetes) return "quinoa";                          // Low GI (53)
  return "arroz-integral";
}

function getCarbAlt(flags: RestrictionFlags): string {
  if (flags.glutenFree) return "boniato";  // GF carb source
  if (flags.diabetes) return "lentejas";   // Very low GI (32), high fiber
  return "boniato";
}

// Breakfast carb - avena contiene gluten por contaminación cruzada (Celiac Foundation)
function getBreakfastCarb(flags: RestrictionFlags): string {
  if (flags.glutenFree) return "galleta-arroz"; // GF safe
  if (flags.diabetes) return "avena";            // Oats: low GI, high fiber (ADA approved)
  return "avena";
}

// Dairy alternatives (NIH/NIDDK: lactose-free or plant-based fortified alternatives)
function getDairy(flags: RestrictionFlags): string {
  if (flags.vegan || flags.lactoseFree) return "tofu"; // Calcium-set tofu (AND)
  return "yogurt-descremado";
}

function getCottage(flags: RestrictionFlags): string {
  if (flags.vegan || flags.lactoseFree) return "tofu";
  return "queso-cottage";
}

// Fat sources (FARE: tree nut allergy → use seeds instead)
function getFatSource(flags: RestrictionFlags): string {
  if (flags.nutFree) return "semillas-girasol";  // No tree nuts
  return "almendras";
}

function getButterFat(flags: RestrictionFlags): string {
  if (flags.nutFree) return "semillas-chia";  // Seed-based fat
  return "mani";                                // Peanut butter (legume, not tree nut - FARE)
}

// Whey protein (dairy-derived)
function getProteinShake(flags: RestrictionFlags): string {
  if (flags.vegan || flags.lactoseFree) return "tofu"; // Plant protein
  return "whey-protein";
}

export function generateMealPlan(
  targetCalories: number,
  protein: number,
  carbs: number,
  fats: number,
  wakeHour: number = 7,
  sleepHour: number = 23,
  dietaryRestrictions: string[] = []
): { meals: MealPlanMeal[]; importantNotes: string[] } {
  const flags = parseRestrictions(dietaryRestrictions);
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
  const t0 = targets[0];
  const breakfastProteinId = flags.vegan ? "tofu" : "huevo-entero";
  const desayunoFoods: MealFood[] = [];

  if (breakfastProteinId === "huevo-entero") {
    const numEggs = Math.max(1, Math.min(3, Math.round(t0.p / 6.5)));
    desayunoFoods.push(buildFoodByUnit("huevo-entero", numEggs, 50));
  } else {
    // Vegan: tofu scramble (AND Position Paper: tofu breakfast)
    desayunoFoods.push(buildFood("tofu", gramsFor(getFood("tofu"), t0.p, "protein")));
  }

  const breakfastCarbId = getBreakfastCarb(flags);
  const r0 = remaining(t0, desayunoFoods);
  if (breakfastCarbId === "galleta-arroz") {
    const numCakes = Math.max(2, Math.min(5, Math.round(r0.c / 7.4)));
    desayunoFoods.push(buildFoodByUnit("galleta-arroz", numCakes, 9));
  } else {
    desayunoFoods.push(buildFood(breakfastCarbId, gramsFor(getFood(breakfastCarbId), r0.c, "carbs")));
  }

  const r0b = remaining(t0, desayunoFoods);
  if (r0b.c > 10 && !flags.diabetes) {
    desayunoFoods.push(buildFoodByUnit("banana", 1, 120));
  } else if (r0b.c > 10 && flags.diabetes) {
    // ADA: berries have lower GI than banana
    desayunoFoods.push(buildFood("arandanos", gramsFor(getFood("arandanos"), r0b.c, "carbs")));
  }

  const r0c = remaining(t0, desayunoFoods);
  if (r0c.f > 5) {
    const fatId = getButterFat(flags);
    desayunoFoods.push(buildFood(fatId, round5(r0c.f / (getFood(fatId).fat / 100))));
  }

  // === MEAL 2: COMIDA 2 - Snack ===
  const t1 = targets[1];
  const dairyId = getDairy(flags);
  const snack1Foods: MealFood[] = [buildFood(dairyId, dairyId === "tofu" ? gramsFor(getFood("tofu"), t1.p, "protein") : 200)];
  const r1 = remaining(t1, snack1Foods);
  if (r1.c > 5) {
    const carbId = flags.glutenFree ? "galleta-arroz" : "avena";
    if (carbId === "galleta-arroz") {
      const n = Math.max(1, Math.min(3, Math.round(r1.c / 7.4)));
      snack1Foods.push(buildFoodByUnit("galleta-arroz", n, 9));
    } else {
      snack1Foods.push(buildFood(carbId, gramsFor(getFood(carbId), r1.c, "carbs")));
    }
  }
  const r1b = remaining(t1, snack1Foods);
  if (r1b.f > 3) {
    const fatId = getFatSource(flags);
    snack1Foods.push(buildFood(fatId, gramsFor(getFood(fatId), r1b.f, "fat")));
  }

  // === MEAL 3: ALMUERZO ===
  const t2 = targets[2];
  const m3Veg = buildFood("brocoli", 150);
  const r2 = remaining(t2, [m3Veg]);
  const mainProteinId = getProteinMain(flags);
  const m3Protein = buildFood(mainProteinId, gramsFor(getFood(mainProteinId), r2.p, "protein"));
  const r2b = remaining(t2, [m3Veg, m3Protein]);
  const mainCarbId = getCarbMain(flags);
  const m3Carb = buildFood(mainCarbId, gramsFor(getFood(mainCarbId), r2b.c, "carbs"));
  const almuerzoFoods: MealFood[] = [m3Protein, m3Carb, m3Veg];

  // Vegan/vegetarian: add legumes for complete amino acids (AND: complementary proteins)
  if (flags.vegan && mainProteinId === "tofu") {
    const r2extra = remaining(t2, almuerzoFoods);
    if (r2extra.p > 5) {
      almuerzoFoods.push(buildFood("garbanzos", gramsFor(getFood("garbanzos"), r2extra.p, "protein")));
    }
  }

  const r2c = remaining(t2, almuerzoFoods);
  if (r2c.f > 5) {
    const oilGrams = Math.min(14, round5(r2c.f / 1.0 * 100 / 100));
    almuerzoFoods.push(buildFood("aceite-oliva", oilGrams));
  }

  // === MEAL 4: MERIENDA ===
  const t3 = targets[3];
  const shakeId = getProteinShake(flags);
  const m4Protein = buildFood(shakeId, gramsFor(getFood(shakeId), t3.p, "protein"));
  const snack2Foods: MealFood[] = [m4Protein];
  const r3 = remaining(t3, snack2Foods);
  if (r3.c > 5) {
    if (flags.glutenFree) {
      const n = Math.max(1, Math.min(4, Math.round(r3.c / 7.4)));
      snack2Foods.push(buildFoodByUnit("galleta-arroz", n, 9));
    } else {
      const numCakes = Math.max(1, Math.min(4, Math.round(r3.c / 7.4)));
      snack2Foods.push(buildFoodByUnit("galleta-arroz", numCakes, 9));
    }
  }
  const r3b = remaining(t3, snack2Foods);
  if (r3b.c > 15 && !flags.diabetes) {
    snack2Foods.push(buildFoodByUnit("banana", 1, 120));
  } else if (r3b.c > 15 && flags.diabetes) {
    snack2Foods.push(buildFood("manzana", 180)); // Low GI fruit
  }

  // === MEAL 5: CENA ===
  const t4 = targets[4];
  const m5Veg = buildFood("espinaca", 100);
  const r4 = remaining(t4, [m5Veg]);
  const altProteinId = getProteinAlt(flags);
  const m5Protein = buildFood(altProteinId, gramsFor(getFood(altProteinId), r4.p, "protein"));
  const r4b = remaining(t4, [m5Veg, m5Protein]);
  const altCarbId = getCarbAlt(flags);
  const m5Carb = buildFood(altCarbId, gramsFor(getFood(altCarbId), r4b.c, "carbs"));
  const cenaFoods: MealFood[] = [m5Protein, m5Carb, m5Veg];

  // Vegan complementary protein
  if (flags.vegan && altProteinId === "lentejas") {
    const r4extra = remaining(t4, cenaFoods);
    if (r4extra.p > 5) {
      cenaFoods.push(buildFood("tofu", gramsFor(getFood("tofu"), r4extra.p, "protein")));
    }
  }

  const r4c = remaining(t4, cenaFoods);
  if (r4c.f > 3) {
    const oilGrams = Math.min(14, round5(r4c.f / 1.0 * 100 / 100));
    cenaFoods.push(buildFood("aceite-oliva", oilGrams));
  }

  // === MEAL 6: COLACION NOCTURNA ===
  const t5 = targets[5];
  const cottageId = getCottage(flags);
  const m6Protein = buildFood(cottageId, gramsFor(getFood(cottageId), t5.p, "protein"));
  const snack3Foods: MealFood[] = [m6Protein];
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

  const picksByCount: Record<number, number[]> = {
    4: [0, 2, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 5, 4],
  };
  const picks = picksByCount[numMeals] || picksByCount[6];

  const selectedMeals: MealPlanMeal[] = picks.map((idx, i) => {
    const m = mealFromFoods(allMealOptions[idx].name, allMealOptions[idx].foods);
    m.time = mealTimes[i] || "";
    return m;
  });

  // Build restriction-specific notes
  const notes = [
    "COMER CADA 3 HORAS",
    `OBJETIVO DIARIO: ${targetCalories} kcal | ${protein}g proteina | ${carbs}g carbos | ${fats}g grasas`,
    "TOMAR 3 LITROS DE AGUA AL DIA",
    "NO AZUCAR, ENDULZAR CON EDULCORANTE",
    "NO ALCOHOL",
  ];

  // Add restriction-specific medical notes
  if (flags.vegan) {
    notes.push("VEGANO: Suplementar vitamina B12 (2.4mcg/dia - AND). Combinar legumbres + cereales para aminoacidos completos.");
  }
  if (flags.vegetarian && !flags.vegan) {
    notes.push("VEGETARIANO: Asegurar variedad de fuentes proteicas (huevos, lacteos, legumbres, tofu).");
  }
  if (flags.glutenFree) {
    notes.push("SIN GLUTEN: Verificar etiquetas de todos los productos. Evitar contaminacion cruzada. La avena comun NO es apta.");
  }
  if (flags.lactoseFree) {
    notes.push("SIN LACTOSA: Asegurar ingesta de calcio (1000mg/dia) via vegetales verdes, tofu, o suplemento.");
  }
  if (flags.nutFree) {
    notes.push("SIN FRUTOS SECOS: Las semillas (girasol, chia, lino) son alternativas seguras. Verificar etiquetas.");
  }
  if (flags.diabetes) {
    notes.push("DIABETES: Priorizar carbohidratos de bajo indice glucemico. Distribuir carbos uniformemente. Monitorear glucemia (ADA).");
  }

  return {
    meals: selectedMeals,
    importantNotes: notes,
  };
}
