// Nutrition v2 — F2: validador de presupuesto
//
// Toma una shopping list agregada (semanal) y calcula el costo en la moneda
// del cliente, usando food_prices de su region. Si el costo supera el
// presupuesto que el cliente declaro, propone downgrades (premium → economico
// dentro de la misma categoria).
//
// Estrategia de lookup:
//   - Filtrar food_prices por country del cliente
//   - Si hay city match, preferir esos precios
//   - Si no, caer al precio nacional (city='')
//   - Si no hay ninguno para ese food en el pais → marcar como sin-precio
//     (no romper, solo log y excluir del costo)

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShoppingList, AggregatedFood, AisleName } from "./shopping-list";

export interface PricedFood extends AggregatedFood {
  pricePerKg: number | null;
  pricePerUnit: number | null;
  currency: string;
  estimatedCost: number;     // costo de la cantidad necesaria, en currency
  hasPriceData: boolean;     // false si no hay precio para ese food en la region
}

export interface PricedShoppingList {
  byAisle: Record<AisleName, PricedFood[]>;
  totalItems: number;
  weekStart: string;
  bufferPct: number;
  periodDays: number;        // dias que cubre la lista (7/15/30)
  periodLabel: string;       // 'Semanal' | 'Quincenal' | 'Mensual' | ...
  // Totales — calculados a partir del costo de los items que cubren periodDays
  listTotal: number;         // costo total de TODA la lista (cubra los dias que cubra)
  weeklyCost: number;        // listTotal escalado a 7 dias (para comparacion)
  monthlyCost: number;       // listTotal escalado a 30 dias (vs userBudgetMonthly)
  currency: string;
  itemsWithoutPrice: string[];
}

export type BudgetStatus = "ok" | "tight" | "over";

export interface BudgetReport {
  pricedList: PricedShoppingList;
  userBudgetMonthly: number | null;   // declarado por el cliente
  status: BudgetStatus;
  overBy: number;                      // cuanto se pasa (positivo si over)
  marginPct: number;                   // (budget - cost) / budget. Negativo si over.
  suggestedDowngrades: Downgrade[];
}

export interface Downgrade {
  fromFoodId: string;
  fromName: string;
  toFoodId: string;
  toName: string;
  monthlyCostSavings: number;
  currency: string;
  reason: string;
}

interface PriceRow {
  food_id: string;
  country: string;
  city: string;
  price_per_kg: number | null;
  price_per_unit: number | null;
  currency: string;
}

interface CatalogRow {
  id: string;
  name: string;
  category: string;
  tier: string | null;
  unit: string;
}

// === Lookup de precios ===

async function loadPricesForRegion(
  supabase: SupabaseClient,
  country: string,
  city?: string | null
): Promise<Map<string, PriceRow>> {
  const { data, error } = await supabase
    .from("food_prices")
    .select("food_id, country, city, price_per_kg, price_per_unit, currency")
    .eq("country", country);

  if (error || !data) return new Map();

  // Indexar: para cada food_id, preferir precio de city; sino city=''
  const byFood = new Map<string, PriceRow>();
  const cityNorm = (city ?? "").trim().toLowerCase();

  for (const row of data as PriceRow[]) {
    const existing = byFood.get(row.food_id);
    const isCityMatch = cityNorm.length > 0 && row.city.toLowerCase() === cityNorm;
    const isNational = row.city === "";

    if (!existing) {
      byFood.set(row.food_id, row);
      continue;
    }
    // Si encontramos un mejor match (city del cliente) lo reemplazamos
    if (isCityMatch && existing.city !== row.city) {
      byFood.set(row.food_id, row);
    } else if (isNational && existing.city !== "" && !cityNorm) {
      // Sin city del cliente, preferir el nacional
      byFood.set(row.food_id, row);
    }
  }

  return byFood;
}

