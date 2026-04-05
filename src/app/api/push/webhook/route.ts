import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const priv = process.env.VAPID_PRIVATE_KEY || "";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
    pub, priv
  );
  vapidConfigured = true;
  return true;
}

// Webhook secret to verify requests come from Supabase
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "push-webhook-secret-2024";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ensureVapid()) {
      return NextResponse.json({ error: "VAPID not configured" }, { status: 500 });
    }

    const body = await request.json();
    const { type, table, record } = body;

    if (type !== "INSERT") {
      return NextResponse.json({ ok: true });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const senderId = record.sender_id;

    // Get sender name
    const { data: senderProfile } = await adminClient
      .from("profiles")
      .select("full_name")
      .eq("id", senderId)
      .single();

    const senderName = senderProfile?.full_name || "Gym Bro";

    if (table === "messages") {
      // Private message: send to the conversation partner
      const conversationId = record.conversation_id;

      // Get conversation to find the other user
      const { data: conv } = await adminClient
        .from("conversations")
        .select("user1_id, user2_id")
        .eq("id", conversationId)
        .single();

      if (!conv) return NextResponse.json({ ok: true });

      const recipientId = conv.user1_id === senderId ? conv.user2_id : conv.user1_id;

      // Get recipient's push subscriptions
      const { data: subs } = await adminClient
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", recipientId);

      if (!subs || subs.length === 0) {
        return NextResponse.json({ sent: 0 });
      }

      const payload = JSON.stringify({
        title: senderName,
        body: (record.content || "").substring(0, 100),
        url: `/dashboard/chat/${conversationId}`,
      });

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
            await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }

      return NextResponse.json({ sent });

    } else if (table === "general_messages") {
      // General message: send to ALL users except sender
      const { data: subs } = await adminClient
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .neq("user_id", senderId);

      if (!subs || subs.length === 0) {
        return NextResponse.json({ sent: 0 });
      }

      const payload = JSON.stringify({
        title: `${senderName} en Chat General`,
        body: (record.content || "").substring(0, 100),
        url: "/dashboard/chat/general",
      });

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
            await adminClient.from("push_subscriptions").delete().eq("id", sub.id);
          }
        }
      }

      return NextResponse.json({ sent });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Webhook failed", detail: String(err) }, { status: 500 });
  }
}
