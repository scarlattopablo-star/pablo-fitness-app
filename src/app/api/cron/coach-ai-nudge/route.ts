import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import webpush from "web-push";

// ============================================================
// COACH AI PROACTIVE NUDGE (runs daily)
// Finds users who are inactive 2-10 days, haven't been nudged in 3+ days,
// and sends a personalized AI-generated message from "Pablo" into their
// chat + a push notification.
// ============================================================

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

const SYSTEM_PROMPT = `Sos Pablo Scarlatto, entrenador personal uruguayo campeon de fisicoculturismo 2019.
ESTILO: Español rioplatense informal (vos, tenes, dale). Motivador, directo, sin corporativo. Maximo 2 frases.
OBJETIVO: Escribir un mensaje PROACTIVO corto (2-3 lineas MAX) a un cliente que dejo de entrenar hace varios dias. Debe ser PERSONAL usando el contexto dado. No genericho.
REGLAS:
- Nunca digas que sos IA
- No uses mas de 1 emoji
- Termina con una pregunta o llamada a la accion concreta
- Tono: preocupado pero sin culpa. Amigo que nota algo.`;

function configureVapid() {
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
    pub, priv
  );
  return true;
}

async function handle(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("authorization");
    const vercelCronAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (cronSecret !== process.env.CRON_SECRET && !vercelCronAuth) {
      if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
      if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const { data: p } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!p?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY missing" }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const vapidOk = configureVapid();

    // Find candidates: onboarded, no activity for 2-10 days
    const now = Date.now();
    const twoDaysAgo = new Date(now - 2 * 86400000).toISOString().split("T")[0];
    const tenDaysAgo = new Date(now - 10 * 86400000).toISOString().split("T")[0];

    const { data: streaks } = await sb
      .from("user_streaks")
      .select("user_id, last_activity_date, max_streak")
      .lte("last_activity_date", twoDaysAgo)
      .gte("last_activity_date", tenDaysAgo);

    if (!streaks || streaks.length === 0) return NextResponse.json({ sent: 0, candidates: 0 });

    const userIds = streaks.map(s => s.user_id);
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, welcome_goal_7d, onboarding_completed_at")
      .in("id", userIds)
      .eq("is_admin", false)
      .is("deleted_at", null)
      .not("onboarding_completed_at", "is", null);

    let sent = 0;

    for (const profile of (profiles || [])) {
      const streak = streaks.find(s => s.user_id === profile.id);
      if (!streak) continue;
      const daysSince = Math.floor((now - new Date(streak.last_activity_date).getTime()) / 86400000);

      // Skip if we nudged this user in last 3 days via this route
      const conversationId = await getOrCreateConversation(sb, profile.id);
      if (!conversationId) continue;

      const { data: lastBotMsg } = await sb
        .from("messages")
        .select("created_at")
        .eq("conversation_id", conversationId)
        .eq("sender_id", ADMIN_ID)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastBotMsg) {
        const hoursSince = (now - new Date(lastBotMsg.created_at).getTime()) / 3_600_000;
        if (hoursSince < 72) continue;
      }

      // Gather context for personalization
      const { data: recentLogs } = await sb
        .from("exercise_logs")
        .select("exercise_name, sets_data, created_at")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5);

      const firstName = profile.full_name?.split(" ")[0] || "Crack";
      const recentEx = (recentLogs || []).map(l => {
        const top = Array.isArray(l.sets_data) ? (l.sets_data as { weight: number; reps: number }[])
          .reduce((b, s) => (s.weight > b.weight ? s : b), { weight: 0, reps: 0 }) : null;
        return top ? `${l.exercise_name} ${top.weight}kg x${top.reps}` : l.exercise_name;
      }).slice(0, 3).join(", ");

      const context = `Cliente: ${firstName}.
Dias sin entrenar: ${daysSince}.
Racha maxima historica: ${streak.max_streak || 0} dias.
Meta de 7 dias que se propuso: ${profile.welcome_goal_7d || "no definida"}.
Ultimos ejercicios que hizo: ${recentEx || "ninguno registrado"}.`;

      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 200,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Escribime un mensaje proactivo para este cliente, muy corto y personal:\n\n${context}`,
          }],
        });

        const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";
        if (!text) continue;

        // Insert as Pablo message
        await sb.from("messages").insert({
          conversation_id: conversationId,
          sender_id: ADMIN_ID,
          content: text,
        });
        await sb.from("conversations").update({
          last_message_at: new Date().toISOString(),
          last_message_preview: text.slice(0, 100),
        }).eq("id", conversationId);

        // Push
        if (vapidOk) {
          const { data: subs } = await sb
            .from("push_subscriptions")
            .select("id, endpoint, p256dh, auth")
            .eq("user_id", profile.id);
          for (const s of (subs || []) as { id: string; endpoint: string; p256dh: string; auth: string }[]) {
            try {
              await webpush.sendNotification(
                { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
                JSON.stringify({
                  title: "Pablo te mando un mensaje",
                  body: text.slice(0, 120),
                  url: `/dashboard/chat/${conversationId}`,
                })
              );
            } catch (err: unknown) {
              const code = (err as { statusCode?: number })?.statusCode;
              if (code === 410 || code === 404) await sb.from("push_subscriptions").delete().eq("id", s.id);
            }
          }
        }

        sent++;
      } catch (err) {
        console.error(`AI nudge fail for ${profile.id}:`, err);
      }
    }

    return NextResponse.json({ sent, candidates: profiles?.length || 0 });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getOrCreateConversation(sb: any, userId: string): Promise<string | null> {
  const [u1, u2] = ADMIN_ID < userId ? [ADMIN_ID, userId] : [userId, ADMIN_ID];
  const { data: existing } = await sb.from("conversations")
    .select("id")
    .eq("user1_id", u1)
    .eq("user2_id", u2)
    .maybeSingle();
  if (existing) return existing.id;
  const { data: created } = await sb.from("conversations")
    .insert({ user1_id: u1, user2_id: u2 })
    .select("id")
    .single();
  return created?.id || null;
}

export const POST = handle;
export const GET = handle;
