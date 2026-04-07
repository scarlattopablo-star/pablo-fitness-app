import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getRandomMessage } from "@/lib/gamification";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return true;
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
    pub, priv
  );
  vapidConfigured = true;
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendPushToUser(
  supabase: any,
  userId: string,
  title: string,
  body: string,
  url: string = "/dashboard/ranking"
) {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return 0;

  const payload = JSON.stringify({ title, body, url });
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      );
      sent++;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number })?.statusCode;
      if (code === 410 || code === 404) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  }
  return sent;
}

// POST: Send motivational push notifications to all users
// Call this via cron or manually from admin
export async function POST(request: NextRequest) {
  try {
    // Optional auth check (allow cron without auth via secret)
    const authHeader = request.headers.get("authorization");
    const cronSecret = request.headers.get("x-cron-secret");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller (admin token or cron secret)
    if (cronSecret !== process.env.CRON_SECRET) {
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const { data: { user } } = await supabase.auth.getUser(token);
        if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
        if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      } else {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    if (!ensureVapid()) {
      return NextResponse.json({ error: "VAPID not configured" }, { status: 500 });
    }

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    let totalSent = 0;

    // 1. STREAK AT RISK — users who trained yesterday but not today
    const { data: streaks } = await supabase
      .from("user_streaks")
      .select("user_id, current_streak, last_activity_date")
      .gte("current_streak", 2)
      .eq("last_activity_date", yesterday);

    if (streaks) {
      for (const s of streaks) {
        // Check if they already trained today
        const { data: todayLog } = await supabase
          .from("exercise_logs")
          .select("id")
          .eq("user_id", s.user_id)
          .gte("date", today)
          .limit(1)
          .maybeSingle();

        if (!todayLog) {
          const msg = getRandomMessage("streakRisk").replace("{streak}", String(s.current_streak));
          totalSent += await sendPushToUser(supabase, s.user_id, "No pierdas tu racha!", msg, "/dashboard/plan");
        }
      }
    }

    // 2. RANKING COMPETITION — notify users who got passed in weekly ranking
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toISOString().split("T")[0];

    const { data: rankings } = await supabase
      .from("weekly_rankings")
      .select("user_id, xp_earned")
      .eq("week_start", weekStart)
      .order("xp_earned", { ascending: false })
      .limit(20);

    if (rankings && rankings.length > 3) {
      // Get user names for messages
      const userIds = rankings.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);
      const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name?.split(" ")[0] || "Alguien"]));

      // Notify users who are NOT in top 3 that someone is ahead
      for (let i = 3; i < Math.min(rankings.length, 10); i++) {
        const user = rankings[i];
        const leaderName = nameMap.get(rankings[0].user_id) || "Alguien";
        const msg = getRandomMessage("rankingDown")
          .replace("{name}", leaderName);
        totalSent += await sendPushToUser(supabase, user.user_id, "Ranking Semanal", msg);
      }
    }

    // 3. WEEKLY REMINDER — on Friday, remind everyone about ranking
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 5) { // Friday
      const { data: allUsers } = await supabase
        .from("push_subscriptions")
        .select("user_id")
        .limit(100);

      const uniqueUsers = [...new Set((allUsers || []).map(u => u.user_id))];
      const daysLeft = 2; // Saturday + Sunday
      const msg = getRandomMessage("weeklyReminder").replace("{days}", String(daysLeft));

      for (const userId of uniqueUsers) {
        totalSent += await sendPushToUser(supabase, userId, "Ranking Semanal", msg);
      }
    }

    return NextResponse.json({ sent: totalSent, streaksAtRisk: streaks?.length || 0 });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
