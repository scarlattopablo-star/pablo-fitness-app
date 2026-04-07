import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const type = request.nextUrl.searchParams.get("type") || "weekly";

  if (type === "weekly") {
    // Get current week's ranking
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toISOString().split("T")[0];

    const { data } = await supabase
      .from("weekly_rankings")
      .select("user_id, xp_earned, sessions_count")
      .eq("week_start", weekStart)
      .order("xp_earned", { ascending: false })
      .limit(50);

    if (!data || data.length === 0) {
      return NextResponse.json({ rankings: [], weekStart });
    }

    // Get user profiles
    const userIds = data.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds)
      .eq("is_admin", false)
      .is("deleted_at", null);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    const rankings = data
      .filter(r => profileMap.has(r.user_id))
      .map((r, i) => ({
        rank: i + 1,
        userId: r.user_id,
        name: profileMap.get(r.user_id)?.full_name || "Usuario",
        avatarUrl: profileMap.get(r.user_id)?.avatar_url,
        xp: r.xp_earned,
        sessions: r.sessions_count,
      }));

    return NextResponse.json({ rankings, weekStart });
  }

  // All-time ranking by total XP
  const { data } = await supabase
    .from("user_xp")
    .select("user_id, total_xp, level, level_name")
    .order("total_xp", { ascending: false })
    .limit(50);

  if (!data || data.length === 0) {
    return NextResponse.json({ rankings: [] });
  }

  const userIds = data.map(r => r.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds)
    .eq("is_admin", false)
    .is("deleted_at", null);

  const profileMap = new Map((profiles || []).map(p => [p.id, p]));

  const rankings = data
    .filter(r => profileMap.has(r.user_id))
    .map((r, i) => ({
      rank: i + 1,
      userId: r.user_id,
      name: profileMap.get(r.user_id)?.full_name || "Usuario",
      avatarUrl: profileMap.get(r.user_id)?.avatar_url,
      xp: r.total_xp,
      level: r.level,
      levelName: r.level_name,
    }));

  return NextResponse.json({ rankings });
}
