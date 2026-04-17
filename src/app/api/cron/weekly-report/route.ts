import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { Resend } from "resend";

// ============================================================
// WEEKLY REPORT CRON
// Runs every Sunday 8pm (cron: 0 20 * * 0)
// For each active user: compute stats, send email + push
// ============================================================

interface SetLog { set?: number; weight: number; reps: number }
interface ExerciseLog {
  exercise_name: string;
  sets_data: SetLog[];
  created_at: string;
}

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

function computeVolume(logs: ExerciseLog[]) {
  let sets = 0;
  let volume = 0;
  const byExercise: Record<string, number> = {};
  const maxByExercise: Record<string, number> = {};
  for (const l of logs) {
    if (!Array.isArray(l.sets_data)) continue;
    for (const s of l.sets_data) {
      if (typeof s.weight !== "number" || typeof s.reps !== "number") continue;
      sets++;
      const v = s.weight * s.reps;
      volume += v;
      byExercise[l.exercise_name] = (byExercise[l.exercise_name] || 0) + v;
      if ((s.weight || 0) > (maxByExercise[l.exercise_name] || 0)) {
        maxByExercise[l.exercise_name] = s.weight;
      }
    }
  }
  const top = Object.entries(byExercise).sort((a, b) => b[1] - a[1])[0];
  return { sets, volume, topExercise: top?.[0] || null, maxByExercise };
}

function emailHtml(params: {
  firstName: string;
  sessions: number;
  prevSessions: number;
  volume: number;
  prevVolume: number;
  sets: number;
  prs: number;
  topExercise: string | null;
  streak: number;
  xpEarned: number;
}) {
  const {
    firstName, sessions, prevSessions, volume, prevVolume,
    sets, prs, topExercise, streak, xpEarned
  } = params;
  const volDiff = prevVolume > 0 ? Math.round(((volume - prevVolume) / prevVolume) * 100) : (volume > 0 ? 100 : 0);
  const volArrow = volDiff > 0 ? "▲" : volDiff < 0 ? "▼" : "→";
  const sessDiff = sessions - prevSessions;
  const sessArrow = sessDiff > 0 ? `+${sessDiff}` : String(sessDiff);

  return `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff">
  <div style="text-align:center;margin-bottom:24px">
    <h1 style="font-size:24px;margin:0;color:#CDFF00">Tu semana, ${firstName}</h1>
    <p style="color:#888;font-size:14px;margin:4px 0 0">Resumen automatico domingo</p>
  </div>

  <div style="background:#111;border:1px solid #222;border-radius:16px;padding:20px;margin-bottom:12px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <div>
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Sesiones</div>
        <div style="font-size:40px;font-weight:900;color:#CDFF00">${sessions}</div>
        <div style="color:#888;font-size:12px">${sessArrow} vs semana anterior</div>
      </div>
      <div style="text-align:right">
        <div style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px">Volumen total</div>
        <div style="font-size:28px;font-weight:900">${Math.round(volume).toLocaleString()}kg</div>
        <div style="color:${volDiff >= 0 ? "#CDFF00" : "#ff6b6b"};font-size:12px">${volArrow} ${Math.abs(volDiff)}%</div>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:14px">
      <div style="color:#888;font-size:11px;text-transform:uppercase">Series</div>
      <div style="font-size:22px;font-weight:800">${sets}</div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:14px">
      <div style="color:#888;font-size:11px;text-transform:uppercase">PRs rotos</div>
      <div style="font-size:22px;font-weight:800;color:${prs > 0 ? "#CDFF00" : "#fff"}">${prs}</div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:14px">
      <div style="color:#888;font-size:11px;text-transform:uppercase">Racha actual</div>
      <div style="font-size:22px;font-weight:800">${streak} ${streak === 1 ? "dia" : "dias"}</div>
    </div>
    <div style="background:#111;border:1px solid #222;border-radius:12px;padding:14px">
      <div style="color:#888;font-size:11px;text-transform:uppercase">XP ganado</div>
      <div style="font-size:22px;font-weight:800">+${xpEarned}</div>
    </div>
  </div>

  ${topExercise ? `<div style="background:#111;border:1px solid #222;border-radius:12px;padding:14px;margin-bottom:20px">
    <div style="color:#888;font-size:11px;text-transform:uppercase">Tu ejercicio estrella</div>
    <div style="font-size:18px;font-weight:700">${topExercise}</div>
  </div>` : ""}

  <div style="text-align:center;margin-top:24px">
    <a href="https://pabloscarlattoentrenamientos.com/dashboard/progreso"
       style="background:#CDFF00;color:#000;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
      Ver mi progreso completo
    </a>
  </div>

  <p style="color:#666;font-size:11px;text-align:center;margin-top:28px">
    ${sessions === 0 ? "No registramos entrenos esta semana. Dale que esta semana arrancamos fuerte!"
     : sessions >= 3 ? "Semanaza. Seguí asi y los resultados vienen solos."
     : "Buena base. La proxima vamos por mas!"}<br>
    — Pablo
  </p>
</div>`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendPushToUser(sb: any, userId: string, title: string, body: string, url = "/dashboard/progreso") {
  const { data: subs } = await sb.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs?.length) return 0;
  const payload = JSON.stringify({ title, body, url });
  let sent = 0;
  for (const s of subs as { id: string; endpoint: string; p256dh: string; auth: string }[]) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
    } catch (err: unknown) {
      const code = (err as { statusCode?: number })?.statusCode;
      if (code === 410 || code === 404) await sb.from("push_subscriptions").delete().eq("id", s.id);
    }
  }
  return sent;
}

