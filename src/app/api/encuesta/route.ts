import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Save survey data (uses service role to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, full_name, email, ...surveyData } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Ensure profile exists before inserting survey (FK constraint)
    const ensureProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, deleted_at")
        .eq("id", userId)
        .single();

      if (profile) {
        if (profile.deleted_at) {
          await supabase.from("profiles").update({
            deleted_at: null,
            full_name: full_name || "",
            email: email || "",
          }).eq("id", userId);
        }
        return;
      }

      // Profile doesn't exist — try to create it
      // First attempt: maybe auth user exists but trigger didn't fire
      const { error: firstTry } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: full_name || "",
        email: email || "",
      }, { onConflict: "id" });

      if (!firstTry) return;

      // FK violation — auth user doesn't exist yet
      // Wait and retry a few times (signUp propagation)
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const { error } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: full_name || "",
          email: email || "",
        }, { onConflict: "id" });
        if (!error) return;
        if (!error.message.includes("foreign key")) {
          throw new Error(`Error creando perfil: ${error.message}`);
        }
      }

      // Last resort: check if the auth user actually exists
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (!authUser?.user) {
        // Auth user truly doesn't exist — this shouldn't happen normally
        // The signUp must have failed or the userId is wrong
        throw new Error("No se pudo verificar tu cuenta. Intenta registrarte de nuevo.");
      }

      // Auth user exists but profile still won't insert — one more try
      const { error: lastErr } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: full_name || authUser.user.user_metadata?.full_name || "",
        email: email || authUser.user.email || "",
      }, { onConflict: "id" });
      if (lastErr) {
        throw new Error(`Error creando perfil: ${lastErr.message}`);
      }
    };

    await ensureProfile();

    // Check if survey already exists (retry scenario)
    const { data: existing } = await supabase
      .from("surveys")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("surveys")
        .update(surveyData)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("surveys").insert({
        user_id: userId,
        ...surveyData,
      }));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error al guardar encuesta: ${msg}` }, { status: 500 });
  }
}
