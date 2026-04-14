// Recipes database - linked to meal types for the nutrition plan

export interface Recipe {
  id: string;
  name: string;
  mealType: "desayuno" | "almuerzo" | "cena" | "snack";
  prepTime: number; // minutes
  difficulty: "facil" | "medio";
  servings: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  steps: string[];
}

export const RECIPES: Recipe[] = [
  // DESAYUNOS
  {
    id: "avena-proteica",
    name: "Avena Proteica con Banana",
    mealType: "desayuno",
    prepTime: 5,
    difficulty: "facil",
    servings: 1,
    calories: 420,
    protein: 35,
    carbs: 52,
    fat: 10,
    ingredients: [
      "60g avena en copos",
      "1 scoop proteina en polvo (vainilla)",
      "1 banana mediana",
      "200ml leche descremada",
      "1 cucharadita canela",
    ],
    steps: [
      "Calienta la leche en una olla a fuego medio.",
      "Agrega la avena y cocina 3-4 minutos revolviendo.",
      "Retira del fuego y mezcla el scoop de proteina.",
      "Corta la banana en rodajas y ponelas arriba.",
      "Espolvorea canela y listo.",
    ],
  },
  {
    id: "huevos-revueltos-tostada",
    name: "Huevos Revueltos con Tostada Integral",
    mealType: "desayuno",
    prepTime: 8,
    difficulty: "facil",
    servings: 1,
    calories: 380,
    protein: 28,
    carbs: 30,
    fat: 16,
    ingredients: [
      "3 huevos",
      "2 rebanadas pan integral",
      "1/2 palta (aguacate)",
      "Sal y pimienta al gusto",
      "Spray de aceite",
    ],
    steps: [
      "Bate los huevos con sal y pimienta.",
      "Cocinalos en sarten con spray de aceite a fuego medio-bajo, revolviendo suave.",
      "Tosta el pan integral.",
      "Aplasta la palta sobre las tostadas.",
      "Sirve los huevos revueltos al lado.",
    ],
  },
  {
    id: "smoothie-proteico",
    name: "Smoothie Proteico de Frutas",
    mealType: "desayuno",
    prepTime: 3,
    difficulty: "facil",
    servings: 1,
    calories: 350,
    protein: 32,
    carbs: 45,
    fat: 5,
    ingredients: [
      "1 scoop proteina en polvo",
      "1 banana congelada",
      "100g frutillas",
      "200ml leche descremada",
      "Hielo al gusto",
    ],
    steps: [
      "Pon todos los ingredientes en la licuadora.",
      "Licua 30-40 segundos hasta que quede cremoso.",
      "Servir inmediatamente.",
    ],
  },
  {
    id: "yogurt-granola",
    name: "Yogurt Griego con Granola y Frutas",
    mealType: "desayuno",
    prepTime: 2,
    difficulty: "facil",
    servings: 1,
    calories: 320,
    protein: 25,
    carbs: 38,
    fat: 8,
    ingredients: [
      "200g yogurt griego natural",
      "40g granola sin azucar",
      "1 banana o 100g frutas de estacion",
      "1 cucharadita miel (opcional)",
    ],
    steps: [
      "Sirve el yogurt en un bowl.",
      "Agrega la granola por encima.",
      "Corta la fruta y ponela arriba.",
      "Agrega miel si queres un toque dulce.",
    ],
  },
  {
    id: "tostadas-huevo-espinaca",
    name: "Tostadas con Huevo y Espinaca",
    mealType: "desayuno",
    prepTime: 10,
    difficulty: "facil",
    servings: 1,
    calories: 360,
    protein: 24,
    carbs: 32,
    fat: 14,
    ingredients: [
      "2 rebanadas pan integral",
      "2 huevos",
      "1 taza espinaca fresca",
      "1 cucharada aceite de oliva",
      "Sal, pimienta, ajo en polvo",
    ],
    steps: [
      "Saltea la espinaca con aceite y ajo 2 minutos.",
      "Cocina los huevos como prefieras (revueltos o al plato).",
      "Tosta el pan.",
      "Arma las tostadas con espinaca y huevo arriba.",
      "Condimenta con sal y pimienta.",
    ],
  },

  // ALMUERZOS
  {
    id: "pollo-arroz-verduras",
    name: "Pollo Grillado con Arroz y Verduras",
    mealType: "almuerzo",
    prepTime: 25,
    difficulty: "facil",
    servings: 1,
    calories: 520,
    protein: 42,
    carbs: 55,
    fat: 12,
    ingredients: [
      "150g pechuga de pollo",
      "100g arroz integral (en crudo)",
      "1 taza brocoli",
      "1/2 zapallo italiano (zucchini)",
      "1 cucharada aceite de oliva",
      "Sal, pimienta, ajo, oregano",
    ],
    steps: [
      "Cocina el arroz integral segun las instrucciones del paquete.",
      "Sazona el pollo con sal, pimienta, ajo y oregano.",
      "Grilla el pollo 5-6 min por lado hasta que este cocido.",
      "Saltea el brocoli y zucchini con aceite 3-4 minutos.",
      "Sirve todo junto en un plato.",
    ],
  },
  {
    id: "carne-batata-ensalada",
    name: "Carne Magra con Batata y Ensalada",
    mealType: "almuerzo",
    prepTime: 30,
    difficulty: "facil",
    servings: 1,
    calories: 550,
    protein: 40,
    carbs: 50,
    fat: 18,
    ingredients: [
      "150g carne magra (lomo o nalga)",
      "200g batata (boniato)",
      "Ensalada: lechuga, tomate, cebolla",
      "1 cucharada aceite de oliva",
      "Limon, sal, pimienta",
    ],
    steps: [
      "Pela y corta la batata en cubos, hervila o horneala 20 min.",
      "Sazona la carne con sal y pimienta.",
      "Cocina la carne a la plancha 4-5 min por lado.",
      "Arma la ensalada con lechuga, tomate y cebolla.",
      "Condimenta con aceite de oliva y limon.",
    ],
  },
  {
    id: "wrap-pollo",
    name: "Wrap de Pollo con Verduras",
    mealType: "almuerzo",
    prepTime: 15,
    difficulty: "facil",
    servings: 1,
    calories: 450,
    protein: 38,
    carbs: 40,
    fat: 14,
    ingredients: [
      "1 tortilla integral grande",
      "120g pollo desmenuzado",
      "1/4 palta",
      "Lechuga, tomate, zanahoria rallada",
      "1 cucharada mostaza o hummus",
    ],
    steps: [
      "Cocina y desmenusa el pollo (o usa sobras).",
      "Unta la tortilla con mostaza o hummus.",
      "Agrega lechuga, tomate, zanahoria y pollo.",
      "Agrega la palta en rodajas.",
      "Enrolla bien apretado y corta por la mitad.",
    ],
  },
  {
    id: "salmon-quinoa",
    name: "Salmon con Quinoa y Espárragos",
    mealType: "almuerzo",
    prepTime: 20,
    difficulty: "medio",
    servings: 1,
    calories: 580,
    protein: 45,
    carbs: 42,
    fat: 22,
    ingredients: [
      "150g filete de salmon",
      "80g quinoa (en crudo)",
      "6-8 esparragos",
      "1 cucharada aceite de oliva",
      "Limon, eneldo, sal, pimienta",
    ],
    steps: [
      "Cocina la quinoa segun instrucciones (15-18 min).",
      "Sazona el salmon con sal, pimienta, eneldo y limon.",
      "Hornea el salmon a 200°C por 12-15 minutos.",
      "Saltea los esparragos con aceite 3-4 minutos.",
      "Sirve el salmon sobre la quinoa con esparragos al lado.",
    ],
  },
  {
    id: "ensalada-atun",
    name: "Ensalada Completa de Atun",
    mealType: "almuerzo",
    prepTime: 10,
    difficulty: "facil",
    servings: 1,
    calories: 420,
    protein: 38,
    carbs: 30,
    fat: 16,
    ingredients: [
      "1 lata atun al natural (150g)",
      "2 huevos duros",
      "Lechuga, tomate cherry, pepino",
      "1/4 palta",
      "Aceite de oliva, limon, sal",
    ],
    steps: [
      "Hierve los huevos 10 minutos, pela y corta en cuartos.",
      "Lava y corta las verduras.",
      "Escurre el atun y desmenuzalo.",
      "Arma la ensalada con todos los ingredientes.",
      "Condimenta con aceite, limon y sal.",
    ],
  },

  // CENAS
  {
    id: "tortilla-espinaca",
    name: "Tortilla de Espinaca y Queso",
    mealType: "cena",
    prepTime: 12,
    difficulty: "facil",
    servings: 1,
    calories: 380,
    protein: 30,
    carbs: 8,
    fat: 26,
    ingredients: [
      "3 huevos",
      "2 tazas espinaca fresca",
      "30g queso bajo en grasa",
      "1/2 cebolla picada",
      "Spray de aceite, sal, pimienta",
    ],
    steps: [
      "Saltea la cebolla y espinaca 2-3 minutos.",
      "Bate los huevos con sal y pimienta.",
      "Vierte los huevos sobre la espinaca en la sarten.",
      "Agrega el queso rallado arriba.",
      "Cocina tapado a fuego bajo 5-6 min hasta que cuaje.",
    ],
  },
  {
    id: "pollo-wok",
    name: "Pollo al Wok con Vegetales",
    mealType: "cena",
    prepTime: 15,
    difficulty: "facil",
    servings: 1,
    calories: 400,
    protein: 38,
    carbs: 25,
    fat: 16,
    ingredients: [
      "150g pechuga de pollo en tiras",
      "1 morron (pimiento)",
      "1 zucchini",
      "1/2 cebolla",
      "Salsa de soja, jengibre, ajo",
      "1 cucharada aceite de oliva",
    ],
    steps: [
      "Corta todas las verduras en tiras finas.",
      "Calienta el aceite en un wok o sarten grande a fuego alto.",
      "Saltea el pollo 3-4 minutos hasta dorar.",
      "Agrega las verduras y saltea 3-4 minutos mas.",
      "Agrega salsa de soja, ajo y jengibre. Mezcla 1 minuto.",
    ],
  },
  {
    id: "merluza-pure",
    name: "Merluza al Horno con Pure de Calabaza",
    mealType: "cena",
    prepTime: 25,
    difficulty: "facil",
    servings: 1,
    calories: 380,
    protein: 35,
    carbs: 35,
    fat: 10,
    ingredients: [
      "150g filete de merluza",
      "250g calabaza",
      "1 cucharada aceite de oliva",
      "Limon, perejil, sal, pimienta",
      "Nuez moscada (opcional)",
    ],
    steps: [
      "Hierve la calabaza pelada y cortada hasta que este blanda (15 min).",
      "Sazona la merluza con limon, sal, pimienta y perejil.",
      "Hornea la merluza a 200°C por 12-15 minutos.",
      "Haz pure de calabaza con un poco de aceite y nuez moscada.",
      "Sirve la merluza sobre el pure.",
    ],
  },
  {
    id: "ensalada-tibia-pollo",
    name: "Ensalada Tibia de Pollo y Garbanzos",
    mealType: "cena",
    prepTime: 15,
    difficulty: "facil",
    servings: 1,
    calories: 450,
    protein: 40,
    carbs: 35,
    fat: 15,
    ingredients: [
      "120g pechuga de pollo",
      "100g garbanzos cocidos",
      "Espinaca, tomate cherry, cebolla morada",
      "1 cucharada aceite de oliva",
      "Vinagre balsamico, sal, pimienta",
    ],
    steps: [
      "Grilla el pollo y cortalo en tiras.",
      "Calienta los garbanzos en sarten 2 minutos.",
      "Arma la ensalada con espinaca, tomates y cebolla.",
      "Agrega el pollo caliente y los garbanzos.",
      "Condimenta con aceite y vinagre balsamico.",
    ],
  },
  {
    id: "omelette-jamon-queso",
    name: "Omelette de Jamon y Queso con Ensalada",
    mealType: "cena",
    prepTime: 10,
    difficulty: "facil",
    servings: 1,
    calories: 360,
    protein: 32,
    carbs: 10,
    fat: 22,
    ingredients: [
      "3 huevos",
      "2 fetas jamon cocido",
      "30g queso magro",
      "Ensalada verde (lechuga, rucula, pepino)",
      "Spray de aceite",
    ],
    steps: [
      "Bate los huevos con sal y pimienta.",
      "Cocinalos en sarten con spray a fuego medio.",
      "Cuando empiece a cuajar, agrega jamon y queso de un lado.",
      "Dobla por la mitad y cocina 1 minuto mas.",
      "Sirve con ensalada verde al lado.",
    ],
  },

  // SNACKS
  {
    id: "batido-post-entreno",
    name: "Batido Post-Entrenamiento",
    mealType: "snack",
    prepTime: 3,
    difficulty: "facil",
    servings: 1,
    calories: 300,
    protein: 30,
    carbs: 35,
    fat: 4,
    ingredients: [
      "1 scoop proteina en polvo",
      "1 banana",
      "200ml agua o leche",
      "1 cucharada avena",
    ],
    steps: [
      "Pon todo en la licuadora.",
      "Licua 20-30 segundos.",
      "Toma dentro de los 30 min post-entreno.",
    ],
  },
  {
    id: "tostada-mantequilla-mani",
    name: "Tostada con Mantequilla de Mani",
    mealType: "snack",
    prepTime: 2,
    difficulty: "facil",
    servings: 1,
    calories: 280,
    protein: 12,
    carbs: 28,
    fat: 14,
    ingredients: [
      "2 rebanadas pan integral",
      "1 cucharada mantequilla de mani natural",
      "1/2 banana en rodajas",
    ],
    steps: [
      "Tosta el pan.",
      "Unta con mantequilla de mani.",
      "Agrega las rodajas de banana arriba.",
    ],
  },
  {
    id: "yogurt-frutas-nueces",
    name: "Yogurt con Frutas y Nueces",
    mealType: "snack",
    prepTime: 2,
    difficulty: "facil",
    servings: 1,
    calories: 250,
    protein: 18,
    carbs: 25,
    fat: 10,
    ingredients: [
      "150g yogurt griego",
      "50g frutas de estacion",
      "15g nueces o almendras",
    ],
    steps: [
      "Sirve el yogurt en un bowl.",
      "Corta la fruta y agrégala.",
      "Agrega las nueces por encima.",
    ],
  },
  {
    id: "huevos-duros-snack",
    name: "Huevos Duros con Palitos de Zanahoria",
    mealType: "snack",
    prepTime: 12,
    difficulty: "facil",
    servings: 1,
    calories: 200,
    protein: 14,
    carbs: 8,
    fat: 12,
    ingredients: [
      "2 huevos",
      "1 zanahoria grande",
      "Sal, pimienta",
      "Hummus (opcional, 2 cucharadas)",
    ],
    steps: [
      "Hierve los huevos 10 minutos en agua.",
      "Enfria con agua fria y pela.",
      "Corta la zanahoria en palitos.",
      "Come los huevos con zanahoria y hummus si queres.",
    ],
  },
];

