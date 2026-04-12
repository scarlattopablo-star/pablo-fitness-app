// Send 30% OFF offer via EMAIL + IN-APP CHAT to all clients EXCEPT QR direct clients and admin
// Usage: node scripts/send-offer-email.mjs

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

// ── Send chat message via in-app chat ──
async function sendChatMessage(clientId, clientName) {
  const firstName = clientName?.split(" ")[0] || "Cliente";

  const chatMsg = `Hola ${firstName}! Te cuento que estoy profesionalizando los planes. A partir de mayo el servicio pasa a ser pago.

Como ya estas entrenando conmigo, te ofrezco:
🎁 30% OFF tu primer trimestre = $4,700 (en vez de $6,720)
🎁 Eso es $1,567/mes — menos que un cafe por dia

Solo para los primeros 10 que confirmen esta semana.

Podes activar tu plan desde el boton en tu dashboard. Te copa?`;

  // Find or create conversation
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

  // Send message
  await supabasePost("messages", {
    conversation_id: conversationId,
    sender_id: ADMIN_ID,
    content: chatMsg,
  });

  // Update conversation preview
  await supabasePatch(`conversations`, `id=eq.${conversationId}`, {
    last_message_at: new Date().toISOString(),
    last_message_preview: chatMsg.substring(0, 50),
  });

  return true;
}

// ── Send email via Resend ──
async function sendEmail(to, name) {
  const firstName = name?.split(" ")[0] || "Cliente";

  const html = `
<!DOCTYPE html>
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
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Te cuento que estoy profesionalizando los planes de entrenamiento y nutricion.
        A partir de mayo el servicio pasa a ser <strong style="color:#ffffff;">100% pago</strong>.
      </p>
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Como ya estas entrenando conmigo, te ofrezco una <strong style="color:#10b981;">oferta exclusiva</strong>:
      </p>
      <div style="background:#10b981;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="color:#000;font-size:13px;font-weight:bold;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px;">30% OFF tu primer trimestre</p>
        <p style="color:#000;font-size:36px;font-weight:900;margin:0;">$4.700</p>
        <p style="color:#000;font-size:14px;margin:4px 0 0;"><s>$6.720</s> · Ahorra $2.020</p>
        <p style="color:#000;font-size:12px;margin:8px 0 0;">$1.567/mes — menos que un cafe por dia</p>
      </div>
      <p style="color:#ffffff;font-size:14px;font-weight:bold;margin:0 0 12px;">Que incluye tu plan:</p>
      <ul style="color:#d4d4d8;font-size:14px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li>Plan de entrenamiento personalizado</li>
        <li>Plan de nutricion con comidas adaptadas</li>
        <li>App con tu rutina dia por dia</li>
        <li>GIFs de cada ejercicio</li>
        <li>Seguimiento y ajustes</li>
      </ul>
      <div style="text-align:center;margin-bottom:16px;">
        <a href="${APP_URL}/dashboard"
           style="display:inline-block;background:#10b981;color:#000;font-size:16px;font-weight:800;padding:14px 40px;border-radius:12px;text-decoration:none;">
          ACTIVAR MI PLAN
        </a>
      </div>
      <p style="color:#6b7280;font-size:12px;text-align:center;margin:0;">
        Solo para los primeros 10 que confirmen esta semana
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject: `${firstName}, 30% OFF tu plan personalizado — Solo esta semana`,
      html,
    }),
  });

  const data = await res.json();
  return { ok: res.ok, data };
}

// ── Main ──
async function main() {
  console.log("Fetching clients...\n");

  const profiles = await supabaseGet("profiles", "is_admin=eq.false&deleted_at=is.null&select=id,full_name,email");
  const directCodes = await supabaseGet("free_access_codes", "used=eq.true&plan_slug=eq.direct-client&select=used_by");
  const directIds = new Set(directCodes.filter(c => c.used_by).map(c => c.used_by));

  const targets = profiles.filter(p => !directIds.has(p.id) && p.email);

  console.log(`Total profiles: ${profiles.length}`);
  console.log(`Direct clients excluded: ${directIds.size}`);
  console.log(`Targets: ${targets.length}`);
  console.log("---\n");

  let emailOk = 0, emailFail = 0, chatOk = 0, chatFail = 0;

  for (const client of targets) {
    const firstName = client.full_name?.split(" ")[0] || "Cliente";

    // Send email
    try {
      const result = await sendEmail(client.email, client.full_name);
      if (result.ok) { emailOk++; }
      else { emailFail++; console.log(`  ✗ EMAIL failed: ${JSON.stringify(result.data)}`); }
    } catch (err) { emailFail++; }

    // Send chat message
    try {
      const ok = await sendChatMessage(client.id, client.full_name);
      if (ok) { chatOk++; }
      else { chatFail++; }
    } catch (err) { chatFail++; }

    console.log(`✓ ${firstName} (${client.email}) — email + chat`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log("\n---");
  console.log(`Emails: ${emailOk} sent, ${emailFail} failed`);
  console.log(`Chats: ${chatOk} sent, ${chatFail} failed`);
}

main().catch(console.error);
