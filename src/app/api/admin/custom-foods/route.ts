import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// GET /api/admin/custom-foods — list all custom foods
// POST /api/admin/custom-foods — add a new custom food
// DELETE /api/admin/custom-foods?id=... — delete a custom food

async function getAdminUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return null;
  return { user, supabase };
}

export async function GET(request: NextRequest) {
  const auth = await getAdminUser(request);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await auth.supabase
    .from("custom_foods")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ foods: data || [] });
}

export async function POST(request: NextRequest) {
  const auth = await getAdminUser(request);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, calories, protein, carbs, fat, unit, category } = body;

  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "Nombre requerido (min 2 caracteres)" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("custom_foods")
    .insert({
      name: name.trim(),
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      unit: unit || "g",
      category: category || "other",
      created_by: auth.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ food: data });
}

export async function DELETE(request: NextRequest) {
  const auth = await getAdminUser(request);
  if (!auth) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const foodId = request.nextUrl.searchParams.get("id");
  if (!foodId) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const { error } = await auth.supabase
    .from("custom_foods")
    .delete()
    .eq("id", foodId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
