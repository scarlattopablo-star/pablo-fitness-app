import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 45;

const CATEGORY_PROMPTS: Record<string, string> = {
  motivacion: "motivación y mentalidad atlética para fitness/musculación",
  "tip-entreno": "tips y técnicas de entrenamiento basados en evidencia científica",
  "tip-nutricion": "nutrición deportiva y hábitos alimenticios saludables",
  dato: "datos curiosos y científicos sobre músculo, metabolismo y fitness",
  pregunta: "preguntas interactivas y reflexiones sobre fitness",
  mito: "mitos del fitness y nutrición vs. la realidad científica",
  "antes-despues": "transformación física y el proceso de cambio",
  rutina: "estructura de una rutina de entrenamiento efectiva",
  recuperacion: "descanso, sueño y recuperación muscular",
  suplementos: "suplementación deportiva: qué funciona y qué no",
};

export async function POST(request: NextRequest) {
  try {
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
    const { category, topic, numSlides = 5 } = body as {
      category: string;
      topic?: string;
      numSlides?: number;
    };

    const slides = Math.min(Math.max(numSlides, 3), 7);
    const catPrompt = CATEGORY_PROMPTS[category] || category;
    const topicLine = topic ? `\nTema específico: "${topic}"` : "";

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const prompt = `Sos el asistente de Pablo Scarlatto, entrenador personal uruguayo.
Creás carruseles de Instagram sobre ${catPrompt}.${topicLine}

Generá un carrusel de ${slides} slides en español para Instagram.
Estructura:
- Slide 1: PORTADA — titular gancho que genere curiosidad y haga swipear
- Slides 2 a ${slides - 1}: CONTENIDO — cada uno desarrolla un punto, tip o paso concreto
- Slide ${slides}: CIERRE — resumen + llamada a la acción

Reglas:
- Voz directa, atlética, sin rodeos. Como habla Pablo con sus alumnos.
- Cada slide debe tener sentido solo, pero fluir como carrusel
- Nada de clichés motivacionales americanos
- Específico y accionable
- El headline de portada debe generar FOMO o curiosidad ("Lo que nadie te dice sobre...", "Por qué el 90% falla en...", "Hacés esto? Entonces...")

Responde SOLO con un array JSON, sin markdown (sin \`\`\`):
[
  {
    "slide": 1,
    "eyebrow": "texto pequeño arriba (ej: 'PABLO SCARLATTO · ENTRENAMIENTO')",
    "headline": "TITULAR IMPACTANTE EN MAYUSCULAS (máx 8 palabras)",
    "body": "texto de 1-2 oraciones que desarrolla el slide",
    "highlight": "frase corta destacada en color (puede ser vacía)",
    "iscover": true
  },
  ...
  {
    "slide": ${slides},
    "eyebrow": "...",
    "headline": "...",
    "body": "...",
    "highlight": "...",
    "isCta": true,
    "cta": "frase final de llamada a la acción (ej: 'Seguime para más tips')"
  }
]`;

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (response.content[0] as { text: string }).text.trim();
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/i, "").trim();
    const slides_data = JSON.parse(jsonStr);

    return NextResponse.json({
      success: true,
      category,
      topic: topic || null,
      totalSlides: slides_data.length,
      slides: slides_data,
    });
  } catch (err) {
    console.error("generate-carousel error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
