// Manda los 9 PNGs de Instagram + el markdown de captions por mail a Pablo.
// Uso: node scripts/mail-instagram-assets.mjs

import resendPkg from "../../../../node_modules/resend/dist/index.cjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { Resend } = resendPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKTREE = path.resolve(__dirname, "..");

async function loadEnv() {
  const envPath = path.resolve(WORKTREE, "../../..", ".env.local");
  const txt = await readFile(envPath, "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
await loadEnv();

const FILES = [
  { f: "sorteo-slide-1.png", d: "🎁 Sorteo · Slide 1 (hook · 1080x1080)" },
  { f: "sorteo-slide-2.png", d: "🎁 Sorteo · Slide 2 (reglas · 1080x1080)" },
  { f: "sorteo-slide-3.png", d: "🎁 Sorteo · Slide 3 (cierre · 1080x1080)" },
  { f: "sorteo-story-1.png", d: "🎁 Sorteo · Story anuncio (1080x1920)" },
  { f: "sorteo-story-2.png", d: "🎁 Sorteo · Story countdown (1080x1920)" },
  { f: "reto-post-1.png", d: "🟣 Reto · Post lanzamiento (1080x1080)" },
  { f: "reto-post-2.png", d: "🟣 Reto · Post Antes/Después día 14 (1080x1080)" },
  { f: "reto-story-1.png", d: "🟣 Reto · Story sumarse (1080x1920)" },
  { f: "reto-story-2.png", d: "🟣 Reto · Story testimonial día 7 (1080x1920)" },
];

const attachments = [];
for (const { f } of FILES) {
  const p = path.join(WORKTREE, "public", "ig-export-png", f);
  attachments.push({ filename: f, content: await readFile(p) });
}

// También adjunto los captions
attachments.push({
  filename: "IG_CAPTIONS.md",
  content: await readFile(path.join(WORKTREE, "IG_CAPTIONS.md")),
});

const list = FILES.map(x => `<li><strong>${x.f}</strong> — ${x.d}</li>`).join("");

const html = `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;background:#f5f5f5;padding:20px;color:#222;">
<div style="max-width:640px;margin:0 auto;background:#fff;padding:32px;border-radius:14px;">
  <h1 style="margin:0 0 12px;font-size:26px;">📸 Capturas IG listas para postear</h1>
  <p style="color:#666;margin:0 0 20px;line-height:1.5;">
    Te dejo las <strong>9 imágenes en resolución nativa de Instagram</strong>
    (1080×1080 los posts cuadrados, 1080×1920 las stories) más el markdown
    <strong>IG_CAPTIONS.md</strong> con los textos listos para copiar/pegar.
  </p>

  <div style="background:#0a0a0a;color:#CDFF00;padding:16px 20px;border-radius:10px;margin-bottom:20px;font-weight:700;">
    📅 Cronograma sugerido:<br>
    <span style="color:#fff;font-weight:400;font-size:14px;line-height:1.6;">
      • Lun 28/4 → carrusel del sorteo<br>
      • Vie 9/5 20hs → sorteo en vivo<br>
      • Lun 5/5 → lanzamiento #RetoPablo<br>
      • Lun 12/5 → arranca el reto público<br>
      • Vie 13/6 → anuncio ganador del reto
    </span>
  </div>

  <h3 style="font-size:16px;margin:24px 0 8px;">Adjuntos:</h3>
  <ol style="color:#444;line-height:1.7;font-size:14px;">${list}
    <li><strong>IG_CAPTIONS.md</strong> — Captions + cronograma + notas legales</li>
  </ol>

  <p style="color:#666;font-size:13px;margin-top:24px;line-height:1.5;">
    💡 <strong>Tip:</strong> bajá los 5 archivos del sorteo a tu galería
    el lunes a la mañana, y armá el carrusel desde la app de IG eligiendo
    los 3 cuadrados en orden (slide-1, slide-2, slide-3). Las stories
    las subís sueltas durante la semana.
  </p>

  <p style="color:#888;font-size:12px;margin-top:28px;">
    — Generado desde Claude Code
  </p>
</div>
</body></html>`;

const resend = new Resend(process.env.RESEND_API_KEY);
console.log("Mandando mail con", attachments.length, "adjuntos...");
const { data, error } = await resend.emails.send({
  from: "Pablo Scarlatto <pablo@pabloscarlattoentrenamientos.com>",
  to: "scarlattopablo@gmail.com",
  subject: "📸 Capturas IG listas: Sorteo + #RetoPablo (9 imágenes + captions)",
  html,
  attachments,
});

if (error) {
  console.error("Error:", error);
  process.exit(1);
}
console.log("✔ Mail enviado. ID:", data?.id);
