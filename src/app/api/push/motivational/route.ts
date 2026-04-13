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

    // 4. SUNDAY MOTIVATION — motivational message to start the week
    if (dayOfWeek === 0) { // Sunday
      const { data: allUsers } = await supabase
        .from("push_subscriptions")
        .select("user_id")
        .limit(200);

      const uniqueUsers = [...new Set((allUsers || []).map(u => u.user_id))];
      const msg = getRandomMessage("sundayMotivation");

      for (const userId of uniqueUsers) {
        totalSent += await sendPushToUser(supabase, userId, "Arranca la semana!", msg, "/dashboard/plan");
      }
    }

    // 5. WEEKLY OFFER — on Wednesday, remind free users about the offer
    if (dayOfWeek === 3) { // Wednesday
      // Get all free subscriptions ($0, non-direct-client)
      const { data: freeSubs } = await supabase
        .from("subscriptions")
        .select("user_id, amount_paid")
        .eq("status", "active")
        .eq("amount_paid", 0);

      if (freeSubs) {
        // Exclude direct clients
        const { data: directCodes } = await supabase
          .from("free_access_codes")
          .select("used_by")
          .eq("used", true)
          .eq("plan_slug", "direct-client");
        const directIds = new Set((directCodes || []).map(c => c.used_by));

        const freeUsers = freeSubs.filter(s => !directIds.has(s.user_id));
        const offerMsg = getRandomMessage("freeUserOffer");

        for (const fu of freeUsers) {
          totalSent += await sendPushToUser(supabase, fu.user_id, "Oferta especial!", offerMsg, "/dashboard");
        }
      }
    }

    // 6. GENTLE INACTIVITY — users who haven't trained in 3+ days (no active streak)
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split("T")[0];
    const { data: inactiveStreaks } = await supabase
      .from("user_streaks")
      .select("user_id, last_activity_date")
      .lte("last_activity_date", threeDaysAgo)
      .lte("current_streak", 1);

    if (inactiveStreaks) {
      const inactiveIds = inactiveStreaks.map(s => s.user_id);
      const { data: inactiveProfiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", inactiveIds)
        .is("deleted_at", null);

      for (const p of inactiveProfiles || []) {
        const streak = inactiveStreaks.find(s => s.user_id === p.id);
        if (!streak) continue;
        const daysSince = Math.floor((Date.now() - new Date(streak.last_activity_date).getTime()) / 86400000);
        if (daysSince > 14) continue; // Don't bother users inactive >2 weeks
        const name = p.full_name?.split(" ")[0] || "Crack";
        const msgs = [
          `${name}, hace ${daysSince} dias que no entrenas. Tu plan te espera!`,
          `${name}, un dia a la vez. Volvemos a entrenar?`,
          `Hey ${name}! No pasa nada, lo importante es volver. Te esperamos!`,
        ];
        const msg = msgs[Math.floor(Math.random() * msgs.length)];
        totalSent += await sendPushToUser(supabase, p.id, "Te extrañamos!", msg, "/dashboard/plan");
      }
    }

    // 7. PERSONALIZE STREAK RISK with user name
    // (already handled above in section 1, but now let's add names to ranking notifications too)

    return NextResponse.json({ sent: totalSent, streaksAtRisk: streaks?.length || 0 });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
