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
import type { ShoppingList } from "./shopping-list";
import type { BudgetReport } from "./budget-validator";

export interface NutritionExtras {
  shoppingList: ShoppingList | null;
  budget: BudgetReport | null;
}

interface BuildExtrasInput {
  meals: MealPlanMeal[];
  country: string | null | undefined;
  city: string | null | undefined;
  userBudgetMonthly: number | null | undefined;
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
    return { shoppingList: null, budget: null };
  }

  // 2) Construir shopping list (offline, sin precios)
  const shoppingList = buildShoppingListFromDayPlan(input.meals, catalog, 7);

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

  return { shoppingList, budget };
}
