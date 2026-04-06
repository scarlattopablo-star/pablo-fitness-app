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

    const { error } = await supabase.from("surveys").insert({
      user_id: userId,
      ...surveyData,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al guardar encuesta" }, { status: 500 });
  }
}
