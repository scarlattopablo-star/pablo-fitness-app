// Endpoint quirurgico: recalcula SOLO shoppingList + budget + supplements
// para los nutrition_plans existentes, sin tocar las comidas del cliente
// ni el plan de entrenamiento.
//
// Usado para arreglar el bug del multiplier daysInWeek que tenia las
// cantidades de la lista de compras infladas 7x (y por ende el presupuesto).
//
// POST body opcional:
//   { userIds?: string[] }   -> regenerar solo para esos users (sino, TODOS)
//
// Solo admin (Bearer token).

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildNutritionExtras } from "@/lib/persist-nutrition-extras";
import { flattenWeekMealsForShopping } from "@/lib/generate-week-meal-plan";
import type { MealPlanMeal } from "@/lib/generate-meal-plan";
import type { WeekMenu } from "@/lib/generate-week-meal-plan";

export const runtime = "nodejs";
export const maxDuration = 60;

interface NutritionPlanRow {
  id: string;
  user_id: string;
  data: {
    meals?: MealPlanMeal[];
    weekMenu?: WeekMenu;
    gymDay?: { meals: MealPlanMeal[] };
    kitesurfDay?: { meals: MealPlanMeal[] };
    shoppingList?: unknown;
    budget?: unknown;
    supplements?: unknown;
    [k: string]: unknown;
  };
}

