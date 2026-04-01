// Base de datos nutricional real basada en USDA FoodData Central
// Valores por 100g de alimento
// Fuente: https://fdc.nal.usda.gov/

export interface FoodItem {
  id: string;
  name: string;
  category: "protein" | "carb" | "fat" | "vegetable" | "fruit" | "dairy" | "snack";
  calories: number; // kcal per 100g
  protein: number;  // grams per 100g
  carbs: number;    // grams per 100g
  fat: number;      // grams per 100g
  fiber?: number;   // grams per 100g
  unit: string;     // display unit (g, unidad, cucharada, etc.)
  mealTypes: string[]; // which meals this food is good for
}

export const FOOD_DATABASE: FoodItem[] = [
  // === PROTEINAS ===
  { id: "pollo-pechuga", name: "Pechuga de pollo (cocida)", category: "protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pollo-muslo", name: "Muslo de pollo (cocido)", category: "protein", calories: 209, protein: 26, carbs: 0, fat: 10.9, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "carne-magra", name: "Carne vacuna magra (cocida)", category: "protein", calories: 250, protein: 26, carbs: 0, fat: 15, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "salmon", name: "Salmon (cocido)", category: "protein", calories: 208, protein: 20, carbs: 0, fat: 13, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "atun", name: "Atun en agua (enlatado)", category: "protein", calories: 116, protein: 26, carbs: 0, fat: 1, unit: "g", mealTypes: ["almuerzo", "cena", "snack"] },
  { id: "merluza", name: "Merluza (cocida)", category: "protein", calories: 90, protein: 19, carbs: 0, fat: 1.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "huevo-entero", name: "Huevo entero", category: "protein", calories: 143, protein: 13, carbs: 0.7, fat: 9.5, unit: "unidad (50g)", mealTypes: ["desayuno", "almuerzo", "snack"] },
  { id: "clara-huevo", name: "Clara de huevo", category: "protein", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "whey-protein", name: "Proteina whey (scoop)", category: "protein", calories: 120, protein: 24, carbs: 3, fat: 1.5, unit: "scoop (30g)", mealTypes: ["desayuno", "snack"] },

  // === CARBOHIDRATOS ===
  { id: "arroz-blanco", name: "Arroz blanco (cocido)", category: "carb", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "arroz-integral", name: "Arroz integral (cocido)", category: "carb", calories: 123, protein: 2.7, carbs: 26, fat: 1, fiber: 1.6, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "avena", name: "Avena (cruda)", category: "carb", calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10, unit: "g", mealTypes: ["desayuno"] },
  { id: "boniato", name: "Boniato/Batata (cocido)", category: "carb", calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "papa", name: "Papa (cocida)", category: "carb", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pan-integral", name: "Pan integral (rebanada)", category: "carb", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, unit: "rebanada (30g)", mealTypes: ["desayuno", "snack"] },
  { id: "fideos", name: "Fideos/Pasta (cocida)", category: "carb", calories: 131, protein: 5, carbs: 25, fat: 1.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "galleta-arroz", name: "Galleta de arroz", category: "carb", calories: 387, protein: 8, carbs: 82, fat: 2.8, unit: "unidad (9g)", mealTypes: ["snack"] },
  { id: "quinoa", name: "Quinoa (cocida)", category: "carb", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, unit: "g", mealTypes: ["almuerzo", "cena"] },

  // === GRASAS SALUDABLES ===
  { id: "aceite-oliva", name: "Aceite de oliva", category: "fat", calories: 884, protein: 0, carbs: 0, fat: 100, unit: "cucharada (14g)", mealTypes: ["almuerzo", "cena"] },
  { id: "palta", name: "Palta/Aguacate", category: "fat", calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 7, unit: "g", mealTypes: ["desayuno", "almuerzo", "snack"] },
  { id: "almendras", name: "Almendras", category: "fat", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, unit: "g", mealTypes: ["snack"] },
  { id: "nueces", name: "Nueces", category: "fat", calories: 654, protein: 15, carbs: 14, fat: 65, unit: "g", mealTypes: ["snack"] },
  { id: "mani", name: "Mantequilla de mani", category: "fat", calories: 588, protein: 25, carbs: 20, fat: 50, unit: "cucharada (16g)", mealTypes: ["desayuno", "snack"] },
  { id: "semillas-chia", name: "Semillas de chia", category: "fat", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, unit: "cucharada (12g)", mealTypes: ["desayuno", "snack"] },

  // === LACTEOS ===
  { id: "yogurt-descremado", name: "Yogurt descremado", category: "dairy", calories: 56, protein: 10, carbs: 4, fat: 0.2, unit: "g (200g)", mealTypes: ["desayuno", "snack"] },
  { id: "yogurt-griego", name: "Yogurt griego", category: "dairy", calories: 97, protein: 9, carbs: 3.6, fat: 5, unit: "g (170g)", mealTypes: ["desayuno", "snack"] },
  { id: "leche-descremada", name: "Leche descremada", category: "dairy", calories: 34, protein: 3.4, carbs: 5, fat: 0.1, unit: "ml (200ml)", mealTypes: ["desayuno"] },
  { id: "queso-cottage", name: "Queso cottage", category: "dairy", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, unit: "g", mealTypes: ["desayuno", "snack"] },

  // === FRUTAS ===
  { id: "banana", name: "Banana", category: "fruit", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "unidad (120g)", mealTypes: ["desayuno", "snack"] },
  { id: "manzana", name: "Manzana", category: "fruit", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: "unidad (180g)", mealTypes: ["snack"] },
  { id: "arandanos", name: "Arandanos", category: "fruit", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "frutilla", name: "Frutillas/Fresas", category: "fruit", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "naranja", name: "Naranja", category: "fruit", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: "unidad (130g)", mealTypes: ["snack"] },

  // === VERDURAS ===
  { id: "brocoli", name: "Brocoli (cocido)", category: "vegetable", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "espinaca", name: "Espinaca (cruda)", category: "vegetable", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "tomate", name: "Tomate", category: "vegetable", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: "unidad (120g)", mealTypes: ["almuerzo", "cena"] },
  { id: "zapallo", name: "Zapallo (cocido)", category: "vegetable", calories: 26, protein: 1, carbs: 6.5, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "zanahoria", name: "Zanahoria (cocida)", category: "vegetable", calories: 35, protein: 0.8, carbs: 8, fat: 0.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "lechuga", name: "Lechuga", category: "vegetable", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pepino", name: "Pepino", category: "vegetable", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "cebolla", name: "Cebolla", category: "vegetable", calories: 40, protein: 1.1, carbs: 9, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
];

// Get food by ID
export function getFoodById(id: string): FoodItem | undefined {
  return FOOD_DATABASE.find(f => f.id === id);
}

// Get foods by category
export function getFoodsByCategory(category: FoodItem["category"]): FoodItem[] {
  return FOOD_DATABASE.filter(f => f.category === category);
}

// Get foods suitable for a meal type
export function getFoodsForMeal(mealType: string): FoodItem[] {
  return FOOD_DATABASE.filter(f => f.mealTypes.includes(mealType));
}

// Calculate grams needed to hit a target macro
export function gramsForProtein(food: FoodItem, targetProtein: number): number {
  if (food.protein <= 0) return 0;
  return Math.round(targetProtein / food.protein * 100 / 10) * 10; // round to 10g
}

export function gramsForCarbs(food: FoodItem, targetCarbs: number): number {
  if (food.carbs <= 0) return 0;
  return Math.round(targetCarbs / food.carbs * 100 / 10) * 10;
}

export function gramsForFat(food: FoodItem, targetFat: number): number {
  if (food.fat <= 0) return 0;
  return Math.round(targetFat / food.fat * 100 / 10) * 10;
}

// Calculate actual macros for a given amount of food
export function calculateFoodMacros(food: FoodItem, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
  };
}
