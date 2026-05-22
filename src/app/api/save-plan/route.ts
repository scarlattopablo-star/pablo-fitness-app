import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit-log";
import webpush from "web-push";
import { Resend } from "resend";

let vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return true;
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
  if (!pub || !priv) return false;
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
    pub,
    priv
  );
  vapidConfigured = true;
  return true;
}

async function notifyClientPlanUpdated(
  supabase: SupabaseClient,
  adminId: string,
  clientId: string,
  planType: "training" | "nutrition"
) {
  const planLabel = planType === "training" ? "entrenamiento" : "nutricion";
  const planLabelCap = planType === "training" ? "Entrenamiento" : "Nutricion";

  // Get client profile
  const { data: clientProfile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", clientId)
    .single();

  if (!clientProfile) return;

  const clientName = clientProfile.full_name?.split(" ")[0] || "Cliente";
  const chatMsg = `Hola ${clientName}! 👋 Actualice tu plan de ${planLabel}. Revisa los cambios en la app — cualquier duda me avisas.`;

  // --- 1. Chat message ---
  try {
    // Sort user IDs to get consistent conversation key
    const [u1, u2] = adminId < clientId ? [adminId, clientId] : [clientId, adminId];

    // Get or create conversation
    let { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("user1_id", u1)
      .eq("user2_id", u2)
      .maybeSingle();

    if (!conv) {
      const { data: created } = await supabase
        .from("conversations")
        .insert({ user1_id: u1, user2_id: u2 })
        .select("id")
        .single();
      conv = created;
    }

    if (conv?.id) {
      await supabase.from("messages").insert({
        conversation_id: conv.id,
        sender_id: adminId,
        content: chatMsg,
      });

      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: chatMsg.slice(0, 100),
        })
        .eq("id", conv.id);
    }
  } catch {
    // Non-fatal — continue with push + email
  }

  // --- 2. Push notification ---
  try {
    if (ensureVapid()) {
      const { data: subs } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth")
        .eq("user_id", clientId);

      if (subs?.length) {
        const payload = JSON.stringify({
          title: `Plan de ${planLabelCap} actualizado`,
          body: `Pablo actualizo tu plan. Revisa los cambios ahora.`,
          url: planType === "training" ? "/dashboard/plan" : "/dashboard/nutricion",
        });
        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              payload
            );
          } catch (err: unknown) {
            const statusCode = (err as { statusCode?: number })?.statusCode;
            if (statusCode === 410 || statusCode === 404) {
              await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            }
          }
        }
      }
    }
  } catch {
    // Non-fatal
  }

  // --- 3. Email ---
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && clientProfile.email) {
      const resend = new Resend(resendKey);
      const dashUrl = planType === "training"
        ? "https://pabloscarlattoentrenamientos.com/dashboard/plan"
        : "https://pabloscarlattoentrenamientos.com/dashboard/nutricion";

      await resend.emails.send({
        from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
        to: clientProfile.email,
        subject: `Tu plan de ${planLabel} fue actualizado`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;margin:0;padding:20px;">
  <div style="max-width:480px;margin:0 auto;background:#111;border-radius:16px;border:1px solid #222;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#c8ff00,#00ff88);padding:24px;text-align:center;">
      <p style="margin:0;font-size:32px;">💪</p>
      <h1 style="margin:8px 0 0;font-size:20px;color:#000;font-weight:900;">
        Plan de ${planLabelCap} Actualizado
      </h1>
    </div>
    <div style="padding:24px;">
      <p style="color:#ccc;font-size:15px;line-height:1.6;">
        Hola <strong>${clientName}</strong>,
      </p>
      <p style="color:#ccc;font-size:15px;line-height:1.6;">
        Pablo actualizó tu plan de <strong>${planLabel}</strong>.
        Ingresá a la app para ver los cambios y, si tenés alguna duda, escribile por el chat.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${dashUrl}"
           style="display:inline-block;background:#c8ff00;color:#000;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          Ver mi plan actualizado →
        </a>
      </div>
      <p style="color:#555;font-size:12px;text-align:center;margin-top:16px;">
        Pablo Scarlatto Entrenamientos &nbsp;·&nbsp;
        <a href="https://pabloscarlattoentrenamientos.com" style="color:#555;">pabloscarlattoentrenamientos.com</a>
      </p>
    </div>
  </div>
</body>
</html>`,
      });
    }
  } catch {
    // Non-fatal
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, type, data } = body;

    if (!clientId || !type || !data) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin via auth token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // --- Helper: snapshot current plan into plan_versions before overwriting ---
    async function snapshotPlan(
      planId: string,
      planType: "training" | "nutrition",
      planData: unknown,
      importantNotes?: unknown,
    ) {
      try {
        // Get next version number
        const { count } = await supabase
          .from("plan_versions")
          .select("id", { count: "exact", head: true })
          .eq("plan_id", planId)
          .eq("plan_type", planType);
        const versionNumber = (count || 0) + 1;

        await supabase.from("plan_versions").insert({
          plan_id: planId,
          plan_type: planType,
          user_id: clientId,
          data: planData,
          important_notes: importantNotes ?? null,
          saved_by: user!.id,
          version_number: versionNumber,
        });
      } catch {
        // Non-fatal — version history failure shouldn't block saves
      }
    }

    if (type === "training") {
      const { data: existing } = await supabase
        .from("training_plans")
        .select("id, data")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const planData = data.days ? { days: data.days } : data;

      if (existing) {
        // Snapshot current version before overwriting
        await snapshotPlan(existing.id, "training", existing.data);

        const { error: updErr } = await supabase
          .from("training_plans")
          .update({ data: planData, plan_approved: true })
          .eq("id", existing.id);
        if (updErr) {
          return NextResponse.json({ error: `Error actualizando: ${updErr.message}` }, { status: 500 });
        }
      } else {
        const { error: insErr } = await supabase
          .from("training_plans")
          .insert({ user_id: clientId, week_number: 1, data: planData, plan_approved: true });
        if (insErr) {
          return NextResponse.json({ error: `Error guardando: ${insErr.message}` }, { status: 500 });
        }
      }
    } else if (type === "nutrition") {
      const { data: existing } = await supabase
        .from("nutrition_plans")
        .select("id, data, important_notes")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Preserve extras (shoppingList, budget, supplements) from existing plan
      // Clear weekMenu/gymDay/kitesurfDay since admin is setting new meals as source of truth
      const existingData = (existing?.data && typeof existing.data === "object") ? existing.data : {};
      const { weekMenu: _wm, gymDay: _gd, kitesurfDay: _kd, ...preservedData } = existingData as Record<string, unknown>;
      const mergedData = {
        ...preservedData,
        meals: data.meals,
      };

      if (existing) {
        // Snapshot current version before overwriting
        await snapshotPlan(existing.id, "nutrition", existing.data, existing.important_notes);

        const { error: updErr } = await supabase
          .from("nutrition_plans")
          .update({
            data: mergedData,
            important_notes: data.importantNotes || [],
            plan_approved: true,
          })
          .eq("id", existing.id);
        if (updErr) {
          return NextResponse.json({ error: `Error actualizando: ${updErr.message}` }, { status: 500 });
        }
      } else {
        const { error: insErr } = await supabase
          .from("nutrition_plans")
          .insert({
            user_id: clientId,
            data: mergedData,
            important_notes: data.importantNotes || [],
            plan_approved: true,
          });
        if (insErr) {
          return NextResponse.json({ error: `Error guardando: ${insErr.message}` }, { status: 500 });
        }
      }
    } else {
      return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
    }

    await logAdminAction({
      admin_id: user.id,
      action: "save_plan",
      target_id: clientId,
      details: `Saved ${type} plan`,
    });

    // Fire-and-forget: notificar al cliente
    notifyClientPlanUpdated(supabase, user.id, clientId, type as "training" | "nutrition").catch(() => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Error inesperado: ${err}` }, { status: 500 });
  }
}
