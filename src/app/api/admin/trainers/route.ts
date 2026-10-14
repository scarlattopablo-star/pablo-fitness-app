import { NextRequest, NextResponse } from "next/server";
import { getStaff } from "@/lib/staff-auth";

// GET /api/admin/trainers → { trainers } (lista del equipo)
// GET /api/admin/trainers?userId=... → { isTrainer }
// POST /api/admin/trainers { userId, isTrainer } → activa/quita el rol de entrenador suplente
export async function GET(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  if (!staff.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    // Sin userId: lista completa del equipo para /admin/equipo
    const { data: trainers } = await staff.adminClient
      .from("trainers").select("user_id, created_at").order("created_at", { ascending: false });
    const ids = (trainers || []).map((t: { user_id: string }) => t.user_id);
    const { data: profiles } = ids.length
      ? await staff.adminClient.from("profiles").select("id, full_name, email, phone").in("id", ids)
      : { data: [] };
    const byId = new Map((profiles || []).map((p: { id: string }) => [p.id, p]));
    return NextResponse.json({
      trainers: (trainers || []).map((t: { user_id: string; created_at: string }) => ({
        ...(byId.get(t.user_id) || { id: t.user_id }),
        since: t.created_at,
      })),
    });
  }

  const { data } = await staff.adminClient.from("trainers").select("user_id").eq("user_id", userId).maybeSingle();
  return NextResponse.json({ isTrainer: !!data });
}

export async function POST(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  if (!staff.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { userId, isTrainer } = await request.json();
  if (!userId || typeof isTrainer !== "boolean") {
    return NextResponse.json({ error: "userId e isTrainer son requeridos" }, { status: 400 });
  }

  const { error } = isTrainer
    ? await staff.adminClient.from("trainers").upsert({ user_id: userId })
    : await staff.adminClient.from("trainers").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, isTrainer });
}
