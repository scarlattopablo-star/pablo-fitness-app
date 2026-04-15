import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify admin
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // Run all queries in parallel
  const [
    profilesRes,
    subsRes,
    paymentsRes,
    exerciseLogsWeekRes,
    visitsRes,
    streaksRes,
    recentLogsRes,
    monthlyRevenueRes,
  ] = await Promise.all([
    // Total registered (non-admin, not deleted)
    sb.from("profiles").select("id, full_name, email, created_at", { count: "exact" }).eq("is_admin", false).is("deleted_at", null),
    // All subscriptions
    sb.from("subscriptions").select("id, user_id, status, start_date, end_date, amount_paid, duration, created_at"),
    // Approved payments
    sb.from("payments").select("id, amount, status, created_at").eq("status", "approved"),
    // Exercise logs this week
    sb.from("exercise_logs").select("id, user_id, created_at").gte("created_at", weekAgo),
    // Visits today
    sb.from("page_visits").select("id", { count: "exact" }).gte("visited_at", today),
    // User streaks
    sb.from("user_streaks").select("user_id, current_streak, max_streak, last_activity_date"),
    // Recent exercise logs with user details (for active/inactive)
    sb.from("exercise_logs").select("user_id, created_at").order("created_at", { ascending: false }).limit(500),
    // All approved payments for revenue chart
    sb.from("payments").select("amount, created_at").eq("status", "approved").order("created_at", { ascending: true }),
  ]);

  const profiles = profilesRes.data || [];
  const totalRegistered = profilesRes.count || profiles.length;
  const subs = subsRes.data || [];
  const payments = paymentsRes.data || [];
  const exerciseLogsWeek = exerciseLogsWeekRes.data || [];
  const visitsToday = visitsRes.count || 0;
  const streaks = streaksRes.data || [];
  const recentLogs = recentLogsRes.data || [];
  const monthlyPayments = monthlyRevenueRes.data || [];

  // KPIs
  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const activeSubs = subs.filter(s => s.status === "active" && new Date(s.end_date) > now);
  const paidSubs = activeSubs.filter(s => (s.amount_paid || 0) > 0);
  const freeSubs = activeSubs.filter(s => !s.amount_paid || s.amount_paid === 0);
  const conversionRate = totalRegistered > 0 ? Math.round((paidSubs.length / totalRegistered) * 100) : 0;

  // Engagement
  const uniqueTrainersWeek = new Set(exerciseLogsWeek.map(l => l.user_id)).size;
  const avgStreak = streaks.length > 0
    ? Math.round(streaks.reduce((s, r) => s + (r.current_streak || 0), 0) / streaks.length * 10) / 10
    : 0;

  // Active vs Inactive clients (last 7 days)
  const lastActivityByUser: Record<string, string> = {};
  for (const log of recentLogs) {
    if (!lastActivityByUser[log.user_id]) {
      lastActivityByUser[log.user_id] = log.created_at;
    }
  }

  const activeClients: { id: string; name: string; email: string; lastActivity: string; streak: number }[] = [];
  const inactiveClients: { id: string; name: string; email: string; lastActivity: string | null; streak: number; daysSince: number }[] = [];

  for (const p of profiles) {
    const last = lastActivityByUser[p.id];
    const streak = streaks.find(s => s.user_id === p.id);
    const currentStreak = streak?.current_streak || 0;

    if (last && new Date(last) >= new Date(weekAgo)) {
      activeClients.push({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        lastActivity: last,
        streak: currentStreak,
      });
    } else {
      const daysSince = last
        ? Math.floor((now.getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24))
        : 999;
      inactiveClients.push({
        id: p.id,
        name: p.full_name || p.email,
        email: p.email,
        lastActivity: last || null,
        streak: currentStreak,
        daysSince,
      });
    }
  }

  // Sort: active by most recent, inactive by most days since
  activeClients.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
  inactiveClients.sort((a, b) => a.daysSince - b.daysSince);

  // Monthly revenue chart data (last 6 months)
  const revenueByMonth: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth[key] = 0;
  }
  for (const p of monthlyPayments) {
    const d = new Date(p.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in revenueByMonth) {
      revenueByMonth[key] += p.amount || 0;
    }
  }
  const revenueChart = Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount }));

  return NextResponse.json({
    kpis: {
      totalRevenue,
      activeClients: activeSubs.length,
      paidClients: paidSubs.length,
      freeClients: freeSubs.length,
      totalRegistered,
      conversionRate,
    },
    engagement: {
      sessionsThisWeek: exerciseLogsWeek.length,
      uniqueTrainersWeek,
      avgStreak,
      visitsToday,
    },
    clients: {
      active: activeClients.slice(0, 20),
      inactive: inactiveClients.slice(0, 20),
    },
    revenueChart,
  });
}
