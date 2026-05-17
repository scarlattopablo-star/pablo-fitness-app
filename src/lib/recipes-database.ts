// Recipes database - linked to meal types for the nutrition plan
// Tags: "vegano", "vegetariano", "sin-gluten", "sin-lactosa", "sin-frutos-secos"
// Macros calculados contra USDA FoodData Central (valores por porcion)

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
  tags: string[]; // restricciones dieteticas compatibles
}

export const RECIPES: Recipe[] = [
  // ============================================================
  // DESAYUNOS
  // ============================================================
  {
    id: "avena-proteica",
    name: "Avena Proteica con Banana",
    mealType: "desayuno",
    prepTime: 5,
    difficulty: "facil",
    servings: 1,
    calories: 500,
    protein: 40,
    carbs: 70,
    fat: 8,
    tags: ["vegetariano"],
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
    calories: 460,
    protein: 28,
    carbs: 30,
    fat: 26,
    tags: ["vegetariano"],
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
    calories: 360,
    protein: 32,
    carbs: 46,
    fat: 5,
    tags: ["vegetariano"],
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
    calories: 380,
    protein: 22,
    carbs: 45,
    fat: 12,
    tags: ["vegetariano"],
    ingredients: [
      "200g yogurt griego natural",
      "40g granola sin azucar",
      "100g frutas de estacion (frutillas, banana, arándanos)",
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
    tags: ["vegetariano"],
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
  // Desayuno vegano
  {
    id: "tostadas-palta-semillas",
    name: "Tostadas de Palta con Semillas",
    mealType: "desayuno",
    prepTime: 5,
    difficulty: "facil",
    servings: 1,
    calories: 380,
    protein: 10,
    carbs: 38,
    fat: 22,
    tags: ["vegano", "vegetariano", "sin-lactosa"],
    ingredients: [
      "2 rebanadas pan integral",
      "1 palta mediana",
      "1 cucharada semillas de chia",
      "1 cucharada semillas de girasol",
      "Jugo de limon, sal, pimienta, ajo en polvo",
    ],
    steps: [
      "Tosta el pan.",
      "Aplasta la palta con sal, pimienta, ajo y limon.",
      "Untar sobre las tostadas.",
      "Espolvorear chia y semillas de girasol arriba.",
    ],
  },
  {
    id: "avena-leche-vegetal-frutas",
    name: "Avena con Leche Vegetal y Frutas",
    mealType: "desayuno",
    prepTime: 5,
    difficulty: "facil",
    servings: 1,
    calories: 360,
    protein: 12,
    carbs: 62,
    fat: 8,
    tags: ["vegano", "vegetariano", "sin-lactosa"],
    ingredients: [
      "60g avena en copos",
      "250ml leche de avena o almendra",
      "1 banana o 100g frutas de estacion",
      "1 cucharada mantequilla de almendras",
      "Canela al gusto",
    ],
    steps: [
      "Calienta la leche vegetal a fuego medio.",
      "Agrega la avena y cocina 3-4 minutos revolviendo.",
      "Retira del fuego y agrega la mantequilla de almendras.",
      "Sirve con la fruta cortada por encima y canela.",
    ],
  },
  {
    id: "bowl-frutas-semillas",
    name: "Bowl de Frutas con Semillas y Granola",
    mealType: "desayuno",
    prepTime: 3,
    difficulty: "facil",
    servings: 1,
    calories: 320,
    protein: 8,
    carbs: 55,
    fat: 10,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "1 banana en rodajas",
      "100g frutillas o arandanos",
      "1 kiwi",
      "30g granola sin gluten",
      "1 cucharada semillas de chia",
      "1 cucharada semillas de girasol",
    ],
    steps: [
      "Corta toda la fruta y distribui en un bowl.",
      "Agrega la granola sin gluten por encima.",
      "Espolvorea las semillas.",
      "Opcional: un chorro de limon para resaltar el sabor.",
    ],
  },
  {
    id: "tofu-scramble",
    name: "Tofu Scramble (Revuelto Vegano)",
    mealType: "desayuno",
    prepTime: 10,
    difficulty: "facil",
    servings: 1,
    calories: 280,
    protein: 20,
    carbs: 12,
    fat: 18,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "200g tofu firme",
      "1/2 morron picado",
      "1/2 cebolla picada",
      "1 taza espinaca",
      "1 cucharada aceite de oliva",
      "Curcuma, sal, pimienta negra, ajo en polvo",
    ],
    steps: [
      "Escurre y desmenuzar el tofu con un tenedor.",
      "Saltea la cebolla y el morron con aceite 3 minutos.",
      "Agrega el tofu desmenuzado y condimenta con curcuma, sal, pimienta y ajo.",
      "Cocina 4-5 minutos revolviendo hasta que tome color dorado.",
      "Agrega la espinaca el ultimo minuto y revuelve.",
    ],
  },

  // ============================================================
  // ALMUERZOS
  // ============================================================
  {
    id: "pollo-arroz-verduras",
    name: "Pollo Grillado con Arroz Integral y Verduras",
    mealType: "almuerzo",
    prepTime: 25,
    difficulty: "facil",
    servings: 1,
    calories: 530,
    protein: 46,
    carbs: 48,
    fat: 13,
    tags: ["sin-lactosa", "sin-gluten"],
    ingredients: [
      "150g pechuga de pollo",
      "200g arroz integral cocido",
      "1 taza brocoli",
      "1/2 zucchini",
      "1 cucharada aceite de oliva",
      "Sal, pimienta, ajo, oregano",
    ],
    steps: [
      "Cocina el arroz integral segun instrucciones del paquete.",
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
    calories: 530,
    protein: 40,
    carbs: 48,
    fat: 18,
    tags: ["sin-lactosa", "sin-gluten"],
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
    id: "salmon-quinoa",
    name: "Salmon con Quinoa y Esparragos",
    mealType: "almuerzo",
    prepTime: 20,
    difficulty: "medio",
    servings: 1,
    calories: 560,
    protein: 44,
    carbs: 38,
    fat: 22,
    tags: ["sin-lactosa", "sin-gluten"],
    ingredients: [
      "150g filete de salmon",
      "150g quinoa cocida",
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
    calories: 400,
    protein: 38,
    carbs: 18,
    fat: 20,
    tags: ["sin-lactosa", "sin-gluten"],
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
  // Almuerzo vegano
  {
    id: "bowl-tofu-quinoa",
    name: "Bowl de Tofu con Quinoa y Brocoli",
    mealType: "almuerzo",
    prepTime: 20,
    difficulty: "facil",
    servings: 1,
    calories: 420,
    protein: 28,
    carbs: 42,
    fat: 16,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "200g tofu firme",
      "150g quinoa cocida",
      "1 taza brocoli",
      "1 cucharada salsa de soja (tamari sin gluten)",
      "1 cucharada aceite de sesamo",
      "Ajo, jengibre, sesamo tostado",
    ],
    steps: [
      "Cocina la quinoa segun instrucciones.",
      "Corta el tofu en cubos y marinalos en soja, ajo y jengibre 10 min.",
      "Cocina el tofu en sarten con aceite hasta dorar todos los lados (8-10 min).",
      "Cocina el brocoli al vapor o en sarten 4 minutos.",
      "Arma el bowl: quinoa + brocoli + tofu. Agrega sesamo tostado.",
    ],
  },
  {
    id: "lentejas-arroz",
    name: "Lentejas con Arroz y Verduras Salteadas",
    mealType: "almuerzo",
    prepTime: 25,
    difficulty: "facil",
    servings: 1,
    calories: 460,
    protein: 22,
    carbs: 72,
    fat: 8,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "150g lentejas cocidas",
      "150g arroz integral cocido",
      "1/2 morron",
      "1/2 cebolla",
      "1 zanahoria",
      "1 cucharada aceite de oliva",
      "Sal, comino, curcuma, ajo",
    ],
    steps: [
      "Cocina las lentejas y el arroz por separado.",
      "Pica el morron, cebolla y zanahoria en cubos chicos.",
      "Saltea las verduras con aceite y ajo 5 minutos.",
      "Agrega comino y curcuma, mezcla bien.",
      "Sirve el arroz con lentejas y verduras encima.",
    ],
  },
  {
    id: "garbanzos-batata-espinaca",
    name: "Garbanzos con Batata y Espinaca",
    mealType: "almuerzo",
    prepTime: 20,
    difficulty: "facil",
    servings: 1,
    calories: 440,
    protein: 18,
    carbs: 65,
    fat: 12,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "150g garbanzos cocidos",
      "200g batata asada en cubos",
      "2 tazas espinaca",
      "1/4 cebolla morada",
      "1 cucharada aceite de oliva",
      "Pimenton ahumado, sal, pimienta, ajo",
    ],
    steps: [
      "Hornea la batata en cubos con aceite y sal a 200°C, 20 min.",
      "Salta los garbanzos con pimenton y ajo 3 minutos.",
      "Agrega la espinaca y cocina hasta que marchite.",
      "Mezcla todo con la batata asada.",
      "Agrega cebolla morada cruda por encima.",
    ],
  },

  // ============================================================
  // CENAS
  // ============================================================
  {
    id: "tortilla-espinaca",
    name: "Tortilla de Espinaca y Queso",
    mealType: "cena",
    prepTime: 12,
    difficulty: "facil",
    servings: 1,
    calories: 390,
    protein: 30,
    carbs: 8,
    fat: 28,
    tags: ["vegetariano", "sin-gluten"],
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
    tags: ["sin-lactosa"],
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
    calories: 360,
    protein: 35,
    carbs: 32,
    fat: 10,
    tags: ["sin-lactosa", "sin-gluten"],
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
    calories: 440,
    protein: 40,
    carbs: 32,
    fat: 15,
    tags: ["sin-lactosa", "sin-gluten"],
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
  // Cena vegana
  {
    id: "curry-garbanzos",
    name: "Curry de Garbanzos y Espinaca",
    mealType: "cena",
    prepTime: 20,
    difficulty: "facil",
    servings: 1,
    calories: 420,
    protein: 18,
    carbs: 52,
    fat: 14,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "150g garbanzos cocidos",
      "2 tazas espinaca",
      "1 lata tomates triturados (200g)",
      "1/2 cebolla",
      "2 dientes ajo",
      "1 cucharada aceite de oliva",
      "Curry en polvo, curcuma, comino, sal, pimienta",
    ],
    steps: [
      "Saltea la cebolla y ajo con aceite 3 minutos.",
      "Agrega las especias (curry, curcuma, comino) y tuesta 1 minuto.",
      "Agrega los tomates triturados y cocina 5 minutos.",
      "Agrega los garbanzos y cocina 8 minutos mas.",
      "Agrega la espinaca el ultimo minuto y mezcla. Servir con arroz si queres.",
    ],
  },
  {
    id: "tofu-verduras-batata",
    name: "Tofu al Ajillo con Verduras y Batata",
    mealType: "cena",
    prepTime: 20,
    difficulty: "facil",
    servings: 1,
    calories: 380,
    protein: 22,
    carbs: 36,
    fat: 16,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "200g tofu firme",
      "150g batata",
      "1 taza brocoli",
      "1/2 morron",
      "3 dientes ajo",
      "1 cucharada aceite de oliva",
      "Sal, pimenton, oregano",
    ],
    steps: [
      "Corta la batata en cubos y hervirla 10 minutos.",
      "Corta el tofu en cubos y dorarlo en sarten con aceite y ajo 8 minutos.",
      "Saltea el brocoli y morron por separado 4 minutos.",
      "Mezcla todo en la sarten, agrega pimenton y oregano.",
      "Cocina 2 minutos mas y servir.",
    ],
  },
  {
    id: "ensalada-lentejas-verduras",
    name: "Ensalada Fria de Lentejas y Verduras",
    mealType: "cena",
    prepTime: 10,
    difficulty: "facil",
    servings: 1,
    calories: 360,
    protein: 18,
    carbs: 48,
    fat: 10,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "150g lentejas cocidas (frias)",
      "1 tomate",
      "1/2 pepino",
      "1/4 cebolla morada",
      "Perejil fresco",
      "1 cucharada aceite de oliva",
      "Jugo de limon, sal, pimienta",
    ],
    steps: [
      "Cocina las lentejas con anticipacion y enfria.",
      "Corta el tomate, pepino y cebolla en cubos chicos.",
      "Mezcla todo con las lentejas.",
      "Agrega perejil picado, aceite y jugo de limon.",
      "Condimenta con sal y pimienta. Servir frio.",
    ],
  },

  // ============================================================
  // SNACKS
  // ============================================================
  {
    id: "batido-post-entreno",
    name: "Batido Post-Entrenamiento",
    mealType: "snack",
    prepTime: 3,
    difficulty: "facil",
    servings: 1,
    calories: 300,
    protein: 30,
    carbs: 36,
    fat: 4,
    tags: ["vegetariano"],
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
    tags: ["vegano", "vegetariano", "sin-lactosa"],
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
    calories: 240,
    protein: 14,
    carbs: 22,
    fat: 10,
    tags: ["vegetariano"],
    ingredients: [
      "150g yogurt griego",
      "100g frutas de estacion (frutillas, arándanos, kiwi)",
      "15g nueces o almendras",
    ],
    steps: [
      "Sirve el yogurt en un bowl.",
      "Corta la fruta y agregala.",
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
    tags: ["vegetariano", "sin-gluten", "sin-lactosa"],
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
  // Snacks veganos y sin-gluten
  {
    id: "fruta-mantequilla-almendras",
    name: "Manzana con Mantequilla de Almendras",
    mealType: "snack",
    prepTime: 2,
    difficulty: "facil",
    servings: 1,
    calories: 200,
    protein: 5,
    carbs: 22,
    fat: 12,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "1 manzana grande",
      "1 cucharada mantequilla de almendras",
    ],
    steps: [
      "Corta la manzana en gajos.",
      "Sirve con la mantequilla de almendras al lado para mojar.",
    ],
  },
  {
    id: "mix-frutas-semillas",
    name: "Mix de Frutas con Semillas",
    mealType: "snack",
    prepTime: 3,
    difficulty: "facil",
    servings: 1,
    calories: 180,
    protein: 4,
    carbs: 32,
    fat: 6,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "1 banana",
      "100g frutillas o arandanos",
      "1 cucharada semillas de chia",
      "1 cucharada semillas de girasol",
      "Jugo de limon (opcional)",
    ],
    steps: [
      "Corta la banana en rodajas y ponela en un bowl.",
      "Agrega las frutillas o arandanos.",
      "Espolvorea chia y semillas de girasol.",
      "Agrega un chorro de limon si queres.",
    ],
  },
  {
    id: "galletas-arroz-palta",
    name: "Galletas de Arroz con Palta",
    mealType: "snack",
    prepTime: 3,
    difficulty: "facil",
    servings: 1,
    calories: 190,
    protein: 3,
    carbs: 22,
    fat: 11,
    tags: ["vegano", "vegetariano", "sin-lactosa", "sin-gluten"],
    ingredients: [
      "3 galletas de arroz",
      "1/2 palta mediana",
      "Sal, pimienta, limon",
    ],
    steps: [
      "Aplasta la palta con sal, pimienta y limon.",
      "Unta cada galleta con la palta.",
    ],
  },
  {
    id: "cottage-frutas",
    name: "Queso Cottage con Frutas",
    mealType: "snack",
    prepTime: 2,
    difficulty: "facil",
    servings: 1,
    calories: 220,
    protein: 18,
    carbs: 20,
    fat: 5,
    tags: ["vegetariano", "sin-gluten"],
    ingredients: [
      "150g queso cottage",
      "100g frutas de estacion (naranja, durazno, pera)",
      "1 cucharadita miel (opcional)",
    ],
    steps: [
      "Sirve el cottage en un bowl.",
      "Corta la fruta y ponela encima.",
      "Agrega miel si queres.",
    ],
  },
];

