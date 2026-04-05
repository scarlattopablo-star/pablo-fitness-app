import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page } = body;

    await supabaseAnon.from("page_visits").insert({
      page: page || "/",
      visited_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Total visits
    const { count: totalVisits } = await supabaseAdmin
      .from("page_visits")
      .select("*", { count: "exact", head: true });

    // Today's visits
    const today = new Date().toISOString().split("T")[0];
    const { count: todayVisits } = await supabaseAdmin
      .from("page_visits")
      .select("*", { count: "exact", head: true })
      .gte("visited_at", `${today}T00:00:00`);

    // This week's visits
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: weekVisits } = await supabaseAdmin
      .from("page_visits")
      .select("*", { count: "exact", head: true })
      .gte("visited_at", weekAgo);

    // This month's visits
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: monthVisits } = await supabaseAdmin
      .from("page_visits")
      .select("*", { count: "exact", head: true })
      .gte("visited_at", monthAgo);

    return NextResponse.json({
      total: totalVisits || 0,
      today: todayVisits || 0,
      week: weekVisits || 0,
      month: monthVisits || 0,
    });
  } catch {
    return NextResponse.json({ total: 0, today: 0, week: 0, month: 0 });
  }
}
