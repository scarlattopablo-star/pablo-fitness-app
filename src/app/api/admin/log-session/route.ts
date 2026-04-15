import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin
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

    const { clientId, exercises } = await request.json();
    if (!clientId || !exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Insert exercise logs on behalf of the client (using service role to bypass RLS)
    for (const ex of exercises) {
      if (!ex.id || !ex.name || !ex.sets || !Array.isArray(ex.sets)) continue;
      const validSets = ex.sets.filter((s: { weight: number }) => s.weight > 0);
      if (validSets.length === 0) continue;

      const { error } = await adminClient.from("exercise_logs").insert({
        user_id: clientId,
        exercise_id: ex.id,
        exercise_name: ex.name,
        sets_data: validSets,
      });

      if (error) {
        return NextResponse.json({ error: `Error guardando ${ex.name}: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Error inesperado: ${err}` }, { status: 500 });
  }
}
