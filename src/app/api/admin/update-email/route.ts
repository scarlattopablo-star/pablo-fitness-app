import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const { userId, newEmail } = await request.json();
    if (!userId || !newEmail) return NextResponse.json({ error: "userId y newEmail requeridos" }, { status: 400 });

    // Update email in Supabase Auth
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, { email: newEmail });
    if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

    // Update email in profiles
    await supabase.from("profiles").update({ email: newEmail }).eq("id", userId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error al actualizar email" }, { status: 500 });
  }
}
