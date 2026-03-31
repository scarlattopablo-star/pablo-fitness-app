export interface MealPlanMeal {
  name: string;
  time: string;
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
  fats: number
): { meals: MealPlanMeal[]; importantNotes: string[] } {
  // Distribute macros across 6 meals
  // Meal distribution: 20%, 10%, 25%, 10%, 25%, 10%
  const dist = [0.20, 0.10, 0.25, 0.10, 0.25, 0.10];

  const proteinPerMeal = dist.map(d => Math.round(protein * d));
  const carbsPerMeal = dist.map(d => Math.round(carbs * d));
  const fatsPerMeal = dist.map(d => Math.round(fats * d));
  const calPerMeal = dist.map(d => Math.round(targetCalories * d));

  // Generate food suggestions based on macro targets per meal
  const meals: MealPlanMeal[] = [
    {
      name: "DESAYUNO",
      time: "07:00",
      foods: generateFoods(proteinPerMeal[0], carbsPerMeal[0], fatsPerMeal[0], "desayuno"),
      approxCalories: calPerMeal[0],
      approxProtein: proteinPerMeal[0],
      approxCarbs: carbsPerMeal[0],
      approxFats: fatsPerMeal[0],
    },
    {
      name: "COMIDA 2",
      time: "10:00",
      foods: generateFoods(proteinPerMeal[1], carbsPerMeal[1], fatsPerMeal[1], "snack1"),
      approxCalories: calPerMeal[1],
      approxProtein: proteinPerMeal[1],
      approxCarbs: carbsPerMeal[1],
      approxFats: fatsPerMeal[1],
    },
    {
      name: "COMIDA 3",
      time: "13:00",
      foods: generateFoods(proteinPerMeal[2], carbsPerMeal[2], fatsPerMeal[2], "almuerzo"),
      approxCalories: calPerMeal[2],
      approxProtein: proteinPerMeal[2],
      approxCarbs: carbsPerMeal[2],
      approxFats: fatsPerMeal[2],
    },
    {
      name: "COMIDA 4",
      time: "16:00",
      foods: generateFoods(proteinPerMeal[3], carbsPerMeal[3], fatsPerMeal[3], "snack2"),
      approxCalories: calPerMeal[3],
      approxProtein: proteinPerMeal[3],
      approxCarbs: carbsPerMeal[3],
      approxFats: fatsPerMeal[3],
    },
    {
      name: "COMIDA 5",
      time: "19:00",
      foods: generateFoods(proteinPerMeal[4], carbsPerMeal[4], fatsPerMeal[4], "cena"),
      approxCalories: calPerMeal[4],
      approxProtein: proteinPerMeal[4],
      approxCarbs: carbsPerMeal[4],
      approxFats: fatsPerMeal[4],
    },
    {
      name: "COMIDA 6",
      time: "21:00",
      foods: generateFoods(proteinPerMeal[5], carbsPerMeal[5], fatsPerMeal[5], "snack3"),
      approxCalories: calPerMeal[5],
      approxProtein: proteinPerMeal[5],
      approxCarbs: carbsPerMeal[5],
      approxFats: fatsPerMeal[5],
    },
  ];

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

function generateFoods(protein: number, carbs: number, fats: number, meal: string): string[] {
  // Calculate approximate food portions based on macros
  // Protein sources: chicken (31g/100g), eggs (13g/2), fish (26g/100g), claras (11g/100g)
  // Carb sources: rice (28g/100g), sweet potato (20g/100g), oats (66g/100g), fruit (~15g)
  // Fat sources: olive oil (14g/tbsp), nuts (14g/20g), avocado (15g/100g)

  const proteinGrams = Math.round(protein / 0.31); // grams of chicken equivalent
  const carbGrams = Math.round(carbs / 0.28); // grams of rice equivalent

  switch (meal) {
    case "desayuno":
      return [
        `${Math.max(1, Math.round(protein / 6.5))} huevos revueltos`,
        `${Math.round(carbs / 0.66 * 10) / 10}g avena`,
        "1 fruta",
        "1 café",
        fats > 8 ? "1 cucharada aceite de oliva o mantequilla de maní" : "",
      ].filter(Boolean);

    case "snack1":
      return [
        "Yogurt descremado",
        `${Math.round(carbs / 0.66 * 10) / 10}g avena o granola`,
        protein > 12 ? `${Math.round(protein / 0.11)}g claras de huevo` : "1 fruta",
        fats > 5 ? `${Math.round(fats / 0.7)}g nueces o almendras` : "",
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
