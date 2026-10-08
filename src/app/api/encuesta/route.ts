import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function validateSurveyData(data: Record<string, unknown>): { valid: boolean; error?: string } {
  if (data.age !== undefined) {
    const age = Number(data.age);
    if (isNaN(age) || age < 14 || age > 100) return { valid: false, error: "Edad debe ser entre 14 y 100" };
  }
  if (data.weight !== undefined) {
    const weight = Number(data.weight);
    if (isNaN(weight) || weight < 30 || weight > 300) return { valid: false, error: "Peso debe ser entre 30 y 300 kg" };
  }
  if (data.height !== undefined) {
    const height = Number(data.height);
    if (isNaN(height) || height < 100 || height > 250) return { valid: false, error: "Altura debe ser entre 100 y 250 cm" };
  }
  if (data.training_days !== undefined) {
    const days = Number(data.training_days);
    if (isNaN(days) || days < 2 || days > 7) return { valid: false, error: "Dias de entrenamiento debe ser entre 2 y 7" };
  }
  if (data.sex !== undefined && !["hombre", "mujer"].includes(String(data.sex))) {
    return { valid: false, error: "Sexo debe ser hombre o mujer" };
  }
  if (data.activity_level !== undefined && !["sedentario", "moderado", "activo", "muy-activo"].includes(String(data.activity_level))) {
    return { valid: false, error: "Nivel de actividad invalido" };
  }
  // Accept any dietary restriction string (users can select "Otra", "Ninguna", etc.)
  if (data.dietary_restrictions !== undefined && Array.isArray(data.dietary_restrictions)) {
    for (const r of data.dietary_restrictions) {
      const str = String(r);
      if (str.length > 100 || /<[^>]*>/g.test(str)) return { valid: false, error: "Restriccion dietetica invalida" };
    }
  }
  // Sanitize text fields
  if (data.full_name !== undefined) {
    const name = String(data.full_name);
    if (name.length > 100 || /<[^>]*>/g.test(name)) return { valid: false, error: "Nombre invalido" };
  }
  return { valid: true };
}

// POST: Save survey data (uses service role to bypass RLS)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, full_name, email, ...surveyData } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 });
    }

    // Validate survey input
    const validation = validateSurveyData(surveyData);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Auth: solo el propio usuario (o un admin) puede guardar su encuesta
    const token = (request.headers.get("authorization") || "").replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { data: { user: caller } } = await supabase.auth.getUser(token);
    if (!caller) {
      return NextResponse.json({ error: "Sesión expirada. Volvé a iniciar sesión." }, { status: 401 });
    }
    if (caller.id !== userId) {
      const { data: callerProfile } = await supabase.from("profiles").select("is_admin").eq("id", caller.id).single();
      if (!callerProfile?.is_admin) {
        return NextResponse.json({ error: "No autorizado para este usuario" }, { status: 403 });
      }
    }

    // Ensure profile exists before inserting survey (FK constraint)
    const ensureProfile = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, deleted_at")
        .eq("id", userId)
        .single();

      if (profile) {
        if (profile.deleted_at) {
          await supabase.from("profiles").update({
            deleted_at: null,
            full_name: full_name || "",
            email: email || "",
          }).eq("id", userId);
        }
        return;
      }

      // Profile doesn't exist — try to create it
      // First attempt: maybe auth user exists but trigger didn't fire
      const { error: firstTry } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: full_name || "",
        email: email || "",
      }, { onConflict: "id" });

      if (!firstTry) return;
      if (!firstTry.message.includes("foreign key")) {
        throw new Error(`Error creando perfil: ${firstTry.message}`);
      }

      // FK violation — verificar YA si el usuario de auth existe (antes esperábamos
      // hasta 10s a ciegas). Si no existe, el signUp devolvió un id falso porque
      // el email ya estaba registrado.
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (!authUser?.user) {
        throw new Error("Tu cuenta no se creó bien. Si ya tenías cuenta con este email, iniciá sesión desde /login.");
      }

      // Auth user exists but profile still won't insert — retry briefly (signUp propagation)
      let lastErr: { message: string } | null = null;
      for (let i = 0; i < 3; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 1000));
        ({ error: lastErr } = await supabase.from("profiles").upsert({
          id: userId,
          full_name: full_name || authUser.user.user_metadata?.full_name || "",
          email: email || authUser.user.email || "",
        }, { onConflict: "id" }));
        if (!lastErr) break;
      }
      if (lastErr) {
        throw new Error(`Error creando perfil: ${lastErr.message}`);
      }
    };

    await ensureProfile();

    // Check if survey already exists (retry scenario)
    const { data: existing } = await supabase
      .from("surveys")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    let error;
    if (existing) {
      ({ error } = await supabase.from("surveys")
        .update(surveyData)
        .eq("id", existing.id));
    } else {
      ({ error } = await supabase.from("surveys").insert({
        user_id: userId,
        ...surveyData,
      }));
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error al guardar encuesta: ${msg}` }, { status: 500 });
  }
}

// PATCH: Update existing survey fields and regenerate plans
export async function PATCH(request: NextRequest) {
  try {
    // Get user from Bearer token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token requerido" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const body = await request.json();
    const userId = user.id;

    // Validate survey input
    const validation = validateSurveyData(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Find existing survey (need objective to decide regeneration policy)
    const { data: existing, error: findError } = await supabase
      .from("surveys")
      .select("id, objective")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json({ error: "No se encontró encuesta para actualizar" }, { status: 404 });
    }

    // Update only the provided fields
    const { error: updateError } = await supabase
      .from("surveys")
      .update(body)
      .eq("id", existing.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Politica de regeneracion:
    // - Cliente directo (objective === "direct-client"): el admin es el unico que
    //   regenera planes. No tocamos nada al actualizar la encuesta.
    // - Cliente regular: actualizar encuesta SOLO regenera el plan de alimentacion
    //   (el de entrenamiento queda intacto para no perder el progreso del cliente).
    const newObjective = typeof body.objective === "string" ? body.objective : existing.objective;
    const isDirectClient = newObjective === "direct-client";
    let regenerated: { mode?: string; skipped?: true } = { skipped: true };

    if (!isDirectClient) {
      const baseUrl = request.nextUrl.origin;
      const generateRes = await fetch(`${baseUrl}/api/generate-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-internal-key": process.env.SUPABASE_SERVICE_ROLE_KEY! },
        body: JSON.stringify({ userId, mode: "nutrition-only" }),
      });
      if (!generateRes.ok) {
        // Survey updated but plan generation failed - still return success
        console.error("Plan regeneration failed after survey update:", await generateRes.text());
      } else {
        regenerated = { mode: "nutrition-only" };
      }
    }

    return NextResponse.json({ success: true, regenerated });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json({ error: `Error al actualizar encuesta: ${msg}` }, { status: 500 });
  }
}
