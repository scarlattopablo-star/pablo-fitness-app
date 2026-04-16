import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

// Motivational messages by inactivity tier
const MESSAGES = {
  // 3-5 days inactive — gentle nudge
  gentle: [
    {
      push: { title: "Te extrañamos en el gym!", body: "Hace unos dias que no entrenas. Tu plan te espera, una sesion corta es mejor que ninguna." },
      chat: "Hola! Vi que hace unos dias no entrenas. Esta todo bien? Acordate que la constancia es la clave. Si necesitas ajustar algo del plan, escribime.",
      email: { subject: "Tu plan de entrenamiento te espera", body: "hace unos dias que no te vemos por la app. Queria recordarte que tu plan personalizado esta listo esperandote. Una sesion corta es mejor que ninguna — la constancia es lo que da resultados.\n\nSi necesitas que ajuste algo de tu rutina o nutricion, escribime sin problema." },
    },
  ],
  // 6-10 days — urgency
  urgent: [
    {
      push: { title: "Tu racha se perdio!", body: "Llevas mas de una semana sin entrenar. Volvé hoy — 20 minutos bastan para retomar el ritmo." },
      chat: "Hey! Llevas varios dias sin entrenar y tu racha se perdio. No dejes que se enfrie el progreso que venias haciendo. Volvé hoy aunque sea con una sesion liviana. 20 minutos bastan!",
      email: { subject: "No pierdas tu progreso — volve a entrenar", body: "llevas mas de una semana sin entrenar y queria escribirte personalmente. Se que a veces cuesta retomar, pero cada dia que pasa es progreso que se pierde.\n\nNo necesitas hacer una sesion perfecta — con 20 minutos hoy ya estas de vuelta en carrera. Tu plan esta ahi esperandote." },
    },
  ],
  // 11+ days — personal reach
  personal: [
    {
      push: { title: "Pablo te escribio un mensaje", body: "Abri la app para ver que te dijo tu entrenador." },
      chat: "Hola! Hace bastante que no entrenas y queria saber como estas. Si algo del plan no te esta funcionando o necesitas cambiar el enfoque, decime y lo ajustamos. Estoy para ayudarte a lograr tu objetivo. Volvé cuando quieras, tu plan sigue activo!",
      email: { subject: "Como estas? — Mensaje de Pablo, tu entrenador", body: "hace un tiempo que no te veo por la app y queria escribirte personalmente para saber como estas.\n\nSi algo del plan no te esta funcionando, si necesitas cambiar ejercicios, ajustar la nutricion o simplemente charlar sobre tu proceso — escribime. Para eso estoy.\n\nTu plan sigue activo y personalizado para vos. Cuando quieras volver, esta todo listo." },
    },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    // Allow cron calls with service key or admin auth
    const isCron = authHeader === `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (!isCron) {
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      const token = authHeader.slice(7);
      const { data: { user } } = await sb.auth.getUser(token);
      if (!user) return NextResponse.json({ error: "Token invalido" }, { status: 401 });
      const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Get all non-admin, non-deleted profiles
    const { data: profiles } = await sb.from("profiles").select("id, full_name, email").eq("is_admin", false).is("deleted_at", null);
    if (!profiles?.length) return NextResponse.json({ nudged: 0 });

    // Get latest exercise log per user
    const { data: logs } = await sb.from("exercise_logs").select("user_id, created_at").order("created_at", { ascending: false });

    const lastActivity: Record<string, string> = {};
    for (const log of (logs || [])) {
      if (!lastActivity[log.user_id]) lastActivity[log.user_id] = log.created_at;
    }

    const now = Date.now();
    const results = { gentle: 0, urgent: 0, personal: 0, skipped: 0, errors: 0 };

    // Configure web push
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    const resend = new Resend(process.env.RESEND_API_KEY);

    for (const profile of profiles) {
      const last = lastActivity[profile.id];
      const daysSince = last
        ? Math.floor((now - new Date(last).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Skip active users (trained in last 3 days)
      if (daysSince < 3) { results.skipped++; continue; }

      // Determine tier
      let tier: "gentle" | "urgent" | "personal";
      if (daysSince <= 5) tier = "gentle";
      else if (daysSince <= 10) tier = "urgent";
      else tier = "personal";

      // Don't nudge the same user more than once per 3 days — check last nudge
      const [nu1, nu2] = ADMIN_ID < profile.id ? [ADMIN_ID, profile.id] : [profile.id, ADMIN_ID];
      const { data: existingConv } = await sb.from("conversations")
        .select("id")
        .eq("user1_id", nu1)
        .eq("user2_id", nu2)
        .maybeSingle();

      let lastNudge = null;
      if (existingConv) {
        const { data: nudgeMsg } = await sb
          .from("messages")
          .select("created_at")
          .eq("conversation_id", existingConv.id)
          .eq("sender_id", ADMIN_ID)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastNudge = nudgeMsg;
      }

      if (lastNudge) {
        const daysSinceNudge = Math.floor((now - new Date(lastNudge.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceNudge < 3) { results.skipped++; continue; }
      }

      const msg = MESSAGES[tier][0];
      const firstName = (profile.full_name || "").split(" ")[0] || "Crack";

      try {
        // 1. Send push notification
        const { data: subs } = await sb.from("push_subscriptions").select("subscription").eq("user_id", profile.id);
        if (subs?.length) {
          for (const sub of subs) {
            try {
              await webpush.sendNotification(
                sub.subscription,
                JSON.stringify({ title: msg.push.title, body: msg.push.body, url: "/dashboard/plan" })
              );
            } catch { /* subscription expired, ignore */ }
          }
        }

        // 2. Send chat message — ensure conversation exists first
        const [u1, u2] = ADMIN_ID < profile.id ? [ADMIN_ID, profile.id] : [profile.id, ADMIN_ID];
        const { data: conv } = await sb.from("conversations")
          .select("id")
          .eq("user1_id", u1)
          .eq("user2_id", u2)
          .maybeSingle();

        let convId: string;
        if (conv) {
          convId = conv.id;
        } else {
          const { data: newConv } = await sb.from("conversations")
            .insert({ user1_id: u1, user2_id: u2 })
            .select("id")
            .single();
          convId = newConv?.id;
        }

        if (convId) {
          await sb.from("messages").insert({
            conversation_id: convId,
            sender_id: ADMIN_ID,
            content: msg.chat,
          });
          await sb.from("conversations").update({
            last_message_at: new Date().toISOString(),
            last_message_preview: msg.chat.slice(0, 100),
          }).eq("id", convId);
        }

        // 3. Send email
        if (profile.email) {
          await resend.emails.send({
            from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
            to: profile.email,
            subject: msg.email.subject,
            html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <p>Hola ${firstName}!</p>
              <p>${msg.email.body.replace(/\n/g, "</p><p>")}</p>
              <p style="margin-top:20px;"><a href="https://pabloscarlattoentrenamientos.com/dashboard/plan" style="background:#CDFF00;color:#000;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block;">Abrir mi plan de entrenamiento</a></p>
              <p style="color:#888;font-size:12px;margin-top:20px;">— Pablo Scarlatto, tu entrenador personal</p>
            </div>`,
          });
        }

        results[tier]++;
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
