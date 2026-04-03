import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTrainingPlan } from "@/lib/generate-training-plan";
import { generateMealPlan } from "@/lib/generate-meal-plan";

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

    // Get latest survey for this user
    const { data: survey, error: surveyError } = await supabase
      .from("surveys")
      .select("target_calories, protein, carbs, fats, objective, training_days, wake_hour, sleep_hour, emphasis, dietary_restrictions, weight")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (surveyError || !survey) {
      return NextResponse.json({ error: "Encuesta no encontrada para este usuario" }, { status: 404 });
    }

    // Determine objective: use planSlug if provided, otherwise survey objective
    const objective = (planSlug && planSlug !== "direct-client")
      ? planSlug
      : (survey.objective && survey.objective !== "direct-client")
        ? survey.objective
        : "quema-grasa";

    const trainingDays = survey.training_days || 5;
    const wakeHour = survey.wake_hour || 7;
    const sleepHour = survey.sleep_hour || 23;

    // Generate plans using existing functions
    const emphasis = survey.emphasis || "ninguno";
    const dietaryRestrictions: string[] = survey.dietary_restrictions || [];
    const userWeight = survey.weight || 70;
    const training = generateTrainingPlan(trainingDays, objective, emphasis, userWeight);
    const nutrition = generateMealPlan(
      survey.target_calories,
      survey.protein,
      survey.carbs,
      survey.fats,
      wakeHour,
      sleepHour,
      dietaryRestrictions
    );

    // Delete existing plans for this user (same pattern as plan-editor)
    await supabase.from("training_plans").delete().eq("user_id", userId);
    await supabase.from("nutrition_plans").delete().eq("user_id", userId);

    // Insert training plan
    const { error: tpError } = await supabase.from("training_plans").insert({
      user_id: userId,
      week_number: 1,
      data: { days: training },
    });

    if (tpError) {
      return NextResponse.json({ error: `Error guardando entrenamiento: ${tpError.message}` }, { status: 500 });
    }

    // Insert nutrition plan
    const { error: npError } = await supabase.from("nutrition_plans").insert({
      user_id: userId,
      data: { meals: nutrition.meals },
      important_notes: nutrition.importantNotes,
    });

    if (npError) {
      return NextResponse.json({ error: `Error guardando nutricion: ${npError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      training: { days: training.length },
      nutrition: { meals: nutrition.meals.length },
    });
  } catch {
    return NextResponse.json({ error: "Error al generar planes" }, { status: 500 });
  }
}
