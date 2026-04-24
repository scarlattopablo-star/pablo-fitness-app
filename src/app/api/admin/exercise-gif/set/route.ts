// Admin: adopta un GIF externo para un ejercicio del catalogo.
// UPSERT en custom_exercise_gifs. getExerciseGif() va a priorizar el local
// pero si no hay local, cae a esta tabla.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: p } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!p?.is_admin) return NextResponse.json({ error: "Not admin" }, { status: 403 });

    const body = await request.json();
    const { exerciseId, gifUrl, source } = body as { exerciseId?: string; gifUrl?: string; source?: string };
    if (!exerciseId || !gifUrl) {
      return NextResponse.json({ error: "exerciseId y gifUrl requeridos" }, { status: 400 });
    }
    try { new URL(gifUrl); } catch {
      return NextResponse.json({ error: "gifUrl no es una URL valida" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("custom_exercise_gifs")
      .upsert({
        exercise_id: exerciseId,
        gif_url: gifUrl,
        source: source || "exercisedb",
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: "exercise_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
