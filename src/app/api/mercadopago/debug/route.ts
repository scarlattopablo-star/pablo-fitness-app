import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Debug endpoint to check webhook health and recent payments
// Only accessible with admin credentials (service role or admin user)
export async function GET(request: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Environment check
    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: !!url,
      SUPABASE_SERVICE_ROLE_KEY: !!key,
      MP_ACCESS_TOKEN: !!process.env.MP_ACCESS_TOKEN,
      MP_WEBHOOK_SECRET: !!process.env.MP_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "(not set)",
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL || "(unknown)"}/api/mercadopago/webhook`,
    };

    if (!url || !key) {
      return NextResponse.json({ envStatus, error: "Missing Supabase env vars" }, { status: 500 });
    }

    const adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Recent payments (last 10)
    const { data: recentPayments, error: payError } = await adminClient
      .from("payments")
      .select("id, mercadopago_id, amount, status, created_at, user_id")
      .order("created_at", { ascending: false })
      .limit(10);

    // Recent subscriptions (last 10)
    const { data: recentSubs, error: subError } = await adminClient
      .from("subscriptions")
      .select("id, user_id, plan_id, duration, status, start_date, end_date, mercadopago_payment_id, created_at, plans(slug, name)")
      .order("created_at", { ascending: false })
      .limit(10);

    // Count active subscriptions
    const { count: activeSubs } = await adminClient
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    return NextResponse.json({
      envStatus,
      stats: {
        activeSubscriptions: activeSubs,
      },
      recentPayments: recentPayments || [],
      recentSubscriptions: recentSubs || [],
      errors: {
        payments: payError?.message || null,
        subscriptions: subError?.message || null,
      },
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
