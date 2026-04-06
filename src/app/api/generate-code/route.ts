import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-side code generation - bypasses RLS using service role
export async function POST(request: NextRequest) {
  try {
    const { type, planSlug, duration } = await request.json();

    if (!type || !["direct-client", "free-plan"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin by checking their auth token
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      // Check admin status
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || profile.role !== "admin") {
        return NextResponse.json({ error: "Solo admin puede generar códigos" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const prefix = type === "direct-client" ? "CLIENT" : "FREE";
    const code = `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase.from("free_access_codes").insert({
      code,
      plan_slug: type === "direct-client" ? "direct-client" : planSlug,
      duration: type === "direct-client" ? "custom" : duration,
      used: false,
    }).select("code, plan_slug, duration").single();

    if (error) {
      console.error("Error inserting code:", error);
      return NextResponse.json({ error: "Error al crear código: " + error.message }, { status: 500 });
    }

    return NextResponse.json({ code: data.code, plan_slug: data.plan_slug, duration: data.duration });
  } catch (err) {
    console.error("Generate code error:", err);
    return NextResponse.json({ error: "Error inesperado" }, { status: 500 });
  }
}
