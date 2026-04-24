// Admin: busca GIFs en ExerciseDB (mirror publico de free-exercise-db).
// Devuelve lista de {name, gifUrl, bodyPart, equipment} filtrada por nombre.
// Sin API key — fuente publica.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const maxDuration = 20;

// JSON canonical de free-exercise-db (cache en memoria del proceso).
const DATA_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
// Base CDN de imagenes (JPG animados que actuan como GIF).
const IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

interface FreeExercise {
  id: string;
  name: string;
  force?: string;
  level?: string;
  mechanic?: string;
  equipment?: string;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  category?: string;
  images?: string[];
}

let cache: { loadedAt: number; list: FreeExercise[] } | null = null;

async function loadCatalog(): Promise<FreeExercise[]> {
  if (cache && Date.now() - cache.loadedAt < 60 * 60 * 1000) return cache.list;
  const res = await fetch(DATA_URL, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`HTTP ${res.status} al bajar catalogo`);
  const list = (await res.json()) as FreeExercise[];
  cache = { loadedAt: Date.now(), list };
  return list;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreMatch(query: string, name: string): number {
  const q = normalize(query);
  const n = normalize(name);
  if (n === q) return 100;
  if (n.startsWith(q)) return 80;
  if (n.includes(q)) return 60;
  // score por tokens
  const qt = q.split(" ").filter(Boolean);
  const nt = n.split(" ").filter(Boolean);
  const hit = qt.filter((t) => nt.includes(t)).length;
  return hit > 0 ? (hit / qt.length) * 50 : 0;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing bearer token" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data: p } = await supabaseAdmin.from("profiles").select("is_admin").eq("id", user.id).single();
    if (!p?.is_admin) return NextResponse.json({ error: "Not admin" }, { status: 403 });

    const body = await request.json();
    const { name } = body as { name?: string };
    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "name requerido (min 2 chars)" }, { status: 400 });
    }

    const list = await loadCatalog();
    const scored = list
      .map((ex) => ({ ex, score: scoreMatch(name, ex.name) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const results = scored.map(({ ex, score }) => ({
      externalId: ex.id,
      name: ex.name,
      score,
      bodyPart: ex.primaryMuscles?.[0] || null,
      equipment: ex.equipment || null,
      level: ex.level || null,
      // Primera imagen disponible. free-exercise-db trae JPGs sequence; el
      // primero suele mostrar la posicion de inicio — aceptable para preview.
      gifUrl: ex.images?.[0] ? `${IMG_BASE}/${ex.images[0]}` : null,
    })).filter((r) => r.gifUrl);

    return NextResponse.json({ success: true, results });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
