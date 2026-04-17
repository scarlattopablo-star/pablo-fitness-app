import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { suggestNextWeight, type Session } from "@/lib/rpe-calculator";

// GET /api/suggest-weight?exerciseId=...&targetReps=8&compound=true
// Returns: { suggestion: Suggestion | null }

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

    const exerciseId = req.nextUrl.searchParams.get("exerciseId");
    const targetReps = parseInt(req.nextUrl.searchParams.get("targetReps") || "8");
    const compound = req.nextUrl.searchParams.get("compound") === "true";
    if (!exerciseId) return NextResponse.json({ error: "exerciseId requerido" }, { status: 400 });

    const { data: logs } = await sb
      .from("exercise_logs")
      .select("sets_data, created_at")
      .eq("user_id", user.id)
      .eq("exercise_id", exerciseId)
      .order("created_at", { ascending: false })
      .limit(5);

    const sessions: Session[] = (logs || []).map(l => ({
      date: l.created_at,
      sets: Array.isArray(l.sets_data) ? l.sets_data : [],
    }));

    const suggestion = suggestNextWeight(sessions, targetReps, { compound });
    return NextResponse.json({ suggestion });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
