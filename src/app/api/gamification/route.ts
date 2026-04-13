import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getLevelForXp, XP_REWARDS, ACHIEVEMENT_CHECKS } from "@/lib/gamification";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET: Load user's gamification data (xp, level, streak, achievements, ranking)
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId requerido" }, { status: 400 });

  const supabase = getSupabase();

  const [xpRes, streakRes, achievementsRes, rankingRes, allAchievementsRes] = await Promise.all([
    supabase.from("user_xp").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_streaks").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("user_achievements").select("achievement_id, earned_at").eq("user_id", userId),
    supabase.from("weekly_rankings").select("*").eq("user_id", userId)
      .gte("week_start", getWeekStart()).maybeSingle(),
    supabase.from("achievements").select("*").order("sort_order"),
  ]);

  const xp = xpRes.data || { total_xp: 0, level: 1, level_name: "Novato" };
  const streak = streakRes.data || { current_streak: 0, max_streak: 0 };
  const earned = new Set((achievementsRes.data || []).map(a => a.achievement_id));
  const earnedList = (achievementsRes.data || []);
  const level = getLevelForXp(xp.total_xp);

  // Calculate weekly rank position
  let rankPosition: number | null = null;
  if (rankingRes.data) {
    const weekStart = getWeekStart();
    const { data: allRankings } = await supabase
      .from("weekly_rankings")
      .select("user_id, xp_earned")
      .eq("week_start", weekStart)
      .order("xp_earned", { ascending: false });
    if (allRankings) {
      const idx = allRankings.findIndex(r => r.user_id === userId);
      if (idx >= 0) rankPosition = idx + 1;
    }
  }

  // Enrich earned achievements with name/icon from definitions
  const allAchDefs = allAchievementsRes.data || [];
  const achMap = new Map(allAchDefs.map(a => [a.id, a]));
  const enrichedEarned = earnedList.map(e => {
    const def = achMap.get(e.achievement_id);
    return { ...e, name: def?.name || "", icon: def?.icon || "🏆" };
  });

  return NextResponse.json({
    xp: xp.total_xp,
    level: level.level,
    levelName: level.name,
    nextLevel: level.nextLevel,
    xpToNext: level.xpToNext,
    progress: level.progress,
    streak: streak.current_streak,
    maxStreak: streak.max_streak,
    ranking: rankingRes.data || null,
    rankPosition,
    earnedAchievements: enrichedEarned,
    allAchievements: allAchDefs.map(a => ({
      ...a,
      earned: earned.has(a.id),
    })),
  });
}

