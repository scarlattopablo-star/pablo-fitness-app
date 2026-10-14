import { NextRequest, NextResponse } from "next/server";
import { getStaff, canTrainerAccessClient, logSessionForClient } from "@/lib/staff-auth";

// Entrenador suplente guarda la sesion (pesos/reps) en la cuenta del cliente.
export async function POST(request: NextRequest) {
  try {
    const staff = await getStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { clientId, exercises } = await request.json();
    if (!clientId || !exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }
    if (!staff.isAdmin && !(await canTrainerAccessClient(staff.adminClient, clientId))) {
      return NextResponse.json({ error: "No tenes acceso a este cliente" }, { status: 403 });
    }

    const error = await logSessionForClient(staff.adminClient, clientId, exercises);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Error inesperado: ${err}` }, { status: 500 });
  }
}