async function loadCatalog(supabase: SupabaseClient): Promise<Map<string, CatalogRow>> {
  const { data, error } = await supabase
    .from("food_catalog")
    .select("id, name, category, tier, unit")
    .eq("active", true);

  if (error || !data) return new Map();
  const map = new Map<string, CatalogRow>();
  for (const row of data as CatalogRow[]) map.set(row.id, row);
  return map;
}

// === Costeo ===

function priceForItem(item: AggregatedFood, price: PriceRow | undefined): {
  cost: number;
  currency: string;
  hasPriceData: boolean;
} {
  if (!price) return { cost: 0, currency: "UYU", hasPriceData: false };

  // Si compramos por unidad y hay price_per_unit
  if (item.totalUnits && price.price_per_unit) {
    return {
      cost: item.totalUnits * Number(price.price_per_unit),
      currency: price.currency,
      hasPriceData: true,
    };
  }
  // Caso default: gramos × (price_per_kg / 1000)
  if (price.price_per_kg) {
    return {
      cost: (item.totalGrams / 1000) * Number(price.price_per_kg),
      currency: price.currency,
      hasPriceData: true,
    };
  }
  return { cost: 0, currency: price.currency, hasPriceData: false };
}

// === Downgrades ===

// Para cada item en la lista que sea tier 'premium' Y la lista exceda el
// presupuesto, busca un swap dentro de la misma categoria con tier
// 'economico' o 'estandar' y precio menor. Calcula ahorro mensual y devuelve
// los downgrades ordenados por ahorro descendente.
function computeDowngrades(
  pricedList: PricedShoppingList,
  catalog: Map<string, CatalogRow>,
  prices: Map<string, PriceRow>
): Downgrade[] {
  const allPriced: PricedFood[] = [];
  for (const aisle of Object.keys(pricedList.byAisle) as AisleName[]) {
    allPriced.push(...pricedList.byAisle[aisle]);
  }

  const downgrades: Downgrade[] = [];

  for (const item of allPriced) {
    const cat = catalog.get(item.foodId);
    if (!cat || cat.tier !== "premium") continue;
    if (!item.hasPriceData) continue;

    // Buscar swap mas barato dentro de la misma categoria con tier !=premium
    const candidates: Array<{ food: CatalogRow; price: PriceRow }> = [];
    for (const [foodId, food] of catalog.entries()) {
      if (foodId === item.foodId) continue;
      if (food.category !== cat.category) continue;
      if (food.tier === "premium") continue;
      const p = prices.get(foodId);
      if (!p || !p.price_per_kg) continue;
      candidates.push({ food, price: p });
    }
    if (candidates.length === 0) continue;

    // Ordenar por price_per_kg ascendente
    candidates.sort((a, b) =>
      Number(a.price.price_per_kg) - Number(b.price.price_per_kg)
    );
    const best = candidates[0];

    // Costo mensual del item actual y del swap (asumiendo misma cantidad en gramos)
    const monthlyMultiplier = 4.345;
    const currentMonthly = item.estimatedCost * monthlyMultiplier;
    const swapWeeklyCost = (item.totalGrams / 1000) * Number(best.price.price_per_kg);
    const swapMonthly = swapWeeklyCost * monthlyMultiplier;
    const savings = Math.round(currentMonthly - swapMonthly);

    if (savings > 0) {
      downgrades.push({
        fromFoodId: item.foodId,
        fromName: item.name,
        toFoodId: best.food.id,
        toName: best.food.name,
        monthlyCostSavings: savings,
        currency: item.currency,
        reason: `${item.name} es premium; ${best.food.name} cubre la misma categoria a menor costo.`,
      });
    }
  }

  return downgrades.sort((a, b) => b.monthlyCostSavings - a.monthlyCostSavings);
}

// === API publica ===

interface ValidateOptions {
  country: string;
  city?: string | null;
  userBudgetMonthly?: number | null;   // null = no validar limite
  tightThresholdPct?: number;          // 0.10 = "tight" cuando margen <10%
}

