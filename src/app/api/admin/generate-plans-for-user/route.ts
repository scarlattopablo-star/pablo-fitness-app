// Admin: genera training_plan + nutrition_plan para un cliente a partir
// de su survey. Se usa para:
//   1) backfill manual desde el admin UI cuando un cliente quedo sin plan
//   2) disparo automatico al terminar la encuesta (flow trial/compra)
//
// Auth: Bearer token admin (como el resto de endpoints admin).
// Fix: si la altura viene <10 (usuario ingreso metros por error), la
// convierte a cm multiplicando por 100 y la guarda corregida en surveys.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import { generateMealPlan } from "@/lib/generate-meal-plan";
import { calculateMacros } from "@/lib/harris-benedict";
import type { Sex, ActivityLevel, PlanSlug, NutritionalGoal } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function pickDays(activityLevel: string): number {
  if (activityLevel === "muy-activo") return 6;
  if (activityLevel === "activo") return 5;
  if (activityLevel === "moderado") return 4;
  return 3; // sedentario / poco-activo
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, overwrite } = body as { userId?: string; overwrite?: boolean };
    if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

    // Si el solicitante NO es admin, solo puede generar para si mismo
    // (caso: auto-generate al terminar la encuesta).
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!callerProfile?.is_admin && user.id !== userId) {
      return NextResponse.json({ error: "Solo admin puede generar para otros" }, { status: 403 });
    }

    // 1) Leer survey mas reciente del usuario
    const { data: surveys, error: sErr } = await supabaseAdmin
      .from("surveys")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });
    const survey = surveys?.[0];
    if (!survey) {
      return NextResponse.json({ error: "El cliente aun no completo la encuesta" }, { status: 400 });
    }

    // 2) Sanear altura: si es <10 asumimos metros por error → convertir a cm
    let heightCm = Number(survey.height) || 0;
    let heightFixed = false;
    if (heightCm > 0 && heightCm < 10) {
      heightCm = Math.round(heightCm * 100);
      heightFixed = true;
    }

    // 3) Recalcular macros (Harris-Benedict) con altura corregida
    const macros = calculateMacros(
      survey.sex as Sex,
      Number(survey.weight) || 70,
      heightCm,
      Number(survey.age) || 30,
      (survey.activity_level || "moderado") as ActivityLevel,
      (survey.objective || "quema-grasa") as PlanSlug,
      (survey.nutritional_goal || undefined) as NutritionalGoal | undefined
    );

    // 4) Persistir correcciones en la survey (altura + macros)
    const surveyPatch: Record<string, unknown> = {
      tmb: macros.tmb,
      tdee: macros.tdee,
      target_calories: macros.targetCalories,
      protein: macros.protein,
      carbs: macros.carbs,
      fats: macros.fats,
    };
    if (heightFixed) surveyPatch.height = heightCm;
    await supabaseAdmin.from("surveys").update(surveyPatch).eq("id", survey.id);

    // 5) Generar rutina de entrenamiento
    const numDays = pickDays(survey.activity_level);
    const trainingDays = generateTrainingPlan(
      numDays,
      survey.objective || "quema-grasa",
      "ninguno",
      Number(survey.weight) || 70,
      survey.sex || "mujer",
      survey.activity_level || "moderado"
    );

    // 6) Generar plan de comidas
    const mealPlan = generateMealPlan(
      macros.targetCalories,
      macros.protein,
      macros.carbs,
      macros.fats,
      7, 23,
      survey.dietary_restrictions || [],
      survey.objective || "",
      survey.nutritional_goal || ""
    );

    // 7) Upsert sin depender de UNIQUE: SELECT → UPDATE/INSERT
    const existsResult = await Promise.all([
      supabaseAdmin.from("training_plans").select("id").eq("user_id", userId).limit(1),
      supabaseAdmin.from("nutrition_plans").select("id").eq("user_id", userId).limit(1),
    ]);
    const existingTraining = existsResult[0].data?.[0];
    const existingNutrition = existsResult[1].data?.[0];

    if (existingTraining && !overwrite) {
      // No pisar el plan existente si el admin no pide overwrite explicito
      return NextResponse.json({
        success: false,
        error: "Ya existe training_plan. Pase overwrite:true si quiere regenerarlo.",
        skipped: true,
      }, { status: 409 });
    }

    const trainingData = { days: trainingDays };
    const nutritionData = { meals: mealPlan.meals, importantNotes: mealPlan.importantNotes };

    if (existingTraining) {
      await supabaseAdmin.from("training_plans")
        .update({ data: trainingData, plan_approved: false })
        .eq("id", existingTraining.id);
    } else {
      await supabaseAdmin.from("training_plans")
        .insert({ user_id: userId, data: trainingData, plan_approved: false });
    }

    if (existingNutrition) {
      await supabaseAdmin.from("nutrition_plans")
        .update({ data: nutritionData, plan_approved: false })
        .eq("id", existingNutrition.id);
    } else {
      await supabaseAdmin.from("nutrition_plans")
        .insert({ user_id: userId, data: nutritionData, plan_approved: false });
    }

    return NextResponse.json({
      success: true,
      heightFixed,
      macros,
      trainingDays: trainingDays.length,
      meals: mealPlan.meals.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
