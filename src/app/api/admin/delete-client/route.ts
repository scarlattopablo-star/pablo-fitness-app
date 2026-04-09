import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/audit-log";

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
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
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

  // Soft-delete: set deleted_at timestamp
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", clientId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Ban the user so they can't access the app
  const { error: banError } = await adminClient.auth.admin.updateUserById(clientId, {
    ban_duration: "876600h",
  });

  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 500 });
  }

  await logAdminAction({
    admin_id: user.id,
    action: "delete_client",
    target_id: clientId,
    details: "Soft-deleted client and banned access",
  });

  return NextResponse.json({ ok: true });
}
