// Anuncio Glúteos 360 + sorteo IG cruzado a TODOS los usuarios.
// Excluye admins, soft-deleted, y emails nulos.
// Manda EMAIL + CHAT + PUSH (mismo patrón que announce-pricing-reto).
//
// Uso:
//   node scripts/announce-gluteos360-all.mjs --dry-run    # solo lista, no manda
//   node scripts/announce-gluteos360-all.mjs --send       # MANDA en vivo

import resendPkg from "../../../../node_modules/resend/dist/index.cjs";
import webpushPkg from "../../../../node_modules/web-push/src/index.js";
import supabasePkg from "../../../../node_modules/@supabase/supabase-js/dist/index.cjs";
const webpush = webpushPkg.default || webpushPkg;
const { createClient } = supabasePkg;
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Resend } = resendPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKTREE = path.resolve(__dirname, "..");

const ADMIN_ID = "fbc38340-5d8f-4f5f-91e0-46e3a8cb8d2f"; // Pablo
const DRY_RUN = !process.argv.includes("--send");

// Excluir cuentas internas/test/Pablo
const EXCLUDE_EMAILS = new Set([
  "googleplay.reviewer@pabloscarlatto.com",
  "testuser999@test.com",
  "testmp2026@gmail.com",
  "pabloscarlatto@hotmail.com",
]);

// Los 28 que recibieron el outreach del 21/4 — les mando un copy "re-engagement" suave
const RECENT_OUTREACH_EMAILS = new Set([
  // trial (15)
  "urujand@gmail.com", "pipiaznarez@gmail.com", "marcelolampa@gmail.com",
  "sofisquiton@gmail.com", "irene_9105@hotmail.com", "horacio.rodriguez.che@gmail.com",
  "palermolucas20@gmail.com", "agus24martinez24@gmail.com", "camila18aylenferreira@gmail.com",
  "sebastianvillalba7@hotmail.com", "yemina19britos@gmail.com", "hazaelmanzur@gmail.com",
  "candelariabasso@gmail.com", "as.ferreirapascale@gmail.com", "danielglisenti28@gmail.com",
  // trial-3m (3)
  "morebengo@hotmail.com", "camicaluca@gmail.com", "micaelalong99@gmail.com",
  // directos (10)
  "bossio.fabricio@gmail.com", "ginettedelgado@hotmail.com", "ychemacias@gmail.com",
  "bgrezzi10@gmail.com", "elianamorales1996@hotmail.com", "florencisdiaz@gmail.com",
  "paulinaberriel@gmail.com", "cunietti@gmail.com", "cecilia.cascardi@gmail.com",
  "dacercoolex@hotmail.com",
]);

