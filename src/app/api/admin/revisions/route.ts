// Nutrition v2 — F5: endpoint admin para listar y resolver plan_revisions
//
// GET:    lista revisiones pendientes (con info del cliente y check-in)
// POST:   { revisionId, action: 'approve'|'reject' }
//   - approve: aplica el delta al survey (+ regenera el plan via /api/admin/generate-plans-for-user)
//   - reject:  marca como rechazada sin tocar el plan

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function assertAdmin(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return null;
  return { user, supabase };
}

// === GET: listar revisiones pendientes ===
export async function GET(req: NextRequest) {
  const auth = await assertAdmin(req);
  if (!auth) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { supabase } = auth;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";
  const userId = searchParams.get("userId");

  let query = supabase
    .from("plan_revisions")
    .select(`
      id, user_id, checkin_id, triggered_by, delta, rationale, status,
      reviewed_by, reviewed_at, applied_at, created_at,
      profiles:user_id ( id, full_name, email )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (status !== "all") query = query.eq("status", status);
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Adjuntar el checkin asociado por separado (Supabase no permite join lateral
  // sin foreign key explicita; hacemos round-trip simple)
  const checkinIds = (data || []).map(r => r.checkin_id).filter(Boolean) as string[];
  let checkins: Array<Record<string, unknown>> = [];
  if (checkinIds.length > 0) {
    const { data: cks } = await supabase
      .from("weekly_checkins")
      .select("id, week_number, weight, energy, hunger, performance, adherence_pct, notes, created_at")
      .in("id", checkinIds);
    checkins = cks || [];
  }
  const checkinMap = new Map(checkins.map(c => [c.id as string, c]));

  const enriched = (data || []).map(r => ({
    ...r,
    checkin: r.checkin_id ? checkinMap.get(r.checkin_id) ?? null : null,
  }));

  return NextResponse.json({ revisions: enriched });
}

// === POST: aprobar o rechazar ===
export async function POST(req: NextRequest) {
  const auth = await assertAdmin(req);
  if (!auth) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });

  const { user, supabase } = auth;
  const body = await req.json();
  const { revisionId, action } = body as { revisionId?: string; action?: "approve" | "reject" };

  if (!revisionId || !action) {
    return NextResponse.json({ error: "revisionId y action son requeridos" }, { status: 400 });
  }
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action debe ser 'approve' o 'reject'" }, { status: 400 });
  }

  // 1) Cargar revision
  const { data: rev, error: revErr } = await supabase
    .from("plan_revisions")
    .select("*")
    .eq("id", revisionId)
    .single();
  if (revErr || !rev) {
    return NextResponse.json({ error: "Revision no encontrada" }, { status: 404 });
  }
  if (rev.status !== "pending") {
    return NextResponse.json({ error: `Esta revision ya esta en estado '${rev.status}'` }, { status: 409 });
  }

  // 2) Si es REJECT: marcar y salir
  if (action === "reject") {
    const { error: updErr } = await supabase
      .from("plan_revisions")
      .update({
        status: "rejected",
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", revisionId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    return NextResponse.json({ success: true, action: "rejected" });
  }

  // 3) APPROVE: aplicar delta al survey + regenerar plan
  const delta = rev.delta as { calories?: number; protein?: number; carbs?: number; fats?: number };

  const { data: survey } = await supabase
    .from("surveys")
    .select("*")
    .eq("user_id", rev.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!survey) {
    return NextResponse.json({ error: "No se encontro encuesta del cliente" }, { status: 404 });
  }

  const patch: Record<string, unknown> = {};
  if (delta.calories) patch.target_calories = (survey.target_calories || 2000) + delta.calories;
  if (delta.protein) patch.protein = (survey.protein || 130) + delta.protein;
  if (delta.carbs) patch.carbs = (survey.carbs || 200) + delta.carbs;
  if (delta.fats) patch.fats = (survey.fats || 65) + delta.fats;

  if (Object.keys(patch).length > 0) {
    const { error: patchErr } = await supabase
      .from("surveys")
      .update(patch)
      .eq("id", survey.id);
    if (patchErr) return NextResponse.json({ error: patchErr.message }, { status: 500 });
  }

  // 4) Marcar la revision como applied
  const { error: applyErr } = await supabase
    .from("plan_revisions")
    .update({
      status: "applied",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      applied_at: new Date().toISOString(),
    })
    .eq("id", revisionId);
  if (applyErr) return NextResponse.json({ error: applyErr.message }, { status: 500 });

  // 5) Disparar regeneracion del plan (best-effort, no bloquear)
  try {
    const baseUrl = req.nextUrl.origin;
    await fetch(`${baseUrl}/api/admin/generate-plans-for-user`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: req.headers.get("authorization") || "",
      },
      body: JSON.stringify({ userId: rev.user_id, overwrite: true }),
    });
  } catch {
    // Si falla la regeneracion, el survey ya quedo actualizado — Pablo puede regenerar manualmente
  }

  return NextResponse.json({ success: true, action: "applied", patch });
}
