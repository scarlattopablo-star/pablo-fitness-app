import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import { generateMealPlan } from "@/lib/generate-meal-plan";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal } from "@/types";

// Admin-only endpoint to regenerate all training plans with updated programming
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();
        if (!profile?.is_admin) {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }
      }
    }

    // Get all users who have surveys (meaning they have plan data)
    const { data: surveys, error: surveyError } = await supabase
      .from("surveys")
      .select("user_id, target_calories, protein, carbs, fats, objective, nutritional_goal, training_days, wake_hour, sleep_hour, emphasis, dietary_restrictions, weight, height, age, sex, activity_level")
      .order("created_at", { ascending: false });

    if (surveyError || !surveys) {
      return NextResponse.json({ error: "Error obteniendo encuestas" }, { status: 500 });
    }

    // Get latest survey per user (they're ordered by created_at desc)
    const latestSurveys = new Map<string, typeof surveys[0]>();
    for (const survey of surveys) {
      if (!latestSurveys.has(survey.user_id)) {
        latestSurveys.set(survey.user_id, survey);
      }
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const [userId, survey] of latestSurveys) {
      try {
        const objective = (survey.objective && survey.objective !== "direct-client")
          ? survey.objective
          : "quema-grasa";
        const trainingDays = survey.training_days || 5;
        const emphasis = survey.emphasis || "ninguno";
        const userWeight = survey.weight || 70;
        const dietaryRestrictions: string[] = survey.dietary_restrictions || [];
        const userSex = (survey.sex || "hombre") as Sex;
        const activityLevel = (survey.activity_level || "moderado") as ActivityLevel;
        const nutritionalGoal = survey.nutritional_goal as NutritionalGoal | null;

        // Recalculate macros if nutritional goal exists for plans that need it
        let { target_calories, protein, carbs, fats } = survey;
        if (nutritionalGoal && PLANS_NEEDING_GOAL.includes(objective as PlanSlug)) {
          const recalc = calculateMacros(
            userSex, userWeight, survey.height || 170, survey.age || 25,
            activityLevel, objective as PlanSlug, nutritionalGoal
          );
          target_calories = recalc.targetCalories;
          protein = recalc.protein;
          carbs = recalc.carbs;
          fats = recalc.fats;
        }

        const training = generateTrainingPlan(trainingDays, objective, emphasis, userWeight, userSex, activityLevel);
        const nutrition = generateMealPlan(
          target_calories, protein, carbs, fats,
          survey.wake_hour || 7, survey.sleep_hour || 23,
          dietaryRestrictions
        );

        // Delete old plans
        await supabase.from("training_plans").delete().eq("user_id", userId);
        await supabase.from("nutrition_plans").delete().eq("user_id", userId);

        // Insert new plans
        const { error: tpError } = await supabase.from("training_plans").insert({
          user_id: userId,
          week_number: 1,
          data: { days: training },
          plan_approved: true,
        });

        const { error: npError } = await supabase.from("nutrition_plans").insert({
          user_id: userId,
          data: { meals: nutrition.meals },
          important_notes: nutrition.importantNotes,
          plan_approved: true,
        });

        if (tpError || npError) {
          errors++;
        } else {
          updated++;
        }
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      total: latestSurveys.size,
      updated,
      skipped,
      errors,
    });
  } catch {
    return NextResponse.json({ error: "Error al regenerar planes" }, { status: 500 });
  }
}
