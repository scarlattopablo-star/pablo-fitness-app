// Nutrition v2 — F7: metricas operacionales especificas de nutricion
//
// Complementa /api/admin/metrics (que cubre revenue/engagement de entreno)
// con datos de F3+F4+F5: check-ins, revisiones, suplementos, presupuesto,
// distribuciones por objetivo/pais.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function assertAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { user, supabase };
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

interface NutritionPlanData {
  supplements?: Array<{ id: string; name: string; priority: string; alreadyTakes?: boolean }>;
  budget?: {
    pricedList?: { monthlyCost?: number; weeklyCost?: number; currency?: string };
    status?: "ok" | "tight" | "over";
  };
  shoppingList?: unknown;
  weekMenu?: unknown;
}

export async function GET(req: NextRequest) {
  const auth = await assertAdmin(req);
  if (!auth) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  const { supabase } = auth;

  const [
    activeSubsRes,
    checkins30Res,
    revisionsRes,
    surveysRes,
    nutritionPlansRes,
  ] = await Promise.all([
    supabase.from("subscriptions").select("user_id", { count: "exact" }).eq("status", "active"),
    supabase.from("weekly_checkins").select("user_id, adherence_pct, energy, hunger, performance, weight, created_at").gte("created_at", daysAgoIso(30)),
    supabase.from("plan_revisions").select("status, created_at, triggered_by"),
    supabase.from("surveys").select("user_id, objective, country, body_fat_pct, food_budget_monthly, pathologies, intolerances, dietary_restrictions"),
    supabase.from("nutrition_plans").select("user_id, data, plan_approved"),
  ]);

  const activeUserIds = new Set((activeSubsRes.data || []).map(s => s.user_id));
  const activeClients = activeSubsRes.count ?? activeUserIds.size;

  // === Operacion ===
  const checkins7d = (checkins30Res.data || []).filter(c =>
    new Date(c.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  const usersWithCheckin10d = new Set(
    (checkins30Res.data || [])
      .filter(c => new Date(c.created_at).getTime() > Date.now() - 10 * 24 * 60 * 60 * 1000)
      .map(c => c.user_id)
  );
  const clientsAtRisk = Math.max(0, activeClients - usersWithCheckin10d.size);

  const revisionsByStatus: Record<string, number> = { pending: 0, approved: 0, rejected: 0, applied: 0 };
  for (const r of (revisionsRes.data || [])) {
    revisionsByStatus[r.status] = (revisionsByStatus[r.status] ?? 0) + 1;
  }

  // === Producto ===
  const adherenceValues = (checkins30Res.data || [])
    .map(c => c.adherence_pct)
    .filter((v): v is number => v != null);
  const avgAdherence30d = adherenceValues.length > 0
    ? Math.round(adherenceValues.reduce((s, v) => s + v, 0) / adherenceValues.length)
    : null;

  const energyValues = (checkins30Res.data || []).map(c => c.energy).filter((v): v is number => v != null);
  const avgEnergy = energyValues.length > 0
    ? Math.round((energyValues.reduce((s, v) => s + v, 0) / energyValues.length) * 10) / 10
    : null;

  const hungerValues = (checkins30Res.data || []).map(c => c.hunger).filter((v): v is number => v != null);
  const avgHunger = hungerValues.length > 0
    ? Math.round((hungerValues.reduce((s, v) => s + v, 0) / hungerValues.length) * 10) / 10
    : null;

  // Suplementos top + budget stats
  const supplementCounts = new Map<string, { count: number; name: string; essentialCount: number }>();
  let plansWithSupplements = 0;
  let plansWithBudget = 0;
  let plansBudgetOver = 0;
  let plansBudgetTight = 0;
  let plansWithWeekMenu = 0;
  let monthlyCostSum = 0;
  let monthlyCostN = 0;
  let monthlyCostCurrency = "UYU";

  for (const np of (nutritionPlansRes.data || [])) {
    const data = np.data as NutritionPlanData | null;
    if (!data) continue;

    if (data.weekMenu) plansWithWeekMenu++;

    if (Array.isArray(data.supplements) && data.supplements.length > 0) {
      plansWithSupplements++;
      for (const s of data.supplements) {
        const cur = supplementCounts.get(s.id) || { count: 0, name: s.name, essentialCount: 0 };
        cur.count++;
        if (s.priority === "esencial") cur.essentialCount++;
        supplementCounts.set(s.id, cur);
      }
    }

    if (data.budget) {
      plansWithBudget++;
      if (data.budget.status === "over") plansBudgetOver++;
      if (data.budget.status === "tight") plansBudgetTight++;
      const monthly = data.budget.pricedList?.monthlyCost;
      if (typeof monthly === "number" && monthly > 0) {
        monthlyCostSum += monthly;
        monthlyCostN++;
        monthlyCostCurrency = data.budget.pricedList?.currency || monthlyCostCurrency;
      }
    }
  }

  const topSupplements = Array.from(supplementCounts.entries())
    .map(([id, v]) => ({ id, name: v.name, count: v.count, essentialCount: v.essentialCount }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const avgMonthlyCost = monthlyCostN > 0 ? Math.round(monthlyCostSum / monthlyCostN) : null;

  // === Distribuciones ===
  const byObjective: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  let withBodyFat = 0;
  let withBudget = 0;
  let withPathologies = 0;
  let withIntolerances = 0;

  const dietFlags = { vegan: 0, vegetarian: 0, glutenFree: 0, lactoseFree: 0 };

  for (const s of (surveysRes.data || [])) {
    const k = s.objective || "sin-definir";
    byObjective[k] = (byObjective[k] ?? 0) + 1;
    if (s.country) byCountry[s.country] = (byCountry[s.country] ?? 0) + 1;
    if (s.body_fat_pct != null) withBodyFat++;
    if (s.food_budget_monthly != null) withBudget++;
    if (Array.isArray(s.pathologies) && s.pathologies.length > 0) withPathologies++;
    if (Array.isArray(s.intolerances) && s.intolerances.length > 0) withIntolerances++;
    const restrictions: string[] = (s.dietary_restrictions || []).map((r: string) => r.toLowerCase());
    if (restrictions.some(r => r.includes("vegano"))) dietFlags.vegan++;
    if (restrictions.some(r => r.includes("vegetariano"))) dietFlags.vegetarian++;
    if (restrictions.some(r => r.includes("gluten"))) dietFlags.glutenFree++;
    if (restrictions.some(r => r.includes("lactosa"))) dietFlags.lactoseFree++;
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    operation: {
      revisionsPending: revisionsByStatus.pending,
      revisionsApproved: (revisionsByStatus.approved ?? 0) + (revisionsByStatus.applied ?? 0),
      revisionsRejected: revisionsByStatus.rejected,
      checkinsLast7d: checkins7d.length,
      clientsAtRisk,
    },
    product: {
      activeClients,
      avgAdherence30d,
      avgEnergy,
      avgHunger,
      checkinResponseRate: activeClients > 0 ? Math.round((usersWithCheckin10d.size / activeClients) * 100) : 0,
      plansWithSupplements,
      plansWithBudget,
      plansWithWeekMenu,
      plansBudgetOver,
      plansBudgetTight,
      avgMonthlyCost,
      monthlyCostCurrency,
    },
    distributions: {
      byObjective,
      byCountry,
      topSupplements,
      withBodyFat,
      withBudget,
      withPathologies,
      withIntolerances,
      dietFlags,
    },
  });
}
