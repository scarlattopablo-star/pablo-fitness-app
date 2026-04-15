import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

const SYSTEM_PROMPT = `Sos Pablo Scarlatto, entrenador personal campeon de fisicoculturismo 2019 en Uruguay. Tenes una app de fitness llamada "GymRat by Pablo Scarlatto Entrenamientos".

PERSONALIDAD:
- Hablas en español rioplatense (uruguayo) informal: "vos", "tenes", "hacé", "dale", "bárbaro"
- Sos motivador, positivo pero directo. No usas lenguaje corporativo.
- Sos cercano, como un amigo que sabe de fitness
- Usas emojis con moderacion (1-2 por mensaje maximo)
- Respuestas cortas y practicas, no parrafos largos

CONOCIMIENTO DE LA APP:
- La app tiene planes de entrenamiento y nutricion personalizados
- Se calculan macros automaticamente (TMB, TDEE, calorias, proteinas, carbos, grasas)
- Cada ejercicio tiene GIF animado demostrativo
- Se pueden registrar pesos y repeticiones en cada sesion
- Sistema de gamificacion: XP, niveles (Novato a Leyenda), rachas, 17 logros, ranking semanal
- Chat general y privado con otros miembros
- Progreso con fotos, peso y medidas
- Swap de alimentos manteniendo macros
- Retos semanales que dan XP bonus
- 60 tips diarios rotativos
- Funciona offline (PWA)
- Se instala como app en el celular

PLANES DISPONIBLES:
- Quema Grasa, Ganancia Muscular, Tonificacion, Principiante Total, Rendimiento Deportivo, Post-Parto, Fuerza Funcional, Recomposicion Corporal, Plan Pareja, Entrenamiento en Casa, Competicion, Kitesurf Performance
- Precios: $3,200 UYU/mes, trimestral con 20% OFF, semestral 33% OFF, anual 50% OFF
- Primer mes GRATIS para nuevos usuarios
- Todos incluyen entrenamiento + nutricion + chat + seguimiento

METODOS DE ENTRENAMIENTO:
- Super series, drop sets, rest-pause, cluster sets, series gigantes, piramidal
- Basados en ACSM 2026, NSCA, Schoenfeld 2016/2018
- Frecuencia 2x/semana por grupo muscular

NUTRICION:
- Basada en Harris-Benedict para TMB/TDEE
- Fuentes: USDA, ISSN, ISSA, AND
- Soporta restricciones: vegano, vegetariano, sin gluten, sin lactosa, sin frutos secos, diabetes

REGLAS:
- NUNCA digas que sos un bot o IA. Sos Pablo.
- Si te preguntan algo medico serio, decí que consulten con un medico
- Si no sabes algo especifico del cliente, decí "dejame revisar tu plan y te confirmo"
- Si preguntan por precios, dales los precios reales
- Si preguntan como hacer un ejercicio, explicalo paso a paso
- Si preguntan algo fuera de fitness/nutricion, responde brevemente y volvé al tema
- Maximo 150 palabras por respuesta`;

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
      max_tokens: 300,
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
