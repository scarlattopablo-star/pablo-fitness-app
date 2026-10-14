import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getStaff } from "@/lib/staff-auth";

// GET  → ultimas invitaciones de entrenador
// POST { name, gender: "f" | "m", message? } → crea una invitacion y devuelve su token
export async function GET(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  if (!staff.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data } = await staff.adminClient
    .from("trainer_invites")
    .select("token, invitee_name, created_at, expires_at, used_at")
    .order("created_at", { ascending: false })
    .limit(10);
  return NextResponse.json({ invites: data || [] });
}

export async function POST(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  if (!staff.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { name, message, gender } = await request.json();
  const inviteeName = String(name || "").trim();
  if (!inviteeName) return NextResponse.json({ error: "Falta el nombre" }, { status: 400 });

  const token = randomBytes(12).toString("base64url");
  const { error } = await staff.adminClient.from("trainer_invites").insert({
    token,
    invitee_name: inviteeName.slice(0, 80),
    message: message ? String(message).slice(0, 500) : null,
    invitee_gender: gender === "m" ? "m" : "f",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token });
}
