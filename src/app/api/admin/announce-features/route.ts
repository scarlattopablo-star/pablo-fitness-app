import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    Laburé varios días actualizando la app con funciones nuevas que te van a cambiar el entreno. Te cuento qué hay:
  </p>

  <!-- Feature 1 -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#fbbf24;font-weight:900;font-size:13px;margin:0 0 6px;letter-spacing:1px;">🏆 COMPARTÍ TUS RECORDS</p>
    <p style="font-size:16px;font-weight:700;margin:0 0 6px;">Armá tu IG Story de PR en 1 tap</p>
    <p style="color:#888;font-size:13px;margin:0;line-height:1.5;">Cuando rompés un record personal, la app genera automáticamente una imagen lista para compartir en Instagram Stories con tu nombre, el peso, y cuánto mejoraste.</p>
  </div>

  <!-- Feature 2 -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#CDFF00;font-weight:900;font-size:13px;margin:0 0 6px;letter-spacing:1px;">🤖 IA ANALIZA TU TÉCNICA</p>
    <p style="font-size:16px;font-weight:700;margin:0 0 6px;">Grabá 5 segundos y recibí feedback al instante</p>
    <p style="color:#888;font-size:13px;margin:0;line-height:1.5;">Subí un video corto de cualquier ejercicio y una IA entrenada te da puntaje, puntos positivos, correcciones y cues de activación. Ya disponible en la sección Ejercicios.</p>
  </div>

  <!-- Feature 3 -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#10b981;font-weight:900;font-size:13px;margin:0 0 6px;letter-spacing:1px;">🎯 RETO DEL MES</p>
    <p style="font-size:16px;font-weight:700;margin:0 0 6px;">Competí con todos los clientes por un premio real</p>
    <p style="color:#888;font-size:13px;margin:0;line-height:1.5;">Cada mes hay un desafío nuevo (sesiones, volumen, racha). El ganador se lleva un premio. El top 5 se muestra en tu dashboard en tiempo real.</p>
  </div>

  <!-- Feature 4 -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:16px;">
    <p style="color:#a78bfa;font-weight:900;font-size:13px;margin:0 0 6px;letter-spacing:1px;">📊 SUGERENCIAS DE PESO CON IA</p>
    <p style="font-size:16px;font-weight:700;margin:0 0 6px;">La app sabe cuándo subir el peso</p>
    <p style="color:#888;font-size:13px;margin:0;line-height:1.5;">Basado en tus sesiones anteriores y esfuerzo percibido, la app te dice exactamente cuánto poner en la barra para seguir progresando sin sobrecargar.</p>
  </div>

  <!-- Feature 5 -->
  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:28px;">
    <p style="color:#f97316;font-weight:900;font-size:13px;margin:0 0 6px;letter-spacing:1px;">📸 ANTES/DESPUÉS INTERACTIVO</p>
    <p style="font-size:16px;font-weight:700;margin:0 0 6px;">Slider para ver tu transformación</p>
    <p style="color:#888;font-size:13px;margin:0;line-height:1.5;">En la sección Progreso podés deslizar entre tus fotos y ver visualmente cuánto cambiaste. Con diferencia de peso y días automática.</p>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:32px;">
    <a href="https://pabloscarlattoentrenamientos.com/dashboard"
       style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:16px;padding:16px 40px;border-radius:14px;text-decoration:none;">
      Ver todo en la app →
    </a>
  </div>

  <p style="color:#555;font-size:13px;line-height:1.6;text-align:center;">
    Cualquier duda escribime directo por el chat de la app.<br>
    Estoy para ayudarte a sacar el máximo.
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
    // Verify admin via Bearer token
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
      // Allow from admin UI via same-origin (no auth header case handled by caller)
      // For extra safety, check a simple secret as fallback
      const secret = request.headers.get("x-admin-secret");
      if (secret !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Get all active subscribers
    const { data: activeSubs, error: subsError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id, status")
      .in("status", ["active", "trial", "trial_3m"]);

    if (subsError) throw subsError;

    if (!activeSubs || activeSubs.length === 0) {
      return NextResponse.json({ success: true, results: { email: { sent: 0, failed: 0 }, push: { sent: 0, failed: 0 } } });
    }

    // Get profiles for those users
    const userIds = activeSubs.map(s => s.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)
      .eq("is_admin", false);

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Configure VAPID
    const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
    const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
    if (pub && priv) {
      webpush.setVapidDetails(
        process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
        pub, priv
      );
    }

    const results = {
      email: { sent: 0, failed: 0 },
      push: { sent: 0, failed: 0 },
    };

    for (const profile of profiles ?? []) {
      const firstName = (profile.full_name || "").split(" ")[0] || "Usuario";
      const email = profile.email;

      // Send email
      if (email) {
        try {
          await resend.emails.send({
            from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
            to: email,
            subject: `${firstName}, hay funciones nuevas en la app 🚀`,
            html: buildEmail(firstName),
          });
          results.email.sent++;
        } catch {
          results.email.failed++;
        }
        // Rate limit
        await new Promise(r => setTimeout(r, 200));
      }

      // Send push notification
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
                title: "Hay novedades en la app! 🚀",
                body: "IA para técnica, compartir PRs, retos del mes y más. Entrá a ver.",
                url: "/dashboard",
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

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
