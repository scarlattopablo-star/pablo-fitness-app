// Renderiza todos los slides IG a PNG nativo (1080x1080 / 1080x1920)
// Uso: node scripts/export-instagram.mjs

import playwrightPkg from "../../../../node_modules/playwright/index.js";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = playwrightPkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKTREE = path.resolve(__dirname, "..");
const OUT_DIR = path.join(WORKTREE, "public", "ig-export-png");

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const SLIDES = [
  // Sorteo
  { id: "sorteo-slide-1", w: 1080, h: 1080, label: "Sorteo · Slide 1 (hook)" },
  { id: "sorteo-slide-2", w: 1080, h: 1080, label: "Sorteo · Slide 2 (reglas)" },
  { id: "sorteo-slide-3", w: 1080, h: 1080, label: "Sorteo · Slide 3 (cierre)" },
  { id: "sorteo-story-1", w: 1080, h: 1920, label: "Sorteo · Story anuncio" },
  { id: "sorteo-story-2", w: 1080, h: 1920, label: "Sorteo · Story countdown" },
  // Reto publico
  { id: "reto-post-1", w: 1080, h: 1080, label: "Reto · Post lanzamiento" },
  { id: "reto-post-2", w: 1080, h: 1080, label: "Reto · Post Antes/Después día 14" },
  { id: "reto-story-1", w: 1080, h: 1920, label: "Reto · Story sumarse" },
  { id: "reto-story-2", w: 1080, h: 1920, label: "Reto · Story testimonial día 7" },
];

console.log("Lanzando Chromium headless...");
const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
});
const page = await ctx.newPage();
await page.goto("http://localhost:3000/ig-export.html", { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

for (const s of SLIDES) {
  const el = await page.$("#" + s.id);
  if (!el) {
    console.error("✗ no encontre #" + s.id);
    continue;
  }
  const out = path.join(OUT_DIR, s.id + ".png");
  await el.screenshot({ path: out, type: "png" });
  console.log(`✔ ${s.id}.png  (${s.w}x${s.h}) — ${s.label}`);
}

await browser.close();
console.log(`\nListo. Archivos en: public/ig-export-png/`);
