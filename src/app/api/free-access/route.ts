import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET: Validate a free access code (read-only check)
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data } = await supabase
    .from("free_access_codes")
    .select("plan_slug, duration")
    .eq("code", code)
    .eq("used", false)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Codigo invalido o ya utilizado" }, { status: 404 });
  }

  return NextResponse.json({ valid: true, plan_slug: data.plan_slug, duration: data.duration });
}

// POST: Atomically claim a free access code (prevents race condition)
export async function POST(request: NextRequest) {
  try {
    const { code, userId } = await request.json();
    if (!code || !userId) {
      return NextResponse.json({ error: "code y userId requeridos" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Atomic: only updates if used=false, returns data if successful
    const { data, error } = await supabase
      .from("free_access_codes")
      .update({ used: true, used_by: userId })
      .eq("code", code)
      .eq("used", false)
      .select("plan_slug, duration")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Codigo invalido o ya utilizado" }, { status: 409 });
    }

    return NextResponse.json({ claimed: true, plan_slug: data.plan_slug, duration: data.duration });
  } catch {
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}
