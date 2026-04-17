import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/gamification/feed
// Returns recent achievements across all (non-admin, non-deleted) users.
// Used to render a community "Feed de logros" section.

export async function GET(req: NextRequest) {
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

    const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "30"), 100);
    const sinceDays = parseInt(req.nextUrl.searchParams.get("days") || "14");
    const since = new Date(Date.now() - sinceDays * 86400000).toISOString();

    // Recent achievements earned
    const { data: achievements } = await sb
      .from("user_achievements")
      .select("user_id, achievement_id, earned_at")
      .gte("earned_at", since)
      .order("earned_at", { ascending: false })
      .limit(limit);

    if (!achievements || achievements.length === 0) {
      return NextResponse.json({ feed: [] });
    }

    // Enrich with profile + achievement definition
    const userIds = [...new Set(achievements.map(a => a.user_id))];
    const achIds = [...new Set(achievements.map(a => a.achievement_id))];

    const [profilesRes, defsRes] = await Promise.all([
      sb.from("profiles").select("id, full_name, is_admin, deleted_at").in("id", userIds),
      sb.from("achievements").select("id, name, description, icon, xp_reward").in("id", achIds),
    ]);

    const profileMap = new Map(
      (profilesRes.data || [])
        .filter(p => !p.is_admin && !p.deleted_at)
        .map(p => [p.id, p.full_name?.split(" ")[0] || "Alguien"])
    );
    const defMap = new Map((defsRes.data || []).map(d => [d.id, d]));

    const feed = achievements
      .filter(a => profileMap.has(a.user_id) && defMap.has(a.achievement_id))
      .map(a => {
        const def = defMap.get(a.achievement_id)!;
        return {
          userId: a.user_id,
          userFirstName: profileMap.get(a.user_id),
          achievementId: a.achievement_id,
          achievementName: def.name,
          achievementIcon: def.icon,
          achievementDescription: def.description,
          xpReward: def.xp_reward || 0,
          earnedAt: a.earned_at,
          isMe: a.user_id === user.id,
        };
      });

    return NextResponse.json({ feed });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
