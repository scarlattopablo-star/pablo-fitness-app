import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface StaffContext {
  adminClient: SupabaseClient;
  userId: string;
  isAdmin: boolean;
  isTrainer: boolean;
}

/**
 * Verifica el Bearer token y devuelve si el usuario es admin y/o entrenador suplente.
 * Devuelve una NextResponse de error si no esta autenticado o no es staff.
 */
export async function getStaff(request: NextRequest): Promise<StaffContext | NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user }, error } = await adminClient.auth.getUser(authHeader.slice(7));
  if (error || !user) {
    return NextResponse.json({ error: "Token invalido" }, { status: 401 });
  }

  const [{ data: profile }, { data: trainer }] = await Promise.all([
    adminClient.from("profiles").select("is_admin, deleted_at").eq("id", user.id).single(),
    adminClient.from("trainers").select("user_id").eq("user_id", user.id).maybeSingle(),
  ]);

  const isAdmin = !!profile?.is_admin;
  const isTrainer = !!trainer && !profile?.deleted_at;
  if (!isAdmin && !isTrainer) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return { adminClient, userId: user.id, isAdmin, isTrainer };
}

/** IDs de los clientes directos (personalizados): via codigo QR o suscripcion direct-client. */
export async function getDirectClientIds(adminClient: SupabaseClient): Promise<Set<string>> {
  const [codesRes, subsRes] = await Promise.all([
    adminClient.from("free_access_codes").select("used_by")
      .eq("plan_slug", "direct-client").eq("used", true).not("used_by", "is", null),
    adminClient.from("subscriptions").select("user_id").eq("plan_slug", "direct-client"),
  ]);
  return new Set<string>([
    ...(codesRes.data?.map((c: { used_by: string }) => c.used_by) || []),
    ...(subsRes.data?.map((s: { user_id: string }) => s.user_id) || []),
  ]);
}

/** Un entrenador solo puede operar sobre clientes directos (y nunca sobre otro staff). */
export async function canTrainerAccessClient(adminClient: SupabaseClient, clientId: string): Promise<boolean> {
  const [{ data: profile }, { data: trainer }, directIds] = await Promise.all([
    adminClient.from("profiles").select("is_admin, deleted_at").eq("id", clientId).maybeSingle(),
    adminClient.from("trainers").select("user_id").eq("user_id", clientId).maybeSingle(),
    getDirectClientIds(adminClient),
  ]);
  if (!profile || profile.is_admin || profile.deleted_at || trainer) return false;
  return directIds.has(clientId);
}

type SessionExercise = { id?: string; name?: string; sets?: { weight: number; reps: number }[] };

/** Guarda una sesion de entrenamiento en la cuenta del cliente y dispara la gamificacion. */
export async function logSessionForClient(
  adminClient: SupabaseClient,
  clientId: string,
  exercises: SessionExercise[],
): Promise<string | null> {
  for (const ex of exercises) {
    if (!ex.id || !ex.name || !ex.sets || !Array.isArray(ex.sets)) continue;
    const validSets = ex.sets.filter((s) => s.weight > 0);
    if (validSets.length === 0) continue;

    const { error } = await adminClient.from("exercise_logs").insert({
      user_id: clientId,
      exercise_id: ex.id,
      exercise_name: ex.name,
      sets_data: validSets,
    });
    if (error) return `Error guardando ${ex.name}: ${error.message}`;
  }

  // Trigger gamification (XP, streak, achievements, ranking) on behalf of the client
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    await fetch(`${baseUrl}/api/gamification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: clientId, action: "session_logged" }),
    });
  } catch {
    // Non-critical — don't fail the session save if gamification errors
  }
  return null;
}
