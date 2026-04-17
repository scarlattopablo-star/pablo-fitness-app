"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Sparkles, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons";

type Template = "ia-tecnica" | "pr-generic" | "cupos-limitados" | "reto-mes" | "ai-feed" | "ai-story";

interface TemplateDef {
  id: Template;
  name: string;
  format: "square" | "story";
  render: (ctx: CanvasRenderingContext2D, fields: Record<string, string>) => void;
  fields: { key: string; label: string; default: string }[];
}

// ============= HELPERS =============

// Polyfill for ctx.roundRect — not available in iOS < 15.4
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string | undefined, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = (text ?? "").split(" ");
  let line = "";
  let offsetY = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y + offsetY);
      line = word;
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y + offsetY);
  return offsetY + lineHeight;
}

function drawPhoneMockup(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Phone outline
  ctx.save();
  ctx.fillStyle = "#1a1a1a";
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 4;
  const r = 40;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  // Screen
  const sx = x + 14, sy = y + 14, sw = w - 28, sh = h - 28;
  ctx.fillStyle = "#0a0a0a";
  roundRect(ctx, sx, sy, sw, sh, r - 10);
  ctx.fill();

  // App content mock
  ctx.fillStyle = "#CDFF00";
  ctx.font = "bold 24px system-ui";
  ctx.textAlign = "left";
  ctx.fillText("ANALIZANDO TECNICA", sx + 30, sy + 60);

  ctx.fillStyle = "#fbbf24";
  ctx.font = "900 120px system-ui";
  ctx.fillText("7", sx + 30, sy + 200);
  ctx.fillStyle = "#666";
  ctx.font = "bold 32px system-ui";
  ctx.fillText("/10", sx + 130, sy + 200);

  // Positives
  ctx.fillStyle = "#10b981";
  ctx.font = "bold 18px system-ui";
  ctx.fillText("✓ Buena profundidad", sx + 30, sy + 260);
  ctx.fillText("✓ Espalda neutra", sx + 30, sy + 290);

  // Corrections
  ctx.fillStyle = "#f59e0b";
  ctx.fillText("⚠ Rodillas hacia adentro", sx + 30, sy + 340);
  ctx.fillText("⚠ Peso en puntas", sx + 30, sy + 370);

  // Cues
  ctx.fillStyle = "#CDFF00";
  ctx.font = "bold 16px system-ui";
  ctx.fillText("CUES:", sx + 30, sy + 420);
  ctx.fillStyle = "#fff";
  ctx.font = "500 16px system-ui";
  ctx.fillText("Rodillas afuera", sx + 30, sy + 445);
  ctx.fillText("Empuja el piso", sx + 30, sy + 470);

  ctx.restore();
}

// ============= TEMPLATES =============