interface SurveyRow {
  user_id: string;
  country: string | null;
  city: string | null;
  food_budget_monthly: number | null;
  shopping_frequency: string | null;
  sex: string | null;
  age: number | null;
  activity_level: string | null;
  training_days: number | null;
  dietary_restrictions: string[] | null;
  pathologies: string[] | null;
  intolerances: string[] | null;
  current_supplements: string[] | null;
  wants_supplement_advice: boolean | null;
  protein: number | null;
  target_calories: number | null;
  tdee: number | null;
  objective: string | null;
  nutritional_goal: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auth: Bearer (admin user logueado) O x-admin-secret = SUPABASE_SERVICE_ROLE_KEY
    // (mismo patron que /api/admin/announce-features)
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!profile?.is_admin) {
        return NextResponse.json({ error: "Solo admin" }, { status: 403 });
      }
    } else {
      const secret = request.headers.get("x-admin-secret");
      if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    let body: { userIds?: string[]; dryRun?: boolean } = {};
    try { body = await request.json(); } catch { /* sin body = todos */ }
    const targetUserIds = body.userIds;
    const dryRun = body.dryRun === true;

    // 1) Buscar nutrition_plans
    let npQuery = supabase
      .from("nutrition_plans")
      .select("id, user_id, data");
    if (targetUserIds && targetUserIds.length > 0) {
      npQuery = npQuery.in("user_id", targetUserIds);
    }
    const { data: plans, error: npErr } = await npQuery;
    if (npErr) {
      return NextResponse.json({ error: "Error leyendo planes: " + npErr.message }, { status: 500 });
    }
    if (!plans || plans.length === 0) {
      return NextResponse.json({ success: true, updated: 0, total: 0, errors: [] });
    }

    // Solo el plan mas reciente por user (igual que regenerate-all-plans)
    const latestByUser = new Map<string, NutritionPlanRow>();
    for (const p of plans as NutritionPlanRow[]) {
      const existing = latestByUser.get(p.user_id);
      if (!existing) latestByUser.set(p.user_id, p);
    }

    const userIds = Array.from(latestByUser.keys());

    // 2) Cargar surveys (campos que necesita buildNutritionExtras)
    const { data: surveys } = await supabase
      .from("surveys")
      .select("user_id, country, city, food_budget_monthly, shopping_frequency, sex, age, activity_level, training_days, dietary_restrictions, pathologies, intolerances, current_supplements, wants_supplement_advice, protein, target_calories, tdee, objective, nutritional_goal")
      .in("user_id", userIds)
      .order("created_at", { ascending: false });

    const latestSurvey = new Map<string, SurveyRow>();
    for (const s of (surveys as SurveyRow[] | null) ?? []) {
      if (!latestSurvey.has(s.user_id)) latestSurvey.set(s.user_id, s);
    }

    let updated = 0;
    let wouldUpdate = 0;
    const errors: Array<{ userId: string; reason: string }> = [];
    const skipped: Array<{ userId: string; reason: string }> = [];
    const sample: Array<{
      userId: string;
      mealsCount: number;
      daysInWeek: number;
      shoppingFreq: string | null;
      monthlyCostBefore: number | null;
      monthlyCostAfter: number | null;
      currency: string | null;
    }> = [];

    for (const [userId, plan] of latestByUser) {
      try {
        const survey = latestSurvey.get(userId);
        if (!survey) {
          skipped.push({ userId, reason: "sin survey" });
          continue;
        }

        // Determinar meals + daysInWeek desde el plan persistido.
        // Prioridad: weekMenu (variedad semanal v2) > meals legacy > gymDay (kitesurf)
        let mealsForShopping: MealPlanMeal[];
        let daysInWeek: number;

        if (plan.data?.weekMenu) {
          mealsForShopping = flattenWeekMealsForShopping(plan.data.weekMenu);
          daysInWeek = 7;
        } else if (plan.data?.gymDay?.meals) {
          // Kitesurf: 1 dia (gym) repetido
          mealsForShopping = plan.data.gymDay.meals;
          daysInWeek = 1;
        } else if (plan.data?.meals) {
          // Plan legacy: 1 dia que se repite
          mealsForShopping = plan.data.meals;
          daysInWeek = 1;
        } else {
          skipped.push({ userId, reason: "sin meals/weekMenu en data" });
          continue;
        }

        const objective = (survey.objective || "direct-client") as string;
        const isDeficit = (survey.target_calories ?? 0) < (survey.tdee ?? (survey.target_calories ?? 0) + 1);

        const extras = await buildNutritionExtras(supabase, {
          meals: mealsForShopping,
          country: survey.country,
          city: survey.city,
          userBudgetMonthly: survey.food_budget_monthly,
          daysInWeek,
          shoppingFrequency: survey.shopping_frequency as "semanal" | "quincenal" | "mensual" | null,
          supplementInput: {
            sex: survey.sex || "hombre",
            age: Number(survey.age) || 30,
            objective,
            nutritionalGoal: survey.nutritional_goal,
            activityLevel: survey.activity_level || "moderado",
            trainingDays: Number(survey.training_days) || 4,
            dietaryRestrictions: survey.dietary_restrictions || [],
            pathologies: survey.pathologies || [],
            intolerances: survey.intolerances || [],
            currentSupplements: survey.current_supplements || [],
            wantsAdvice: survey.wants_supplement_advice ?? true,
            proteinTarget: Number(survey.protein) || 130,
            isDeficit,
          },
        });

        // Sample para reportar (primeros 5 users)
        if (sample.length < 5) {
          const oldBudget = (plan.data?.budget as { pricedList?: { monthlyCost?: number; currency?: string } } | undefined);
          const newBudget = extras.budget?.pricedList;
          sample.push({
            userId,
            mealsCount: mealsForShopping.length,
            daysInWeek,
            shoppingFreq: survey.shopping_frequency ?? null,
            monthlyCostBefore: oldBudget?.pricedList?.monthlyCost ?? null,
            monthlyCostAfter: newBudget?.monthlyCost ?? null,
            currency: newBudget?.currency ?? oldBudget?.pricedList?.currency ?? null,
          });
        }

        if (dryRun) {
          wouldUpdate++;
          continue;
        }

        // Construir el data nuevo: preservar TODO lo existente y solo
        // pisar shoppingList/budget/supplements.
        const nextData = { ...plan.data };
        if (extras.shoppingList) nextData.shoppingList = extras.shoppingList;
        else delete nextData.shoppingList;
        if (extras.budget) nextData.budget = extras.budget;
        else delete nextData.budget;
        if (extras.supplements) nextData.supplements = extras.supplements;

        const { error: upErr } = await supabase
          .from("nutrition_plans")
          .update({ data: nextData })
          .eq("id", plan.id);
        if (upErr) {
          errors.push({ userId, reason: upErr.message });
          continue;
        }
        updated++;
      } catch (e) {
        errors.push({ userId, reason: e instanceof Error ? e.message : "unknown" });
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      total: latestByUser.size,
      updated: dryRun ? 0 : updated,
      wouldUpdate: dryRun ? wouldUpdate : updated,
      skipped,
      errors,
      sample,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : "Error interno"
    }, { status: 500 });
  }
}
