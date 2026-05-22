import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/admin/plan-versions?clientId=...&type=training|nutrition
// Optional: &versionId=... to get a specific version's full data
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const clientId = request.nextUrl.searchParams.get("clientId");
  const planType = request.nextUrl.searchParams.get("type");
  const versionId = request.nextUrl.searchParams.get("versionId");

  if (!clientId) {
    return NextResponse.json({ error: "clientId requerido" }, { status: 400 });
  }

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify admin
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // If versionId is provided, return that specific version's full data
  if (versionId) {
    const { data: version, error } = await supabase
      .from("plan_versions")
      .select("*")
      .eq("id", versionId)
      .eq("user_id", clientId)
      .single();

    if (error || !version) {
      return NextResponse.json({ error: "Version no encontrada" }, { status: 404 });
    }
    return NextResponse.json({ version });
  }

  // List all versions for this client + plan type (without full data for speed)
  let query = supabase
    .from("plan_versions")
    .select("id, plan_id, plan_type, version_number, saved_by, created_at")
    .eq("user_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (planType) {
    query = query.eq("plan_type", planType);
  }

  const { data: versions, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions: versions || [] });
}
