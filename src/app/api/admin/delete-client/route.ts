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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // Call the SECURITY DEFINER function that checks is_admin() and deletes from auth.users
  const { error } = await supabase.rpc("delete_user", { user_id: clientId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
