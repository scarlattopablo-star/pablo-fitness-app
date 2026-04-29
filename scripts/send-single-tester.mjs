// Manda email de invitacion a 1 tester individual
// Usage: node scripts/send-single-tester.mjs email nombre
//   ej: node scripts/send-single-tester.mjs melisa@gmail.com Melisa

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>";
const OPT_IN_URL = "https://play.google.com/apps/testing/com.pabloscarlattoentrenamientos.app";

const [, , emailArg, ...nameArgs] = process.argv;
const email = emailArg;
const fullName = nameArgs.join(" ") || "Cliente";
const firstName = fullName.split(" ")[0];

if (!email || !email.includes("@")) {
  console.error("Uso: node scripts/send-single-tester.mjs email nombre");
  process.exit(1);
}

if (!RESEND_API_KEY) {
  console.error("Falta RESEND_API_KEY en .env.local");
  process.exit(1);
}

const html = `<!DOCTYPE html>
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
        Por eso te incluyo entre las primeras personas con acceso. <strong style="color:#ffffff;">Sin que ustedes la descarguen estos dias, la app no puede salir al publico.</strong>
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
        Cualquier cosa rara, contestame este mail y te respondo personalmente.
      </p>
      <p style="color:#ffffff;font-size:15px;line-height:1.6;margin:24px 0 0;font-weight:bold;">
        GRACIAS por bancarme con esto. Sin ustedes no llegamos 🙏
      </p>
      <p style="color:#d4d4d8;font-size:15px;line-height:1.6;margin:8px 0 0;">
        Un abrazo grande,<br>Pablo
      </p>
    </div>
  </div>
</body>
</html>`;

console.log(`Mandando a ${firstName} <${email}>...`);

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${RESEND_API_KEY}`,
  },
  body: JSON.stringify({
    from: FROM_EMAIL,
    to: [email],
    subject: `${firstName}, te pido un favor de 1 minuto con GymRat 🙏`,
    html,
  }),
});

const data = await res.json();
if (res.ok) {
  console.log(`✓ Enviado. ID: ${data.id}`);
} else {
  console.error(`✗ Falló: ${JSON.stringify(data)}`);
  process.exit(1);
}
