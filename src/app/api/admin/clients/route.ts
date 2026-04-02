import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  // Use service role key for ALL operations (bypasses RLS)
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify user token and get user id
  const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  // Check if user is admin using service role (no RLS issues)
  const { data: profile } = await adminClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Get clients
  const limit = Number(request.nextUrl.searchParams.get("limit") || "100");
  const clientId = request.nextUrl.searchParams.get("id");

  const deleted = request.nextUrl.searchParams.get("deleted") === "true";

  let query = adminClient
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (deleted) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
  }

  if (clientId) {
    query = query.eq("id", clientId);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data || [], total: count || 0 });
}
