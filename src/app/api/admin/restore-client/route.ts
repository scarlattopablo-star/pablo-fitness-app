import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const { id: clientId } = await request.json();
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

  // Restore: clear deleted_at
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({ deleted_at: null })
    .eq("id", clientId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Unban the user
  const { error: unbanError } = await adminClient.auth.admin.updateUserById(clientId, {
    ban_duration: "none",
  });

  if (unbanError) {
    return NextResponse.json({ error: unbanError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
