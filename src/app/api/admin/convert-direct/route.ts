import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/convert-direct
// Body: { subscriptionId: string }
// Converts a subscription to "direct-client" plan with 10-year end date

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify user is admin
    const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const { data: profile } = await sb.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!profile?.is_admin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

    const body = await req.json();
    const { subscriptionId } = body;
    if (!subscriptionId) return NextResponse.json({ error: "Falta subscriptionId" }, { status: 400 });

    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);

    const { error } = await sb
      .from("subscriptions")
      .update({
        plan_slug: "direct-client",
        duration: "custom",
        end_date: farFuture.toISOString(),
        status: "active",
      })
      .eq("id", subscriptionId);

    if (error) throw error;

    return NextResponse.json({ ok: true, end_date: farFuture.toISOString() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