// Get recipes by meal type
export function getRecipesByType(mealType: Recipe["mealType"]): Recipe[] {
  return RECIPES.filter(r => r.mealType === mealType);
}

// Get a recipe by ID
export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

// Match keywords from foods to find the best recipe
const FOOD_KEYWORDS: Record<string, string[]> = {
  "avena-proteica": ["avena", "proteina", "whey"],
  "huevos-revueltos-tostada": ["huevo", "tostada", "pan integral"],
  "smoothie-proteico": ["smoothie", "batido", "licuado", "frutilla"],
  "yogurt-granola": ["yogurt", "granola"],
  "tostadas-huevo-espinaca": ["espinaca", "huevo", "tostada"],
  "pollo-arroz-verduras": ["pollo", "arroz", "brocoli", "verdura"],
  "carne-batata-ensalada": ["carne", "batata", "boniato", "ensalada"],
  "wrap-pollo": ["wrap", "tortilla", "pollo", "palta"],
  "salmon-quinoa": ["salmon", "quinoa", "esparrago"],
  "ensalada-atun": ["atun", "ensalada", "huevo duro"],
  "tortilla-espinaca": ["tortilla", "espinaca", "queso"],
  "pollo-wok": ["wok", "pollo", "morron", "pimiento", "soja"],
  "merluza-pure": ["merluza", "pescado", "calabaza", "pure"],
  "ensalada-tibia-pollo": ["garbanzo", "pollo", "ensalada tibia"],
  "omelette-jamon-queso": ["omelette", "jamon", "queso"],
  "batido-post-entreno": ["batido", "proteina", "banana", "post"],
  "tostada-mantequilla-mani": ["mantequilla", "mani", "tostada"],
  "yogurt-frutas-nueces": ["yogurt", "nuez", "almendra", "fruta"],
  "huevos-duros-snack": ["huevo duro", "zanahoria", "hummus"],
};

