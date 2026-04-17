import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Public stats endpoint — returns aggregate numbers for marketing/social proof.
// Cached for 5 minutes.

export const revalidate = 300;

const MONTHLY_CAP = parseInt(process.env.MONTHLY_CLIENT_CAP || "30");

export async function GET() {
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    // Active subscribers started this month
    const { count: monthSignups } = await sb
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .eq("status", "active");

    // Total active clients
    const { count: totalActive } = await sb
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active");

    const taken = monthSignups || 0;
    const remaining = Math.max(0, MONTHLY_CAP - taken);

    return NextResponse.json({
      monthlyCapacity: {
        cap: MONTHLY_CAP,
        taken,
        remaining,
        percentFull: Math.round((taken / MONTHLY_CAP) * 100),
      },
      totalActive: totalActive || 0,
    });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
