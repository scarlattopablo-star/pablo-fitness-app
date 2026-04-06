import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: Get referral stats for current user, or validate a referral code
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  // Validate a referral code (public - no auth needed)
  if (code) {
    const { data: referrer } = await supabase
      .from("profiles")
      .select("id, full_name, referral_code")
      .eq("referral_code", code.toUpperCase())
      .single();

    if (!referrer) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      referrerName: referrer.full_name?.split(" ")[0] || "Un amigo",
      discount: 15,
    });
  }

  // Get stats for authenticated user
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Get user's referral code
  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single();

  // Get referral stats
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, referred_id, status, reward_applied, days_rewarded, created_at, profiles!referrals_referred_id_fkey(full_name)")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false });

  const totalReferred = referrals?.filter((r) => r.status === "completed").length || 0;
  const totalDaysEarned = referrals?.reduce((sum, r) => sum + (r.days_rewarded || 0), 0) || 0;

  return NextResponse.json({
    referralCode: profile?.referral_code || "",
    referralLink: `${process.env.NEXT_PUBLIC_SITE_URL || "https://pabloscarlattoentrenamientos.com"}/ref/${profile?.referral_code || ""}`,
    totalReferred,
    totalDaysEarned,
    referrals: referrals || [],
  });
}
