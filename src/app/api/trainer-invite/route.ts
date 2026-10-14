import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

type Invite = { token: string; invitee_name: string; message: string | null; expires_at: string; used_by: string | null };

async function loadInvite(token: string | null): Promise<{ invite?: Invite; error?: string; status?: number }> {
  if (!token) return { error: "Invitacion invalida", status: 400 };
  const { data } = await admin()
    .from("trainer_invites")
    .select("token, invitee_name, message, expires_at, used_by")
    .eq("token", token)
    .maybeSingle();
  if (!data) return { error: "Esta invitacion no existe", status: 404 };
  return { invite: data as Invite };
}

// GET ?t=TOKEN → datos publicos de la invitacion (nombre y mensaje de Pablo)
export async function GET(request: NextRequest) {
  const { invite, error, status } = await loadInvite(request.nextUrl.searchParams.get("t"));
  if (!invite) return NextResponse.json({ error }, { status });
  return NextResponse.json({
    name: invite.invitee_name,
    message: invite.message,
    used: !!invite.used_by,
    expired: new Date(invite.expires_at) < new Date(),
  });
}

// POST { token } + Bearer → la cuenta logueada acepta la invitacion y queda como entrenador
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const sb = admin();
  const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
  if (!user) return NextResponse.json({ error: "Sesion invalida" }, { status: 401 });

  const { token } = await request.json();
  const { invite, error, status } = await loadInvite(token);
  if (!invite) return NextResponse.json({ error }, { status });
  if (invite.used_by && invite.used_by !== user.id) {
    return NextResponse.json({ error: "Esta invitacion ya fue usada" }, { status: 409 });
  }
  if (!invite.used_by && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Esta invitacion vencio. Pedile a Pablo una nueva." }, { status: 410 });
  }

  // Marcar usada solo si sigue libre (evita que dos cuentas usen el mismo link)
  if (!invite.used_by) {
    const { data: claimed } = await sb
      .from("trainer_invites")
      .update({ used_by: user.id, used_at: new Date().toISOString() })
      .eq("token", invite.token)
      .is("used_by", null)
      .select("token");
    if (!claimed?.length) return NextResponse.json({ error: "Esta invitacion ya fue usada" }, { status: 409 });
  }

  const { error: trErr } = await sb.from("trainers").upsert({ user_id: user.id });
  if (trErr) return NextResponse.json({ error: trErr.message }, { status: 500 });

  const { data: survey } = await sb.from("surveys").select("id").eq("user_id", user.id).limit(1).maybeSingle();
  return NextResponse.json({ ok: true, hasSurvey: !!survey });
}