const TEMPLATES: TemplateDef[] = [
  {
    id: "ia-tecnica",
    name: "IA Analiza Técnica (feed)",
    format: "square",
    fields: [
      { key: "headline1", label: "Título línea 1", default: "PRIMER GIMNASIO" },
      { key: "headline2", label: "Título línea 2", default: "EN URUGUAY CON IA" },
      { key: "headline3", label: "Título línea 3", default: "QUE TE CORRIGE" },
      { key: "headline4", label: "Título línea 4", default: "LA TECNICA" },
      { key: "subtitle", label: "Subtítulo", default: "Grabas 5 segundos. Te digo que corregir al toque." },
      { key: "cta", label: "CTA", default: "PRIMER MES GRATIS - LINK EN BIO" },
    ],
    render: (ctx, f) => {
      // 1080x1080
      // BG dark gradient
      const bg = ctx.createLinearGradient(0, 0, 0, 1080);
      bg.addColorStop(0, "#0a0a0a");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1080);

      // Radial glow
      const g = ctx.createRadialGradient(540, 540, 100, 540, 540, 700);
      g.addColorStop(0, "rgba(205, 255, 0, 0.12)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1080);

      // Phone mockup RIGHT side — draw FIRST so text renders on top
      drawPhoneMockup(ctx, 600, 140, 420, 620);

      // Left column text (constrained to 520px to never overlap the phone)
      ctx.fillStyle = "#CDFF00";
      ctx.fillRect(60, 60, 80, 5);
      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 20px system-ui";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText("PABLO SCARLATTO · FEATURE NUEVA", 60, 80);

      // Headline — clip to left half so it never bleeds over phone
      ctx.save();
      ctx.rect(0, 0, 580, 1080);
      ctx.clip();
      ctx.fillStyle = "#fff";
      ctx.font = "900 56px system-ui";
      ctx.fillText(f.headline1 || "", 60, 160);
      ctx.fillText(f.headline2 || "", 60, 220);
      ctx.fillStyle = "#CDFF00";
      ctx.fillText(f.headline3 || "", 60, 280);
      ctx.fillStyle = "#fff";
      ctx.fillText(f.headline4 || "", 60, 340);
      ctx.restore();

      // Subtitle and CTA (left column)
      ctx.fillStyle = "#aaa";
      ctx.font = "500 24px system-ui";
      wrapText(ctx, f.subtitle, 60, 490, 500, 34);

      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 22px system-ui";
      ctx.fillText(f.cta || "", 60, 990);
      ctx.fillStyle = "#666";
      ctx.font = "500 14px system-ui";
      ctx.fillText("pabloscarlattoentrenamientos.com", 60, 1025);
    },
  },
  {
    id: "pr-generic",
    name: "Compartí tu PR (story)",
    format: "story",
    fields: [
      { key: "heading", label: "Titular", default: "ROMPISTE UN PR?" },
      { key: "body", label: "Texto", default: "La app te arma una imagen lista para tu IG Story con 1 tap." },
      { key: "cta", label: "CTA", default: "Entra a tu dashboard →" },
    ],
    render: (ctx, f) => {
      // 1080x1920
      const bg = ctx.createLinearGradient(0, 0, 0, 1920);
      bg.addColorStop(0, "#0a0a0a");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1920);

      const g = ctx.createRadialGradient(540, 960, 100, 540, 960, 900);
      g.addColorStop(0, "rgba(251, 191, 36, 0.18)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1920);

      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(80, 180, 120, 6);
      ctx.font = "bold 36px system-ui";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillText("PABLO SCARLATTO", 80, 220);

      ctx.fillStyle = "#fff";
      ctx.font = "900 110px system-ui";
      wrapText(ctx, (f.heading || "").toUpperCase(), 80, 320, 920, 120);

      ctx.fillStyle = "#aaa";
      ctx.font = "500 40px system-ui";
      wrapText(ctx, f.body, 80, 800, 920, 56);

      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 44px system-ui";
      ctx.fillText(f.cta, 80, 1700);
    },
  },
  {
    id: "cupos-limitados",
    name: "Cupos limitados (feed)",
    format: "square",
    fields: [
      { key: "number", label: "Número", default: "3" },
      { key: "cap", label: "De", default: "30" },
      { key: "heading", label: "Titular", default: "CUPOS ESTE MES" },
      { key: "cta", label: "CTA", default: "Primer mes GRATIS - link en bio" },
    ],
    render: (ctx, f) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 1080);
      bg.addColorStop(0, "#0a0a0a");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1080);

      // Red urgency glow
      const g = ctx.createRadialGradient(540, 540, 100, 540, 540, 700);
      g.addColorStop(0, "rgba(239, 68, 68, 0.18)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1080);

      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 32px system-ui";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillText("ULTIMOS LUGARES", 540, 180);

      // Big number
      ctx.fillStyle = "#ef4444";
      ctx.font = "900 380px system-ui";
      ctx.fillText(f.number, 540, 260);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 56px system-ui";
      ctx.fillText(`de ${f.cap}`, 540, 670);

      ctx.font = "900 64px system-ui";
      ctx.fillText(f.heading, 540, 770);

      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 28px system-ui";
      ctx.fillText(f.cta, 540, 950);
      ctx.fillStyle = "#666";
      ctx.font = "500 18px system-ui";
      ctx.fillText("pabloscarlattoentrenamientos.com", 540, 1000);
    },
  },
  {
    id: "reto-mes",
    name: "Reto del mes (feed)",
    format: "square",
    fields: [
      { key: "heading", label: "Titular", default: "RETO DEL MES" },
      { key: "challenge", label: "Desafío", default: "12 SESIONES EN ABRIL" },
      { key: "prize", label: "Premio", default: "Sesion 1 a 1 GRATIS con Pablo" },
      { key: "cta", label: "CTA", default: "Participa gratis - link en bio" },
    ],
    render: (ctx, f) => {
      const bg = ctx.createLinearGradient(0, 0, 0, 1080);
      bg.addColorStop(0, "#1a1204");
      bg.addColorStop(1, "#000");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, 1080, 1080);

      const g = ctx.createRadialGradient(540, 540, 100, 540, 540, 700);
      g.addColorStop(0, "rgba(251, 191, 36, 0.22)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1080, 1080);

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 28px system-ui";
      ctx.textBaseline = "top";
      ctx.textAlign = "center";
      ctx.fillText(f.heading, 540, 140);

      // Trophy
      ctx.fillStyle = "#fbbf24";
      ctx.font = "180px system-ui";
      ctx.fillText("🏆", 540, 200);

      ctx.fillStyle = "#fff";
      ctx.font = "900 74px system-ui";
      wrapText(ctx, f.challenge, 540, 440, 900, 88);

      // Prize box
      ctx.fillStyle = "rgba(251, 191, 36, 0.1)";
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      roundRect(ctx, 90, 720, 900, 120, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 22px system-ui";
      ctx.fillText("PREMIO", 540, 745);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px system-ui";
      ctx.fillText(f.prize, 540, 785);

      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 26px system-ui";
      ctx.fillText(f.cta, 540, 990);
    },
  },
  // ── AI GENERATED FEED ──────────────────────────────────────────────
  {
    id: "ai-feed",
    name: "IA Generado (feed)",
    format: "square",
    fields: [
      { key: "eyebrow", label: "Etiqueta arriba", default: "TIP DE ENTRENAMIENTO" },
      { key: "headline", label: "Titular", default: "GENERA CON IA →" },
      { key: "body", label: "Cuerpo", default: "Elegí una categoría y apretá Generar." },
      { key: "extra", label: "Dato extra (opcional)", default: "" },
      { key: "cta", label: "CTA", default: "Guardalo y ponlo en práctica" },
    ],
    render: (ctx, f) => {
      const W = 1080, H = 1080;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0a0a"); bg.addColorStop(1, "#000");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Lime glow top-left
      const glow = ctx.createRadialGradient(200, 200, 50, 200, 200, 700);
      glow.addColorStop(0, "rgba(205,255,0,0.14)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      // Eyebrow pill
      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 30px system-ui";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillRect(60, 90, 8, 50);
      ctx.fillText(f.eyebrow || "", 82, 98);

      // Headline
      ctx.fillStyle = "#fff";
      ctx.font = "900 76px system-ui";
      const headY = wrapText(ctx, f.headline || "", 60, 200, 960, 86) + 200;

      // Divider
      ctx.fillStyle = "#222";
      ctx.fillRect(60, headY + 20, 960, 2);

      // Body
      ctx.fillStyle = "#ccc";
      ctx.font = "400 36px system-ui";
      const bodyEndY = wrapText(ctx, f.body || "", 60, headY + 50, 960, 50) + headY + 50;

      // Extra fact (if any)
      if (f.extra && f.extra.trim()) {
        ctx.fillStyle = "#555";
        ctx.fillRect(60, bodyEndY + 20, 960, 1);
        ctx.fillStyle = "#CDFF00";
        ctx.font = "500 28px system-ui";
        wrapText(ctx, f.extra, 60, bodyEndY + 38, 960, 38);
      }

      // Footer
      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 28px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(f.cta || "", 60, 960);

      ctx.textAlign = "right";
      ctx.fillStyle = "#444";
      ctx.font = "500 24px system-ui";
      ctx.fillText("PABLO SCARLATTO", 1020, 960);
      ctx.fillStyle = "#333";
      ctx.font = "400 20px system-ui";
      ctx.fillText("@pabloscarlattoentrenamientos", 1020, 990);
    },
  },
  // ── AI GENERATED STORY ─────────────────────────────────────────────
  {
    id: "ai-story",
    name: "IA Generado (story)",
    format: "story",
    fields: [
      { key: "eyebrow", label: "Etiqueta arriba", default: "TIP DE ENTRENAMIENTO" },
      { key: "headline", label: "Titular", default: "GENERA CON IA →" },
      { key: "body", label: "Cuerpo", default: "Elegí una categoría y apretá Generar." },
      { key: "extra", label: "Dato extra (opcional)", default: "" },
      { key: "cta", label: "CTA", default: "Guardalo y ponlo en práctica" },
    ],
    render: (ctx, f) => {
      const W = 1080, H = 1920;
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, "#0a0a0a"); bg.addColorStop(1, "#000");
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      const glow = ctx.createRadialGradient(540, 700, 100, 540, 700, 900);
      glow.addColorStop(0, "rgba(205,255,0,0.15)"); glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

      // Top label
      ctx.fillStyle = "#CDFF00";
      ctx.fillRect(80, 200, 8, 60);
      ctx.font = "bold 36px system-ui";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(f.eyebrow || "", 104, 213);

      // Big headline
      ctx.fillStyle = "#fff";
      ctx.font = "900 96px system-ui";
      wrapText(ctx, f.headline || "", 80, 360, 920, 108);

      // Divider
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(80, 740, 920, 3);

      // Body
      ctx.fillStyle = "#bbb";
      ctx.font = "400 44px system-ui";
      wrapText(ctx, f.body || "", 80, 790, 920, 60);

      // Extra
      if (f.extra && f.extra.trim()) {
        ctx.fillStyle = "#CDFF00";
        ctx.font = "600 34px system-ui";
        wrapText(ctx, f.extra, 80, 1100, 920, 46);
      }

      // CTA
      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 40px system-ui";
      ctx.fillText(f.cta || "", 80, 1650);

      // Branding
      ctx.textAlign = "right";
      ctx.fillStyle = "#CDFF00";
      ctx.font = "900 34px system-ui";
      ctx.fillText("PABLO SCARLATTO", 1000, 1740);
      ctx.fillStyle = "#555";
      ctx.font = "400 26px system-ui";
      ctx.fillText("@pabloscarlattoentrenamientos", 1000, 1780);
    },
  },
];

