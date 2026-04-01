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

  // Client with user token to verify admin
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: isAdmin } = await userClient.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Admin client with service role to delete auth user
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await adminClient.auth.admin.deleteUser(clientId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
