// Standalone mass-outreach runner. Reads env from .env.local.
// Run: node scripts/run-mass-outreach.mjs
import fs from "node:fs";
import path from "node:path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([A-Z_0-9]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].trim();
}

const { createClient } = await import("@supabase/supabase-js");
const webpushMod = await import("web-push");
const webpush = webpushMod.default;
const { Resend } = await import("resend");

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f";
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const trialUsers = [
  { userId: "a9c7d0d4-e928-422e-a00b-20daa0bc5198", name: "Javier", email: "urujand@gmail.com" },
  { userId: "19777700-34d6-4daa-b39a-40d74378af3f", name: "Maria Pia", email: "pipiaznarez@gmail.com" },
  { userId: "8ec03fc0-ccb7-4071-a99a-00a87edadd05", name: "Marcelo", email: "marcelolampa@gmail.com" },
  { userId: "2114185f-c36a-4943-9e3f-867710d3a906", name: "Sofia", email: "sofisquiton@gmail.com" },
  { userId: "e0bb814f-26f1-416a-a13d-f3994724ae1e", name: "Irene", email: "irene_9105@hotmail.com" },
  { userId: "3101e086-c959-4223-888e-81c8033fd659", name: "Horacio", email: "horacio.rodriguez.che@gmail.com" },
  { userId: "abcd6113-3dc1-474f-9b22-6cb0c6a01592", name: "Lucas", email: "palermolucas20@gmail.com" },
  { userId: "b9befaec-05cf-4377-8718-22928f2ee59d", name: "Agustina", email: "agus24martinez24@gmail.com" },
  { userId: "2f3af638-b659-44fe-b95e-817b550ef7aa", name: "Camila", email: "camila18aylenferreira@gmail.com" },
  { userId: "52dcd54c-bc82-4174-875f-f73c23054e6e", name: "Seba", email: "sebastianvillalba7@hotmail.com" },
  { userId: "8d41a760-6056-4cea-85e8-c14b02a2ddd1", name: "Yemina", email: "yemina19britos@gmail.com" },
  { userId: "457986d4-5173-4f0f-8b74-37a941deefbe", name: "Hazael", email: "hazaelmanzur@gmail.com" },
  { userId: "be243bbf-1caf-4bf4-993d-babf0d36a1fb", name: "Candelaria", email: "candelariabasso@gmail.com" },
  { userId: "4a94aa22-f2af-4e58-bb91-e72036a06a69", name: "Sofia F.", email: "as.ferreirapascale@gmail.com" },
  { userId: "c7d34e5b-9780-4ec5-8ce8-cd2af0d5ad3b", name: "Daniel", email: "danielglisenti28@gmail.com" },
];

const trial3mUsers = [
  { userId: "52949da8-8b2f-46e6-b113-18f6f097e6b3", name: "Fernando", email: "morebengo@hotmail.com" },
  { userId: "1097ebb2-89c7-4e88-a694-e6c64a404005", name: "Camila O.", email: "camicaluca@gmail.com" },
  { userId: "0793521c-572f-427d-93ca-cd81a8a17127", name: "Micaela", email: "micaelalong99@gmail.com" },
];

const directUsers = [
  { userId: "e2601bbf-2bc4-49f3-9f6c-b9507b48daae", name: "Fabricio", email: "bossio.fabricio@gmail.com" },
  { userId: "14a32164-b7c0-4ab2-ae6b-837138ce0d2e", name: "Ginette", email: "ginettedelgado@hotmail.com" },
  { userId: "12f4d509-db89-4241-9930-cbddc5c3e6be", name: "Yan-Li", email: "ychemacias@gmail.com" },
  { userId: "b4d5db98-1e24-4014-9992-29d466541a9e", name: "Belen", email: "bgrezzi10@gmail.com" },
  { userId: "d07c8979-f0d4-41c1-89ac-46c606203a96", name: "Eliana", email: "elianamorales1996@hotmail.com" },
  { userId: "0b459a64-0b9c-4d61-b5e5-7262a5ff29d5", name: "Florencia", email: "florencisdiaz@gmail.com" },
  { userId: "198bb53b-5550-4065-a347-78a06f7c6587", name: "Paulina", email: "paulinaberriel@gmail.com" },
  { userId: "57916875-ddc3-4bde-8d9b-9806ac020845", name: "Daniel C.", email: "cunietti@gmail.com" },
  { userId: "59213861-e329-495f-80af-832e98ea0bd6", name: "Cecilia", email: "cecilia.cascardi@gmail.com" },
  { userId: "0abbfb48-3406-4763-beb8-013d9e8c112e", name: "David", email: "dacercoolex@hotmail.com" },
];

