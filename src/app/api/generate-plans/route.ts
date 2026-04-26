import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import { generateMealPlan, generateKitesurfMealPlans } from "@/lib/generate-meal-plan";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import { calculateMacrosV2, shouldUseV2Engine } from "@/lib/nutrition-engine";
import { buildNutritionExtras } from "@/lib/persist-nutrition-extras";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal, JobActivity } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { userId, planSlug } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get latest survey for this user (incluye campos v2 + region/budget)
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("target_calories, protein, carbs, fats, objective, nutritional_goal, training_days, wake_hour, sleep_hour, emphasis, dietary_restrictions, weight, height, age, sex, activity_level, kitesurf_level, body_fat_pct, job_activity, intolerances, disliked_foods, meals_per_day, country, city, food_budget_monthly")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (surveyError || !survey) {
      return NextResponse.json({ error: "Encuesta no encontrada para este usuario" }, { status: 404 });
    }

    // Determine objective: use planSlug if provided, otherwise survey objective
    // Direct clients get maintenance plan (0% adjustment) - admin can customize before approving
    const objective = (planSlug && planSlug !== "direct-client")
      ? planSlug
      : (survey.objective && survey.objective !== "direct-client")
        ? survey.objective
        : "direct-client";

    const trainingDays = survey.training_days || 5;
    const wakeHour = survey.wake_hour || 7;
    const sleepHour = survey.sleep_hour || 23;

    // Generate plans using existing functions
    const emphasis = survey.emphasis || "ninguno";
    const dietaryRestrictions: string[] = survey.dietary_restrictions || [];
    const userWeight = survey.weight || 70;
    const userSex = (survey.sex || "hombre") as Sex;
    const activityLevel = (survey.activity_level || "moderado") as ActivityLevel;
    const nutritionalGoal = survey.nutritional_goal as NutritionalGoal | null;

    // Si la encuesta tiene datos extra (% graso o trabajo), usar motor v2.
    // Si no, mantener calculo viejo persistido o recalcular con harris-benedict
    // cuando el plan necesita un goal del cliente.
    let { target_calories, protein, carbs, fats } = survey;
    const useV2 = shouldUseV2Engine({
      body_fat_pct: survey.body_fat_pct,
      job_activity: survey.job_activity,
    });

    if (useV2) {
      const recalc = calculateMacrosV2({
        sex: userSex,
        weight: userWeight,
        height: survey.height || 170,
        age: survey.age || 25,
        activityLevel,
        objective: objective as PlanSlug,
        bodyFatPct: survey.body_fat_pct ?? undefined,
        jobActivity: (survey.job_activity as JobActivity | null) ?? undefined,
        nutritionalGoal: nutritionalGoal ?? undefined,
      });
      target_calories = recalc.targetCalories;
      protein = recalc.protein;
      carbs = recalc.carbs;
      fats = recalc.fats;
    } else if (nutritionalGoal && PLANS_NEEDING_GOAL.includes(objective as PlanSlug)) {
      const recalc = calculateMacros(
        userSex,
        userWeight,
        survey.height || 170,
        survey.age || 25,
        activityLevel,
        objective as PlanSlug,
        nutritionalGoal
      );
      target_calories = recalc.targetCalories;
      protein = recalc.protein;
      carbs = recalc.carbs;
      fats = recalc.fats;
    }

    const training = generateTrainingPlan(trainingDays, objective, emphasis, userWeight, userSex, activityLevel);

    const isKitesurf = objective === "kitesurf";
    const nutrition = isKitesurf
      ? generateKitesurfMealPlans(target_calories, protein, carbs, fats, wakeHour, sleepHour, dietaryRestrictions, nutritionalGoal || "")
      : generateMealPlan(target_calories, protein, carbs, fats, wakeHour, sleepHour, dietaryRestrictions, objective, nutritionalGoal || "");

    // Direct clients require admin approval before client sees the plan
    // All other QR plans (free access with specific plan_slug) auto-approve
    const needsApproval = objective === "direct-client";

    // Check if plans already exist (don't overwrite admin-edited plans on retry)
    const { data: existingTP } = await supabase.from("training_plans")
      .select("id").eq("user_id", userId).limit(1).maybeSingle();
    const { data: existingNP } = await supabase.from("nutrition_plans")
      .select("id").eq("user_id", userId).limit(1).maybeSingle();

    if (existingTP) {
      // Update existing training plan
      const { error: tpError } = await supabase.from("training_plans")
        .update({ data: { days: training }, plan_approved: !needsApproval })
        .eq("id", existingTP.id);
      if (tpError) {
        return NextResponse.json({ error: `Error guardando entrenamiento: ${tpError.message}` }, { status: 500 });
      }
    } else {
      const { error: tpError } = await supabase.from("training_plans").insert({
        user_id: userId,
        week_number: 1,
        data: { days: training },
        plan_approved: !needsApproval,
      });
      if (tpError) {
        return NextResponse.json({ error: `Error guardando entrenamiento: ${tpError.message}` }, { status: 500 });
      }
    }

    // Build nutrition data for storage
    type SingleNutrition = { meals: import("@/lib/generate-meal-plan").MealPlanMeal[]; importantNotes: string[] };
    type DualNutrition = { gymDay: SingleNutrition; kitesurfDay: SingleNutrition };
    const nutritionData: Record<string, unknown> = isKitesurf
      ? { gymDay: (nutrition as DualNutrition).gymDay, kitesurfDay: (nutrition as DualNutrition).kitesurfDay }
      : { meals: (nutrition as SingleNutrition).meals };
    const nutritionNotes = isKitesurf
      ? [...(nutrition as DualNutrition).kitesurfDay.importantNotes]
      : (nutrition as SingleNutrition).importantNotes;

    // F2: enriquecer con shopping list + budget. Para kitesurf usamos el menu
    // del dia de gym como base (asumiendo que la lista cubre los 2 tipos de dia).
    try {
      const baseMeals = isKitesurf
        ? (nutrition as DualNutrition).gymDay.meals
        : (nutrition as SingleNutrition).meals;
      const extras = await buildNutritionExtras(supabase, {
        meals: baseMeals,
        country: survey.country,
        city: survey.city,
        userBudgetMonthly: survey.food_budget_monthly,
      });
      if (extras.shoppingList) nutritionData.shoppingList = extras.shoppingList;
      if (extras.budget) nutritionData.budget = extras.budget;
    } catch (e) {
      // Si falla, no bloqueamos la generacion del plan — solo no enriquecemos
      console.error("[generate-plans] buildNutritionExtras failed:", e);
    }

    if (existingNP) {
      // Update existing nutrition plan
      const { error: npError } = await supabase.from("nutrition_plans")
        .update({ data: nutritionData, important_notes: nutritionNotes, plan_approved: !needsApproval })
        .eq("id", existingNP.id);
      if (npError) {
        return NextResponse.json({ error: `Error guardando nutricion: ${npError.message}` }, { status: 500 });
      }
    } else {
      const { error: npError } = await supabase.from("nutrition_plans").insert({
        user_id: userId,
        data: nutritionData,
        important_notes: nutritionNotes,
        plan_approved: !needsApproval,
      });
      if (npError) {
        return NextResponse.json({ error: `Error guardando nutricion: ${npError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      training: { days: training.length },
      nutrition: { meals: isKitesurf ? "dual" : (nutrition as { meals: unknown[] }).meals.length },
    });
  } catch {
    return NextResponse.json({ error: "Error al generar planes" }, { status: 500 });
  }
}
