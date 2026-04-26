// Nutrition v2 — F2: helper compartido para enriquecer nutrition_plans.data
// con shoppingList + budget al momento de generar/regenerar.
//
// Uso: tanto /api/generate-plans como /api/admin/generate-plans-for-user lo
// llaman despues de construir el mealPlan. Si la encuesta no tiene los datos
// de region/budget, devuelve los extras vacios (no rompe el plan).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { MealPlanMeal } from "./generate-meal-plan";
import { buildShoppingListFromDayPlan } from "./shopping-list";
import { validateBudget } from "./budget-validator";
import { recommendSupplements, type SupplementRecommendation } from "./supplement-advisor";
import type { ShoppingList } from "./shopping-list";
import type { BudgetReport } from "./budget-validator";

export interface NutritionExtras {
  shoppingList: ShoppingList | null;
  budget: BudgetReport | null;
  supplements: SupplementRecommendation[] | null;
}

interface BuildExtrasInput {
  meals: MealPlanMeal[];
  country: string | null | undefined;
  city: string | null | undefined;
  userBudgetMonthly: number | null | undefined;
  // F3: cuantos dias DISTINTOS contiene 'meals'.
  //   - 7 si pasas un solo dia que se repite (legacy/kitesurf: targetDays=7 → multiplier=1)
  //   - 1 si pasas weekMenu aplanado (35 comidas distintas, ya cubren la semana)
  daysInWeek?: number;
  // F2 update: shopping_frequency del cliente (semanal/quincenal/mensual).
  // Determina cuantos dias debe cubrir la lista de compras (7/15/30).
  // Default 7 si no se especifica (compatibilidad).
  shoppingFrequency?: "semanal" | "quincenal" | "mensual" | null;
  // F4: input para el advisor de suplementos. Si no se pasa, no se generan
  // recomendaciones (los planes viejos quedan sin suplementos hasta regenerar).
  supplementInput?: {
    sex: string;
    age: number;
    objective: string;
    nutritionalGoal: string | null;
    activityLevel: string;
    trainingDays: number;
    dietaryRestrictions: string[];
    pathologies: string[];
    intolerances: string[];
    currentSupplements: string[];
    wantsAdvice: boolean;
    proteinTarget: number;
    isDeficit: boolean;
    country?: string | null;
  };
}

export async function buildNutritionExtras(
  supabase: SupabaseClient,
  input: BuildExtrasInput
): Promise<NutritionExtras> {
  // Si no hay pais, no podemos costear nada — devolver shoppingList sin precios.
  const country = input.country || "UY";

  // 1) Cargar catalogo (id+name+category+unit) para resolver foodIds del meal plan
  const { data: catalogData } = await supabase
    .from("food_catalog")
    .select("id, name, category, unit")
    .eq("active", true);

  const catalog = (catalogData ?? []) as Array<{
    id: string; name: string; category: string; unit: string;
  }>;

  if (catalog.length === 0) {
    // No hay catalogo seedeado todavia — degradar elegantemente
    return { shoppingList: null, budget: null, supplements: null };
  }

  // 2) Construir shopping list (offline, sin precios)
  const daysInWeek = input.daysInWeek ?? 7;
  const targetDays = input.shoppingFrequency === "mensual" ? 30
    : input.shoppingFrequency === "quincenal" ? 15
    : 7; // 'semanal' o null/undefined
  const shoppingList = buildShoppingListFromDayPlan(input.meals, catalog, daysInWeek, {
    targetDays,
  });

  // 3) Validar contra presupuesto + precios de la region
  let budget: BudgetReport | null = null;
  try {
    budget = await validateBudget(supabase, shoppingList, {
      country,
      city: input.city,
      userBudgetMonthly: input.userBudgetMonthly ?? null,
    });
  } catch {
    // Si no hay precios en la region o algo falla, dejar budget nulo y seguir
    budget = null;
  }

  // 4) F4: recomendaciones de suplementos (opcional)
  let supplements: SupplementRecommendation[] | null = null;
  if (input.supplementInput) {
    try {
      supplements = await recommendSupplements(supabase, {
        ...input.supplementInput,
        country: input.supplementInput.country ?? country,
      });
    } catch {
      supplements = null;
    }
  }

  return { shoppingList, budget, supplements };
}