const buildMsg = (u, kind) => {
  if (kind === "trial") {
    return {
      ...u, type: "trial",
      pushTitle: `${u.name}, tu prueba se acaba pronto`,
      pushBody: "Primer mes GRATIS en cualquier plan — sin tarjeta. No te lo pierdas!",
      chatMessage: `Hola ${u.name}! Soy Pablo. Vi que estás usando la app, qué bueno! Como te viene yendo?\n\nTe cuento que tengo una promo activa hasta fin de mayo: PRIMER MES GRATIS en cualquier plan, sin tarjeta de crédito. Entrás, probás el plan completo personalizado y recién al segundo mes se cobra.\n\nSi te interesa escribime y te paso el link directo para activarlo. Dale que son pocos lugares este mes!`,
      emailSubject: `${u.name}, Primer mes GRATIS — sin tarjeta`,
      emailKind: "trial",
    };
  } else if (kind === "trial-3m") {
    return {
      ...u, type: "trial-3m",
      pushTitle: `${u.name}, como va el entreno?`,
      pushBody: "Escribime si necesitás ajustar algo de tu rutina!",
      chatMessage: `Hola ${u.name}! Soy Pablo. Como viene el entrenamiento con la app? Quería saber si necesitás algo, alguna rutina específica o algún ajuste. Estoy para ayudarte a sacarle el máximo! Escribime cualquier duda.`,
      emailSubject: `${u.name}, estoy para ayudarte - Pablo Scarlatto`,
      emailKind: "engage",
    };
  } else {
    return {
      ...u, type: "directo",
      pushTitle: `${u.name}, te pido un favor!`,
      pushBody: "Me ayudás con un testimonio? Tengo 15% OFF para tus referidos",
      chatMessage: `Hola ${u.name}! Como estás? Te quería pedir un favor: me ayudarías con un testimonio cortito de tu experiencia entrenando conmigo? Puede ser un audio o un mensajito, me re sirve para la app.\n\nY si conocés a alguien que le interese entrenar, tengo 15% OFF para referidos. Pasale este link: pabloscarlattoentrenamientos.com/registro-gratis`,
      emailSubject: `${u.name}, me ayudás con algo? - Pablo Scarlatto`,
      emailKind: "referral",
    };
  }
};

const trialEmailHtml = (name) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#111;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#10b981;margin:0;">Pablo Scarlatto</h1><p style="color:#888;font-size:14px;">Entrenamientos Personalizados</p></div>
  <h2 style="color:#fff;">Hola ${name}!</h2>
  <p style="color:#ccc;line-height:1.6;">Vi que estás probando la app y me encanta. Quería contarte que <strong style="color:#CDFF00;">tenés el PRIMER MES GRATIS</strong> en cualquier plan — sin tarjeta de crédito.</p>
  <div style="background:#1a1a2e;border:1px solid #CDFF00;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
    <p style="color:#888;margin:0 0 5px;">Oferta de lanzamiento</p>
    <p style="font-size:28px;font-weight:bold;color:#CDFF00;margin:0;">Primer mes GRATIS</p>
    <p style="color:#888;font-size:13px;margin:5px 0 0;">Rutina personalizada + Videos + Seguimiento + Chat directo</p>
    <p style="color:#888;font-size:13px;margin:5px 0 0;">Sin tarjeta. Recién al segundo mes se cobra.</p>
  </div>
  <div style="text-align:center;margin:30px 0;"><a href="https://pabloscarlattoentrenamientos.com/planes" style="background:#CDFF00;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Ver Planes</a></div>
  <p style="color:#888;font-size:13px;text-align:center;">Oferta hasta fin de mayo. Pocos lugares este mes!</p>
  <hr style="border:none;border-top:1px solid #333;margin:30px 0;">
  <p style="color:#666;font-size:12px;text-align:center;">Pablo Scarlatto Entrenamientos<br>pabloscarlattoentrenamientos.com</p>
</div></body></html>`;

const engageEmailHtml = (name) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#111;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#10b981;margin:0;">Pablo Scarlatto</h1><p style="color:#888;font-size:14px;">Entrenamientos Personalizados</p></div>
  <h2 style="color:#fff;">Hola ${name}!</h2>
  <p style="color:#ccc;line-height:1.6;">Quería saber como viene tu entrenamiento con la app. Necesitás alguna rutina específica o algún ajuste?</p>
  <p style="color:#ccc;line-height:1.6;">Estoy para ayudarte a sacarle el máximo provecho. Respondé este email o escribime directo por la app!</p>
  <div style="text-align:center;margin:30px 0;"><a href="https://pabloscarlattoentrenamientos.com/dashboard" style="background:#10b981;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Abrir la App</a></div>
</div></body></html>`;

