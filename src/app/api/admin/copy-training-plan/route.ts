// Admin: copiar una rutina (array de days) al training_plan de otro cliente.
// Usa service role key para saltar RLS y evitar bloqueos al escribir sobre
// otro user_id. Reemplaza el plan actual, deja plan_approved = false para
// que el cliente lo vea como "pendiente de confirmacion".

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user }, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Not admin" }, { status: 403 });
    }

    const body = await request.json();
    const { targetUserId, days } = body as { targetUserId?: string; days?: unknown[] };

    if (!targetUserId || !Array.isArray(days) || days.length === 0) {
      return NextResponse.json(
        { error: "targetUserId y days (array no vacio) son requeridos" },
        { status: 400 }
      );
    }

    // SELECT (sin .single/.maybeSingle para tolerar duplicados existentes).
    // training_plans solo tiene created_at (no updated_at).
    const { data: rows, error: selErr } = await supabaseAdmin
      .from("training_plans")
      .select("id, data, created_at")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(5);

    if (selErr) {
      return NextResponse.json({ error: selErr.message }, { status: 500 });
    }

    const existing = rows?.[0];
    const existingData = (existing?.data && typeof existing.data === "object") ? existing.data : {};
    const newData = { ...existingData, days };

    if (existing?.id) {
      // Si hay duplicados, actualizamos el mas reciente.
      // (La limpieza de duplicados antiguos queda como SQL manual.)
      const { error: upErr } = await supabaseAdmin
        .from("training_plans")
        .update({ data: newData, plan_approved: false })
        .eq("id", existing.id);
      if (upErr) {
        return NextResponse.json({ error: upErr.message }, { status: 500 });
      }
    } else {
      const { error: insErr } = await supabaseAdmin
        .from("training_plans")
        .insert({ user_id: targetUserId, data: newData, plan_approved: false });
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }

    const duplicatesCount = (rows?.length ?? 0) > 1 ? (rows!.length - 1) : 0;
    return NextResponse.json({
      success: true,
      data: newData,
      ...(duplicatesCount > 0 ? { warning: `Hay ${duplicatesCount} filas duplicadas de training_plans para este cliente. Actualice la mas reciente; conviene limpiar con SQL.` } : {}),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
