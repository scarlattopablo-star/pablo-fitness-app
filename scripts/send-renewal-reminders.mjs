// Auto-detect expiring subscriptions and send renewal reminders via EMAIL + IN-APP CHAT
// Usage: node scripts/send-renewal-reminders.mjs
// Sends to clients whose subscription expires within the next 30 days and haven't paid yet

import "dotenv/config";
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FROM_EMAIL = "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>";
const APP_URL = "https://pabloscarlattoentrenamientos.com";
const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";

async function supabaseGet(table, params = "") {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

async function supabasePost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

async function supabasePatch(table, params, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(data),
  });
  return res.json();
}

function daysUntil(dateStr) {
  const now = new Date();
  const end = new Date(dateStr);
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

function getReminderMessage(firstName, daysLeft) {
  if (daysLeft <= 7) {
    return `Hola ${firstName}! 👋

Te aviso que tu acceso gratuito se vence en ${daysLeft} dias. Despues de eso no vas a poder ver tu rutina ni registrar tus entrenamientos.

Para que no pierdas tu progreso, te ofrezco:
🔥 30% OFF el plan trimestral = $4.700/mes (en vez de $6.720)
💪 Eso es $1.567/mes — menos que un cafe por dia

Incluye: plan de entrenamiento personalizado + nutricion + seguimiento + GIFs de ejercicios.

Podes activarlo desde tu dashboard o escribime y te paso el link directo.

No te quiero perder como alumno! 🤙`;
  }

  if (daysLeft <= 14) {
    return `Hola ${firstName}! Como va el entrenamiento? 💪

Te cuento que tu acceso actual se vence en ${daysLeft} dias. Queria avisarte con tiempo para que no pierdas tu progreso.

Tengo una promo especial para vos:
🎁 30% OFF tu primer trimestre = $4.700 (en vez de $6.720)
📱 Seguís con tu rutina, nutricion y todo desde la app

Solo para los primeros 10 que confirmen. Podes activarlo desde "Activar Plan" en tu dashboard.

Cualquier duda escribime! 🤙`;
  }

  return `Hola ${firstName}! Como estas? 💪

Queria saber como te esta funcionando la app y los entrenamientos. Alguna duda o algo que necesites?

Te cuento que tu acceso gratuito se vence el proximo mes. Como ya estas entrenando conmigo, te ofrezco una oferta exclusiva:

🎁 30% OFF el plan trimestral = $4.700/mes (en vez de $6.720)
Eso es $1.567/mes — menos que un cafe por dia.

Si te interesa lo activas directo desde la app o me avisas. Estoy aca para lo que necesites! 🤙`;
}

function getReminderSubject(firstName, daysLeft) {
  if (daysLeft <= 7) return `${firstName}, tu acceso vence en ${daysLeft} dias — asegura tu plan`;
  if (daysLeft <= 14) return `${firstName}, 30% OFF tu plan — oferta por tiempo limitado`;
  return `${firstName}, como va el entrenamiento? Te tengo una oferta`;
}

function getReminderEmailHtml(firstName, daysLeft) {
  const urgencyColor = daysLeft <= 7 ? "#ef4444" : "#10b981";
  const urgencyText = daysLeft <= 7
    ? `Tu acceso se vence en <strong>${daysLeft} dias</strong>. No pierdas tu progreso.`
    : `Tu acceso gratuito se vence en ${daysLeft} dias. Asegura tu lugar con esta oferta exclusiva.`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#10b981;font-size:24px;margin:0;">Pablo Scarlatto</h1>
      <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Entrenador Personal · Campeon Fisicoculturismo 2019</p>
    </div>
    <div style="background:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#ffffff;font-size:22px;margin:0 0 16px;">Hola ${firstName}!</h2>
      <div style="background:${urgencyColor}22;border:1px solid ${urgencyColor};border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="color:${urgencyColor};font-size:14px;font-weight:bold;margin:0;">
          ⏰ ${urgencyText}
        </p>
      </div>
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Como ya estas entrenando conmigo, te ofrezco una <strong style="color:#10b981;">oferta exclusiva</strong>:
      </p>
      <div style="background:#10b981;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="color:#000;font-size:13px;font-weight:bold;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">30% OFF tu primer trimestre</p>
        <p style="color:#000;font-size:36px;font-weight:900;margin:0;">$4.700</p>
        <p style="color:#000;font-size:14px;margin:4px 0 0;"><s>$6.720</s> · Ahorra $2.020</p>
        <p style="color:#000;font-size:12px;margin:8px 0 0;">$1.567/mes — menos que un cafe por dia</p>
      </div>
      <p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0 0 12px;">Tu plan incluye:</p>
      <ul style="color:#d4d4d8;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Plan de entrenamiento 100% personalizado</li>
        <li>Plan de nutricion con comidas adaptadas</li>
        <li>App con tu rutina dia por dia</li>
        <li>GIFs de cada ejercicio</li>
        <li>Seguimiento y ajustes continuos</li>
      </ul>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${APP_URL}/dashboard"
           style="display:inline-block;background:#10b981;color:#000;font-size:16px;font-weight:800;padding:14px 40px;border-radius:12px;text-decoration:none;">
          ACTIVAR MI PLAN
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        Oferta valida solo esta semana
      </p>
    </div>
    <div style="text-align:center;">
      <p style="color:#6b7280;font-size:11px;margin:0;">
        Pablo Scarlatto Entrenamientos · pabloscarlattoentrenamientos.com
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendChatMessage(clientId, message) {
  const existing = await supabaseGet(
    "conversations",
    `or=(and(user1_id.eq.${clientId},user2_id.eq.${ADMIN_ID}),and(user1_id.eq.${ADMIN_ID},user2_id.eq.${clientId}))&select=id&limit=1`
  );

  let conversationId;
  if (Array.isArray(existing) && existing.length > 0) {
    conversationId = existing[0].id;
  } else {
    const conv = await supabasePost("conversations", {
      user1_id: clientId,
      user2_id: ADMIN_ID,
    });
    conversationId = Array.isArray(conv) ? conv[0]?.id : conv.id;
  }

  if (!conversationId) return false;

  await supabasePost("messages", {
    conversation_id: conversationId,
    sender_id: ADMIN_ID,
    content: message,
  });

  await supabasePatch(`conversations`, `id=eq.${conversationId}`, {
    last_message_at: new Date().toISOString(),
    last_message_preview: message.substring(0, 50),
  });

  return true;
}

async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return { ok: res.ok, data: await res.json() };
}

async function main() {
  console.log("🔍 Buscando suscripciones por vencer...\n");

  // Get all active subscriptions with $0 (free) that expire within 30 days
  const subs = await supabaseGet(
    "subscriptions",
    "status=eq.active&amount_paid=eq.0&select=*,profiles(id,full_name,email)&order=end_date.asc"
  );

  // Get payments to exclude anyone who already paid
  const payments = await supabaseGet("payments", "status=eq.approved&select=user_id");
  const paidUserIds = new Set(payments.filter(p => p.user_id).map(p => p.user_id));

  const now = new Date();
  const targets = [];

  for (const sub of subs) {
    if (!sub.profiles || !sub.profiles.email) continue;
    if (paidUserIds.has(sub.profiles.id)) continue;

    const days = daysUntil(sub.end_date);
    if (days > 0 && days <= 30) {
      targets.push({
        userId: sub.profiles.id,
        name: sub.profiles.full_name,
        email: sub.profiles.email,
        endDate: sub.end_date,
        daysLeft: days,
        duration: sub.duration,
      });
    }
  }

  if (targets.length === 0) {
    console.log("✅ No hay suscripciones por vencer en los proximos 30 dias.");
    return;
  }

  console.log(`📋 ${targets.length} clientes con suscripcion por vencer:\n`);
  targets.forEach(t => {
    const urgency = t.daysLeft <= 7 ? "🔴" : t.daysLeft <= 14 ? "🟡" : "🟢";
    console.log(`${urgency} ${t.name} (${t.email}) — vence en ${t.daysLeft} dias (${t.endDate})`);
  });

  console.log("\n📤 Enviando recordatorios...\n");

  let emailOk = 0, emailFail = 0, chatOk = 0, chatFail = 0;

  for (const client of targets) {
    const firstName = client.name?.split(" ")[0] || "Cliente";
    const chatMsg = getReminderMessage(firstName, client.daysLeft);
    const subject = getReminderSubject(firstName, client.daysLeft);
    const html = getReminderEmailHtml(firstName, client.daysLeft);

    // Send chat
    try {
      const ok = await sendChatMessage(client.userId, chatMsg);
      if (ok) chatOk++;
      else { chatFail++; console.log(`  ✗ CHAT failed for ${firstName}`); }
    } catch (err) { chatFail++; }

    // Send email
    try {
      const result = await sendEmail(client.email, subject, html);
      if (result.ok) emailOk++;
      else { emailFail++; console.log(`  ✗ EMAIL failed: ${JSON.stringify(result.data)}`); }
    } catch (err) { emailFail++; }

    console.log(`✓ ${firstName} (${client.email}) — ${client.daysLeft}d restantes — chat + email`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n---");
  console.log(`📧 Emails: ${emailOk} enviados, ${emailFail} fallidos`);
  console.log(`💬 Chats: ${chatOk} enviados, ${chatFail} fallidos`);
  console.log(`\n✅ Recordatorios completados.`);
}

main().catch(console.error);
