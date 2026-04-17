import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

const CATEGORIES = {
  motivacion: {
    label: "Motivación",
    instruction: `Genera una frase motivacional poderosa para fitness/musculación en español.
Debe ser corta, impactante y directa. Estilo atlético, sin clichés baratos.
Tono de entrenador que habla de igual a igual, no de coach motivacional americano.`,
  },
  "tip-entreno": {
    label: "Tip de entrenamiento",
    instruction: `Genera un tip de entrenamiento concreto y útil en español.
Basado en evidencia científica (ACSM/NSCA). Específico, accionable.
Puede ser sobre técnica, periodización, recuperación, progresión, series, repeticiones, etc.`,
  },
  "tip-nutricion": {
    label: "Tip de nutrición",
    instruction: `Genera un tip de nutrición deportiva en español.
Basado en evidencia. Práctico, sin vender suplementos.
Puede ser sobre timing de comidas, proteínas, carbohidratos, hidratación, etc.`,
  },
  dato: {
    label: "Dato curioso",
    instruction: `Genera un dato científico curioso sobre fitness, músculo, metabolismo o nutrición en español.
Debe ser sorprendente, real y verificable. Algo que la gente quiera compartir.`,
  },
  pregunta: {
    label: "Pregunta interactiva",
    instruction: `Genera una pregunta interactiva para fitness en español que genere debate o reflexión.
Tipo: "¿Cuántos días entrenas por semana?" / "¿Cuál es tu ejercicio favorito?" / "¿Proteína antes o después?"
Debe generar engagement en Instagram.`,
  },
  mito: {
    label: "Mito vs Realidad",
    instruction: `Genera un mito común del fitness o nutrición y su realidad en español.
El mito debe ser algo que mucha gente cree. La realidad, la versión basada en evidencia.
Directo al punto.`,
  },
  "antes-despues": {
    label: "Antes / Después (texto)",
    instruction: `Genera un copy para post de transformación física en español.
Menciona esfuerzo, consistencia, tiempo. Motivacional pero realista.
Que inspire a empezar, no que venda magia.`,
  },
};

type Category = keyof typeof CATEGORIES;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const authHeader = request.headers.get("authorization");
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      const { data: profile } = await supabaseAdmin
        .from("profiles").select("is_admin").eq("id", user?.id ?? "").single();
      if (!profile?.is_admin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();
    const { category, topic, format } = body as {
      category: Category;
      topic?: string;
      format: "square" | "story";
    };

    const catDef = CATEGORIES[category];
    if (!catDef) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const topicLine = topic ? `\nTema específico del usuario: "${topic}"` : "";
    const formatNote = format === "story"
      ? "Es para una Story de Instagram (formato vertical). El headline puede ser más largo."
      : "Es para un post de feed de Instagram (cuadrado). El headline debe ser corto e impactante.";

    const prompt = `Sos el asistente de Pablo Scarlatto, entrenador personal uruguayo campeón de fisicoculturismo 2019.
Creás contenido para su Instagram con voz directa, atlética y sin vueltas.

${catDef.instruction}
${topicLine}

${formatNote}

Responde SOLO con un JSON con exactamente estos campos (sin markdown, sin explicaciones):
{
  "eyebrow": "texto pequeño arriba (máx 4 palabras en mayúsculas, ej: 'TIP DE ENTRENAMIENTO')",
  "headline": "titular principal (máx 8 palabras, impactante, en mayúsculas)",
  "body": "texto descriptivo (2-3 oraciones, en español natural, sin emojis)",
  "cta": "llamada a la acción (máx 6 palabras, ej: 'Guardalo y ponlo en práctica')",
  "extra": "dato extra opcional, puede ser vacío (ej: fuente, dato numérico, segundo punto)"
}`;

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();
    // Strip possible markdown code blocks
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const generated = JSON.parse(jsonStr);

    return NextResponse.json({
      success: true,
      category,
      categoryLabel: catDef.label,
      ...generated,
    });
  } catch (err) {
    console.error("generate-content error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
