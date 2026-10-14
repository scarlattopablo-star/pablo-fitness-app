// Admin: copiar un plan de nutricion (el JSON `data` completo) al nutrition_plan
// de otro cliente. Reemplaza el plan actual y deja plan_approved = false, igual
// que copy-training-plan.

import { NextRequest, NextResponse } from "next/server";
import { getStaff } from "@/lib/staff-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const staff = await getStaff(request);
    if (staff instanceof NextResponse) return staff;
    if (!staff.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    const { adminClient } = staff;

    const { targetUserId, data, importantNotes } = await request.json() as {
      targetUserId?: string; data?: Record<string, unknown>; importantNotes?: string[];
    };
    const hasMeals = Array.isArray(data?.meals) && (data!.meals as unknown[]).length > 0;
    const isKitesurf = !!data?.gymDay;
    if (!targetUserId || !data || (!hasMeals && !isKitesurf)) {
      return NextResponse.json({ error: "targetUserId y data (con comidas) son requeridos" }, { status: 400 });
    }

    const { data: rows, error: selErr } = await adminClient
      .from("nutrition_plans")
      .select("id")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false, nullsFirst: false })
      .limit(1);
    if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

    // El plan pegado es una copia limpia: no arrastra la marca de aprobacion del otro cliente
    const newData = { ...data };
    delete newData.admin_updated_at;

    const fields = {
      data: newData,
      important_notes: Array.isArray(importantNotes) ? importantNotes : [],
      plan_approved: false,
    };
    const existing = rows?.[0];
    const { error } = existing?.id
      ? await adminClient.from("nutrition_plans").update(fields).eq("id", existing.id)
      : await adminClient.from("nutrition_plans").insert({ user_id: targetUserId, ...fields });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, ...fields });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