// Suggest a recipe based on meal name AND the actual foods in the meal
export function suggestRecipe(mealName: string, foods?: string[]): Recipe | null {
  // First try to match by actual food contents
  if (foods && foods.length > 0) {
    const foodText = foods.join(" ").toLowerCase();
    let bestMatch: Recipe | null = null;
    let bestScore = 0;

    for (const recipe of RECIPES) {
      const keywords = FOOD_KEYWORDS[recipe.id] || [];
      let score = 0;
      for (const kw of keywords) {
        if (foodText.includes(kw)) score++;
      }
      // Also check recipe ingredients against meal foods
      for (const ing of recipe.ingredients) {
        const ingLower = ing.toLowerCase();
        for (const food of foods) {
          const foodLower = food.toLowerCase();
          if (foodLower.includes(ingLower.split(" ").pop() || "") || ingLower.includes(foodLower.split(" ").pop() || "")) {
            score += 0.5;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = recipe;
      }
    }
    if (bestMatch && bestScore >= 1) return bestMatch;
  }

  // Fallback: match by meal type
  const lower = mealName.toLowerCase();
  const type = lower.includes("desayuno") ? "desayuno"
    : lower.includes("almuerzo") ? "almuerzo"
    : lower.includes("cena") ? "cena"
    : (lower.includes("merienda") || lower.includes("colacion") || lower.includes("comida")) ? "snack"
    : null;

  if (!type) return null;
  const options = getRecipesByType(type);
  if (options.length === 0) return null;

  // Use date-based index so recipe doesn't change every render
  const dayIdx = Math.floor(Date.now() / 86400000);
  return options[dayIdx % options.length];
}
