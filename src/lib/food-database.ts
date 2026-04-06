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
  // === PROTEINAS (20) ===
  { id: "pollo-pechuga", name: "Pechuga de pollo (cocida)", category: "protein", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pollo-muslo", name: "Muslo de pollo (cocido)", category: "protein", calories: 209, protein: 26, carbs: 0, fat: 10.9, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "carne-magra", name: "Carne vacuna magra (cocida)", category: "protein", calories: 250, protein: 26, carbs: 0, fat: 15, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "carne-molida", name: "Carne molida magra (cocida)", category: "protein", calories: 255, protein: 26, carbs: 0, fat: 16, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "cerdo-lomo", name: "Lomo de cerdo (cocido)", category: "protein", calories: 143, protein: 27, carbs: 0, fat: 3.5, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pavo-pechuga", name: "Pechuga de pavo (cocida)", category: "protein", calories: 135, protein: 30, carbs: 0, fat: 1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "salmon", name: "Salmon (cocido)", category: "protein", calories: 208, protein: 20, carbs: 0, fat: 13, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "atun", name: "Atun en agua (enlatado)", category: "protein", calories: 116, protein: 26, carbs: 0, fat: 1, unit: "g", mealTypes: ["almuerzo", "cena", "snack"] },
  { id: "merluza", name: "Merluza (cocida)", category: "protein", calories: 90, protein: 19, carbs: 0, fat: 1.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "tilapia", name: "Tilapia (cocida)", category: "protein", calories: 128, protein: 26, carbs: 0, fat: 2.7, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "camarones", name: "Camarones (cocidos)", category: "protein", calories: 99, protein: 24, carbs: 0.2, fat: 0.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "sardina", name: "Sardinas en aceite (escurridas)", category: "protein", calories: 208, protein: 25, carbs: 0, fat: 11, unit: "g", mealTypes: ["almuerzo", "cena", "snack"] },
  { id: "huevo-entero", name: "Huevo entero", category: "protein", calories: 143, protein: 13, carbs: 0.7, fat: 9.5, unit: "unidad (50g)", mealTypes: ["desayuno", "almuerzo", "snack"] },
  { id: "clara-huevo", name: "Clara de huevo", category: "protein", calories: 52, protein: 11, carbs: 0.7, fat: 0.2, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "whey-protein", name: "Proteina whey (scoop)", category: "protein", calories: 120, protein: 24, carbs: 3, fat: 1.5, unit: "scoop (30g)", mealTypes: ["desayuno", "snack"] },
  { id: "tofu", name: "Tofu firme", category: "protein", calories: 144, protein: 17, carbs: 3, fat: 8, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "jamon-pavo", name: "Jamon de pavo", category: "protein", calories: 104, protein: 18, carbs: 2, fat: 2.5, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "bondiola", name: "Bondiola de cerdo (cocida)", category: "protein", calories: 280, protein: 24, carbs: 0, fat: 20, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "caballa", name: "Caballa (cocida)", category: "protein", calories: 205, protein: 19, carbs: 0, fat: 14, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "caseina", name: "Proteina caseina (scoop)", category: "protein", calories: 110, protein: 24, carbs: 3, fat: 0.5, unit: "scoop (30g)", mealTypes: ["snack"] },

  // === CARBOHIDRATOS (18) ===
  { id: "arroz-blanco", name: "Arroz blanco (cocido)", category: "carb", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "arroz-integral", name: "Arroz integral (cocido)", category: "carb", calories: 123, protein: 2.7, carbs: 26, fat: 1, fiber: 1.6, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "avena", name: "Avena (cruda)", category: "carb", calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10, unit: "g", mealTypes: ["desayuno"] },
  { id: "boniato", name: "Boniato/Batata (cocido)", category: "carb", calories: 90, protein: 2, carbs: 21, fat: 0.1, fiber: 3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "papa", name: "Papa (cocida)", category: "carb", calories: 87, protein: 1.9, carbs: 20, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pan-integral", name: "Pan integral (rebanada)", category: "carb", calories: 247, protein: 13, carbs: 41, fat: 3.4, fiber: 7, unit: "rebanada (30g)", mealTypes: ["desayuno", "snack"] },
  { id: "pan-blanco", name: "Pan blanco (rebanada)", category: "carb", calories: 265, protein: 9, carbs: 49, fat: 3.2, unit: "rebanada (30g)", mealTypes: ["desayuno", "snack"] },
  { id: "fideos", name: "Fideos/Pasta (cocida)", category: "carb", calories: 131, protein: 5, carbs: 25, fat: 1.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "fideos-integrales", name: "Pasta integral (cocida)", category: "carb", calories: 124, protein: 5.3, carbs: 24, fat: 0.5, fiber: 3.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "galleta-arroz", name: "Galleta de arroz", category: "carb", calories: 387, protein: 8, carbs: 82, fat: 2.8, unit: "unidad (9g)", mealTypes: ["snack"] },
  { id: "quinoa", name: "Quinoa (cocida)", category: "carb", calories: 120, protein: 4.4, carbs: 21, fat: 1.9, fiber: 2.8, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "lentejas", name: "Lentejas (cocidas)", category: "carb", calories: 116, protein: 9, carbs: 20, fat: 0.4, fiber: 8, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "garbanzos", name: "Garbanzos (cocidos)", category: "carb", calories: 164, protein: 9, carbs: 27, fat: 2.6, fiber: 8, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "porotos-negros", name: "Porotos negros (cocidos)", category: "carb", calories: 132, protein: 9, carbs: 24, fat: 0.5, fiber: 8.7, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "choclo", name: "Choclo/Maiz (cocido)", category: "carb", calories: 96, protein: 3.4, carbs: 21, fat: 1.5, fiber: 2.4, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "mandioca", name: "Mandioca/Yuca (cocida)", category: "carb", calories: 160, protein: 1.4, carbs: 38, fat: 0.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "tortilla-trigo", name: "Tortilla de trigo", category: "carb", calories: 312, protein: 8, carbs: 52, fat: 8, unit: "unidad (40g)", mealTypes: ["almuerzo", "cena", "snack"] },
  { id: "granola", name: "Granola", category: "carb", calories: 471, protein: 10, carbs: 64, fat: 20, fiber: 5, unit: "g", mealTypes: ["desayuno"] },

  // === GRASAS SALUDABLES (12) ===
  { id: "aceite-oliva", name: "Aceite de oliva", category: "fat", calories: 884, protein: 0, carbs: 0, fat: 100, unit: "cucharada (14g)", mealTypes: ["almuerzo", "cena"] },
  { id: "aceite-coco", name: "Aceite de coco", category: "fat", calories: 862, protein: 0, carbs: 0, fat: 100, unit: "cucharada (14g)", mealTypes: ["desayuno", "almuerzo", "cena"] },
  { id: "palta", name: "Palta/Aguacate", category: "fat", calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 7, unit: "g", mealTypes: ["desayuno", "almuerzo", "snack"] },
  { id: "almendras", name: "Almendras", category: "fat", calories: 579, protein: 21, carbs: 22, fat: 50, fiber: 12, unit: "g", mealTypes: ["snack"] },
  { id: "nueces", name: "Nueces", category: "fat", calories: 654, protein: 15, carbs: 14, fat: 65, unit: "g", mealTypes: ["snack"] },
  { id: "castanas-caju", name: "Castanas de caju", category: "fat", calories: 553, protein: 18, carbs: 30, fat: 44, unit: "g", mealTypes: ["snack"] },
  { id: "pistachos", name: "Pistachos", category: "fat", calories: 560, protein: 20, carbs: 28, fat: 45, fiber: 10, unit: "g", mealTypes: ["snack"] },
  { id: "mani", name: "Mantequilla de mani", category: "fat", calories: 588, protein: 25, carbs: 20, fat: 50, unit: "cucharada (16g)", mealTypes: ["desayuno", "snack"] },
  { id: "mantequilla-almendras", name: "Mantequilla de almendras", category: "fat", calories: 614, protein: 21, carbs: 19, fat: 56, unit: "cucharada (16g)", mealTypes: ["desayuno", "snack"] },
  { id: "semillas-chia", name: "Semillas de chia", category: "fat", calories: 486, protein: 17, carbs: 42, fat: 31, fiber: 34, unit: "cucharada (12g)", mealTypes: ["desayuno", "snack"] },
  { id: "semillas-lino", name: "Semillas de lino", category: "fat", calories: 534, protein: 18, carbs: 29, fat: 42, fiber: 27, unit: "cucharada (10g)", mealTypes: ["desayuno", "snack"] },
  { id: "semillas-girasol", name: "Semillas de girasol", category: "fat", calories: 584, protein: 21, carbs: 20, fat: 51, fiber: 9, unit: "g", mealTypes: ["snack"] },

  // === LACTEOS (8) ===
  { id: "yogurt-descremado", name: "Yogurt descremado", category: "dairy", calories: 56, protein: 10, carbs: 4, fat: 0.2, unit: "g (200g)", mealTypes: ["desayuno", "snack"] },
  { id: "yogurt-griego", name: "Yogurt griego", category: "dairy", calories: 97, protein: 9, carbs: 3.6, fat: 5, unit: "g (170g)", mealTypes: ["desayuno", "snack"] },
  { id: "leche-descremada", name: "Leche descremada", category: "dairy", calories: 34, protein: 3.4, carbs: 5, fat: 0.1, unit: "ml (200ml)", mealTypes: ["desayuno"] },
  { id: "leche-entera", name: "Leche entera", category: "dairy", calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, unit: "ml (200ml)", mealTypes: ["desayuno"] },
  { id: "queso-cottage", name: "Queso cottage", category: "dairy", calories: 98, protein: 11, carbs: 3.4, fat: 4.3, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "queso-ricota", name: "Ricota descremada", category: "dairy", calories: 138, protein: 11, carbs: 3.5, fat: 8, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "queso-untable", name: "Queso crema light", category: "dairy", calories: 140, protein: 7, carbs: 5, fat: 10, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "queso-muzzarella", name: "Muzzarella", category: "dairy", calories: 280, protein: 28, carbs: 3.1, fat: 17, unit: "g", mealTypes: ["almuerzo", "cena", "snack"] },

  // === FRUTAS (14) ===
  { id: "banana", name: "Banana", category: "fruit", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: "unidad (120g)", mealTypes: ["desayuno", "snack"] },
  { id: "manzana", name: "Manzana", category: "fruit", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: "unidad (180g)", mealTypes: ["snack"] },
  { id: "arandanos", name: "Arandanos", category: "fruit", calories: 57, protein: 0.7, carbs: 14, fat: 0.3, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "frutilla", name: "Frutillas/Fresas", category: "fruit", calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "naranja", name: "Naranja", category: "fruit", calories: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: "unidad (130g)", mealTypes: ["snack"] },
  { id: "mandarina", name: "Mandarina", category: "fruit", calories: 53, protein: 0.8, carbs: 13, fat: 0.3, unit: "unidad (90g)", mealTypes: ["snack"] },
  { id: "pera", name: "Pera", category: "fruit", calories: 57, protein: 0.4, carbs: 15, fat: 0.1, unit: "unidad (180g)", mealTypes: ["snack"] },
  { id: "durazno", name: "Durazno", category: "fruit", calories: 39, protein: 0.9, carbs: 10, fat: 0.3, unit: "unidad (150g)", mealTypes: ["snack"] },
  { id: "sandia", name: "Sandia", category: "fruit", calories: 30, protein: 0.6, carbs: 8, fat: 0.2, unit: "g", mealTypes: ["snack"] },
  { id: "mango", name: "Mango", category: "fruit", calories: 60, protein: 0.8, carbs: 15, fat: 0.4, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "anana", name: "Anana/Piña", category: "fruit", calories: 50, protein: 0.5, carbs: 13, fat: 0.1, unit: "g", mealTypes: ["desayuno", "snack"] },
  { id: "kiwi", name: "Kiwi", category: "fruit", calories: 61, protein: 1.1, carbs: 15, fat: 0.5, unit: "unidad (75g)", mealTypes: ["desayuno", "snack"] },
  { id: "uvas", name: "Uvas", category: "fruit", calories: 69, protein: 0.7, carbs: 18, fat: 0.2, unit: "g", mealTypes: ["snack"] },
  { id: "ciruela", name: "Ciruela", category: "fruit", calories: 46, protein: 0.7, carbs: 11, fat: 0.3, unit: "unidad (65g)", mealTypes: ["snack"] },

  // === VERDURAS (16) ===
  { id: "brocoli", name: "Brocoli (cocido)", category: "vegetable", calories: 35, protein: 2.4, carbs: 7, fat: 0.4, fiber: 3.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "espinaca", name: "Espinaca (cruda)", category: "vegetable", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, fiber: 2.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "tomate", name: "Tomate", category: "vegetable", calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: "unidad (120g)", mealTypes: ["almuerzo", "cena"] },
  { id: "zapallo", name: "Zapallo (cocido)", category: "vegetable", calories: 26, protein: 1, carbs: 6.5, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "zanahoria", name: "Zanahoria (cocida)", category: "vegetable", calories: 35, protein: 0.8, carbs: 8, fat: 0.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "lechuga", name: "Lechuga", category: "vegetable", calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "pepino", name: "Pepino", category: "vegetable", calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "cebolla", name: "Cebolla", category: "vegetable", calories: 40, protein: 1.1, carbs: 9, fat: 0.1, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "morron", name: "Morron/Pimiento", category: "vegetable", calories: 31, protein: 1, carbs: 6, fat: 0.3, unit: "unidad (120g)", mealTypes: ["almuerzo", "cena"] },
  { id: "coliflor", name: "Coliflor (cocida)", category: "vegetable", calories: 23, protein: 1.8, carbs: 4.1, fat: 0.5, fiber: 2.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "chauchas", name: "Chauchas/Judias verdes (cocidas)", category: "vegetable", calories: 35, protein: 1.8, carbs: 7, fat: 0.4, fiber: 3.4, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "berenjena", name: "Berenjena (cocida)", category: "vegetable", calories: 25, protein: 0.8, carbs: 6, fat: 0.2, fiber: 2.5, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "zucchini", name: "Zucchini/Zapallito (cocido)", category: "vegetable", calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "champinones", name: "Champinones (cocidos)", category: "vegetable", calories: 28, protein: 2.2, carbs: 5, fat: 0.5, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "rucula", name: "Rucula", category: "vegetable", calories: 25, protein: 2.6, carbs: 3.7, fat: 0.7, fiber: 1.6, unit: "g", mealTypes: ["almuerzo", "cena"] },
  { id: "esparragos", name: "Esparragos (cocidos)", category: "vegetable", calories: 22, protein: 2.4, carbs: 4, fat: 0.2, fiber: 2, unit: "g", mealTypes: ["almuerzo", "cena"] },
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

// Find food by display name (fuzzy match for stored plan names)
export function findFoodByName(name: string): FoodItem | undefined {
  const n = name.toLowerCase().trim();
  // Exact match
  const exact = FOOD_DATABASE.find(f => f.name.toLowerCase() === n);
  if (exact) return exact;
  // Match by ID (e.g., "pollo-pechuga")
  const byId = FOOD_DATABASE.find(f => f.id === n || n.includes(f.id));
  if (byId) return byId;
  // Search term contains food base name (e.g., "pechuga de pollo cocida" contains "pechuga de pollo")
  const containsName = FOOD_DATABASE.find(f => {
    const baseName = f.name.toLowerCase().split(" (")[0];
    return n.includes(baseName);
  });
  if (containsName) return containsName;
  // Food base name contains search term (e.g., "Pechuga de pollo" contains "pollo")
  // Only match if search term is 4+ chars to avoid false positives
  if (n.length >= 4) {
    const nameContains = FOOD_DATABASE.find(f => {
      const baseName = f.name.toLowerCase().split(" (")[0];
      return baseName.includes(n);
    });
    if (nameContains) return nameContains;
  }
  // Match common short names
  const aliases: Record<string, string> = {
    "pollo": "pollo-pechuga", "pechuga": "pollo-pechuga", "muslo": "pollo-muslo",
    "carne": "carne-magra", "bife": "carne-magra", "molida": "carne-molida",
    "cerdo": "cerdo-lomo", "lomo": "cerdo-lomo", "pavo": "pavo-pechuga",
    "salmon": "salmon", "atun": "atun", "merluza": "merluza", "tilapia": "tilapia",
    "camarones": "camarones", "sardina": "sardina", "caballa": "caballa",
    "huevo": "huevo-entero", "huevos": "huevo-entero", "clara": "clara-huevo", "claras": "clara-huevo",
    "whey": "whey-protein", "proteina": "whey-protein", "caseina": "caseina",
    "tofu": "tofu", "jamon": "jamon-pavo",
    "arroz": "arroz-blanco", "arroz blanco": "arroz-blanco", "arroz integral": "arroz-integral",
    "avena": "avena", "batata": "boniato", "boniato": "boniato", "papa": "papa",
    "pan": "pan-integral", "pan integral": "pan-integral", "pan blanco": "pan-blanco",
    "fideos": "fideos", "pasta": "fideos", "pasta integral": "fideos-integrales",
    "quinoa": "quinoa", "lentejas": "lentejas", "garbanzos": "garbanzos",
    "porotos": "porotos-negros", "choclo": "choclo", "maiz": "choclo",
    "mandioca": "mandioca", "yuca": "mandioca", "tortilla": "tortilla-trigo", "granola": "granola",
    "aceite": "aceite-oliva", "aceite de coco": "aceite-coco", "coco": "aceite-coco",
    "palta": "palta", "aguacate": "palta",
    "almendras": "almendras", "nueces": "nueces", "castanas": "castanas-caju", "caju": "castanas-caju",
    "pistachos": "pistachos", "mani": "mani", "girasol": "semillas-girasol",
    "chia": "semillas-chia", "lino": "semillas-lino", "linaza": "semillas-lino",
    "yogurt": "yogurt-descremado", "yogur": "yogurt-descremado", "leche": "leche-descremada",
    "cottage": "queso-cottage", "ricota": "queso-ricota", "muzzarella": "queso-muzzarella",
    "queso crema": "queso-untable",
    "banana": "banana", "manzana": "manzana", "naranja": "naranja",
    "mandarina": "mandarina", "pera": "pera", "durazno": "durazno",
    "sandia": "sandia", "mango": "mango", "anana": "anana", "piña": "anana",
    "kiwi": "kiwi", "uvas": "uvas", "ciruela": "ciruela",
    "brocoli": "brocoli", "espinaca": "espinaca", "tomate": "tomate",
    "morron": "morron", "pimiento": "morron", "coliflor": "coliflor",
    "chauchas": "chauchas", "berenjena": "berenjena", "zucchini": "zucchini",
    "zapallito": "zucchini", "champinones": "champinones", "hongos": "champinones",
    "rucula": "rucula", "esparragos": "esparragos",
    "galleta": "galleta-arroz", "galletas": "galleta-arroz",
  };
  for (const [alias, foodId] of Object.entries(aliases)) {
    if (n.includes(alias)) return getFoodById(foodId);
  }
  return undefined;
}

// Map meal names to mealType keys used in food database
function mealNameToType(mealName: string): string {
  const name = mealName.toLowerCase();
  if (name.includes("desayuno")) return "desayuno";
  if (name.includes("almuerzo")) return "almuerzo";
  if (name.includes("cena")) return "cena";
  return "snack";
}

// Get swap alternatives: same category, suitable for the meal type
export function getSwapAlternatives(currentFoodId: string, mealName: string): FoodItem[] {
  const current = getFoodById(currentFoodId);
  if (!current) return FOOD_DATABASE;
  const mealType = mealNameToType(mealName);
  return FOOD_DATABASE.filter(f =>
    f.id !== currentFoodId &&
    f.category === current.category &&
    f.mealTypes.includes(mealType)
  );
}

// Calculate grams of new food to best match the original food's macros.
// Uses a weighted scoring system that considers ALL macros, not just one.
// Weights prioritize the primary macro for the category but still penalize
// big deviations in calories and secondary macros.
export function calculateSwapGrams(
  originalFood: FoodItem,
  originalGrams: number,
  newFood: FoodItem
): number {
  const orig = calculateFoodMacros(originalFood, originalGrams);

  // Determine category-specific weights for scoring
  // [calories, protein, carbs, fat]
  let weights: [number, number, number, number];
  switch (originalFood.category) {
    case "protein":
    case "dairy":
      weights = [0.3, 0.5, 0.05, 0.15]; // protein most important, then cal, then fat
      break;
    case "carb":
    case "fruit":
      weights = [0.3, 0.05, 0.5, 0.15]; // carbs most important, then cal
      break;
    case "fat":
      weights = [0.3, 0.05, 0.15, 0.5]; // fat most important, then cal
      break;
    case "vegetable":
      weights = [0.4, 0.1, 0.4, 0.1]; // cal + carbs
      break;
    default:
      weights = [0.5, 0.2, 0.15, 0.15]; // default: prioritize calories
  }

  // Test grams from 10 to 500 in steps of 5, find the best score
  let bestGrams = originalGrams;
  let bestScore = Infinity;

  for (let g = 10; g <= 500; g += 5) {
    const test = calculateFoodMacros(newFood, g);

    // Calculate weighted error (lower is better)
    const calErr = orig.calories > 0 ? Math.abs(test.calories - orig.calories) / Math.max(orig.calories, 1) : 0;
    const proErr = orig.protein > 0 ? Math.abs(test.protein - orig.protein) / Math.max(orig.protein, 1) : 0;
    const carErr = orig.carbs > 0 ? Math.abs(test.carbs - orig.carbs) / Math.max(orig.carbs, 1) : 0;
    const fatErr = orig.fat > 0 ? Math.abs(test.fat - orig.fat) / Math.max(orig.fat, 1) : 0;

    const score = weights[0] * calErr + weights[1] * proErr + weights[2] * carErr + weights[3] * fatErr;

    if (score < bestScore) {
      bestScore = score;
      bestGrams = g;
    }
  }

  // Cap vegetables at 300g
  if (originalFood.category === "vegetable") {
    bestGrams = Math.min(bestGrams, 300);
  }

  return bestGrams;
}
