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
    // profiles.id references auth.users(id), so auth user must exist first.
    // After signUp there's a race condition — the auth user may not be committed yet.
    const ensureProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (profile) return; // Profile already exists

      // Retry profile upsert with increasing delays (auth user may not be committed yet)
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // 1s, 2s, 3s, 4s, 5s, 6s
        const { error: upsertErr } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: full_name || "",
          email: email || "",
        }, { onConflict: "id" });
        if (!upsertErr) return; // Success
        if (!upsertErr.message.includes("foreign key")) {
          throw new Error(`Error creando perfil: ${upsertErr.message}`);
        }
        // FK violation = auth user not ready yet, retry
      }
      throw new Error("El usuario aun no esta listo. Intenta de nuevo en unos segundos.");
    };

    await ensureProfile();

    const { error } = await supabase.from("surveys").insert({
      user_id: userId,
      ...surveyData,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error al guardar encuesta: ${msg}` }, { status: 500 });
  }
}