// POST: Record an action and update XP, streaks, achievements
export async function POST(request: NextRequest) {
  try {
    const { userId, action } = await request.json();
    if (!userId || !action) return NextResponse.json({ error: "userId y action requeridos" }, { status: 400 });

    const supabase = getSupabase();
    const results: { xpGained: number; newAchievements: string[]; levelUp: boolean; newLevel?: string } = {
      xpGained: 0, newAchievements: [], levelUp: false,
    };

    // Calculate XP for action
    let xpGain = 0;
    switch (action) {
      case "session_logged": xpGain = XP_REWARDS.SESSION_LOGGED; break;
      case "personal_record": xpGain = XP_REWARDS.PERSONAL_RECORD; break;
      case "progress_photo": xpGain = XP_REWARDS.PROGRESS_PHOTO; break;
      case "food_swap": xpGain = XP_REWARDS.FOOD_SWAP; break;
      case "chat_message": xpGain = XP_REWARDS.CHAT_MESSAGE; break;
      default: break;
    }

    // Update XP
    if (xpGain > 0) {
      const { data: currentXp } = await supabase.from("user_xp")
        .select("total_xp").eq("user_id", userId).maybeSingle();

      const oldXp = currentXp?.total_xp || 0;
      const newXp = oldXp + xpGain;
      const oldLevel = getLevelForXp(oldXp);
      const newLevel = getLevelForXp(newXp);

      await supabase.from("user_xp").upsert({
        user_id: userId,
        total_xp: newXp,
        level: newLevel.level,
        level_name: newLevel.name,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      results.xpGained = xpGain;

      if (newLevel.level > oldLevel.level) {
        results.levelUp = true;
        results.newLevel = newLevel.name;
      }
    }

    // Update streak for session actions
    if (action === "session_logged") {
      const today = new Date().toISOString().split("T")[0];
      const { data: streakData } = await supabase.from("user_streaks")
        .select("*").eq("user_id", userId).maybeSingle();

      let newStreak = 1;
      let maxStreak = 1;

      if (streakData) {
        const lastDate = streakData.last_activity_date;
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        if (lastDate === today) {
          // Already logged today
          newStreak = streakData.current_streak;
          maxStreak = streakData.max_streak;
        } else if (lastDate === yesterday) {
          // Consecutive day
          newStreak = streakData.current_streak + 1;
          maxStreak = Math.max(newStreak, streakData.max_streak);
        } else {
          // Streak broken
          newStreak = 1;
          maxStreak = streakData.max_streak;
        }
      }

      await supabase.from("user_streaks").upsert({
        user_id: userId,
        current_streak: newStreak,
        max_streak: maxStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      // Add streak XP bonus
      if (newStreak > 1) {
        const streakBonus = XP_REWARDS.STREAK_DAY;
        const { data: xpRow } = await supabase.from("user_xp").select("total_xp").eq("user_id", userId).single();
        if (xpRow) {
          await supabase.from("user_xp").update({ total_xp: xpRow.total_xp + streakBonus }).eq("user_id", userId);
        }
        results.xpGained += streakBonus;
      }

      // Update weekly ranking
      const weekStart = getWeekStart();
      const { data: weekRank } = await supabase.from("weekly_rankings")
        .select("*").eq("user_id", userId).eq("week_start", weekStart).maybeSingle();

      if (weekRank) {
        await supabase.from("weekly_rankings").update({
          xp_earned: weekRank.xp_earned + results.xpGained,
          sessions_count: weekRank.sessions_count + 1,
        }).eq("id", weekRank.id);
      } else {
        await supabase.from("weekly_rankings").insert({
          user_id: userId,
          week_start: weekStart,
          xp_earned: results.xpGained,
          sessions_count: 1,
        });
      }

      // Check achievements
      const stats = await getUserStats(supabase, userId);
      const { data: earned } = await supabase.from("user_achievements")
        .select("achievement_id").eq("user_id", userId);
      const earnedSet = new Set((earned || []).map(a => a.achievement_id));

      const { data: allAchievements } = await supabase.from("achievements").select("*");
      for (const achievement of allAchievements || []) {
        if (earnedSet.has(achievement.id)) continue;
        const check = ACHIEVEMENT_CHECKS[achievement.id];
        if (check && check(stats)) {
          await supabase.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
          });
          // Award XP for achievement
          const { data: xpData } = await supabase.from("user_xp")
            .select("total_xp").eq("user_id", userId).single();
          if (xpData) {
            const achievementXp = xpData.total_xp + achievement.xp_reward;
            const newLvl = getLevelForXp(achievementXp);
            await supabase.from("user_xp").update({
              total_xp: achievementXp,
              level: newLvl.level,
              level_name: newLvl.name,
            }).eq("user_id", userId);
          }
          results.newAchievements.push(achievement.id);
          results.xpGained += achievement.xp_reward;
        }
      }
    }

    // Send push notifications for achievements and level ups (fire and forget)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://pabloscarlattoentrenamientos.com";
    if (results.levelUp && results.newLevel) {
      fetch(`${baseUrl}/api/push/achievement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, type: "level_up", data: { level: results.newLevel, levelName: results.newLevel } }),
      }).catch(() => {});
    }
    for (const achievementId of results.newAchievements) {
      const ach = (await supabase.from("achievements").select("name, xp_reward").eq("id", achievementId).single()).data;
      if (ach) {
        fetch(`${baseUrl}/api/push/achievement`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, type: "new_badge", data: { badge: ach.name, xp: ach.xp_reward } }),
        }).catch(() => {});
      }
    }

    return NextResponse.json(results);
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getUserStats(supabase: any, userId: string) {
  const [sessionsRes, streakRes, progressRes, surveyRes, latestWeightRes] = await Promise.all([
    supabase.from("exercise_logs").select("id", { count: "exact" }).eq("user_id", userId),
    supabase.from("user_streaks").select("current_streak, max_streak").eq("user_id", userId).maybeSingle(),
    supabase.from("progress_entries").select("id", { count: "exact" }).eq("user_id", userId),
    supabase.from("surveys").select("weight").eq("user_id", userId).order("created_at", { ascending: true }).limit(1).maybeSingle(),
    supabase.from("progress_entries").select("weight").eq("user_id", userId).order("date", { ascending: false }).limit(1).maybeSingle(),
  ]);

  const initialWeight = surveyRes.data?.weight || 0;
  const currentWeight = latestWeightRes.data?.weight || initialWeight;
  const weightLost = Math.max(0, initialWeight - currentWeight);

  return {
    sessions: sessionsRes.count || 0,
    streak: streakRes.data?.current_streak || 0,
    maxStreak: streakRes.data?.max_streak || 0,
    progressPhotos: progressRes.count || 0,
    weightLost: Math.round(weightLost * 10) / 10,
  };
}
