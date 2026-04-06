import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Save survey data (uses service role to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...surveyData } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Ensure profile exists before inserting survey (FK constraint)
    // The auth trigger should create it, but race conditions can cause it to be missing
    const ensureProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!profile) {
        const { data: authUser } = await supabase.auth.admin.getUserById(userId);
        if (!authUser?.user) {
          throw new Error("Usuario no encontrado en auth");
        }
        const { error: upsertErr } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: authUser.user.user_metadata?.full_name || "",
          email: authUser.user.email || "",
        }, { onConflict: "id" });
        if (upsertErr) {
          throw new Error(`Error creando perfil: ${upsertErr.message}`);
        }
        // Small delay to ensure profile is committed
        await new Promise(r => setTimeout(r, 300));
      }
    };

    // Try up to 3 times to handle race conditions
    let error = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      await ensureProfile();
      const result = await supabase.from("surveys").insert({
        user_id: userId,
        ...surveyData,
      });
      error = result.error;
      if (!error) break;
      if (!error.message.includes("foreign key")) break; // Different error, don't retry
      // Wait before retry
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al guardar encuesta" }, { status: 500 });
  }
}
