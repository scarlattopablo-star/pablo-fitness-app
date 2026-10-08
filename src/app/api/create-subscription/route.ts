import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST: Crea una suscripcion (service role, bypassea RLS).
//
// Reglas de acceso (solo Pablo da acceso gratis):
// - Admin: puede crear cualquier suscripcion para cualquier usuario.
// - Cliente: SOLO puede activar la suscripcion gratis de un codigo que Pablo
//   genero y que el mismo canjeo (/api/free-access). La duracion sale del codigo,
//   no del body, y cada codigo se puede aplicar una sola vez.
// - Las suscripciones pagas las crea unicamente el webhook de MercadoPago.

function calculateEndDate(duration: string, trialDays?: number): Date {
  const endDate = new Date();
  if (trialDays && trialDays > 0) {
    endDate.setDate(endDate.getDate() + trialDays);
    return endDate;
  }
  switch (duration) {
    case "1-mes":
    case "30-dias":
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case "3-meses":
      endDate.setMonth(endDate.getMonth() + 3);
      break;
    case "6-meses":
      endDate.setMonth(endDate.getMonth() + 6);
      break;
    case "custom":
      // Cliente directo: sin vencimiento practico (igual que /api/admin/convert-direct)
      endDate.setFullYear(endDate.getFullYear() + 10);
      break;
    case "1-ano":
    default:
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
  }
  return endDate;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await request.json();
    const { userId, currency } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    const token = (request.headers.get("authorization") || "").replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token invalido" }, { status: 401 });
    }

    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    const isAdmin = !!callerProfile?.is_admin;

    if (!isAdmin && user.id !== userId) {
      return NextResponse.json({ error: "No autorizado para este usuario" }, { status: 403 });
    }

    let duration: string;
    let amountPaid = 0;
    let planSlug: string | null = null;
    let trialDays: number | undefined;

    if (isAdmin) {
      duration = body.duration;
      amountPaid = Number(body.amountPaid) || 0;
      trialDays = Number(body.trialDays) || undefined;
      if (!duration) {
        return NextResponse.json({ error: "duration requerido" }, { status: 400 });
      }
    } else {
      // El cliente tiene que haber canjeado un codigo de Pablo
      const { data: codes } = await supabase
        .from("free_access_codes")
        .select("plan_slug, duration, created_at")
        .eq("used_by", userId)
        .order("created_at", { ascending: false });

      if (!codes || codes.length === 0) {
        return NextResponse.json({ error: "Necesitás un código de acceso válido" }, { status: 403 });
      }

      // Cada codigo canjeado habilita UNA suscripcion gratis (evita renovarse infinitamente)
      const { count: freeSubs } = await supabase
        .from("subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("amount_paid", 0)
        .is("mercadopago_payment_id", null);

      if ((freeSubs || 0) >= codes.length) {
        const { data: current } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (current) return NextResponse.json({ success: true, subscription: current });
        return NextResponse.json({ error: "Este código ya fue aplicado" }, { status: 409 });
      }

      const code = codes[0];
      planSlug = code.plan_slug === "direct-client" ? "direct-client" : null;
      duration = code.duration || "1-mes";
    }

    // Verify the user exists in auth
    const { data: { user: authUser }, error: userCheckErr } = await supabase.auth.admin.getUserById(userId);
    if (userCheckErr || !authUser) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    // Ensure profile exists (create if missing - handles race conditions during signup)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!profile) {
      await supabase.from("profiles").upsert({
        id: userId,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "",
      }, { onConflict: "id" });
    }

    const startDate = new Date();
    const endDate = calculateEndDate(duration, trialDays);

    const row = {
      duration,
      amount_paid: amountPaid,
      currency: currency || "UYU",
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      ...(planSlug ? { plan_slug: planSlug } : {}),
    };

    // Admin: si ya hay una activa la actualiza (evita duplicados en reintentos)
    if (isAdmin) {
      const { data: existing } = await supabase.from("subscriptions")
        .select("id").eq("user_id", userId).eq("status", "active")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();

      if (existing) {
        const { data, error } = await supabase.from("subscriptions")
          .update(row).eq("id", existing.id).select().single();
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ success: true, subscription: data });
      }
    }

    const { data, error } = await supabase.from("subscriptions").insert({
      user_id: userId,
      ...row,
      status: "active",
    }).select().single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch {
    return NextResponse.json({ error: "Error al crear suscripcion" }, { status: 500 });
  }
}
