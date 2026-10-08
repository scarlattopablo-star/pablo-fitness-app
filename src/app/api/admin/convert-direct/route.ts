import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/convert-direct
// Body: { subscriptionId: string } | { userId: string }
// Converts a subscription to "direct-client" plan with 10-year end date.
// Con userId (cliente sin suscripcion) crea una nueva de cliente directo.

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
    const { subscriptionId, userId } = body;
    if (!subscriptionId && !userId) return NextResponse.json({ error: "Falta subscriptionId o userId" }, { status: 400 });

    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);

    if (!subscriptionId) {
      const { data: created, error: insertError } = await sb
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_slug: "direct-client",
          duration: "custom",
          amount_paid: 0,
          currency: "UYU",
          start_date: new Date().toISOString().split("T")[0],
          end_date: farFuture.toISOString(),
          status: "active",
        })
        .select()
        .single();
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, end_date: farFuture.toISOString(), subscription: created });
    }

    const { error } = await sb
      .from("subscriptions")
      .update({
        plan_slug: "direct-client",
        duration: "custom",
        end_date: farFuture.toISOString(),
        status: "active",
      })
      .eq("id", subscriptionId);

    if (error) {
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true, end_date: farFuture.toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