// ── CAROUSEL ───────────────────────────────────────────────────────────
interface CarouselSlide {
  slide: number;
  eyebrow: string;
  headline: string;
  body: string;
  highlight?: string;
  cta?: string;
  isCover?: boolean;
  isCta?: boolean;
}

function renderCarouselSlide(
  canvas: HTMLCanvasElement,
  slide: CarouselSlide,
  total: number,
) {
  const W = 1080, H = 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // BG
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0d0d0d");
  bg.addColorStop(1, "#000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Cover gets a stronger glow, CTA slide a different accent
  const glowColor = slide.isCover
    ? "rgba(205,255,0,0.18)"
    : slide.isCta
    ? "rgba(251,191,36,0.14)"
    : "rgba(205,255,0,0.08)";
  const glow = ctx.createRadialGradient(540, 400, 80, 540, 400, 780);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Left accent bar
  const barColor = slide.isCta ? "#fbbf24" : "#CDFF00";
  ctx.fillStyle = barColor;
  ctx.fillRect(0, 0, 8, H);

  // Slide counter (top right)
  ctx.fillStyle = "#333";
  ctx.font = "500 28px system-ui";
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText(`${slide.slide} / ${total}`, W - 60, 60);

  // Eyebrow
  ctx.fillStyle = barColor;
  ctx.font = "bold 28px system-ui";
  ctx.textAlign = "left";
  ctx.fillText((slide.eyebrow || "").toUpperCase(), 60, 100);

  if (slide.isCover) {
    // Cover: big centered headline
    ctx.fillStyle = "#fff";
    ctx.font = "900 86px system-ui";
    ctx.textBaseline = "top";
    const headH = wrapText(ctx, slide.headline || "", 60, 220, 960, 96);

    if (slide.body) {
      ctx.fillStyle = "#888";
      ctx.font = "400 36px system-ui";
      wrapText(ctx, slide.body, 60, 220 + headH + 40, 960, 50);
    }

    // "Swipe →" hint bottom
    ctx.fillStyle = barColor;
    ctx.font = "bold 30px system-ui";
    ctx.textAlign = "right";
    ctx.fillText("Deslizá →", W - 60, H - 80);
  } else if (slide.isCta) {
    // CTA slide
    ctx.fillStyle = "#fff";
    ctx.font = "900 72px system-ui";
    ctx.textBaseline = "top";
    const headH = wrapText(ctx, slide.headline || "", 60, 220, 960, 82);

    ctx.fillStyle = "#aaa";
    ctx.font = "400 36px system-ui";
    const bodyH = wrapText(ctx, slide.body || "", 60, 220 + headH + 30, 960, 50);

    // CTA box
    const ctaY = 220 + headH + bodyH + 80;
    ctx.fillStyle = barColor;
    ctx.fillRect(60, ctaY, 960, 4);
    ctx.fillStyle = barColor;
    ctx.font = "bold 42px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(slide.cta || "Seguime para más", 60, ctaY + 24);
  } else {
    // Content slide
    // Step number badge
    ctx.fillStyle = barColor;
    ctx.font = "900 100px system-ui";
    ctx.textBaseline = "top";
    ctx.fillText(String(slide.slide - 1), 60, 160);

    ctx.fillStyle = "#fff";
    ctx.font = "900 66px system-ui";
    const headH = wrapText(ctx, slide.headline || "", 60, 310, 960, 76);

    ctx.fillStyle = "#aaa";
    ctx.font = "400 34px system-ui";
    const bodyH = wrapText(ctx, slide.body || "", 60, 310 + headH + 20, 960, 48);

    if (slide.highlight && slide.highlight.trim()) {
      const hy = 310 + headH + bodyH + 50;
      ctx.fillStyle = "rgba(205,255,0,0.08)";
      ctx.fillRect(60, hy, 960, 80);
      ctx.fillStyle = "#CDFF00";
      ctx.font = "600 30px system-ui";
      ctx.textBaseline = "middle";
      ctx.fillText(slide.highlight, 80, hy + 40);
      ctx.textBaseline = "top";
    }
  }

  // Footer branding
  ctx.textAlign = "right";
  ctx.fillStyle = "#2a2a2a";
  ctx.font = "700 26px system-ui";
  ctx.textBaseline = "bottom";
  ctx.fillText("PABLO SCARLATTO · @pabloscarlattoentrenamientos", W - 60, H - 40);
}

function initFields(id: Template): Record<string, string> {
  const tpl = TEMPLATES.find(t => t.id === id)!;
  const init: Record<string, string> = {};
  for (const f of tpl.fields) init[f.key] = f.default;
  return init;
}

export default function ContenidoPage() {
  const [templateId, setTemplateId] = useState<Template>("ia-tecnica");
  // Initialize fields immediately with defaults so canvas never sees undefined values
  const [fields, setFields] = useState<Record<string, string>>(() => initFields("ia-tecnica"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [aiCategory, setAiCategory] = useState("motivacion");
  const [aiTopic, setAiTopic] = useState("");
  const [aiFormat, setAiFormat] = useState<"square" | "story">("square");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiMode, setAiMode] = useState<"single" | "carousel">("single");
  const [carouselSlides, setCarouselSlides] = useState<CarouselSlide[]>([]);
  const [carouselNumSlides, setCarouselNumSlides] = useState(5);
  const [carouselGenerating, setCarouselGenerating] = useState(false);
  const [carouselError, setCarouselError] = useState("");
  const carouselRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const generateWithAI = async () => {
    setAiGenerating(true);
    setAiError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/generate-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ category: aiCategory, topic: aiTopic || undefined, format: aiFormat }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "Error al generar"); return; }

      // Switch to the right template and fill fields
      const targetId: Template = aiFormat === "story" ? "ai-story" : "ai-feed";
      setTemplateId(targetId);
      setFields({
        eyebrow: data.eyebrow || "",
        headline: data.headline || "",
        body: data.body || "",
        extra: data.extra || "",
        cta: data.cta || "",
      });
    } catch (e) {
      setAiError(String(e));
    } finally {
      setAiGenerating(false);
    }
  };

  const generateCarousel = async () => {
    setCarouselGenerating(true);
    setCarouselError("");
    setCarouselSlides([]);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/generate-carousel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ category: aiCategory, topic: aiTopic || undefined, numSlides: carouselNumSlides }),
      });
      const data = await res.json();
      if (!res.ok) { setCarouselError(data.error || "Error"); return; }
      setCarouselSlides(data.slides || []);
    } catch (e) {
      setCarouselError(String(e));
    } finally {
      setCarouselGenerating(false);
    }
  };

  // Render carousel slides whenever they change
  useEffect(() => {
    carouselSlides.forEach((slide, i) => {
      const canvas = carouselRefs.current[i];
      if (canvas) renderCarouselSlide(canvas, slide, carouselSlides.length);
    });
  }, [carouselSlides]);

  const downloadAllSlides = async () => {
    for (let i = 0; i < carouselSlides.length; i++) {
      const canvas = carouselRefs.current[i];
      if (!canvas) continue;
      await new Promise<void>(resolve => {
        canvas.toBlob(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `carrusel-slide-${i + 1}-de-${carouselSlides.length}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
          resolve();
        }, "image/png");
      });
      // Small delay between downloads so browser doesn't block them
      await new Promise(r => setTimeout(r, 300));
    }
  };

  const sendFeatureAnnouncement = async () => {
    if (!confirm("Esto enviará email + mensaje en el chat de la app + push notification a TODOS los clientes activos. ¿Confirmar?")) return;
    setSending(true);
    setSendResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/announce-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
      });
      const data = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, msg: data.summary || `✓ Enviado a ${data.results?.email?.sent ?? 0} clientes` });
      } else {
        setSendResult({ ok: false, msg: data.error || "Error desconocido" });
      }
    } catch (e) {
      setSendResult({ ok: false, msg: String(e) });
    } finally {
      setSending(false);
    }
  };

  const template = TEMPLATES.find(t => t.id === templateId)!;
  const size = template.format === "story" ? { w: 1080, h: 1920 } : { w: 1080, h: 1080 };

  // Re-initialize fields when template changes
  useEffect(() => {
    setFields(initFields(templateId));
  }, [templateId]);

  // Re-render on any change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size.w, size.h);
    template.render(ctx, fields);
  }, [fields, templateId, size.w, size.h]);

  const download = () => {
    canvasRef.current?.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${template.id}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-black">Generador de contenido</h1>
      </div>
      <p className="text-sm text-muted mb-6">Creá imágenes listas para Instagram desde plantillas.</p>

      {/* ── AI GENERATOR ─────────────────────────── */}
      <div className="mb-6 p-4 rounded-2xl border border-primary/40 bg-primary/5">
        <h2 className="font-bold text-sm mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Generar contenido con IA
        </h2>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          {(["single", "carousel"] as const).map(m => (
            <button key={m} onClick={() => setAiMode(m)}
              className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${aiMode === m ? "border-primary bg-primary/10 text-primary" : "border-card-border text-muted"}`}>
              {m === "single" ? "📷 Post único" : "🎠 Carrusel"}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          {/* Category */}
          <div>
            <label className="text-xs text-muted block mb-1">Categoría</label>
            <select value={aiCategory} onChange={e => setAiCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-card-bg border border-card-border text-sm focus:border-primary outline-none">
              <option value="motivacion">💪 Motivación</option>
              <option value="tip-entreno">🏋️ Tip de entrenamiento</option>
              <option value="tip-nutricion">🥗 Tip de nutrición</option>
              <option value="dato">🧠 Dato curioso</option>
              <option value="pregunta">❓ Pregunta interactiva</option>
              <option value="mito">⚡ Mito vs Realidad</option>
              <option value="antes-despues">📸 Antes / Después</option>
              <option value="rutina">📋 Estructura de rutina</option>
              <option value="recuperacion">😴 Recuperación y descanso</option>
              <option value="suplementos">💊 Suplementación</option>
            </select>
          </div>
          {/* Topic */}
          <div>
            <label className="text-xs text-muted block mb-1">Tema específico (opcional)</label>
            <input type="text" value={aiTopic} onChange={e => setAiTopic(e.target.value)}
              placeholder="ej: sentadilla, proteína, sueño..."
              className="w-full p-2.5 rounded-lg bg-card-bg border border-card-border text-sm focus:border-primary outline-none" />
          </div>
          {/* Format (single) or Num slides (carousel) */}
          {aiMode === "single" ? (
            <div>
              <label className="text-xs text-muted block mb-1">Formato</label>
              <div className="flex gap-2">
                {(["square", "story"] as const).map(f => (
                  <button key={f} onClick={() => setAiFormat(f)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-all ${aiFormat === f ? "border-primary bg-primary/10 text-primary" : "border-card-border text-muted"}`}>
                    {f === "square" ? "Feed 1:1" : "Story 9:16"}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs text-muted block mb-1">Cantidad de slides</label>
              <div className="flex gap-2">
                {[3, 5, 7].map(n => (
                  <button key={n} onClick={() => setCarouselNumSlides(n)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${carouselNumSlides === n ? "border-primary bg-primary/10 text-primary" : "border-card-border text-muted"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {aiMode === "single" ? (
          <>
            <button onClick={generateWithAI} disabled={aiGenerating}
              className="gradient-primary text-black font-bold py-2.5 px-6 rounded-xl text-sm disabled:opacity-50 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {aiGenerating ? "Generando..." : "Generar post"}
            </button>
            {aiError && <p className="mt-2 text-xs text-red-400">{aiError}</p>}
            <p className="mt-2 text-[11px] text-muted">Carga el template automáticamente. Editá antes de descargar.</p>
          </>
        ) : (
          <>
            <button onClick={generateCarousel} disabled={carouselGenerating}
              className="gradient-primary text-black font-bold py-2.5 px-6 rounded-xl text-sm disabled:opacity-50 inline-flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {carouselGenerating ? "Generando carrusel..." : `Generar carrusel (${carouselNumSlides} slides)`}
            </button>
            {carouselError && <p className="mt-2 text-xs text-red-400">{carouselError}</p>}
            <p className="mt-2 text-[11px] text-muted">Genera {carouselNumSlides} imágenes 1:1 listas para subir como carrusel de Instagram.</p>
          </>
        )}
      </div>

      {/* ── CAROUSEL PREVIEW ─────────────────────── */}
      {carouselSlides.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-sm">Carrusel — {carouselSlides.length} slides</h2>
            <button onClick={downloadAllSlides}
              className="gradient-primary text-black font-bold py-2 px-4 rounded-xl text-sm inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Descargar todos
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {carouselSlides.map((slide, i) => (
              <div key={i} className="shrink-0 w-48">
                <div className="rounded-xl overflow-hidden bg-black border border-card-border mb-2">
                  <canvas
                    ref={el => { carouselRefs.current[i] = el; }}
                    className="w-full h-auto block"
                  />
                </div>
                <p className="text-[10px] text-muted text-center mb-1 truncate px-1">{slide.headline}</p>
                <button
                  onClick={() => {
                    const canvas = carouselRefs.current[i];
                    if (!canvas) return;
                    canvas.toBlob(blob => {
                      if (!blob) return;
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `slide-${i + 1}.png`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }, "image/png");
                  }}
                  className="w-full py-1.5 rounded-lg border border-card-border text-[11px] font-semibold hover:bg-card-bg flex items-center justify-center gap-1"
                >
                  <Download className="h-3 w-3" /> Slide {i + 1}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
        {TEMPLATES.map(t => (
          <button
            key={t.id}
            onClick={() => setTemplateId(t.id)}
            className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${
              templateId === t.id
                ? "border-primary bg-primary/10"
                : "border-card-border hover:border-primary/30"
            }`}
          >
            <p>{t.name}</p>
            <p className="text-[10px] text-muted mt-1 uppercase">{t.format === "story" ? "9:16 story" : "1:1 feed"}</p>
          </button>
        ))}
      </div>

      {/* Mass announcement section */}
      <div className="mb-8 p-4 rounded-2xl border border-primary/30 bg-primary/5">
        <h2 className="font-bold text-sm mb-1 flex items-center gap-2">
          <Send className="h-4 w-4 text-primary" /> Email masivo — Nuevas funciones
        </h2>
        <p className="text-xs text-muted mb-3">
          Anuncia a todos los clientes activos las nuevas features: compartir PR, analizar técnica con IA, retos del mes, feed de logros y más.
        </p>
        <button
          onClick={sendFeatureAnnouncement}
          disabled={sending}
          className="gradient-primary text-black font-bold py-2.5 px-5 rounded-xl text-sm disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {sending ? "Enviando..." : "Enviar a todos los clientes"}
        </button>
        {sendResult && (
          <p className={`mt-3 text-sm flex items-center gap-2 ${sendResult.ok ? "text-primary" : "text-red-400"}`}>
            {sendResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {sendResult.msg}
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Fields */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Textos editables</h3>
          <div className="space-y-3">
            {template.fields.map(f => (
              <div key={f.key}>
                <label className="text-xs text-muted block mb-1">{f.label}</label>
                <input
                  type="text"
                  value={fields[f.key] || ""}
                  onChange={e => setFields({ ...fields, [f.key]: e.target.value })}
                  className="w-full p-2.5 rounded-lg bg-card-bg border border-card-border focus:border-primary outline-none text-sm"
                />
              </div>
            ))}
            <button
              onClick={() => setFields(initFields(templateId))}
              className="text-xs text-muted hover:text-primary flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Resetear al texto original
            </button>
          </div>

          <button
            onClick={download}
            className="w-full gradient-primary text-black font-bold py-4 rounded-xl mt-6 inline-flex items-center justify-center gap-2 hover:opacity-90"
          >
            <Download className="h-5 w-5" /> Descargar PNG
          </button>

          <div className="mt-4 p-3 rounded-lg bg-card-bg border border-card-border text-xs text-muted">
            <p className="flex items-center gap-1 mb-1 text-foreground font-semibold">
              <InstagramIcon className="h-3 w-3" /> Tip
            </p>
            <p>Descargá el PNG, subilo a Instagram como {template.format === "story" ? "Story" : "post del feed"}. El tamaño ya está optimizado.</p>
          </div>
        </div>

        {/* Preview */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Vista previa</h3>
          <div className={`rounded-xl overflow-hidden bg-black border border-card-border ${template.format === "story" ? "max-w-[280px]" : "max-w-[400px]"} mx-auto`}>
            <canvas
              ref={canvasRef}
              className="w-full h-auto block"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
