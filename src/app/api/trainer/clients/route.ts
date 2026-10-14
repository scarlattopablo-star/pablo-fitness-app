import { NextRequest, NextResponse } from "next/server";
import { getStaff, getDirectClientIds } from "@/lib/staff-auth";

// Lista de clientes directos (personalizados) que el entrenador suplente puede entrenar.
export async function GET(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  const { adminClient } = staff;

  const directIds = [...(await getDirectClientIds(adminClient))];
  if (directIds.length === 0) return NextResponse.json({ clients: [] });

  const [{ data: profiles }, { data: trainers }] = await Promise.all([
    adminClient.from("profiles").select("id, full_name, email, phone, avatar_url")
      .in("id", directIds).eq("is_admin", false).is("deleted_at", null)
      .order("full_name", { ascending: true }),
    adminClient.from("trainers").select("user_id"),
  ]);

  const trainerIds = new Set(trainers?.map((t: { user_id: string }) => t.user_id) || []);
  const clients = (profiles || []).filter((p: { id: string }) => !trainerIds.has(p.id));
  return NextResponse.json({ clients });
}
