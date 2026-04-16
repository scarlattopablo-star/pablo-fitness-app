import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getRandomMessage } from "@/lib/gamification";

// POST: Send motivational push notifications to users
// Call this daily (e.g., via cron) to send streak reminders and ranking updates
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin or cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");
    if (!cronSecret && authHeader) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const sent: string[] = [];

    // 1. Streak at risk notifications — users who trained yesterday but not today
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];
    const { data: streaksAtRisk } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak")
      .eq("last_activity_date", yesterday)
      .gte("current_streak", 2);

    for (const streak of streaksAtRisk || []) {
      const msg = getRandomMessage("streakRisk").replace("{streak}", String(streak.current_streak));
      await sendPushToUser(supabase, streak.user_id, "Racha en riesgo!", msg);
      sent.push(`streak-risk:${streak.user_id}`);
    }

    // 2. Weekly ranking reminder (Friday)
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 5) { // Friday
      const daysLeft = 2; // Saturday + Sunday
      const { data: rankings } = await supabase
        .from("weekly_rankings")
        .select("user_id")
        .gte("week_start", getWeekStart());

      for (const r of rankings || []) {
        const msg = getRandomMessage("weeklyReminder").replace("{days}", String(daysLeft));
        await sendPushToUser(supabase, r.user_id, "Ranking Semanal", msg);
        sent.push(`weekly-reminder:${r.user_id}`);
      }
    }

    // 3. Inactive users (no session in 3+ days, had activity before)
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
    const { data: inactive } = await supabase
      .from("user_streaks")
      .select("user_id")
      .lt("last_activity_date", threeDaysAgo)
      .gt("max_streak", 0);

    for (const u of inactive || []) {
      await sendPushToUser(supabase, u.user_id, "Te extrañamos!", "Hace dias que no entrenas. Volvé y recupera tu racha!");
      sent.push(`inactive:${u.user_id}`);
    }

    return NextResponse.json({ sent: sent.length, details: sent });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(now.setDate(diff)).toISOString().split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendPushToUser(supabase: any, userId: string, title: string, body: string) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return;

  for (const sub of subs) {
    try {
      // Send push notification via web-push
      const webpush = require("web-push");
      webpush.setVapidDetails(
        "mailto:scarlattopablo@gmail.com",
        (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim(),
        (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim()
      );
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url: "/dashboard/ranking" })
      ).catch(() => {});
    } catch {}
  }
}