// ============================================================
// Helpers
// ============================================================

export function getRecipesByType(mealType: Recipe["mealType"]): Recipe[] {
  return RECIPES.filter(r => r.mealType === mealType);
}

export function getRecipeById(id: string): Recipe | undefined {
  return RECIPES.find(r => r.id === id);
}

// Filtra recetas que sean compatibles con las restricciones dieteticas del cliente
export function filterRecipesByRestrictions(recipes: Recipe[], restrictions: string[]): Recipe[] {
  if (!restrictions.length) return recipes;
  const r = restrictions.map(s => s.toLowerCase());
  const isVegan = r.some(s => s.includes("vegano"));
  const isVegetarian = r.some(s => s.includes("vegetariano"));
  const isGlutenFree = r.some(s => s.includes("gluten") || s.includes("celiaco") || s.includes("celíaco"));
  const isLactoseFree = r.some(s => s.includes("lactosa"));

  return recipes.filter(recipe => {
    const tags = recipe.tags;
    if (isVegan && !tags.includes("vegano")) return false;
    if (isVegetarian && !isVegan && !tags.includes("vegetariano") && !tags.includes("vegano")) return false;
    if (isGlutenFree && !tags.includes("sin-gluten")) return false;
    if (isLactoseFree && !tags.includes("sin-lactosa")) return false;
    return true;
  });
}

