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

// POST: Send achievement/level-up push notification to a specific user
export async function POST(request: NextRequest) {
  try {
    const { userId, type, data } = await request.json();
    if (!userId || !type) {
      return NextResponse.json({ error: "userId y type requeridos" }, { status: 400 });
    }

    if (!ensureVapid()) {
      return NextResponse.json({ sent: 0 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let title = "";
    let body = "";

    switch (type) {
      case "new_badge": {
        title = "Nuevo Logro!";
        body = getRandomMessage("newBadge")
          .replace("{badge}", data?.badge || "")
          .replace("{xp}", data?.xp || "0");
        break;
      }
      case "level_up": {
        title = "Subiste de Nivel!";
        body = getRandomMessage("levelUp")
          .replace("{level}", data?.level || "")
          .replace("{levelName}", data?.levelName || "");
        break;
      }
      case "ranking_up": {
        title = "Ranking";
        body = getRandomMessage("rankingUp")
          .replace("{rank}", data?.rank || "");
        break;
      }
      default:
        return NextResponse.json({ error: "Tipo desconocido" }, { status: 400 });
    }

    const payload = JSON.stringify({ title, body, url: "/dashboard/ranking" });
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

    return NextResponse.json({ sent });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