async function loadEnv() {
  const envPath = path.resolve(WORKTREE, "../../..", ".env.local");
  const txt = await readFile(envPath, "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
await loadEnv();

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// 1) Query: TODOS los users con email, no admin, no soft-deleted
const { data: profiles, error: pErr } = await sb
  .from("profiles")
  .select("id, full_name, email, deleted_at, is_admin, created_at")
  .eq("is_admin", false)
  .is("deleted_at", null)
  .not("email", "is", null);

if (pErr) {
  console.error("Error queryando profiles:", pErr);
  process.exit(1);
}

const targets = (profiles || []).filter(p =>
  p.email && p.email.includes("@") && !EXCLUDE_EMAILS.has(p.email.toLowerCase())
);

// Enriquecer con subscription status para reportar
const { data: subs } = await sb
  .from("subscriptions")
  .select("user_id, status");
const subMap = new Map((subs || []).map(s => [s.user_id, s.status]));

const enriched = targets.map(t => ({
  ...t,
  sub_status: subMap.get(t.id) || "ninguna",
  is_recent: RECENT_OUTREACH_EMAILS.has(t.email.toLowerCase()),
}));

console.log(`\n📊 ALCANCE DEL ENVIO\n${"=".repeat(60)}`);
console.log(`Total destinatarios: ${enriched.length}`);
const recent = enriched.filter(e => e.is_recent).length;
const fresh = enriched.length - recent;
console.log(`  Copy "fresco" (primer contacto):     ${fresh}`);
console.log(`  Copy "re-engagement" (outreach 21/4): ${recent}`);
const byStatus = {};
for (const e of enriched) byStatus[e.sub_status] = (byStatus[e.sub_status] || 0) + 1;
console.log(`\nPor sub status:`);
for (const [k, v] of Object.entries(byStatus)) {
  console.log(`  ${k.padEnd(15)} → ${v} usuarios`);
}
console.log("");

console.log(`Lista (primeros 50):`);
for (const e of enriched.slice(0, 50)) {
  const name = (e.full_name || "(sin nombre)").padEnd(28);
  console.log(`  ${name} ${e.email.padEnd(40)} [${e.sub_status}]`);
}
if (enriched.length > 50) console.log(`  ... y ${enriched.length - 50} más.\n`);

if (DRY_RUN) {
  console.log(`\n🟡 DRY-RUN — no se mando nada.`);
  console.log(`Para mandar de verdad: node scripts/announce-gluteos360-all.mjs --send\n`);
  process.exit(0);
}

// ============= MODO ENVIO REAL =============

// ===== Copy FRESCO (primer contacto sobre Glúteos 360 + sorteo) =====
const buildEmailFresh = (name) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:13px;padding:6px 16px;border-radius:99px;letter-spacing:1px;">PABLO SCARLATTO ENTRENAMIENTOS</div>
  </div>
  <h1 style="font-size:28px;font-weight:900;margin:0 0 8px;line-height:1.2;color:#fff;">Hola ${name}! 👋</h1>
  <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 28px;">Te cuento dos cosas en 30 segundos:</p>
  <div style="background:#111;border:2px solid #ff6ec7;border-radius:16px;padding:24px;margin-bottom:20px;">
    <p style="color:#ff6ec7;font-weight:900;font-size:13px;margin:0 0 8px;letter-spacing:1px;">💪 RETO · GLÚTEOS 360</p>
    <p style="font-size:22px;font-weight:800;margin:0 0 6px;line-height:1.3;color:#fff;">21 días enfocados en glúteos y abdomen.</p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 16px;">Rutina simple <strong style="color:#fff;">en casa o gym</strong>, guía de alimentación flexible, y seguimiento directo conmigo. Pensado para mujeres que entrenan y no ven cambios.</p>
    <ul style="color:#ccc;font-size:13px;line-height:1.7;padding-left:20px;margin:0 0 18px;">
      <li>Rutina adaptada para casa o gimnasio</li>
      <li>Guía de alimentación flexible</li>
      <li>Seguimiento de fotos, peso y medidas</li>
      <li>Chat directo conmigo durante los 21 días</li>
    </ul>
    <div style="display:inline-block;background:#ff6ec7;color:#000;font-weight:900;font-size:22px;padding:12px 24px;border-radius:14px;">$599 UYU</div>
    <p style="color:#888;font-size:11px;margin:14px 0 0;">Cupos limitados cada mes.</p>
  </div>
  <div style="background:#111;border:1px solid #CDFF00;border-radius:16px;padding:24px;margin-bottom:20px;">
    <p style="color:#CDFF00;font-weight:900;font-size:13px;margin:0 0 8px;letter-spacing:1px;">🎁 BONUS · SORTEO EN INSTAGRAM</p>
    <p style="font-size:18px;font-weight:800;margin:0 0 6px;line-height:1.3;color:#fff;">Sorteamos 1 mes GRATIS del plan completo.</p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 14px;">Etiquetá a 2 amigos en mi último post de Instagram (@pabloscarlattoentrenamientos) y entrás al sorteo. Cierra el viernes 9 de mayo.</p>
    <p style="color:#CDFF00;font-size:12px;font-weight:800;margin:0;">Sorteamos en vivo · Solo 1 ganador</p>
  </div>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://pabloscarlattoentrenamientos.com/planes/glutes-360" style="display:inline-block;background:#ff6ec7;color:#000;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;margin:6px;">Quiero el reto →</a>
    <a href="https://www.instagram.com/pabloscarlattoentrenamientos" style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;margin:6px;">Ver sorteo en IG →</a>
  </div>
  <p style="color:#555;font-size:13px;line-height:1.6;text-align:center;">Cualquier duda escribime directo.<br>— Pablo</p>
  <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;">
  <p style="color:#333;font-size:11px;text-align:center;">Pablo Scarlatto Entrenamientos · pabloscarlattoentrenamientos.com</p>
</div></body></html>`;

const buildChatFresh = (name) => `Hola ${name}! 👋

Dos novedades:

💪 *NUEVO RETO · Gluteos 360 · 21 dias*
Rutina + alimentacion flexible + seguimiento conmigo, pensado para mujeres. $599 UYU, cupos limitados.

🎁 *SORTEO en Instagram*
Sorteamos 1 mes GRATIS del plan completo. Etiqueta a 2 amigos en mi ultimo post de @pabloscarlattoentrenamientos. Cierra el viernes 9 de mayo, sorteamos en vivo.`;

// ===== Copy RE-ENGAGEMENT (para los 28 que recibieron el outreach del 21/4) =====
const buildEmailRecent = (name) => `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#fff;font-family:Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:32px;">
    <div style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:13px;padding:6px 16px;border-radius:99px;letter-spacing:1px;">PABLO SCARLATTO ENTRENAMIENTOS</div>
  </div>
  <h1 style="font-size:26px;font-weight:900;margin:0 0 8px;line-height:1.2;color:#fff;">${name}, te escribo de nuevo 👋</h1>
  <p style="color:#aaa;font-size:15px;line-height:1.6;margin:0 0 28px;">
    La semana pasada te conté de la promo. Hoy te aviso porque <strong style="color:#fff;">arrancamos un sorteo en Instagram</strong> y quería que lo veas antes que nadie.
  </p>
  <div style="background:#111;border:2px solid #CDFF00;border-radius:16px;padding:24px;margin-bottom:20px;">
    <p style="color:#CDFF00;font-weight:900;font-size:13px;margin:0 0 8px;letter-spacing:1px;">🎁 SORTEO · 1 MES GRATIS</p>
    <p style="font-size:22px;font-weight:800;margin:0 0 6px;line-height:1.3;color:#fff;">Plan personalizado completo, gratis 30 días.</p>
    <p style="color:#aaa;font-size:14px;line-height:1.6;margin:0 0 14px;">
      Anda al post fijado en mi Instagram, <strong style="color:#fff;">etiquetá a 2 amigos</strong> y entrás. Cierra el viernes <strong style="color:#fff;">9 de mayo</strong>, sorteamos en vivo en stories.
    </p>
    <p style="color:#CDFF00;font-size:12px;font-weight:800;margin:0;">Si ya sos cliente: te regalo 1 mes EXTRA si ganás.</p>
  </div>
  <div style="background:#111;border:1px solid #ff6ec7;border-radius:16px;padding:20px;margin-bottom:20px;">
    <p style="color:#ff6ec7;font-weight:900;font-size:13px;margin:0 0 8px;letter-spacing:1px;">💪 Y SI BUSCÁS ALGO MÁS ENFOCADO...</p>
    <p style="color:#fff;font-size:15px;line-height:1.5;margin:0 0 8px;">Lancé el reto <strong>Glúteos 360</strong> · 21 días, $599 UYU.</p>
    <p style="color:#aaa;font-size:13px;line-height:1.5;margin:0;">Rutina + guía de alimentación + seguimiento, pensado para mujeres que entrenan y no ven cambios. Cupos limitados.</p>
  </div>
  <div style="text-align:center;margin:32px 0;">
    <a href="https://www.instagram.com/pabloscarlattoentrenamientos" style="display:inline-block;background:#CDFF00;color:#000;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;margin:6px;">Ir al sorteo →</a>
    <a href="https://pabloscarlattoentrenamientos.com/planes/glutes-360" style="display:inline-block;background:#ff6ec7;color:#000;font-weight:900;font-size:16px;padding:16px 32px;border-radius:14px;text-decoration:none;margin:6px;">Ver Glúteos 360 →</a>
  </div>
  <p style="color:#555;font-size:13px;line-height:1.6;text-align:center;">Cualquier cosa me escribís directo.<br>— Pablo</p>
  <hr style="border:none;border-top:1px solid #1a1a1a;margin:28px 0;">
  <p style="color:#333;font-size:11px;text-align:center;">Pablo Scarlatto Entrenamientos · pabloscarlattoentrenamientos.com</p>
</div></body></html>`;

const buildChatRecent = (name) => `Hola ${name}! 👋

Te escribo de nuevo porque arrancó algo nuevo:

🎁 *SORTEO en Instagram* — 1 mes GRATIS del plan completo. Solo tenés que etiquetar a 2 amigos en mi ultimo post de @pabloscarlattoentrenamientos. Cierra el viernes 9 de mayo.

Si ya sos cliente y ganás, te regalo 1 mes EXTRA.

(Y si buscás algo mas enfocado, te dejo info del nuevo reto Glúteos 360 - 21 dias - $599 UYU.)`;

const resend = new Resend(process.env.RESEND_API_KEY);

const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").replace(/[=\s]+$/g, "").trim();
const priv = (process.env.VAPID_PRIVATE_KEY || "").replace(/[=\s]+$/g, "").trim();
if (pub && priv) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:scarlattopablo@gmail.com",
    pub, priv
  );
}

const results = {
  email: { sent: 0, failed: 0 },
  chat: { sent: 0, failed: 0 },
  push: { sent: 0, failed: 0 },
};

let i = 0;
for (const p of enriched) {
  i++;
  const firstName = (p.full_name || "").split(" ")[0] || "Hola";
  process.stdout.write(`[${i}/${enriched.length}] ${firstName.padEnd(20)} ${p.email.padEnd(38)} `);

  // EMAIL
  try {
    await resend.emails.send({
      from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
      to: p.email,
      subject: p.is_recent
        ? `${firstName}, sorteo de 1 mes GRATIS — etiquetá 2 amigos 🎁`
        : `${firstName}, lanzamos Glúteos 360 + sorteo de 1 mes GRATIS 🎁`,
      html: p.is_recent ? buildEmailRecent(firstName) : buildEmailFresh(firstName),
    });
    results.email.sent++;
    process.stdout.write(p.is_recent ? "📧R " : "📧F ");
  } catch (e) {
    results.email.failed++;
    process.stdout.write("📧✗ ");
  }
  await new Promise(r => setTimeout(r, 150));

  // CHAT (solo si tienen acceso al chat — ie cualquier user no admin)
  try {
    const [user1, user2] = p.id < ADMIN_ID ? [p.id, ADMIN_ID] : [ADMIN_ID, p.id];
    let conversationId;
    const { data: existing } = await sb
      .from("conversations")
      .select("id")
      .eq("user1_id", user1)
      .eq("user2_id", user2)
      .maybeSingle();
    if (existing) {
      conversationId = existing.id;
    } else {
      const { data: created, error: ce } = await sb
        .from("conversations")
        .insert({ user1_id: user1, user2_id: user2 })
        .select("id")
        .single();
      if (ce) throw ce;
      conversationId = created.id;
    }
    const chatText = p.is_recent ? buildChatRecent(firstName) : buildChatFresh(firstName);
    await sb.from("messages").insert({
      conversation_id: conversationId,
      sender_id: ADMIN_ID,
      content: chatText,
    });
    await sb.from("conversations").update({
      last_message_at: new Date().toISOString(),
      last_message_preview: chatText.substring(0, 100),
    }).eq("id", conversationId);
    results.chat.sent++;
    process.stdout.write("💬✓ ");
  } catch {
    results.chat.failed++;
    process.stdout.write("💬✗ ");
  }

  // PUSH
  try {
    const { data: psubs } = await sb
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", p.id);
    let pushSent = 0;
    for (const sub of psubs || []) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({
            title: "Pablo te mandó un mensaje 💬",
            body: "Reto Glúteos 360 + sorteo de 1 mes GRATIS en IG. Abrí el chat.",
            url: "/dashboard/chat",
          })
        );
        pushSent++;
      } catch (err) {
        const sc = err?.statusCode;
        if (sc === 410 || sc === 404) {
          await sb.from("push_subscriptions").delete().eq("id", sub.id);
        }
      }
    }
    if (pushSent) results.push.sent += pushSent;
    process.stdout.write(pushSent ? `🔔×${pushSent}` : "🔔–");
  } catch {
    results.push.failed++;
    process.stdout.write("🔔✗");
  }
  process.stdout.write("\n");
}

console.log(`\n📊 RESUMEN`);
console.log(`  📧 Emails:  ${results.email.sent} enviados, ${results.email.failed} fallidos`);
console.log(`  💬 Chats:   ${results.chat.sent} enviados, ${results.chat.failed} fallidos`);
console.log(`  🔔 Pushes:  ${results.push.sent} enviados, ${results.push.failed} fallidos`);
