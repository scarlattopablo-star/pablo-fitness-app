import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// POST /api/analyze-technique
// Body: { exerciseName: string, frames: string[] } where frames are base64 JPEG data URLs
// Returns: { analysis: { score, positives, corrections, cues } }

interface Frame {
  type: "image";
  source: { type: "base64"; media_type: "image/jpeg" | "image/png"; data: string };
}

const SYSTEM_PROMPT = `Sos Pablo Scarlatto, entrenador personal uruguayo experto en biomecanica y tecnica de ejercicios.
Te van a mostrar varias imagenes/frames de un cliente haciendo un ejercicio. Tu trabajo es analizar la tecnica.

FORMATO DE RESPUESTA (JSON valido, sin markdown ni codigo):
{
  "score": <numero 1-10>,
  "summary": "<1 frase: impresion general>",
  "positives": ["<punto positivo 1>", "<punto 2>"],
  "corrections": ["<correccion concreta 1>", "<correccion 2>"],
  "cues": ["<cue mental 1>", "<cue 2>"]
}

REGLAS:
- Maximo 3 positivos, 3 correcciones, 2 cues
- Cues son frases cortas tipo "rodillas sobre tobillos", "aire fuera al empujar"
- Hablá en rioplatense (vos, tenes). Sin lenguaje tecnico excesivo.
- Si las imagenes NO muestran un ejercicio claramente o son muy borrosas, devolve score: 0 y summary: "No puedo evaluar — video poco claro o no es un ejercicio"
- NUNCA respondas con texto libre, solo el JSON`;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: { user } } = await sb.auth.getUser(authHeader.slice(7));
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

    const body = await req.json();
    const exerciseName: string = body.exerciseName || "ejercicio";
    const frames: string[] = body.frames || [];

    if (!Array.isArray(frames) || frames.length === 0) {
      return NextResponse.json({ error: "Faltan frames" }, { status: 400 });
    }
    if (frames.length > 6) {
      return NextResponse.json({ error: "Demasiados frames (max 6)" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "AI no configurado" }, { status: 500 });
    }

    // Parse data URLs into Anthropic content blocks
    const imageBlocks: Frame[] = frames.map((dataUrl) => {
      const match = /^data:image\/(jpeg|jpg|png);base64,(.+)$/.exec(dataUrl);
      if (!match) throw new Error("Formato de imagen invalido");
      const mt = match[1] === "png" ? "image/png" : "image/jpeg";
      return {
        type: "image",
        source: { type: "base64", media_type: mt, data: match[2] },
      };
    });

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `Ejercicio que esta intentando: ${exerciseName}.\n\nAnalizá la tecnica a partir de los frames. Devolveme SOLO el JSON.`,
            },
          ],
        },
      ],
    });

    const text = response.content[0]?.type === "text" ? response.content[0].text.trim() : "";

    // Parse JSON — strip possible code fences defensively
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      return NextResponse.json({ error: "No pude parsear la respuesta de la IA", raw: text }, { status: 500 });
    }

    return NextResponse.json({ analysis });
  } catch (err) {
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
