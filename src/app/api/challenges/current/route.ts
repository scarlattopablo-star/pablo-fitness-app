import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/challenges/current
// Returns the active monthly challenge + user's progress + top 5 leaderboard.

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

    // Current month start
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString().split("T")[0];

    // Get current challenge
    const { data: challenge } = await sb
      .from("monthly_challenges")
      .select("*")
      .eq("month", monthStartISO)
      .maybeSingle();

    if (!challenge) return NextResponse.json({ challenge: null });

    // Compute progress for everyone for this month, then extract user + top 5
    // Metric-specific computation
    let usersProgress: Array<{ user_id: string; progress: number }> = [];

    if (challenge.metric === "sessions") {
      // Distinct days with exercise_logs this month, per user
      const { data: logs } = await sb
        .from("exercise_logs")
        .select("user_id, created_at")
        .gte("created_at", monthStart.toISOString());
      const perUser: Record<string, Set<string>> = {};
      for (const l of logs || []) {
        const day = new Date(l.created_at).toISOString().split("T")[0];
        (perUser[l.user_id] = perUser[l.user_id] || new Set()).add(day);
      }
      usersProgress = Object.entries(perUser).map(([uid, days]) => ({ user_id: uid, progress: days.size }));
    } else if (challenge.metric === "xp") {
      // Sum weekly_rankings xp_earned where week_start >= monthStart
      const { data: ranks } = await sb
        .from("weekly_rankings")
        .select("user_id, xp_earned, week_start")
        .gte("week_start", monthStartISO);
      const perUser: Record<string, number> = {};
      for (const r of ranks || []) perUser[r.user_id] = (perUser[r.user_id] || 0) + (r.xp_earned || 0);
      usersProgress = Object.entries(perUser).map(([uid, xp]) => ({ user_id: uid, progress: xp }));
    } else if (challenge.metric === "streak") {
      const { data: streaks } = await sb.from("user_streaks").select("user_id, current_streak");
      usersProgress = (streaks || []).map(s => ({ user_id: s.user_id, progress: s.current_streak || 0 }));
    } else if (challenge.metric === "volume") {
      const { data: logs } = await sb
        .from("exercise_logs")
        .select("user_id, sets_data")
        .gte("created_at", monthStart.toISOString());
      const perUser: Record<string, number> = {};
      for (const l of logs || []) {
        if (!Array.isArray(l.sets_data)) continue;
        let v = 0;
        for (const s of l.sets_data as { weight?: number; reps?: number }[]) {
          if (typeof s.weight === "number" && typeof s.reps === "number") v += s.weight * s.reps;
        }
        perUser[l.user_id] = (perUser[l.user_id] || 0) + v;
      }
      usersProgress = Object.entries(perUser).map(([uid, vol]) => ({ user_id: uid, progress: Math.round(vol) }));
    }

    // Enrich with names, filter admins/deleted
    const userIds = usersProgress.map(u => u.user_id);
    const { data: profiles } = await sb
      .from("profiles")
      .select("id, full_name, is_admin, deleted_at")
      .in("id", userIds.length ? userIds : ["00000000-0000-0000-0000-000000000000"]);
    const profileMap = new Map(
      (profiles || [])
        .filter(p => !p.is_admin && !p.deleted_at)
        .map(p => [p.id, p.full_name?.split(" ")[0] || "Atleta"])
    );

    const filtered = usersProgress
      .filter(u => profileMap.has(u.user_id))
      .sort((a, b) => b.progress - a.progress);

    const leaderboard = filtered.slice(0, 5).map((u, i) => ({
      rank: i + 1,
      userId: u.user_id,
      name: profileMap.get(u.user_id),
      progress: u.progress,
      completed: u.progress >= challenge.target_value,
      isMe: u.user_id === user.id,
    }));

    const myEntry = filtered.find(u => u.user_id === user.id);
    const myRank = myEntry ? filtered.findIndex(u => u.user_id === user.id) + 1 : null;

    return NextResponse.json({
      challenge,
      leaderboard,
      myProgress: myEntry?.progress || 0,
      myRank,
      totalParticipants: filtered.length,
    });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
