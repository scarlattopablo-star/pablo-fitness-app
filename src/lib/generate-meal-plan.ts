export interface MealPlanMeal {
  name: string;
  time?: string;
  foods: string[];
  approxCalories: number;
  approxProtein: number;
  approxCarbs: number;
  approxFats: number;
}

export function generateMealPlan(
  targetCalories: number,
  protein: number,
  carbs: number,
  fats: number,
  wakeHour: number = 7,
  sleepHour: number = 23
): { meals: MealPlanMeal[]; importantNotes: string[] } {
  // Calculate number of meals based on wake/sleep hours (every 3 hours)
  const awakeHours = sleepHour > wakeHour ? sleepHour - wakeHour : (24 - wakeHour) + sleepHour;
  const numMeals = Math.max(3, Math.min(7, Math.floor(awakeHours / 3) + 1));

  // Distribute macros dynamically based on number of meals
  // First and main meals get more, snacks get less
  const dist: number[] = [];
  for (let i = 0; i < numMeals; i++) {
    if (i === 0) dist.push(0.22); // desayuno
    else if (i === Math.floor(numMeals / 2)) dist.push(0.25); // almuerzo
    else if (i === numMeals - 2) dist.push(0.22); // cena
    else dist.push(0.10); // snacks
  }
  // Normalize to 100%
  const total = dist.reduce((a, b) => a + b, 0);
  for (let i = 0; i < dist.length; i++) dist[i] = dist[i] / total;

  const proteinPerMeal = dist.map(d => Math.round(protein * d));
  const carbsPerMeal = dist.map(d => Math.round(carbs * d));
  const fatsPerMeal = dist.map(d => Math.round(fats * d));
  const calPerMeal = dist.map(d => Math.round(targetCalories * d));

  // Meal type mapping based on position
  const getMealType = (i: number, total: number): string => {
    if (i === 0) return "desayuno";
    if (i === total - 1) return "snack3";
    if (i === Math.floor(total / 2)) return "almuerzo";
    if (i === total - 2) return "cena";
    if (i === 1) return "snack1";
    return "snack2";
  };

  const getMealName = (i: number, total: number): string => {
    if (i === 0) return "DESAYUNO";
    if (total <= 4) return `COMIDA ${i + 1}`;
    if (i === Math.floor(total / 2)) return "ALMUERZO";
    if (i === total - 2) return "CENA";
    return `COMIDA ${i + 1}`;
  };

  const meals: MealPlanMeal[] = [];
  for (let i = 0; i < numMeals; i++) {
    meals.push({
      name: getMealName(i, numMeals),
      foods: generateFoods(proteinPerMeal[i], carbsPerMeal[i], fatsPerMeal[i], getMealType(i, numMeals)),
      approxCalories: calPerMeal[i],
      approxProtein: proteinPerMeal[i],
      approxCarbs: carbsPerMeal[i],
      approxFats: fatsPerMeal[i],
    });
  }

  return {
    meals,
    importantNotes: [
      "COMER CADA 3 HORAS",
      `OBJETIVO DIARIO: ${targetCalories} kcal | ${protein}g proteína | ${carbs}g carbos | ${fats}g grasas`,
      "TOMAR 3 LITROS DE AGUA AL DÍA",
      "NO AZÚCAR, ENDULZAR CON EDULCORANTE",
      "NO ALCOHOL",
    ],
  };
}

// Round to nearest 10g for clean numbers
function round10(n: number): number {
  return Math.round(n / 10) * 10 || 10;
}

function generateFoods(protein: number, carbs: number, fats: number, meal: string): string[] {
  const proteinGrams = round10(protein / 0.31);
  const carbGrams = round10(carbs / 0.28);

  switch (meal) {
    case "desayuno":
      return [
        `${Math.max(1, Math.round(protein / 6.5))} huevos revueltos`,
        `${round10(carbs / 0.66)}g avena`,
        "1 fruta",
        "1 café",
        fats > 8 ? "1 cucharada aceite de oliva o mantequilla de maní" : "",
      ].filter(Boolean);

    case "snack1":
      return [
        "Yogurt descremado",
        `${round10(carbs / 0.66)}g avena o granola`,
        protein > 12 ? `${round10(protein / 0.11)}g claras de huevo` : "1 fruta",
        fats > 5 ? `${round10(fats / 0.7)}g nueces o almendras` : "",
      ].filter(Boolean);

    case "almuerzo":
      return [
        `${proteinGrams}g pollo o carne magra`,
        `${carbGrams}g arroz integral o boniato`,
        "Ensalada verde abundante",
        fats > 5 ? "1 cucharada aceite de oliva" : "",
      ].filter(Boolean);

    case "snack2":
      return [
        `${Math.max(2, Math.round(protein / 3.6))} claras de huevo`,
        `${Math.max(1, Math.round(carbs / 8))} galletas de arroz`,
        carbs > 15 ? "1 banana" : "",
      ].filter(Boolean);

    case "cena":
      return [
        `${proteinGrams}g pescado o pollo (suprema)`,
        `${carbGrams}g zapallo, zanahoria o verduras al vapor`,
        fats > 5 ? "1 cucharada aceite de oliva" : "",
        "Infusión digestiva",
      ].filter(Boolean);

    case "snack3":
      return [
        `${Math.max(2, Math.round(protein / 3.6))} claras de huevo`,
        carbs > 5 ? "1 galleta de arroz" : "",
        "Infusión de cola de caballo",
      ].filter(Boolean);

    default:
      return [];
  }
}
