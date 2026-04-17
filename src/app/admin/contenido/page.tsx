"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Download, Sparkles, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons";

type Template = "ia-tecnica" | "pr-generic" | "cupos-limitados" | "reto-mes";

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
];

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

  const sendFeatureAnnouncement = async () => {
    if (!confirm("Esto enviará un email y notificación push a TODOS los clientes activos anunciando las nuevas funciones. ¿Confirmar?")) return;
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
        setSendResult({ ok: true, msg: `✓ Enviado a ${data.results?.email?.sent ?? 0} clientes` });
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
