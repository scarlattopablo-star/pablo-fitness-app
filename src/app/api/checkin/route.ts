// Nutrition v2 — F5: endpoint de check-in semanal del cliente
//
// POST: cliente envia su check-in. El servidor calcula sugerencias y las
// guarda como plan_revision pendiente. Pablo aprueba en admin antes de
// que se apliquen al plan.
//
// GET: devuelve si el cliente puede hacer check-in ahora (>=7 dias desde el
// ultimo) y, si ya hizo, los datos del ultimo.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { suggestRevision, type CheckinData, type PlanContext } from "@/lib/checkin-advisor";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getUserFromBearer(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return { user, supabase };
}

// === GET: estado del check-in (¿puede hacer uno ahora?) ===
export async function GET(req: NextRequest) {
  const auth = await getUserFromBearer(req);
  if (!auth) return NextResponse.json({ error: "Token requerido" }, { status: 401 });

  const { user, supabase } = auth;
  const { data: last } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const now = Date.now();
  const lastTime = last ? new Date(last.created_at).getTime() : 0;
  const daysSinceLast = last ? Math.floor((now - lastTime) / (1000 * 60 * 60 * 24)) : 999;
  const canCheckIn = !last || daysSinceLast >= 7;
  const nextWeekNumber = last ? last.week_number + 1 : 1;

  return NextResponse.json({
    canCheckIn,
    daysSinceLast,
    lastCheckIn: last,
    nextWeekNumber,
  });
}

// === POST: crear check-in + generar sugerencia ===
export async function POST(req: NextRequest) {
  const auth = await getUserFromBearer(req);
  if (!auth) return NextResponse.json({ error: "Token requerido" }, { status: 401 });

  const { user, supabase } = auth;
  const body = await req.json();

  const {
    weight, measurements, photos, energy, hunger, performance, adherence_pct, notes,
  } = body as {
    weight?: number; measurements?: Record<string, unknown>; photos?: Record<string, unknown>;
    energy?: number; hunger?: number; performance?: number; adherence_pct?: number; notes?: string;
  };

  // 1) Validar minimo de datos (al menos peso O sensaciones)
  if (weight == null && energy == null && hunger == null && performance == null) {
    return NextResponse.json({ error: "Aporta al menos peso o tus sensaciones para hacer el check-in." }, { status: 400 });
  }

  // 2) Determinar week_number (siguiente disponible)
  const { data: last } = await supabase
    .from("weekly_checkins")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const weekNumber = last ? last.week_number + 1 : 1;

  // 3) Insertar check-in
  const { data: created, error: insertErr } = await supabase
    .from("weekly_checkins")
    .insert({
      user_id: user.id,
      week_number: weekNumber,
      weight,
      measurements: measurements ?? null,
      photos: photos ?? null,
      energy,
      hunger,
      performance,
      adherence_pct,
      notes,
    })
    .select()
    .single();

  if (insertErr || !created) {
    return NextResponse.json({ error: insertErr?.message || "Error guardando check-in" }, { status: 500 });
  }

  // 4) Cargar contexto del plan para el advisor
  const { data: survey } = await supabase
    .from("surveys")
    .select("target_calories, protein, carbs, fats, training_days, nutritional_goal, weight, objective")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!survey) {
    // Sin encuesta no podemos sugerir — devolvemos el check-in solo
    return NextResponse.json({ success: true, checkin: created, suggestion: null });
  }

  const goal = (survey.nutritional_goal || survey.objective || "mantenimiento") as string;
  const ctx: PlanContext = {
    startWeight: Number(survey.weight) || (weight ?? 70),
    currentTargetCalories: Number(survey.target_calories) || 2000,
    currentProtein: Number(survey.protein) || 130,
    currentCarbs: Number(survey.carbs) || 200,
    currentFats: Number(survey.fats) || 65,
    currentTrainingDays: Number(survey.training_days) || 4,
    goal,
    weeksOnPlan: weekNumber,
  };

  const checkinData: CheckinData = {
    week_number: weekNumber,
    weight: weight ?? null,
    energy: energy ?? null,
    hunger: hunger ?? null,
    performance: performance ?? null,
    adherence_pct: adherence_pct ?? null,
  };

  const prevCheckin: CheckinData | null = last ? {
    week_number: last.week_number,
    weight: last.weight,
    energy: last.energy,
    hunger: last.hunger,
    performance: last.performance,
    adherence_pct: last.adherence_pct,
  } : null;

  const suggestion = suggestRevision(checkinData, prevCheckin, ctx);

  // 5) Si hay sugerencia con delta no vacio O necesita revision, crear plan_revision
  let revisionId: string | null = null;
  if (suggestion && (Object.keys(suggestion.delta).length > 0 || suggestion.needsReview)) {
    const { data: rev } = await supabase
      .from("plan_revisions")
      .insert({
        user_id: user.id,
        checkin_id: created.id,
        triggered_by: "weekly-checkin",
        delta: suggestion.delta,
        rationale: suggestion.rationale,
        status: "pending",
      })
      .select("id")
      .single();
    revisionId = rev?.id ?? null;
  }

  return NextResponse.json({
    success: true,
    checkin: created,
    suggestion,
    revisionId,
  });
}
