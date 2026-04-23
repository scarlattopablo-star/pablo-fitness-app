// Anuncio masivo: lanzamiento Reto Gluteos 360 + nueva funcion "Actividad extra".
// Envia email + mensaje en el chat interno + push. Solo admin puede disparar.
// Reutiliza la misma infra que /api/admin/announce-features.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 60;

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f"; // Pablo

function buildChatMessage(name: string): string {
  return `Hola ${name}! 👋

Dos novedades importantes:

💪 *NUEVO RETO · Gluteos 360 · 21 dias*
Rutina simple (casa o gym) + guia de alimentacion flexible + seguimiento directo conmigo. Pensado para mujeres que entrenan y no ven cambios. Cupos limitados cada mes.

🔥 *Funcion nueva: Actividad extra*
Ahora podes registrar lo que haces fuera del plan — correr, futbol, kitesurf, caminata, HIIT, lo que sea. La app te calcula kcal quemadas y te suma XP para mantener la racha.

Lo encontras en tu dashboard, debajo del banner del reto. Probalo y contame que te parece 💥`;
}

function buildEmail(name: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">

  <!-- Header -->
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:13px;padding:6px 16px;border-radius:99px;letter-spacing:1px;">PABLO SCARLATTO ENTRENAMIENTOS</div>
  </div>

  <h1 style="font-size:28px;font-weight:900;margin:0 0 8px;line-height:1.2;">Hola ${name}! 👋</h1>
  <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 28px;">
    Dos novedades importantes que te cuento en 30 segundos:
  </p>

  <!-- Reto Gluteos 360 -->
  <div style="background:#111;border:2px solid #ff6ec7;border-radius:16px;padding:24px;margin-bottom:20px;">
    <p style="color:#ff6ec7;font-weight:900;font-size:13px;margin:0 0 8px;letter-spacing:1px;">💪 NUEVO · RETO GLÚTEOS 360</p>
    <p style="font-size:22px;font-weight:800;margin:0 0 6px;line-height:1.3;">21 días enfocados en glúteos y abdomen.</p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Rutina simple <strong>en casa o gym</strong>, guía de alimentación flexible, y seguimiento directo conmigo. Pensado para mujeres que entrenan y no ven cambios.
    </p>
    <ul style="color:#ccc;font-size:13px;line-height:1.7;padding-left:20px;margin:0 0 18px;">
      <li>Rutina adaptada para casa o gimnasio</li>
      <li>Guía de alimentación flexible (sin dietas extremas)</li>
      <li>Seguimiento de fotos, peso y medidas en la app</li>
      <li>Acceso inmediato y chat directo conmigo</li>
    </ul>
    <div style="display:inline-block;background:#ff6ec7;color:#000;font-weight:900;font-size:22px;padding:12px 24px;border-radius:14px;">
      $599 UYU
    </div>
    <p style="color:#888;font-size:11px;margin:14px 0 0;">Cupos limitados cada mes.</p>
  </div>

  <!-- Actividad extra -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:24px;margin-bottom:20px;">
    <p style="color:#f97316;font-weight:900;font-size:13px;margin:0 0 8px;letter-spacing:1px;">🔥 NUEVA FUNCIÓN · ACTIVIDAD EXTRA</p>
    <p style="font-size:20px;font-weight:800;margin:0 0 6px;line-height:1.3;">Sumá lo que hacés por fuera del plan.</p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 16px;">
      Correr, fútbol, kitesurf, caminata, HIIT — lo que hagas por tu cuenta ahora se registra en la app.
      Te calculamos las calorías quemadas según tu peso e intensidad, te sumamos XP y mantenés la racha.
    </p>
    <p style="color:#888;font-size:13px;margin:0;">
      Ya disponible en tu dashboard, debajo del banner del reto.
    </p>
  </div>

  <!-- CTAs -->
  <div style="text-align:center;margin:32px 0;">
    <a href="https://pabloscarlattoentrenamientos.com/planes/glutes-360"
       style="display:inline-block;background:#ff6ec7;color:#000;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;margin:6px;">
      Quiero el reto →
    </a>
    <a href="https://pabloscarlattoentrenamientos.com/dashboard"
       style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;margin:6px;">
      Abrir la app →
    </a>
  </div>

  <p style="color:#555;font-size:13px;line-height:1.6;text-align:center;">
    Cualquier duda escribime directo por el chat de la app.<br>
    — Pablo
  </p>

  <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;">
  <p style="color:#333;font-size:11px;text-align:center;">
    Pablo Scarlatto Entrenamientos · pabloscarlattoentrenamientos.com
  </p>
</div>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("is_admin")
        .eq("id", user?.id ?? "")
        .single();
      if (!profile?.is_admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const secret = request.headers.get("x-admin-secret");
      if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Alcance: clientes con subscripcion activa O trial.
    // (Si queres incluir leads o registros sin sub, se puede ampliar despues.)
    const { data: activeSubs, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status")
      .in("status", ["active", "trial", "trial_3m"]);

    if (subsError) throw subsError;

    if (!activeSubs || activeSubs.length === 0) {
      return NextResponse.json({
        success: true,
        results: { email: { sent: 0, failed: 0 }, chat: { sent: 0, failed: 0 }, push: { sent: 0, failed: 0 } },
      });
    }

    const userIds = activeSubs.map((s) => s.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .eq("is_admin", false);

    const resend = new Resend(process.env.RESEND_API_KEY);

    const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
    const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
    if (pub && priv) {
      webpush.setVapidDetails(
        process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
        pub,
        priv
      );
    }

    const results = {
      email: { sent: 0, failed: 0 },
      chat: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 },
    };

    for (const profile of profiles ?? []) {
      const firstName = (profile.full_name || "").split(" ")[0] || "Usuario";
      const email = profile.email;

      // 1) Email
      if (email) {
        try {
          await resend.emails.send({
            from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
            to: email,
            subject: `${firstName}, lanzamos el reto Glúteos 360 + nueva función en la app 💪`,
            html: buildEmail(firstName),
          });
          results.email.sent++;
        } catch {
          results.email.failed++;
        }
        await new Promise((r) => setTimeout(r, 150));
      }

      // 2) Mensaje en el chat interno como Pablo (admin)
      try {
        const userId = profile.id;
        const [user1, user2] = userId < ADMIN_ID ? [userId, ADMIN_ID] : [ADMIN_ID, userId];

        let conversationId: string;
        const { data: existing } = await supabaseAdmin
          .from("conversations")
          .select("id")
          .eq("user1_id", user1)
          .eq("user2_id", user2)
          .single();

        if (existing) {
          conversationId = existing.id;
        } else {
          const { data: created, error: convErr } = await supabaseAdmin
            .from("conversations")
            .insert({ user1_id: user1, user2_id: user2 })
            .select("id")
            .single();
          if (convErr || !created) throw convErr || new Error("no conv");
          conversationId = created.id;
        }

        const chatText = buildChatMessage(firstName);
        const { error: msgErr } = await supabaseAdmin.from("messages").insert({
          conversation_id: conversationId,
          sender_id: ADMIN_ID,
          content: chatText,
        });
        if (msgErr) throw msgErr;

        await supabaseAdmin
          .from("conversations")
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: chatText.substring(0, 100),
          })
          .eq("id", conversationId);

        results.chat.sent++;
      } catch {
        results.chat.failed++;
      }

      // 3) Push
      try {
        const { data: subs } = await supabaseAdmin
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("user_id", profile.id);

        for (const sub of subs ?? []) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              JSON.stringify({
                title: "Pablo te mando un mensaje 💬",
                body: "Nuevo reto Gluteos 360 + funcion para registrar actividad extra. Entra a verlo.",
                url: "/dashboard/chat",
              })
            );
            results.push.sent++;
          } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await supabaseAdmin.from("push_subscriptions").delete().eq("id", sub.id);
            }
            results.push.failed++;
          }
        }
      } catch {
        results.push.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: `Email: ${results.email.sent} enviados · Chat: ${results.chat.sent} enviados · Push: ${results.push.sent} enviados`,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
