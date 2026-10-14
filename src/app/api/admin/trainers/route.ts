import { NextRequest, NextResponse } from "next/server";
import { getStaff } from "@/lib/staff-auth";

// GET /api/admin/trainers?userId=... → { isTrainer }
// POST /api/admin/trainers { userId, isTrainer } → activa/quita el rol de entrenador suplente
export async function GET(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  if (!staff.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

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
