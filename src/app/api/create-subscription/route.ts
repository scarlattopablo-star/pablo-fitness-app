import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Create a subscription for a user (uses service role to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { userId, duration, trialDays, amountPaid, currency } = await request.json();
    if (!userId || !duration) {
      return NextResponse.json({ error: "userId y duration requeridos" }, { status: 400 });
    }

    // Auth check: require valid Bearer token OR allow trial creation for just-registered users
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    if (token) {
      // Validate token if provided
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return NextResponse.json({ error: "Token invalido" }, { status: 401 });
      }

      // Verify the authenticated user matches the userId or is admin
      const { data: authProfile } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (user.id !== userId && authProfile?.role !== "admin") {
        return NextResponse.json({ error: "No autorizado para este usuario" }, { status: 403 });
      }
    } else {
      // No token: only allow free trial creation ($0)
      if (amountPaid && amountPaid > 0) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
    }

    // Verify the user exists in auth
    const { data: { user: authUser }, error: userCheckErr } = await supabase.auth.admin.getUserById(userId);
    if (userCheckErr || !authUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Ensure profile exists (create if missing - handles race conditions during signup)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      await supabase.from("profiles").upsert({
        id: userId,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "",
      }, { onConflict: "id" });
    }

    // Calculate end date based on duration (trialDays overrides for free trials)
    const startDate = new Date();
    const endDate = new Date();
    if (trialDays && Number(trialDays) > 0) {
      endDate.setDate(endDate.getDate() + Number(trialDays));
    } else switch (duration) {
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