async function handle(req: NextRequest) {
  try {
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("authorization");
    // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
    const vercelCronAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Allow cron secret header OR Vercel cron bearer OR admin bearer
    if (cronSecret !== process.env.CRON_SECRET && !vercelCronAuth) {
      if (!authHeader?.startsWith("Bearer ")) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
      if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      const { data: p } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
      if (!p?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const vapidOk = configureVapid();
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

    // Week window: last 7 days ending now
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 86400000).toISOString();
    const prevWeekStart = new Date(now.getTime() - 14 * 86400000).toISOString();

    // Get all non-admin, non-deleted users with subscription or survey
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, email, onboarding_completed_at")
      .eq("is_admin", false)
      .is("deleted_at", null);

    if (!profiles) return NextResponse.json({ sent: 0, users: 0 });

    let emailsSent = 0;
    let pushesSent = 0;
    let processed = 0;

    for (const p of profiles as { id: string; full_name: string; email: string; onboarding_completed_at: string | null }[]) {
      // Only send to users who completed onboarding (skip brand-new)
      if (!p.onboarding_completed_at) continue;

      // This week
      const { data: weekLogs } = await sb
        .from("exercise_logs")
        .select("exercise_name, sets_data, created_at")
        .eq("user_id", p.id)
        .gte("created_at", weekStart);

      // Previous week
      const { data: prevLogs } = await sb
        .from("exercise_logs")
        .select("exercise_name, sets_data, created_at")
        .eq("user_id", p.id)
        .gte("created_at", prevWeekStart)
        .lt("created_at", weekStart);

      // Historical max (for PR detection) — all-time before this week
      const { data: priorLogs } = await sb
        .from("exercise_logs")
        .select("exercise_name, sets_data")
        .eq("user_id", p.id)
        .lt("created_at", weekStart);

      const week = computeVolume((weekLogs || []) as ExerciseLog[]);
      const prev = computeVolume((prevLogs || []) as ExerciseLog[]);
      const prior = computeVolume((priorLogs || []) as ExerciseLog[]);

      // Count unique days with at least one log (sessions)
      const sessionDays = new Set((weekLogs || []).map(l => new Date(l.created_at).toISOString().split("T")[0]));
      const prevSessionDays = new Set((prevLogs || []).map(l => new Date(l.created_at).toISOString().split("T")[0]));

      // PRs: exercises where max weight this week > historical max
      let prs = 0;
      for (const [ex, wkMax] of Object.entries(week.maxByExercise)) {
        if (wkMax > (prior.maxByExercise[ex] || 0)) prs++;
      }

      // Streak
      const { data: streakRow } = await sb
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", p.id)
        .maybeSingle();

      // XP earned this week (from weekly_rankings — the canonical weekly XP ledger)
      const weekStartDate = new Date(now.getTime() - 7 * 86400000).toISOString().split("T")[0];
      const { data: rankRow } = await sb
        .from("weekly_rankings")
        .select("xp_earned")
        .eq("user_id", p.id)
        .gte("week_start", weekStartDate)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      const xpEarned = rankRow?.xp_earned || 0;

      const firstName = p.full_name?.split(" ")[0] || "Crack";
      const sessions = sessionDays.size;
      const prevSessions = prevSessionDays.size;

      // Skip users with zero activity both weeks (handled by inactive cron)
      if (sessions === 0 && prevSessions === 0) continue;

      // SEND EMAIL
      if (resend && p.email) {
        try {
          await resend.emails.send({
            from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
            to: p.email,
            subject: `${firstName}, tu resumen semanal ${sessions > 0 ? `(${sessions} ${sessions === 1 ? "sesion" : "sesiones"})` : ""}`,
            html: emailHtml({
              firstName,
              sessions,
              prevSessions,
              volume: week.volume,
              prevVolume: prev.volume,
              sets: week.sets,
              prs,
              topExercise: week.topExercise,
              streak: streakRow?.current_streak || 0,
              xpEarned,
            }),
          });
          emailsSent++;
        } catch (err) {
          console.error(`Email fail ${p.email}:`, err);
        }
      }

      // SEND PUSH
      if (vapidOk) {
        const pushBody = sessions === 0
          ? `No registramos entrenos esta semana. Arrancamos fuerte manana!`
          : `${sessions} ${sessions === 1 ? "sesion" : "sesiones"} · ${Math.round(week.volume).toLocaleString()}kg${prs > 0 ? ` · ${prs} PR${prs > 1 ? "s" : ""}!` : ""}`;
        pushesSent += await sendPushToUser(sb, p.id, `Tu semana, ${firstName}`, pushBody);
      }

      await sb.from("profiles").update({ last_weekly_report_at: new Date().toISOString() }).eq("id", p.id);
      processed++;
    }

    return NextResponse.json({ processed, emailsSent, pushesSent });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;

