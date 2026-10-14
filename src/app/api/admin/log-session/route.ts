import { NextRequest, NextResponse } from "next/server";
import { getStaff, logSessionForClient } from "@/lib/staff-auth";

export async function POST(request: NextRequest) {
  try {
    const staff = await getStaff(request);
    if (staff instanceof NextResponse) return staff;
    if (!staff.isAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { clientId, exercises } = await request.json();
    if (!clientId || !exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Insert exercise logs on behalf of the client (using service role to bypass RLS)
    const error = await logSessionForClient(staff.adminClient, clientId, exercises);
    if (error) return NextResponse.json({ error }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Error inesperado: ${err}` }, { status: 500 });
  }
}
