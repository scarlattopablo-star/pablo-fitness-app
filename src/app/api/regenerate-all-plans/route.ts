import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import { generateMealPlan } from "@/lib/generate-meal-plan";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import type { PlanSlug, NutritionalGoal, Sex, ActivityLevel } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    // Optional: regenerate only specific user IDs
    let body: { userIds?: string[] } = {};
    try { body = await request.json(); } catch { /* no body = regenerate all */ }
    const targetUserIds = body.userIds;

    // Fetch ALL users who have a survey (regardless of subscription status)
    let surveyQuery = supabase
      .from("surveys")
      .select("user_id, target_calories, protein, carbs, fats, objective, nutritional_goal, training_days, wake_hour, sleep_hour, emphasis, dietary_restrictions, weight, height, age, sex, activity_level")
      .order("created_at", { ascending: false });

    if (targetUserIds && targetUserIds.length > 0) {
      surveyQuery = surveyQuery.in("user_id", targetUserIds);
    }

    const { data: surveys, error: surveyError } = await surveyQuery;
    if (surveyError || !surveys) {
      return NextResponse.json({ error: "Error obteniendo encuestas: " + surveyError?.message }, { status: 500 });
    }

    // Keep only latest survey per user
    type SurveyRow = Record<string, unknown> & { user_id: string };
    const latestSurveys = new Map<string, SurveyRow>();
    for (const survey of (surveys as unknown as SurveyRow[])) {
      if (!latestSurveys.has(survey.user_id)) {
        latestSurveys.set(survey.user_id, survey);
      }
    }

    // Also get subscription info for plan_slug (optional, not required)
    const userIds = Array.from(latestSurveys.keys());
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("user_id, plan_id, plans(slug)")
      .in("user_id", userIds);

    const userPlanMap = new Map<string, string>();
    if (subs) {
      for (const sub of subs) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const slug = (sub as any).plans?.slug as string | undefined;
        if (sub.user_id && slug) {
          userPlanMap.set(sub.user_id as string, slug);
        }
      }
    }

    let updated = 0;
    const errors: string[] = [];

    for (const [userId, survey] of latestSurveys) {
      try {
        const planSlug = userPlanMap.get(userId);
        const surveyObj = String(survey.objective || "direct-client");
        const objective: string = (planSlug && planSlug !== "direct-client")
          ? planSlug
          : (surveyObj !== "direct-client") ? surveyObj : "direct-client";

        const trainingDays = Number(survey.training_days) || 5;
        const wakeHour = Number(survey.wake_hour) || 7;
        const sleepHour = Number(survey.sleep_hour) || 23;
        const emphasis = String(survey.emphasis || "ninguno");
        const dietaryRestrictions: string[] = (survey.dietary_restrictions as string[]) || [];
        const userWeight = Number(survey.weight) || 70;
        const userSex = String(survey.sex || "hombre") as Sex;
        const activityLevel = String(survey.activity_level || "moderado") as ActivityLevel;
        const nutritionalGoal = (survey.nutritional_goal || null) as NutritionalGoal | null;

        let target_calories = Number(survey.target_calories) || 2000;
        let protein = Number(survey.protein) || 150;
        let carbs = Number(survey.carbs) || 200;
        let fats = Number(survey.fats) || 60;

        if (nutritionalGoal && PLANS_NEEDING_GOAL.includes(objective as PlanSlug)) {
          const recalc = calculateMacros(
            userSex,
            Number(survey.weight) || 70,
            Number(survey.height) || 170,
            Number(survey.age) || 25,
            activityLevel,
            objective as PlanSlug,
            nutritionalGoal
          );
          target_calories = recalc.targetCalories;
          protein = recalc.protein;
          carbs = recalc.carbs;
          fats = recalc.fats;
        }

        const training = generateTrainingPlan(
          trainingDays, objective, emphasis, userWeight, userSex, activityLevel
        );
        const nutrition = generateMealPlan(
          target_calories, protein, carbs, fats,
          wakeHour, sleepHour, dietaryRestrictions
        );

        // Update or insert training plan
        const { data: existingTP } = await supabase
          .from("training_plans").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

        if (existingTP) {
          await supabase.from("training_plans").update({
            data: { days: training, admin_updated_at: new Date().toISOString() },
            plan_approved: true,
          }).eq("id", existingTP.id);
        } else {
          await supabase.from("training_plans").insert({
            user_id: userId, week_number: 1,
            data: { days: training, admin_updated_at: new Date().toISOString() },
            plan_approved: true,
          });
        }

        // Update or insert nutrition plan
        const { data: existingNP } = await supabase
          .from("nutrition_plans").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();

        if (existingNP) {
          await supabase.from("nutrition_plans").update({
            data: { meals: nutrition, macros: { calories: target_calories, protein, carbs, fats }, admin_updated_at: new Date().toISOString() },
            plan_approved: true,
          }).eq("id", existingNP.id);
        } else {
          await supabase.from("nutrition_plans").insert({
            user_id: userId,
            data: { meals: nutrition, macros: { calories: target_calories, protein, carbs, fats }, admin_updated_at: new Date().toISOString() },
            plan_approved: true,
          });
        }

        updated++;
      } catch (e) {
        errors.push(`${userId}: ${e instanceof Error ? e.message : "unknown error"}`);
      }
    }

    return NextResponse.json({ success: true, updated, total: latestSurveys.size, errors });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error interno" }, { status: 500 });
  }
}
