import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Create a subscription for a user (uses service role to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const { userId, duration, amountPaid, currency } = await request.json();
    if (!userId || !duration) {
      return NextResponse.json({ error: "userId y duration requeridos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify the user exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Calculate end date based on duration
    const startDate = new Date();
    const endDate = new Date();
    switch (duration) {
      case "7-dias":
        endDate.setDate(endDate.getDate() + 7);
        break;
      case "1-mes":
        endDate.setMonth(endDate.getMonth() + 1);
        break;
      case "3-meses":
        endDate.setMonth(endDate.getMonth() + 3);
        break;
      case "6-meses":
        endDate.setMonth(endDate.getMonth() + 6);
        break;
      case "1-ano":
      default:
        endDate.setFullYear(endDate.getFullYear() + 1);
        break;
    }

    // Check for existing active subscription (avoid duplicates on retry)
    const { data: existing } = await supabase.from("subscriptions")
      .select("id").eq("user_id", userId).eq("status", "active").maybeSingle();

    if (existing) {
      // Update existing subscription
      const { data, error } = await supabase.from("subscriptions")
        .update({
          duration,
          amount_paid: amountPaid || 0,
          currency: currency || "UYU",
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
        }).eq("id", existing.id).select().single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, subscription: data });
    }

    const { data, error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      duration,
      amount_paid: amountPaid || 0,
      currency: currency || "UYU",
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "active",
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch {
    return NextResponse.json({ error: "Error al crear suscripcion" }, { status: 500 });
  }
}
