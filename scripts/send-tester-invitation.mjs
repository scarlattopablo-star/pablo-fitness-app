// Manda email a clientes Gmail pidiendo que se registren como testers en Play Store
// Muestra preview + pide confirmacion explicita antes de mandar
// Usage: cd a /pablo-fitness-app && node .claude/worktrees/interesting-montalcini-e99db2/scripts/send-tester-invitation.mjs

import { config } from "dotenv";
import readline from "node:readline";
config({ path: ".env.local" });
config({ path: ".env" });

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const FROM_EMAIL = "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>";

const OPT_IN_URL = "https://play.google.com/apps/testing/com.pabloscarlattoentrenamientos.app";

if (!RESEND_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("FALTAN ENV VARS. RESEND_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY requeridas.");
  process.exit(1);
}

async function getProfiles() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=email,full_name,is_admin&order=created_at.desc`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.json();
}

function buildHtml(firstName) {
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
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Te escribo personalmente porque <strong style="color:#ffffff;">necesito un favor tuyo de 1 minuto</strong>.
      </p>
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Despues de meses de laburo, finalmente subi <strong style="color:#10b981;">GymRat</strong> a Google Play. Ahora viene la parte donde Google me obliga a tener un grupo de personas que la prueben antes de hacerla publica.
      </p>
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Por eso te incluyo a vos entre las primeras personas con acceso. <strong style="color:#ffffff;">Sin que ustedes la descarguen estos dias, la app no puede salir al publico.</strong> Por eso necesito tu mano.
      </p>

      <div style="background:#0d1f17;border:1px solid #10b981;border-radius:12px;padding:24px;margin-bottom:24px;">
        <p style="color:#10b981;font-size:14px;font-weight:bold;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">3 pasos · 1 minuto</p>

        <p style="color:#ffffff;font-size:15px;margin:0 0 8px;"><strong>1)</strong> Desde tu celular Android, abri este link:</p>
        <div style="text-align:center;margin:12px 0 16px;">
          <a href="${OPT_IN_URL}" style="display:inline-block;background:#10b981;color:#000;font-size:15px;font-weight:800;padding:14px 28px;border-radius:10px;text-decoration:none;">
            ABRIR LINK DE GymRat
          </a>
        </div>

        <p style="color:#ffffff;font-size:15px;margin:0 0 8px;"><strong>2)</strong> Apreta el boton <strong style="color:#10b981;">"Convertirme en tester"</strong> (o "Become a tester")</p>

        <p style="color:#ffffff;font-size:15px;margin:0 0 8px;"><strong>3)</strong> Esperá 5-10 min, abrí Play Store y buscá <strong style="color:#10b981;">GymRat</strong> — ya la podes descargar</p>
      </div>

      <p style="color:#d4d4d8;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Si tenes <strong>iPhone</strong>, todavia no se puede — la subo a App Store apenas termine este proceso.
      </p>

      <p style="color:#d4d4d8;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Cualquier cosa rara, contestame este mail directamente y te respondo personalmente.
      </p>

      <p style="color:#ffffff;font-size:15px;line-height:1.6;margin:24px 0 0;font-weight:bold;">
        GRACIAS por bancarme con esto. Sin ustedes no llegamos 🙏
      </p>
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:8px 0 0;">
        Un abrazo grande,<br>Pablo
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

async function sendEmail(to, name) {
  const firstName = name?.split(" ")[0] || "Cliente";
  const subject = `${firstName}, te pido un favor de 1 minuto con GymRat 🙏`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: buildHtml(firstName),
    }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function main() {
  console.log("Fetching profiles...\n");
  const profiles = await getProfiles();

  if (!Array.isArray(profiles)) {
    console.error("Error fetching profiles:", profiles);
    process.exit(1);
  }

  // Solo Gmail (los que cargamos en Play Console). Excluir admins. Excluir cuenta developer.
  const targets = profiles.filter(p =>
    p.email &&
    /@gmail\.com$/i.test(p.email) &&
    !p.is_admin &&
    p.email.toLowerCase() !== "scarlattopablo@gmail.com" &&
    !p.email.includes("+pablo") &&
    !/test/i.test(p.email)
  );

  console.log(`Total profiles: ${profiles.length}`);
  console.log(`Targets (Gmail, no admin, no test): ${targets.length}\n`);
  console.log("=== DESTINATARIOS ===");
  targets.forEach((t, i) => {
    console.log(`${String(i + 1).padStart(2)}. ${(t.full_name || "(sin nombre)").padEnd(30)} → ${t.email}`);
  });

  console.log("\n=== EMAIL PREVIEW ===");
  const sample = targets[0];
  const sampleFirstName = sample?.full_name?.split(" ")[0] || "Cliente";
  console.log(`From:    ${FROM_EMAIL}`);
  console.log(`To:      [destinatario]`);
  console.log(`Subject: ${sampleFirstName}, te pido un favor de 1 minuto con GymRat 🙏`);
  console.log(`\n--- HTML body (preview text only) ---`);
  console.log(`Hola ${sampleFirstName}!`);
  console.log(``);
  console.log(`Te escribo personalmente porque NECESITO UN FAVOR TUYO DE 1 MINUTO.`);
  console.log(``);
  console.log(`Despues de meses de laburo, finalmente subi GymRat a Google Play. Ahora`);
  console.log(`viene la parte donde Google me obliga a tener un grupo de personas que la`);
  console.log(`prueben antes de hacerla publica.`);
  console.log(``);
  console.log(`Por eso te incluyo a vos entre las primeras personas con acceso. SIN QUE`);
  console.log(`USTEDES LA DESCARGUEN ESTOS DIAS, LA APP NO PUEDE SALIR AL PUBLICO. Por eso`);
  console.log(`necesito tu mano.`);
  console.log(``);
  console.log(`3 PASOS · 1 MINUTO`);
  console.log(``);
  console.log(`1) Desde tu celular Android, abri este link:`);
  console.log(`   [BOTON] ABRIR LINK DE GymRat → ${OPT_IN_URL}`);
  console.log(``);
  console.log(`2) Apreta el boton "Convertirme en tester" (o "Become a tester")`);
  console.log(``);
  console.log(`3) Esperá 5-10 min, abrí Play Store y buscá GymRat — ya la podes descargar`);
  console.log(``);
  console.log(`Si tenes iPhone, todavia no se puede.`);
  console.log(``);
  console.log(`Cualquier cosa rara, contestame este mail directamente.`);
  console.log(``);
  console.log(`GRACIAS por bancarme con esto. Sin ustedes no llegamos 🙏`);
  console.log(``);
  console.log(`Un abrazo grande,`);
  console.log(`Pablo`);
  console.log(`\n---`);

  console.log(`\n⚠️  Vas a mandar ${targets.length} emails reales con Resend.`);
  const answer = await ask(`Escribi MANDAR para confirmar (o cualquier otra cosa para cancelar): `);

  if (answer !== "MANDAR") {
    console.log("\n❌ Cancelado. No se mando nada.");
    process.exit(0);
  }

  console.log(`\n📤 Enviando ${targets.length} emails...\n`);
  let ok = 0, fail = 0;
  for (const t of targets) {
    try {
      const r = await sendEmail(t.email, t.full_name);
      if (r.ok) {
        ok++;
        console.log(`✓ ${(t.full_name || t.email).padEnd(30)} → ${t.email}`);
      } else {
        fail++;
        console.log(`✗ ${(t.full_name || t.email).padEnd(30)} → ${t.email} | ${JSON.stringify(r.data)}`);
      }
    } catch (err) {
      fail++;
      console.log(`✗ ${t.email} | ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`✓ Enviados: ${ok}`);
  console.log(`✗ Fallidos: ${fail}`);
}

main().catch(console.error);
