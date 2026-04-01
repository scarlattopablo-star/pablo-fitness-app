import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const token = authHeader.slice(7);

  // Verify the user token is valid
  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user } } = await authClient.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  // Verify admin using RPC
  const { data: isAdmin } = await authClient.rpc("is_admin");
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Use service role key to bypass RLS completely
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const limit = Number(request.nextUrl.searchParams.get("limit") || "100");
  const clientId = request.nextUrl.searchParams.get("id");

  let query = adminClient
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("is_admin", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (clientId) {
    query = query.eq("id", clientId);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ clients: data || [], total: count || 0 });
}