export async function priceShoppingList(
  supabase: SupabaseClient,
  list: ShoppingList,
  options: ValidateOptions
): Promise<PricedShoppingList> {
  const [prices, catalog] = await Promise.all([
    loadPricesForRegion(supabase, options.country, options.city),
    loadCatalog(supabase),
  ]);

  const byAisle: Record<AisleName, PricedFood[]> = {
    "Carniceria": [],
    "Pescaderia": [],
    "Lacteos y huevos": [],
    "Frutas y verduras": [],
    "Panaderia": [],
    "Almacen seco": [],
    "Suplementacion": [],
    "Otros": [],
  };

  let listTotal = 0;
  let currency = "UYU";
  const itemsWithoutPrice: string[] = [];

  for (const aisle of Object.keys(list.byAisle) as AisleName[]) {
    for (const item of list.byAisle[aisle]) {
      // Skip items que no resolvieron a un food del catalogo
      if (item.foodId.startsWith("__unmapped:")) {
        itemsWithoutPrice.push(item.name);
        byAisle[aisle].push({
          ...item,
          pricePerKg: null,
          pricePerUnit: null,
          currency,
          estimatedCost: 0,
          hasPriceData: false,
        });
        continue;
      }
      const price = prices.get(item.foodId);
      const { cost, currency: itemCurrency, hasPriceData } = priceForItem(item, price);
      if (!hasPriceData) itemsWithoutPrice.push(item.foodId);
      currency = itemCurrency;
      listTotal += cost;
      byAisle[aisle].push({
        ...item,
        pricePerKg: price?.price_per_kg != null ? Number(price.price_per_kg) : null,
        pricePerUnit: price?.price_per_unit != null ? Number(price.price_per_unit) : null,
        currency: itemCurrency,
        estimatedCost: Math.round(cost),
        hasPriceData,
      });
    }
  }

  // Escalar a semanal/mensual segun el periodo real de la lista
  const periodDays = Math.max(1, list.periodDays);
  const weeklyCost = listTotal * (7 / periodDays);
  const monthlyCost = listTotal * (30 / periodDays);

  return {
    byAisle,
    totalItems: list.totalItems,
    weekStart: list.weekStart,
    bufferPct: list.bufferPct,
    periodDays,
    periodLabel: list.periodLabel,
    listTotal: Math.round(listTotal),
    weeklyCost: Math.round(weeklyCost),
    monthlyCost: Math.round(monthlyCost),
    currency,
    itemsWithoutPrice,
  };
}

export async function validateBudget(
  supabase: SupabaseClient,
  list: ShoppingList,
  options: ValidateOptions
): Promise<BudgetReport> {
  const pricedList = await priceShoppingList(supabase, list, options);
  const tightPct = options.tightThresholdPct ?? 0.10;

  let status: BudgetStatus = "ok";
  let overBy = 0;
  let marginPct = 1;

  if (options.userBudgetMonthly != null && options.userBudgetMonthly > 0) {
    const cost = pricedList.monthlyCost;
    const budget = options.userBudgetMonthly;
    overBy = Math.max(0, cost - budget);
    marginPct = (budget - cost) / budget;
    if (cost > budget) status = "over";
    else if (marginPct < tightPct) status = "tight";
  }

  // Solo computar downgrades si vamos over o tight
  let suggestedDowngrades: Downgrade[] = [];
  if (status !== "ok") {
    const [prices, catalog] = await Promise.all([
      loadPricesForRegion(supabase, options.country, options.city),
      loadCatalog(supabase),
    ]);
    suggestedDowngrades = computeDowngrades(pricedList, catalog, prices);
  }

  return {
    pricedList,
    userBudgetMonthly: options.userBudgetMonthly ?? null,
    status,
    overBy: Math.round(overBy),
    marginPct: Math.round(marginPct * 100) / 100,
    suggestedDowngrades,
  };
}
