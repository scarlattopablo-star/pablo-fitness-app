import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getFoodById,
  findFoodByName,
  calculateSwapGrams,
  calculateFoodMacros,
} from "@/lib/food-database";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { mealIndex, foodIndex, newFoodId } = await request.json();

  if (mealIndex == null || foodIndex == null || !newFoodId) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get user from token
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  // Get user's nutrition plan
  const { data: plan, error: planError } = await adminClient
    .from("nutrition_plans")
    .select("id, data, original_data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (planError || !plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 });
  }

  const meals = plan.data?.meals;
  if (!meals || !meals[mealIndex]) {
    return NextResponse.json({ error: "Comida no encontrada" }, { status: 400 });
  }

  const meal = meals[mealIndex];
  if (!meal.foodDetails || !meal.foodDetails[foodIndex]) {
    return NextResponse.json({ error: "Alimento no encontrado" }, { status: 400 });
  }

  const originalFoodDetail = meal.foodDetails[foodIndex];
  const newFood = getFoodById(newFoodId);
  if (!newFood) {
    return NextResponse.json({ error: "Alimento nuevo no existe en la base de datos" }, { status: 400 });
  }

  // Find the original food in FOOD_DATABASE to determine its category
  const originalFood = findFoodByName(originalFoodDetail.name);
  if (!originalFood) {
    return NextResponse.json({ error: "No se pudo identificar el alimento original" }, { status: 400 });
  }

  // Calculate new grams and macros
  const newGrams = calculateSwapGrams(originalFood, originalFoodDetail.grams, newFood);
  const newMacros = calculateFoodMacros(newFood, newGrams);

  // Save original_data on first swap
  const updateFields: Record<string, unknown> = {};
  if (!plan.original_data) {
    updateFields.original_data = plan.data;
  }

  // Replace food in meal
  meal.foodDetails[foodIndex] = {
    name: newFood.name,
    grams: newGrams,
    unit: newFood.unit,
    calories: newMacros.calories,
    protein: newMacros.protein,
    carbs: newMacros.carbs,
    fat: newMacros.fat,
  };

  // Update foods display string
  if (meal.foods && meal.foods[foodIndex] !== undefined) {
    meal.foods[foodIndex] = `${newGrams}g ${newFood.name}`;
  }

  // Recalculate meal totals
  meal.approxCalories = Math.round(
    meal.foodDetails.reduce((sum: number, f: { calories: number }) => sum + f.calories, 0)
  );
  meal.approxProtein = Math.round(
    meal.foodDetails.reduce((sum: number, f: { protein: number }) => sum + f.protein, 0) * 10
  ) / 10;
  meal.approxCarbs = Math.round(
    meal.foodDetails.reduce((sum: number, f: { carbs: number }) => sum + f.carbs, 0) * 10
  ) / 10;
  meal.approxFats = Math.round(
    meal.foodDetails.reduce((sum: number, f: { fat: number }) => sum + f.fat, 0) * 10
  ) / 10;

  // Save updated plan
  meals[mealIndex] = meal;
  updateFields.data = { ...plan.data, meals };

  const { error: updateError } = await adminClient
    .from("nutrition_plans")
    .update(updateFields)
    .eq("id", plan.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, meal });
}
