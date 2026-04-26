// Nutrition v2 — F2: lista de compras
//
// Toma un meal plan (1 dia o array de dias) y lo convierte en lista de compras
// agregada por alimento, con buffers de mermas, agrupado por pasillo.
// Los precios se aplican en budget-validator.ts (queda separado para poder
// generar lista offline y precios en una segunda pasada con DB).

import type { MealPlanMeal } from "./generate-meal-plan";

// Item agregado: cuanto se necesita por semana de cada alimento.
export interface AggregatedFood {
  foodId: string;          // 'pollo-pechuga'
  name: string;             // 'Pechuga de pollo (cocida)'
  category: string;         // 'protein','carb',...
  unit: string;             // 'g' | 'unidad (50g)' | 'scoop (30g)'
  totalGrams: number;       // suma de gramos en la semana
  totalUnits?: number;      // si el alimento se vende por unidad (huevos, panes)
  daysUsed: number[];       // [0,1,2,...] dias de la semana donde aparece
}

// Lista final agrupada por pasillo del super.
export interface ShoppingList {
  byAisle: Record<AisleName, AggregatedFood[]>;
  totalItems: number;
  weekStart: string;        // ISO date
  bufferPct: number;        // 0.10 default
}

export type AisleName =
  | "Carniceria"
  | "Pescaderia"
  | "Lacteos y huevos"
  | "Frutas y verduras"
  | "Almacen seco"
  | "Panaderia"
  | "Suplementacion"
  | "Otros";

// Mapping categoria → pasillo del super (estandar UY).
function categoryToAisle(category: string, foodId: string): AisleName {
  // Suplementos van aparte (whey, caseina, omega-3, etc)
  if (foodId === "whey-protein" || foodId === "caseina") return "Suplementacion";

  // Pescados/mariscos a pescaderia
  const pescados = ["salmon","atun","merluza","tilapia","camarones","sardina","caballa"];
  if (pescados.includes(foodId)) return "Pescaderia";

  // Carnes a carniceria (excepto los procesados que van a fiambres = lacteos area)
  if (category === "protein") {
    if (foodId === "tofu") return "Almacen seco";
    if (foodId === "huevo-entero" || foodId === "clara-huevo") return "Lacteos y huevos";
    if (foodId === "jamon-pavo") return "Lacteos y huevos";
    return "Carniceria";
  }

  if (category === "dairy") return "Lacteos y huevos";
  if (category === "vegetable" || category === "fruit") return "Frutas y verduras";

  if (category === "carb") {
    if (foodId === "pan-integral" || foodId === "pan-blanco" || foodId === "tortilla-trigo") {
      return "Panaderia";
    }
    return "Almacen seco";
  }

  if (category === "fat") return "Almacen seco";

  return "Otros";
}

// Extrae la masa real en gramos de cada item del meal plan.
// MealPlanMeal.foodDetails[i].grams ya viene en gramos cocidos / netos por
// porcion del DIA. Para la lista de compras usamos esos gramos directamente.
function extractFoodFromMeal(meal: MealPlanMeal): Array<{ foodId: string | null; name: string; grams: number; unit: string }> {
  if (!meal.foodDetails || meal.foodDetails.length === 0) return [];
  return meal.foodDetails.map(detail => ({
    // foodDetails no tiene foodId persistido — lo deducimos del name vs catalogo.
    // Para el agregado usamos el name normalizado como id de fallback.
    foodId: null,
    name: detail.name,
    grams: detail.grams,
    unit: detail.unit,
  }));
}

// Resuelve foodId a partir del name del meal usando el catalogo del cliente.
// Recibe el catalogo ya cargado para no hacer queries por cada item.
export function resolveFoodId(
  name: string,
  catalog: Array<{ id: string; name: string }>
): string | null {
  const n = name.toLowerCase().trim();
  // Quitar prefijos como "150g " o "2 "
  const cleanName = n.replace(/^\d+\s*g?\s+/, "");

  // Match por id directo
  const byId = catalog.find(f => f.id === cleanName.replace(/\s+/g, "-"));
  if (byId) return byId.id;

  // Match por nombre exacto
  const exact = catalog.find(f => f.name.toLowerCase() === cleanName);
  if (exact) return exact.id;

  // Match por nombre base (antes del parentesis)
  const partial = catalog.find(f => {
    const base = f.name.toLowerCase().split(" (")[0];
    return cleanName.includes(base) || base.includes(cleanName);
  });
  if (partial) return partial.id;

  return null;
}

// === API publica ===

interface BuildOptions {
  bufferPct?: number;        // mermas/desperdicio. Default 0.10 (10%)
  weekStart?: string;        // ISO. Default = hoy.
}

