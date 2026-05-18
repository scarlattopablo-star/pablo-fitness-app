import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 120;

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

// ─── Mensaje 1: todos los usuarios ───────────────────────────────────────────

function buildChatMotivacion(name: string): string {
  return `Hola ${name}! 💪

Mañana es un gran día para entrenar. Tu cuerpo está listo — solo falta que vos aparezcas.

Recordá hidratarte bien esta noche y dormir temprano. Nos vemos mañana. 🔥`;
}

function buildEmailMotivacion(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:13px;padding:6px 16px;border-radius:99px;letter-spacing:1px;">PABLO SCARLATTO ENTRENAMIENTOS</div>
  </div>
  <h1 style="font-size:32px;font-weight:900;margin:0 0 12px;line-height:1.2;">💪 Mañana te espero en el gym</h1>
  <p style="color:#aaa;font-size:16px;line-height:1.7;margin:0 0 28px;">
    Hola ${name}, tu cuerpo ya está preparado. Mañana es un gran día para entrenar — solo falta que vos aparezcas.
  </p>
  <div style="background:#111;border-left:4px solid #CDFF00;border-radius:0 12px 12px 0;padding:20px 24px;margin-bottom:28px;">
    <p style="margin:0;font-size:15px;line-height:1.7;color:#ddd;">
      Hidratate bien esta noche, dormí temprano y llegá con energía. Cada sesión es un paso más cerca de quien querés ser.
    </p>
  </div>
  <div style="text-align:center;margin-bottom:32px;">
    <a href="https://pabloscarlattoentrenamientos.com/dashboard"
       style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:16px;padding:16px 40px;border-radius:14px;text-decoration:none;">
      Ver mi plan de entrenamiento →
    </a>
  </div>
  <p style="color:#555;font-size:13px;line-height:1.6;text-align:center;">
    — Pablo Scarlatto
  </p>
  <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;">
  <p style="color:#333;font-size:11px;text-align:center;">Pablo Scarlatto Entrenamientos · pabloscarlattoentrenamientos.com</p>
</div>
</body>
</html>`;
}

// ─── Mensaje 2: usuarios sin plan activo / gratuitos ─────────────────────────

function buildChatReto(name: string): string {
  return `Hola ${name}! 🔥

Quiero invitarte al *Reto Transformación 30 Días*.

En 30 días vas a tener:
✅ Plan de entrenamiento personalizado
✅ Plan de nutrición ajustado a tus objetivos
✅ Seguimiento directo conmigo
✅ Resultados reales

Los que arrancaron ya están viendo cambios. ¿Te sumás?

👉 https://pabloscarlattoentrenamientos.com/planes/reto-30-dias

Cualquier consulta respondeme acá!`;
}

function buildEmailReto(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:13px;padding:6px 16px;border-radius:99px;letter-spacing:1px;">PABLO SCARLATTO ENTRENAMIENTOS</div>
  </div>
  <h1 style="font-size:30px;font-weight:900;margin:0 0 12px;line-height:1.2;">🔥 30 días para cambiar tu cuerpo</h1>
  <p style="color:#aaa;font-size:16px;line-height:1.7;margin:0 0 28px;">
    Hola ${name}, todavía no arrancaste y el tiempo pasa. El Reto Transformación 30 Días está diseñado exactamente para vos.
  </p>
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:16px;">
    <p style="color:#CDFF00;font-weight:900;font-size:12px;margin:0 0 12px;letter-spacing:1px;">LO QUE INCLUYE</p>
    <div style="display:flex;flex-direction:column;gap:10px;">
      <p style="margin:0;font-size:15px;">✅ Plan de entrenamiento personalizado</p>
      <p style="margin:0;font-size:15px;">✅ Plan de nutrición ajustado a tus objetivos</p>
      <p style="margin:0;font-size:15px;">✅ Seguimiento directo con Pablo</p>
      <p style="margin:0;font-size:15px;">✅ Resultados reales en 30 días</p>
    </div>
  </div>
  <div style="background:#1a1a00;border:1px solid #CDFF00;border-radius:16px;padding:20px;margin-bottom:28px;text-align:center;">
    <p style="color:#CDFF00;font-weight:900;font-size:14px;margin:0 0 6px;">Los que arrancaron ya están viendo cambios.</p>
    <p style="color:#888;font-size:13px;margin:0;">Quedan pocos lugares disponibles.</p>
  </div>
  <div style="text-align:center;margin-bottom:32px;">
    <a href="https://pabloscarlattoentrenamientos.com/planes/reto-30-dias"
       style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:16px;padding:16px 40px;border-radius:14px;text-decoration:none;">
      Quiero sumarme al Reto →
    </a>
  </div>
  <p style="color:#555;font-size:13px;line-height:1.6;text-align:center;">
    Cualquier consulta respondeme por el chat de la app o por Instagram.<br>— Pablo Scarlatto
  </p>
  <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;">
  <p style="color:#333;font-size:11px;text-align:center;">Pablo Scarlatto Entrenamientos · pabloscarlattoentrenamientos.com</p>
</div>
</body>
</html>`;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function sendPush(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  url: string
): Promise<{ sent: number; failed: number }> {
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  let sent = 0, failed = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body, url })
      );
      sent++;
    } catch (err: unknown) {
      const statusCode = (err as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) {
        await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
      }
      failed++;
    }
  }
  return { sent, failed };
}