// Match keywords from foods to find the best recipe
const FOOD_KEYWORDS: Record<string, string[]> = {
  "avena-proteica": ["avena", "proteina", "whey"],
  "huevos-revueltos-tostada": ["huevo", "tostada", "pan integral"],
  "smoothie-proteico": ["smoothie", "batido", "licuado", "frutilla"],
  "yogurt-granola": ["yogurt", "granola"],
  "tostadas-huevo-espinaca": ["espinaca", "huevo", "tostada"],
  "tostadas-palta-semillas": ["palta", "aguacate", "chia", "tostada"],
  "avena-leche-vegetal-frutas": ["avena", "leche vegetal", "almendra"],
  "bowl-frutas-semillas": ["arandano", "frutilla", "kiwi", "granola"],
  "tofu-scramble": ["tofu", "scramble", "revuelto", "espinaca"],
  "pollo-arroz-verduras": ["pollo", "arroz", "brocoli"],
  "carne-batata-ensalada": ["carne", "batata", "boniato", "ensalada"],
  "salmon-quinoa": ["salmon", "quinoa", "esparrago"],
  "ensalada-atun": ["atun", "ensalada"],
  "bowl-tofu-quinoa": ["tofu", "quinoa", "brocoli"],
  "lentejas-arroz": ["lentejas", "arroz", "zanahoria"],
  "garbanzos-batata-espinaca": ["garbanzo", "batata", "boniato", "espinaca"],
  "tortilla-espinaca": ["tortilla", "espinaca", "queso"],
  "pollo-wok": ["wok", "pollo", "morron", "pimiento"],
  "merluza-pure": ["merluza", "pescado", "calabaza"],
  "ensalada-tibia-pollo": ["garbanzo", "pollo", "ensalada"],
  "curry-garbanzos": ["garbanzo", "curry", "espinaca", "tomate"],
  "tofu-verduras-batata": ["tofu", "batata", "brocoli", "morron"],
  "ensalada-lentejas-verduras": ["lentejas", "pepino", "tomate", "ensalada"],
  "batido-post-entreno": ["batido", "proteina", "banana", "post"],
  "tostada-mantequilla-mani": ["mani", "tostada", "banana"],
  "yogurt-frutas-nueces": ["yogurt", "nuez", "almendra"],
  "huevos-duros-snack": ["huevo", "zanahoria", "hummus"],
  "fruta-mantequilla-almendras": ["manzana", "almendra", "mantequilla"],
  "mix-frutas-semillas": ["frutilla", "arandano", "banana", "chia"],
  "galletas-arroz-palta": ["galleta", "arroz", "palta"],
  "cottage-frutas": ["cottage", "naranja", "durazno", "pera"],
};

