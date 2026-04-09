import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit-log";

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { fromUserId, toEmail } = await request.json();
    if (!fromUserId || !toEmail) return NextResponse.json({ error: "fromUserId y toEmail requeridos" }, { status: 400 });

    // Find target user by email
    const { data: targetProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", toEmail)
      .single();

    if (!targetProfile) {
      return NextResponse.json({ error: `No se encontró usuario con email ${toEmail}` }, { status: 404 });
    }

    const toUserId = targetProfile.id;

    // Transfer subscription
    await supabase.from("subscriptions")
      .update({ user_id: toUserId })
      .eq("user_id", fromUserId)
      .eq("status", "active");

    // Transfer training plan
    await supabase.from("training_plans")
      .update({ user_id: toUserId })
      .eq("user_id", fromUserId);

    // Transfer nutrition plan
    await supabase.from("nutrition_plans")
      .update({ user_id: toUserId })
      .eq("user_id", fromUserId);

    // Transfer survey
    await supabase.from("surveys")
      .update({ user_id: toUserId })
      .eq("user_id", fromUserId);

    await logAdminAction({
      admin_id: user!.id,
      action: "transfer_plan",
      target_id: fromUserId,
      details: `Transferred plan from ${fromUserId} to ${toEmail} (${toUserId})`,
    });

    return NextResponse.json({
      success: true,
      message: `Plan transferido de ${fromUserId} a ${toEmail} (${toUserId})`,
    });
  } catch {
    return NextResponse.json({ error: "Error al transferir plan" }, { status: 500 });
  }
}
