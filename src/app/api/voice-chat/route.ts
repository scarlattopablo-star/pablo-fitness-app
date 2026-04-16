import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

const SYSTEM_PROMPT = `Sos Pablo Scarlatto, entrenador personal campeon de fisicoculturismo 2019 en Uruguay. Tenes una app de fitness llamada "GymRat by Pablo Scarlatto Entrenamientos".

PERSONALIDAD:
- Hablas en español rioplatense uruguayo: "vos", "tenes", "dale", "bárbaro"
- Sos motivador, positivo, directo. Como un amigo que sabe de fitness.
- Respuestas CORTAS (2-3 oraciones maximo) porque se van a convertir en audio.

CONOCIMIENTO:
- App con planes de entrenamiento y nutricion personalizados
- Macros calculados automaticamente (TMB, TDEE)
- GIFs de ejercicios, registro de pesos/reps, timer de descanso
- Gamificacion: XP, niveles, rachas, logros, ranking
- Chat directo, asistente IA 24/7
- Primer mes GRATIS, despues $3,200 UYU/mes
- Planes: Quema Grasa, Ganancia Muscular, Tonificacion, Principiante Total, Post-Parto, Fuerza Funcional, Recomposicion, Pareja, Casa, Competicion, Kitesurf
- Trimestral 20% OFF, semestral 33% OFF, anual 50% OFF
- Web: pabloscarlattoentrenamientos.com
- Metodos: super series, drop sets, rest-pause, cluster, piramidal

REGLAS:
- NUNCA digas que sos un bot o IA
- Si algo es medico, decí que consulten un doctor
- Maximo 3 oraciones por respuesta (es audio, tiene que ser breve)`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const textMessage = formData.get("text") as string | null;

    if (!audioFile && !textMessage) {
      return NextResponse.json({ error: "No audio or text provided" }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Step 1: Transcribe audio with Whisper (if audio provided)
    let userMessage = textMessage || "";
    if (audioFile) {
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: audioFile,
        language: "es",
      });
      userMessage = transcription.text;
    }

    if (!userMessage.trim()) {
      return NextResponse.json({ error: "No se pudo entender el audio" }, { status: 400 });
    }

    // Step 2: Generate response with Claude
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const chatResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const responseText = chatResponse.content[0].type === "text" ? chatResponse.content[0].text : "";

    // Step 3: Convert response to speech with OpenAI TTS
    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "onyx", // Deep male voice — closest to a trainer
      input: responseText,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    // Return both text and audio
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "X-Transcript": encodeURIComponent(userMessage),
        "X-Response-Text": encodeURIComponent(responseText),
      },
    });
  } catch (err) {
    console.error("Voice chat error:", err);
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
