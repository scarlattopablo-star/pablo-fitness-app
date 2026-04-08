import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import { generateMealPlan } from "@/lib/generate-meal-plan";
import { calculateMacros, PLANS_NEEDING_GOAL } from "@/lib/harris-benedict";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal } from "@/types";

// Admin-only endpoint to regenerate ALL training + nutrition plans
// for every user who has an active subscription AND a survey.
export async function POST(request: NextRequest) {
  try {
    // ── Auth: require Bearer token ──
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify token belongs to an admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // ── Fetch users with active subscription + plan_slug ──
    const { data: activeSubs, error: subError } = await supabase
      .from("subscriptions")
      .select("user_id, plans(slug)")
      .eq("status", "active");

    if (subError || !activeSubs) {
      return NextResponse.json({ error: "Error obteniendo suscripciones" }, { status: 500 });
    }

    // Build a map userId -> plan_slug
    const userPlanMap = new Map<string, string>();
    for (const sub of activeSubs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const slug = (sub as any).plans?.slug as string | undefined;
      if (sub.user_id && slug) {
        userPlanMap.set(sub.user_id, slug);
      }
    }

    if (userPlanMap.size === 0) {
      return NextResponse.json({ success: true, updated: 0, errors: [] });
    }

    // ── Fetch all surveys for those users ──
    const userIds = Array.from(userPlanMap.keys());
    const { data: surveys, error: surveyError } = await supabase
      .from("surveys")
      .select(
        "user_id, target_calories, protein, carbs, fats, objective, nutritional_goal, " +
        "training_days, wake_hour, sleep_hour, emphasis, dietary_restrictions, " +
        "weight, height, age, sex, activity_level"
      )
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    if (surveyError || !surveys) {
      return NextResponse.json({ error: "Error obteniendo encuestas" }, { status: 500 });
    }

    // Keep only latest survey per user
    type SurveyRow = Record<string, unknown> & { user_id: string };
    const latestSurveys = new Map<string, SurveyRow>();
    for (const survey of (surveys as unknown as SurveyRow[])) {
      if (!latestSurveys.has(survey.user_id)) {
        latestSurveys.set(survey.user_id, survey);
      }
    }

    let updated = 0;
    const errors: string[] = [];

    // ── Regenerate plans for each user ──
    for (const [userId, survey] of latestSurveys) {
      try {
        const planSlug = userPlanMap.get(userId)!;

        // Determine objective: use subscription plan_slug, fallback to survey
        const surveyObj = String(survey.objective || "direct-client");
        const objective: string = (planSlug && planSlug !== "direct-client")
          ? planSlug
          : (surveyObj !== "direct-client")
            ? surveyObj
            : "direct-client";

        const trainingDays = Number(survey.training_days) || 5;
        const wakeHour = Number(survey.wake_hour) || 7;
        const sleepHour = Number(survey.sleep_hour) || 23;
        const emphasis = String(survey.emphasis || "ninguno");
        const dietaryRestrictions: string[] = (survey.dietary_restrictions as string[]) || [];
        const userWeight = Number(survey.weight) || 70;
        const userSex = String(survey.sex || "hombre") as Sex;
        const activityLevel = String(survey.activity_level || "moderado") as ActivityLevel;
        const nutritionalGoal = (survey.nutritional_goal || null) as NutritionalGoal | null;

        // Recalculate macros when needed
        let target_calories = survey.target_calories as number;
        let protein = survey.protein as number;
        let carbs = survey.carbs as number;
        let fats = survey.fats as number;
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

        const needsApproval = objective === "direct-client";

        // ── Update (not insert) existing plans ──
        const { data: existingTP } = await supabase
          .from("training_plans")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        const { data: existingNP } = await supabase
          .from("nutrition_plans")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();

        if (existingTP) {
          const { error: tpError } = await supabase
            .from("training_plans")
            .update({ data: { days: training }, plan_approved: !needsApproval })
            .eq("id", existingTP.id);
          if (tpError) {
            errors.push(`User ${userId}: training update failed - ${tpError.message}`);
            continue;
          }
        } else {
          const { error: tpError } = await supabase.from("training_plans").insert({
            user_id: userId,
            week_number: 1,
            data: { days: training },
            plan_approved: !needsApproval,
          });
          if (tpError) {
            errors.push(`User ${userId}: training insert failed - ${tpError.message}`);
            continue;
          }
        }

        if (existingNP) {
          const { error: npError } = await supabase
            .from("nutrition_plans")
            .update({
              data: { meals: nutrition.meals },
              important_notes: nutrition.importantNotes,
              plan_approved: !needsApproval,
            })
            .eq("id", existingNP.id);
          if (npError) {
            errors.push(`User ${userId}: nutrition update failed - ${npError.message}`);
            continue;
          }
        } else {
          const { error: npError } = await supabase.from("nutrition_plans").insert({
            user_id: userId,
            data: { meals: nutrition.meals },
            important_notes: nutrition.importantNotes,
            plan_approved: !needsApproval,
          });
          if (npError) {
            errors.push(`User ${userId}: nutrition insert failed - ${npError.message}`);
            continue;
          }
        }

        updated++;
      } catch (err) {
        errors.push(`User ${userId}: ${err instanceof Error ? err.message : "unknown error"}`);
      }
    }

    return NextResponse.json({ success: true, updated, errors });
  } catch (err) {
    return NextResponse.json(
      { error: `Error al regenerar planes: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 500 }
    );
  }
}
