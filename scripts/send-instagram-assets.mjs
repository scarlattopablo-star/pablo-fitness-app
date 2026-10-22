// Genera 4 PNG desde los HTMLs de Instagram (posts + historias) y los manda
// por email via Resend al admin. Uso: node scripts/send-instagram-assets.mjs

import { chromium } from "playwright";
import { Resend } from "resend";
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

// Cargar .env.local manualmente (node no lo lee por defecto).
const envPath = path.resolve(".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
  console.error("Falta RESEND_API_KEY en .env.local");
  process.exit(1);
}

const TO_EMAIL = "scarlattopablo@gmail.com";
const FROM = "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>";

const pieces = [
  { html: "instagram-glutes-360-post.html",   out: "glutes-360-post.png",   w: 1080, h: 1350, label: "Reto Gluteos 360 · POST (1080x1350)" },
  { html: "instagram-glutes-360-story.html",  out: "glutes-360-story.png",  w: 1080, h: 1920, label: "Reto Gluteos 360 · HISTORIA (1080x1920)" },
  { html: "instagram-precios-post.html",      out: "precios-post.png",      w: 1080, h: 1350, label: "Precios · POST (1080x1350)" },
  { html: "instagram-precios-story.html",     out: "precios-story.png",     w: 1080, h: 1920, label: "Precios · HISTORIA (1080x1920)" },
];

const outDir = path.resolve("out-instagram");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

console.log("Lanzando Chromium headless...");
const browser = await chromium.launch();

for (const p of pieces) {
  const ctx = await browser.newContext({ viewport: { width: p.w, height: p.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const fileUrl = url.pathToFileURL(path.resolve(p.html)).toString();
  await page.goto(fileUrl, { waitUntil: "networkidle" });
  // Esperar que el script inline haya actualizado la fecha del cupo.
  await page.waitForTimeout(300);
  const locator = page.locator(".canvas").first();
  const outPath = path.join(outDir, p.out);
  await locator.screenshot({ path: outPath, type: "png" });
  const stat = fs.statSync(outPath);
  console.log(`✓ ${p.out}  (${Math.round(stat.size / 1024)} KB)`);
  await ctx.close();
}
await browser.close();

console.log("\nEnviando email a", TO_EMAIL);
const resend = new Resend(RESEND_API_KEY);

const attachments = pieces.map((p) => ({
  filename: p.out,
  content: fs.readFileSync(path.join(outDir, p.out)).toString("base64"),
}));

const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#222;">
  <h2 style="color:#111;">Assets Instagram listos</h2>
  <p>Te dejo las 4 piezas para que se las pases a Javi:</p>
  <ul style="line-height:1.8;">
    ${pieces.map(p => `<li><strong>${p.label}</strong> — <code>${p.out}</code></li>`).join("")}
  </ul>
  <p style="color:#666;font-size:13px;">
    Los HTML de origen siguen versionados en el repo. Las fechas de cierre
    del reto se auto-actualizan al primero de cada mes — si querés re-exportar
    el mes siguiente, solo corré de nuevo este script.
  </p>
</div>`;

const { data, error } = await resend.emails.send({
  from: FROM,
  to: TO_EMAIL,
  subject: "Assets Instagram: Reto Gluteos 360 + Precios (4 piezas)",
  html,
  attachments,
});

if (error) {
  console.error("Error enviando email:", error);
  process.exit(1);
}
console.log("✓ Email enviado. ID:", data?.id);
