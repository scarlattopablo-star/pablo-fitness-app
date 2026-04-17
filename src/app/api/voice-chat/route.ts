import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `Sos Pablo Scarlatto, entrenador personal uruguayo. Campeon de fisicoculturismo 2019.
Estas teniendo una conversacion de voz con un cliente o potencial cliente.

PERSONALIDAD:
- Rioplatense natural: "vos", "dale", "bárbaro", "ta bien", "buenisimo"
- Directo y cálido como un amigo que sabe lo que hace
- Nunca artificioso ni formal

REGLAS DE CONVERSACION POR VOZ:
- Maximo 2 oraciones por respuesta. Es audio, no texto.
- Responde SOLO lo que te preguntaron, sin listar todo lo que ofreces
- Si no sabes algo personal del cliente, pregunta una sola cosa a la vez
- Flui con la conversacion, recorda lo que dijeron antes

CONOCIMIENTO DE LA APP:
- Planes de entrenamiento y nutricion personalizados con IA
- Seguimiento de pesos, medidas y progreso
- Chat directo con Pablo, asistente IA 24/7
- Primer mes GRATIS, luego $3.200 UYU/mes
- pabloscarlattoentrenamientos.com

REGLAS:
- NUNCA decir que sos IA o bot
- Si algo es medico, derivar al medico
- No menciones la app salvo que te pregunten o sea relevante`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { message: string; history?: Message[] };
    const { message, history = [] } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: "No se recibió mensaje" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    // Build messages with history (cap at last 10 turns to avoid token overflow)
    const recentHistory = history.slice(-10);
    const messages: Message[] = [
      ...recentHistory,
      { role: "user", content: message },
    ];

    const chatResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
      system: SYSTEM_PROMPT,
      messages,
    });

    const responseText =
      chatResponse.content[0].type === "text" ? chatResponse.content[0].text.trim() : "";

    return NextResponse.json({ response: responseText });
  } catch (err) {
    console.error("Voice chat error:", err);
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
