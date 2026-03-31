import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

// GET: Validate a free access code
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code" }, { status: 400 });
  }

  const { data } = await supabase
    .from("free_access_codes")
    .select("*")
    .eq("code", code)
    .eq("used", false)
    .single();

  if (!data) {
    return NextResponse.json({ error: "Invalid or used code" }, { status: 404 });
  }

  return NextResponse.json({ valid: true, plan_slug: data.plan_slug, duration: data.duration });
}