async function sendChat(
  supabaseAdmin: ReturnType<typeof createClient>,
  userId: string,
  text: string
): Promise<void> {
  const [u1, u2] = userId < ADMIN_ID ? [userId, ADMIN_ID] : [ADMIN_ID, userId];
  let conversationId: string;

  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .single();

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error } = await supabaseAdmin
      .from("conversations")
      .insert({ user1_id: u1, user2_id: u2 })
      .select("id")
      .single();
    if (error || !created) throw error || new Error("no conv");
    conversationId = created.id;
  }

  await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: ADMIN_ID,
    content: text,
  });
  await supabaseAdmin.from("conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_preview: text.substring(0, 100),
  }).eq("id", conversationId);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auth
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("is_admin").eq("id", user?.id ?? "").single();
      if (!profile?.is_admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {
      const secret = request.headers.get("x-admin-secret");
      if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // VAPID
    const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
    const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
    if (pub && priv) {
      webpush.setVapidDetails(
        process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
        pub, priv
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // ── Todos los perfiles no-admin ──────────────────────────────────────────
    const { data: allProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("is_admin", false)
      .is("deleted_at", null);

    // ── Usuarios con suscripción activa ──────────────────────────────────────
    const { data: activeSubs } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .in("status", ["active", "trial", "trial_3m"]);

    const activeIds = new Set((activeSubs ?? []).map(s => s.user_id));

    const results = {
      msg1: { email: { sent: 0, failed: 0 }, push: { sent: 0, failed: 0 }, chat: { sent: 0, failed: 0 } },
      msg2: { email: { sent: 0, failed: 0 }, push: { sent: 0, failed: 0 }, chat: { sent: 0, failed: 0 } },
    };

    for (const profile of allProfiles ?? []) {
      const name = (profile.full_name || "").split(" ")[0] || "Usuario";
      const email = profile.email;

      // ── Mensaje 1: TODOS ────────────────────────────────────────────────────
      if (email) {
        try {
          await resend.emails.send({
            from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
            to: email,
            subject: `💪 Mañana te espero en el gym`,
            html: buildEmailMotivacion(name),
          });
          results.msg1.email.sent++;
        } catch { results.msg1.email.failed++; }
        await new Promise(r => setTimeout(r, 150));
      }

      try {
        await sendChat(supabaseAdmin, profile.id, buildChatMotivacion(name));
        results.msg1.chat.sent++;
      } catch { results.msg1.chat.failed++; }

      const p1 = await sendPush(supabaseAdmin, profile.id,
        "💪 Mañana es tu día",
        "Tu cuerpo está listo. Mañana es un gran día para entrenar. ¿Lo hacemos?",
        "/dashboard"
      );
      results.msg1.push.sent += p1.sent;
      results.msg1.push.failed += p1.failed;

      // ── Mensaje 2: solo usuarios SIN suscripción activa ─────────────────────
      if (!activeIds.has(profile.id)) {
        if (email) {
          try {
            await resend.emails.send({
              from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
              to: email,
              subject: `🔥 30 días para cambiar tu cuerpo — empezamos ya`,
              html: buildEmailReto(name),
            });
            results.msg2.email.sent++;
          } catch { results.msg2.email.failed++; }
          await new Promise(r => setTimeout(r, 150));
        }

        try {
          await sendChat(supabaseAdmin, profile.id, buildChatReto(name));
          results.msg2.chat.sent++;
        } catch { results.msg2.chat.failed++; }

        const p2 = await sendPush(supabaseAdmin, profile.id,
          "🔥 El Reto 30 Días te está esperando",
          "Transformá tu cuerpo en 30 días con un plan personalizado. Quedan pocos lugares.",
          "/planes/reto-30-dias"
        );
        results.msg2.push.sent += p2.sent;
        results.msg2.push.failed += p2.failed;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        msg1: `Email: ${results.msg1.email.sent} · Chat: ${results.msg1.chat.sent} · Push: ${results.msg1.push.sent}`,
        msg2: `Email: ${results.msg2.email.sent} · Chat: ${results.msg2.chat.sent} · Push: ${results.msg2.push.sent}`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
