import { NextRequest, NextResponse } from "next/server";
import { getStaff, canTrainerAccessClient } from "@/lib/staff-auth";

// Datos de solo lectura de un cliente para el entrenador suplente:
// perfil basico, plan de entrenamiento, plan de nutricion e historial de pesos.
export async function GET(request: NextRequest) {
  const staff = await getStaff(request);
  if (staff instanceof NextResponse) return staff;
  const { adminClient } = staff;

  const clientId = request.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }
  if (!staff.isAdmin && !(await canTrainerAccessClient(adminClient, clientId))) {
    return NextResponse.json({ error: "No tenes acceso a este cliente" }, { status: 403 });
  }

  const [clientRes, trainingRes, nutritionRes, logsRes] = await Promise.all([
    adminClient.from("profiles").select("id, full_name, email, phone, avatar_url")
      .eq("id", clientId).single(),
    adminClient.from("training_plans").select("data")
      .eq("user_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    adminClient.from("nutrition_plans").select("data")
      .eq("user_id", clientId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    adminClient.from("exercise_logs").select("exercise_id, exercise_name, sets_data, date")
      .eq("user_id", clientId).order("date", { ascending: false }).limit(500),
  ]);

  return NextResponse.json({
    client: clientRes.data,
    trainingPlan: trainingRes.data,
    nutritionPlan: nutritionRes.data,
    logs: logsRes.data || [],
  });
}
