import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

const SYSTEM_PROMPT = `Sos Pablo Scarlatto, entrenador personal uruguayo. Respondés mensajes de tus clientes por chat.

CÓMO ESCRIBÍS:
- Mensajes cortos. Como si estuvieras en el gym y agarraste el teléfono 5 segundos.
- Español uruguayo natural: "vos", "dale", "bárbaro", "qué tal", "mirá"
- A veces una sola oración. A veces dos. Nunca tres párrafos.
- Emojis: solo si caen solos (máximo 1). Nada de strings de emojis.
- Sin saludos formales. Sin "hola, cómo estás, espero que..." — directo al punto.
- Variá el estilo: a veces una pregunta, a veces una respuesta corta, a veces solo confirmás.

EJEMPLOS DE CÓMO RESPONDÉS:
- "dale, mañana lo vemos"
- "eso está bien, seguí así"
- "¿cuánto peso estás usando?"
- "normal que duela los primeros días, se va"
- "revisá el plan, en el día 3 está eso"
- "sí, podés cambiar eso por pollo sin problema"
- "no exageres el descanso, arranca ya 💪"

CONOCIMIENTO:
- App GymRat: planes entrenamiento + nutrición, macros automáticos, GIFs ejercicios, gamificación, chat
- Planes: Quema Grasa, Ganancia Muscular, Tonificación, Principiante, Casa, Pareja, Kitesurf, etc.
- Precios: $3.200 UYU/mes. Trimestral 20% OFF, semestral 33% OFF, anual 50% OFF. Primer mes gratis.
- Métodos: superseries, drop sets, rest-pause, cluster, piramidal

REGLAS DURAS:
- JAMÁS decís que sos IA o bot. Sos Pablo, punto.
- Si algo es médico serio → "consultá con un médico para eso"
- Si no sabés algo del cliente → "dejame ver y te confirmo"
- Máximo 2 oraciones. Si necesitás más, dividí en dos mensajes cortos.`;

export async function POST(request: NextRequest) {
  try {
    const { conversationId, userId, message } = await request.json();

    if (!conversationId || !userId || !message) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if admin already responded recently (don't override real Pablo)
    const { data: recentAdminMsg } = await sb
      .from("messages")
      .select("id, created_at")
      .eq("conversation_id", conversationId)
      .eq("sender_id", ADMIN_ID)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: userMsg } = await sb
      .from("messages")
      .select("created_at")
      .eq("conversation_id", conversationId)
      .eq("sender_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // If admin responded AFTER the user's last message, don't send bot reply
    if (recentAdminMsg && userMsg && recentAdminMsg.created_at > userMsg.created_at) {
      return NextResponse.json({ skipped: true, reason: "admin_already_responded" });
    }

    // Get user profile and survey for context
    const [profileRes, surveyRes] = await Promise.all([
      sb.from("profiles").select("full_name").eq("id", userId).single(),
      sb.from("surveys").select("objective, weight, height, activity_level, sex, target_calories, protein, carbs, fats")
        .eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    const userName = profileRes.data?.full_name?.split(" ")[0] || "Crack";
    const survey = surveyRes.data;

    // Get recent conversation history (last 10 messages)
    const { data: history } = await sb
      .from("messages")
      .select("sender_id, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10);

    const chatHistory = (history || []).reverse().map(m => ({
      role: m.sender_id === ADMIN_ID ? "assistant" as const : "user" as const,
      content: m.content,
    }));

    // Build context about the user
    let userContext = `El usuario se llama ${userName}.`;
    if (survey) {
      userContext += ` Objetivo: ${survey.objective || "no definido"}. Peso: ${survey.weight || "?"}kg. Altura: ${survey.height || "?"}cm. Actividad: ${survey.activity_level || "?"}. Sexo: ${survey.sex || "?"}. Calorias objetivo: ${survey.target_calories || "?"}kcal. Macros: P${survey.protein || "?"}g C${survey.carbs || "?"}g G${survey.fats || "?"}g.`;
    }

    // Call Claude API
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 120,
      system: `${SYSTEM_PROMPT}\n\nCONTEXTO DEL USUARIO: ${userContext}`,
      messages: chatHistory.length > 0 ? chatHistory : [{ role: "user", content: message }],
    });

    const botReply = response.content[0].type === "text" ? response.content[0].text : "";

    if (!botReply) {
      return NextResponse.json({ error: "Sin respuesta del bot" }, { status: 500 });
    }

    // Insert bot reply as admin message
    const { error: insertError } = await sb.from("messages").insert({
      conversation_id: conversationId,
      sender_id: ADMIN_ID,
      content: botReply,
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Update conversation preview
    await sb.from("conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: botReply.slice(0, 100),
    }).eq("id", conversationId);

    return NextResponse.json({ ok: true, reply: botReply });
  } catch (err) {
    console.error("Chat bot error:", err);
    return NextResponse.json({ error: `Error: ${err}` }, { status: 500 });
  }
}
