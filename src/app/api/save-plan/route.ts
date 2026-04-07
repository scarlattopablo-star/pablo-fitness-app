import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, type, data } = body;

    if (!clientId || !type || !data) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify caller is admin via auth token
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (!user) {
        return NextResponse.json({ error: "No autenticado" }, { status: 401 });
      }
      // Check admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();
      if (!profile?.is_admin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    if (type === "training") {
      // Check if existing plan exists
      const { data: existing } = await supabase
        .from("training_plans")
        .select("id")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const planData = data.days ? { days: data.days } : data;

      if (existing) {
        // Update existing plan
        const { error: updErr } = await supabase
          .from("training_plans")
          .update({
            data: planData,
            plan_approved: true,
          })
          .eq("id", existing.id);
        if (updErr) {
          return NextResponse.json({ error: `Error actualizando: ${updErr.message}` }, { status: 500 });
        }
      } else {
        // Insert new training plan
        const { error: insErr } = await supabase
          .from("training_plans")
          .insert({
            user_id: clientId,
            week_number: 1,
            data: planData,
            plan_approved: true,
          });
        if (insErr) {
          return NextResponse.json({ error: `Error guardando: ${insErr.message}` }, { status: 500 });
        }
      }
    } else if (type === "nutrition") {
      // Check if existing plan exists
      const { data: existing } = await supabase
        .from("nutrition_plans")
        .select("id")
        .eq("user_id", clientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing) {
        // Update existing plan
        const { error: updErr } = await supabase
          .from("nutrition_plans")
          .update({
            data: { meals: data.meals },
            important_notes: data.importantNotes || [],
            plan_approved: true,
          })
          .eq("id", existing.id);
        if (updErr) {
          return NextResponse.json({ error: `Error actualizando: ${updErr.message}` }, { status: 500 });
        }
      } else {
        // Insert new nutrition plan
        const { error: insErr } = await supabase
          .from("nutrition_plans")
          .insert({
            user_id: clientId,
            data: { meals: data.meals },
            important_notes: data.importantNotes || [],
            plan_approved: true,
          });
        if (insErr) {
          return NextResponse.json({ error: `Error guardando: ${insErr.message}` }, { status: 500 });
        }
      }
    } else {
      return NextResponse.json({ error: "Tipo invalido" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: `Error inesperado: ${err}` }, { status: 500 });
  }
}
