// Renderiza cada seccion del mockup como PNG y se lo manda por mail a Pablo.
// Uso: node scripts/screenshot-and-mail-mockups.mjs
// Requiere: dev server corriendo en localhost:3000 con /mockups-preview.html accesible
//           ../../../node_modules/playwright + resend instalados, .env.local con RESEND_API_KEY

import playwrightPkg from "../../../../node_modules/playwright/index.js";
import resendPkg from "../../../../node_modules/resend/dist/index.cjs";
const { chromium } = playwrightPkg;
const { Resend } = resendPkg;
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKTREE = path.resolve(__dirname, "..");
const OUT_DIR = path.join(WORKTREE, "tmp-mockups");

// Cargar .env.local del repo padre
async function loadEnv() {
  const envPath = path.resolve(WORKTREE, "../../..", ".env.local");
  const txt = await readFile(envPath, "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

await loadEnv();

if (!process.env.RESEND_API_KEY) {
  console.error("Falta RESEND_API_KEY");
  process.exit(1);
}

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

console.log("Lanzando Chromium...");
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1500, height: 1100 },
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/mockups-preview.html", {
  waitUntil: "networkidle",
});
await page.evaluate(() => document.fonts.ready);

const sections = [
  { idx: 0, file: "01-email-gluteos360.png", title: "Email Glúteos 360" },
  { idx: 1, file: "02-sorteo-instagram.png", title: "Sorteo Instagram" },
  { idx: 2, file: "03-reto-publico.png", title: "Reto público #RetoPablo" },
];

const handles = await page.$$(".section");
console.log(`Encontre ${handles.length} secciones en el DOM`);

const results = [];
for (const s of sections) {
  const handle = handles[s.idx];
  if (!handle) {
    console.error(`No encontre seccion idx=${s.idx}`);
    continue;
  }
  const out = path.join(OUT_DIR, s.file);
  await handle.screenshot({ path: out, type: "png" });
  console.log(`✔ ${s.file} (${s.title})`);
  results.push({ ...s, path: out });
}

await browser.close();

// Mandar mail
const resend = new Resend(process.env.RESEND_API_KEY);
const attachments = await Promise.all(
  results.map(async (r) => ({
    filename: r.file,
    content: await readFile(r.path),
  }))
);

const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#222;">
<div style="max-width:600px;margin:0 auto;background:#fff;padding:30px;border-radius:12px;">
  <h1 style="margin:0 0 8px;font-size:24px;">Pablo, te dejo los 3 mockups</h1>
  <p style="color:#666;margin:0 0 20px;">Adjunto las 3 piezas en PNG para que las revises:</p>
  <ol style="color:#444;line-height:1.8;font-size:15px;">
    <li><strong>Email Glúteos 360</strong> — re-envío con sorteo cruzado, 28 destinatarios</li>
    <li><strong>Sorteo Instagram</strong> — carrusel 3 slides + 2 stories</li>
    <li><strong>Reto público #RetoPablo</strong> — Antes/Después 30 días</li>
  </ol>
  <p style="color:#444;margin-top:20px;font-size:14px;">
    Cualquier ajuste de copy, color o estructura me decís y lo retoco antes de mandar/postear.
  </p>
  <p style="color:#888;font-size:12px;margin-top:24px;">
    — Generado desde Claude Code (worktree elastic-kowalevski-9ff2a7)
  </p>
</div>
</body></html>`;

console.log("Mandando mail...");
const { data, error } = await resend.emails.send({
  from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
  to: "scarlattopablo@gmail.com",
  subject: "Mockups CORREGIDOS: Glúteos 360 + Sorteo IG + Reto público",
  html,
  attachments,
});

if (error) {
  console.error("Error:", error);
  process.exit(1);
}
console.log("✔ Mail enviado. ID:", data?.id);