const referralEmailHtml = (name) => `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#111;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:30px;"><h1 style="color:#10b981;margin:0;">Pablo Scarlatto</h1><p style="color:#888;font-size:14px;">Entrenamientos Personalizados</p></div>
  <h2 style="color:#fff;">Hola ${name}!</h2>
  <p style="color:#ccc;line-height:1.6;">Te quería pedir un favor: me ayudarías con un <strong style="color:#10b981;">testimonio cortito</strong>? Me re sirve para la app!</p>
  <p style="color:#ccc;line-height:1.6;">Y si conocés a alguien que le interese entrenar, tengo <strong style="color:#10b981;">15% OFF para referidos</strong>. Pasale este link:</p>
  <div style="background:#1a1a2e;border:1px solid #10b981;border-radius:12px;padding:15px;margin:20px 0;text-align:center;">
    <a href="https://pabloscarlattoentrenamientos.com/registro-gratis" style="color:#10b981;font-size:14px;">pabloscarlattoentrenamientos.com/registro-gratis</a>
  </div>
  <div style="text-align:center;margin:30px 0;"><a href="https://pabloscarlattoentrenamientos.com/dashboard/chat" style="background:#10b981;color:#000;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Responder por la App</a></div>
</div></body></html>`;

// Build all messages
const messages = [
  ...trialUsers.map((u) => buildMsg(u, "trial")),
  ...trial3mUsers.map((u) => buildMsg(u, "trial-3m")),
  ...directUsers.map((u) => buildMsg(u, "directo")),
];

// Configure VAPID
const vapidPub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
const vapidPriv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
if (vapidPub && vapidPriv) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
    vapidPub, vapidPriv
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);
const results = { push: { sent: 0, failed: 0, noSubscription: 0 }, chat: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 } };

console.log(`\nDispatch a ${messages.length} usuarios (${trialUsers.length} trial / ${trial3mUsers.length} trial3m / ${directUsers.length} directos)\n`);

for (const msg of messages) {
  console.log(`→ ${msg.type.padEnd(10)} ${msg.name.padEnd(12)} ${msg.email}`);

  // 1. Push
  try {
    const { data: subs } = await sb.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", msg.userId);
    if (subs && subs.length) {
      const payload = JSON.stringify({ title: msg.pushTitle, body: msg.pushBody, url: "/dashboard/chat" });
      for (const sub of subs) {
        try {
          await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
          results.push.sent++;
        } catch (err) {
          const sc = err?.statusCode;
          if (sc === 410 || sc === 404) await sb.from("push_subscriptions").delete().eq("id", sub.id);
          results.push.failed++;
        }
      }
    } else {
      results.push.noSubscription++;
    }
  } catch (e) { results.push.failed++; console.log("  push err:", e.message); }

  // 2. Chat
  try {
    const [u1, u2] = msg.userId < ADMIN_ID ? [msg.userId, ADMIN_ID] : [ADMIN_ID, msg.userId];
    const { data: existing } = await sb.from("conversations").select("id").eq("user1_id", u1).eq("user2_id", u2).maybeSingle();
    let convId;
    if (existing) convId = existing.id;
    else {
      const { data: created, error } = await sb.from("conversations").insert({ user1_id: u1, user2_id: u2 }).select("id").single();
      if (error) throw error;
      convId = created.id;
    }
    await sb.from("messages").insert({ conversation_id: convId, sender_id: ADMIN_ID, content: msg.chatMessage });
    await sb.from("conversations").update({ last_message_at: new Date().toISOString(), last_message_preview: msg.chatMessage.slice(0, 100) }).eq("id", convId);
    results.chat.sent++;
  } catch (e) { results.chat.failed++; console.log("  chat err:", e.message); }

  // 3. Email
  try {
    const html = msg.emailKind === "trial" ? trialEmailHtml(msg.name)
      : msg.emailKind === "engage" ? engageEmailHtml(msg.name)
      : referralEmailHtml(msg.name);
    await resend.emails.send({
      from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
      to: msg.email, subject: msg.emailSubject, html,
    });
    results.email.sent++;
  } catch (e) { results.email.failed++; console.log("  email err:", e.message); }

  await new Promise((r) => setTimeout(r, 400));
}

console.log("\n=== RESULTADO ===");
console.log(JSON.stringify(results, null, 2));
