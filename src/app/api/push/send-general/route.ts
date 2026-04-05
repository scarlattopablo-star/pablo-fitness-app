import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No auth token" }, { status: 401 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { title, body } = await request.json();

    if (!ensureVapid()) {
      return NextResponse.json({ error: "VAPID keys not configured" }, { status: 500 });
    }

    // Get all push subscriptions EXCEPT the sender's
    const { data: subscriptions } = await adminClient
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .neq("user_id", user.id);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const payload = JSON.stringify({
      title: title || "Chat General",
      body: body || "",
      url: "/dashboard/chat/general",
    });

    let sent = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        );
        sent++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }

    return NextResponse.json({ sent });
  } catch {
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
