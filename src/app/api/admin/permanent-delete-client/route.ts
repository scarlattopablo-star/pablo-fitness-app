import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const clientId = request.nextUrl.searchParams.get("id");
  if (!clientId) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify caller is admin
  const {
    data: { user },
    error: authError,
  } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Verify client exists and is soft-deleted
  const { data: clientProfile } = await adminClient
    .from("profiles")
    .select("deleted_at")
    .eq("id", clientId)
    .single();

  if (!clientProfile) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 });
  }

  if (!clientProfile.deleted_at) {
    return NextResponse.json(
      { error: "El cliente debe estar en la papelera antes de eliminarlo definitivamente" },
      { status: 400 }
    );
  }

  // Delete related data first (order matters for FK constraints)
  const userIdTables = [
    "weekly_rankings",
    "user_achievements",
    "user_streaks",
    "user_xp",
    "push_subscriptions",
    "chat_blocks",
    "general_messages",
    "exercise_logs",
    "progress_entries",
    "nutrition_plans",
    "training_plans",
    "subscriptions",
    "surveys",
  ];

  for (const table of userIdTables) {
    await adminClient.from(table).delete().eq("user_id", clientId);
  }

  // Delete messages and conversations (user can be sender or participant)
  await adminClient.from("messages").delete().eq("sender_id", clientId);
  await adminClient.from("conversations").delete().or(`user1_id.eq.${clientId},user2_id.eq.${clientId}`);

  // Delete free access code usage
  await adminClient.from("free_access_codes").update({ used: false, used_by: null }).eq("used_by", clientId);

  // Delete profile
  await adminClient.from("profiles").delete().eq("id", clientId);

  // Delete from auth
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(clientId);
  if (deleteAuthError) {
    return NextResponse.json({ error: deleteAuthError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