// Suggest a recipe based on meal name, foods AND dietary restrictions
export function suggestRecipe(
  mealName: string,
  foods?: string[],
  restrictions?: string[]
): Recipe | null {
  // Filter recipes by dietary restrictions first
  const pool = restrictions?.length
    ? filterRecipesByRestrictions(RECIPES, restrictions)
    : RECIPES;

  if (pool.length === 0) return null;

  // Try to match by actual food contents
  if (foods && foods.length > 0) {
    const foodText = foods.join(" ").toLowerCase();
    let bestMatch: Recipe | null = null;
    let bestScore = 0;

    for (const recipe of pool) {
      const keywords = FOOD_KEYWORDS[recipe.id] || [];
      let score = 0;
      for (const kw of keywords) {
        if (foodText.includes(kw)) score++;
      }
      for (const ing of recipe.ingredients) {
        const ingLower = ing.toLowerCase();
        for (const food of foods) {
          const foodLower = food.toLowerCase();
          if (
            foodLower.includes(ingLower.split(" ").pop() || "") ||
            ingLower.includes(foodLower.split(" ").pop() || "")
          ) {
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

  // Fallback: match by meal type from allowed pool
  const lower = mealName.toLowerCase();
  const type = lower.includes("desayuno") ? "desayuno"
    : lower.includes("almuerzo") ? "almuerzo"
    : lower.includes("cena") ? "cena"
    : (lower.includes("merienda") || lower.includes("colacion") || lower.includes("comida")) ? "snack"
    : null;

  if (!type) return null;
  const options = pool.filter(r => r.mealType === type);
  if (options.length === 0) return null;

  const dayIdx = Math.floor(Date.now() / 86400000);
  return options[dayIdx % options.length];
}