// Agrega un meal plan de un dia repetido N veces (default 7 = una semana).
// Nota: cuando exista weekMenu real (F3), recibira 7 dias distintos.
export function buildShoppingListFromDayPlan(
  dayMeals: MealPlanMeal[],
  catalog: Array<{ id: string; name: string; category: string; unit: string }>,
  daysInWeek: number = 7,
  options: BuildOptions = {}
): ShoppingList {
  const bufferPct = options.bufferPct ?? 0.10;
  const weekStart = options.weekStart ?? new Date().toISOString().slice(0, 10);

  // 1) Acumular por foodId
  const byFoodId = new Map<string, AggregatedFood>();

  for (const meal of dayMeals) {
    const items = extractFoodFromMeal(meal);
    for (const item of items) {
      const foodId = resolveFoodId(item.name, catalog) || `__unmapped:${item.name}`;
      const catFood = catalog.find(f => f.id === foodId);

      const existing = byFoodId.get(foodId);
      if (existing) {
        existing.totalGrams += item.grams * daysInWeek;
        existing.daysUsed = [...new Set([...existing.daysUsed, ...Array.from({length: daysInWeek}, (_, i) => i)])];
      } else {
        byFoodId.set(foodId, {
          foodId,
          name: catFood?.name ?? item.name,
          category: catFood?.category ?? "snack",
          unit: catFood?.unit ?? item.unit ?? "g",
          totalGrams: item.grams * daysInWeek,
          daysUsed: Array.from({length: daysInWeek}, (_, i) => i),
        });
      }
    }
  }

  // 2) Aplicar buffer + redondeo a presentaciones realistas
  const aggregated = Array.from(byFoodId.values()).map(item => {
    const withBuffer = item.totalGrams * (1 + bufferPct);
    return {
      ...item,
      totalGrams: roundToShoppingPortion(withBuffer, item.category, item.unit),
      totalUnits: deriveUnits(item.unit, withBuffer),
    };
  });

  // 3) Agrupar por pasillo
  const byAisle: Record<AisleName, AggregatedFood[]> = {
    "Carniceria": [],
    "Pescaderia": [],
    "Lacteos y huevos": [],
    "Frutas y verduras": [],
    "Panaderia": [],
    "Almacen seco": [],
    "Suplementacion": [],
    "Otros": [],
  };

  for (const item of aggregated) {
    const aisle = categoryToAisle(item.category, item.foodId);
    byAisle[aisle].push(item);
  }

  // Ordenar items por nombre dentro de cada pasillo
  for (const aisle of Object.keys(byAisle) as AisleName[]) {
    byAisle[aisle].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }

  return {
    byAisle,
    totalItems: aggregated.length,
    weekStart,
    bufferPct,
  };
}

// Redondeo a presentaciones tipicas del super (no comprar 137g de pollo,
// sino 1 paquete de ~150g o medio kilo).
function roundToShoppingPortion(grams: number, category: string, unit: string): number {
  // Si la unidad es por unidad (huevo, banana, kiwi...), no redondear gramos
  if (unit !== "g" && !unit.startsWith("g (")) return Math.round(grams);

  // Carnes/pescados: bandejas de 250/500/750/1000g
  if (category === "protein") {
    if (grams <= 250) return 250;
    if (grams <= 500) return 500;
    if (grams <= 750) return 750;
    if (grams <= 1000) return 1000;
    return Math.ceil(grams / 250) * 250;
  }
  // Granos secos (arroz, fideos, avena, lentejas): paquetes 500g/1kg
  if (category === "carb") {
    if (grams <= 500) return 500;
    return Math.ceil(grams / 500) * 500;
  }
  // Lacteos en pote: 200g/500g/1kg
  if (category === "dairy") {
    if (grams <= 200) return 200;
    if (grams <= 500) return 500;
    if (grams <= 1000) return 1000;
    return Math.ceil(grams / 500) * 500;
  }
  // Frutos secos / semillas: pasos de 100g
  if (category === "fat") {
    return Math.ceil(grams / 100) * 100;
  }
  // Verduras y frutas: pasos de 250g (un atado / cebolla / etc)
  return Math.ceil(grams / 250) * 250;
}

// Si la unidad indica que se vende por unidad (Ej "unidad (50g)"), derivar
// cuantas unidades comprar.
function deriveUnits(unit: string, gramsNeeded: number): number | undefined {
  const match = unit.match(/\((\d+)\s*g(?:\/(\d+)ml)?\)/);
  if (!match) return undefined;
  const gramsPerUnit = Number(match[1]);
  if (gramsPerUnit <= 0) return undefined;
  return Math.ceil(gramsNeeded / gramsPerUnit);
}

// Helper: aplanar la lista en formato de string para portapapeles
// (uso del boton "Copiar lista" en la UI).
export function shoppingListToText(list: ShoppingList, currency?: string): string {
  const lines: string[] = ["Lista de compras semanal — ScarlattoTeam", ""];
  for (const aisle of Object.keys(list.byAisle) as AisleName[]) {
    const items = list.byAisle[aisle];
    if (items.length === 0) continue;
    lines.push(`${aisle.toUpperCase()}`);
    for (const item of items) {
      const qty = item.totalUnits
        ? `${item.totalUnits} ${item.unit.split(" (")[0]}`
        : `${formatGrams(item.totalGrams)}`;
      lines.push(`  - ${item.name}: ${qty}`);
    }
    lines.push("");
  }
  if (currency) {
    lines.push(`Moneda: ${currency}`);
  }
  return lines.join("\n");
}

function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(g % 1000 === 0 ? 0 : 1)} kg`;
  return `${g} g`;
}
