import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Unban and restore a previously deleted user so they can re-register
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "email requerido" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find the user by email in auth
    const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1 });
    // listUsers doesn't filter by email, so search manually
    const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const authUser = allUsers?.users?.find(u => u.email === email);

    if (!authUser) {
      return NextResponse.json({ exists: false });
    }

    // Check if banned
    if (authUser.banned_until && new Date(authUser.banned_until) > new Date()) {
      // Unban the user
      await supabase.auth.admin.updateUserById(authUser.id, {
        ban_duration: "none",
      });

      // Restore profile if soft-deleted
      await supabase.from("profiles").update({
        deleted_at: null,
      }).eq("id", authUser.id);

      return NextResponse.json({ exists: true, restored: true, userId: authUser.id });
    }

    return NextResponse.json({ exists: true, restored: false, userId: authUser.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
