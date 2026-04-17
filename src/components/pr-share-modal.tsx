"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2, Trophy } from "lucide-react";
import { InstagramIcon } from "@/components/icons";

interface Props {
  open: boolean;
  onClose: () => void;
  exerciseName: string;
  weight: number;
  reps?: number;
  userName: string;
  previousMax?: number | null;
  avatarUrl?: string | null;
}

// Render a 1080x1920 IG-story-ready PR card into a canvas, then let user
// download / native-share. No external deps.
export function PRShareModal({
  open,
  onClose,
  exerciseName,
  weight,
  reps,
  userName,
  previousMax,
  avatarUrl,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;

    // Reset state every time deps change so modal is re-usable
    setRendered(false);
    setSharing(false);

    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ---- Background: dark gradient with subtle radial glow ----
    const bg = ctx.createLinearGradient(0, 0, 0, 1920);
    bg.addColorStop(0, "#0a0a0a");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // Radial glow — amber for PR
    const glow = ctx.createRadialGradient(540, 900, 100, 540, 900, 900);
    glow.addColorStop(0, "rgba(251, 191, 36, 0.22)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);

    // ---- Top accent line + "PR" eyebrow ----
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(80, 180, 120, 6);

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("NUEVO RECORD PERSONAL", 80, 220);

    // ---- Big exercise name ----
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 84px system-ui, sans-serif";
    wrapText(ctx, exerciseName.toUpperCase(), 80, 320, 920, 92);

    // ---- BIG NUMBER — weight ----
    ctx.fillStyle = "#fbbf24";
    ctx.font = "900 400px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${weight}`, 540, 650);

    // kg label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 72px system-ui, sans-serif";
    ctx.fillText("KG", 540, 1080);

    // reps
    if (reps) {
      ctx.fillStyle = "#888";
      ctx.font = "500 44px system-ui, sans-serif";
      ctx.fillText(`x ${reps} reps`, 540, 1170);
    }

    // ---- Previous max comparison ----
    if (previousMax && previousMax > 0) {
      const diff = weight - previousMax;
      ctx.fillStyle = "#CDFF00";
      ctx.font = "bold 52px system-ui, sans-serif";
      ctx.fillText(`+${diff.toFixed(1)}kg vs anterior (${previousMax}kg)`, 540, 1260);
    }

    // ---- Footer: user name + brand ----
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.fillText(userName.toUpperCase(), 80, 1660);

    ctx.fillStyle = "#888";
    ctx.font = "500 32px system-ui, sans-serif";
    ctx.fillText(new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }), 80, 1730);

    // brand right side
    ctx.textAlign = "right";
    ctx.fillStyle = "#CDFF00";
    ctx.font = "900 38px system-ui, sans-serif";
    ctx.fillText("PABLO SCARLATTO", 1000, 1660);
    ctx.fillStyle = "#888";
    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillText("@pabloscarlattoentrenamientos", 1000, 1710);

    // ---- Trophy icon (simple rendered) ----
    drawTrophy(ctx, 540, 1420, 80);

    // ---- Avatar (if provided) ----
    if (avatarUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(1000, 250, 50, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, 950, 200, 100, 100);
        ctx.restore();
        setRendered(true);
      };
      img.onerror = () => setRendered(true);
      img.src = avatarUrl;
    } else {
      setRendered(true);
    }
  }, [open, exerciseName, weight, reps, userName, previousMax, avatarUrl]);

  if (!open) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PR-${exerciseName.replace(/\s+/g, "-")}-${weight}kg.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setSharing(true);

    // Safety timeout — if toBlob never fires or share hangs, re-enable button
    const safety = setTimeout(() => setSharing(false), 15000);

    canvasRef.current.toBlob(async (blob) => {
      try {
        if (!blob) return;
        const file = new File([blob], `PR-${exerciseName}.png`, { type: "image/png" });
        const nav = navigator as Navigator & { canShare?: (data: { files?: File[] }) => boolean };
        if (nav.canShare && nav.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `Nuevo PR: ${exerciseName} ${weight}kg`,
              text: `Nuevo record personal con Pablo Scarlatto Entrenamientos`,
            });
          } catch (err: unknown) {
            // User cancelled or permission denied — fallback to download
            const name = (err as { name?: string })?.name;
            if (name !== "AbortError") handleDownload();
          }
        } else {
          handleDownload();
        }
      } finally {
        clearTimeout(safety);
        setSharing(false);
      }
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-card-border rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-400" />
            <p className="font-bold text-sm">Compartir tu PR</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black mb-4">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ imageRendering: "auto" }}
            />
          </div>
          {!rendered && <p className="text-xs text-muted text-center mb-2">Generando imagen...</p>}

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={!rendered}
              className="flex-1 py-3 rounded-xl border border-card-border text-sm font-semibold hover:bg-card-bg disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" /> Descargar
            </button>
            <button
              onClick={handleShare}
              disabled={!rendered || sharing}
              className="flex-[2] py-3 rounded-xl gradient-primary text-black text-sm font-bold disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" /> Compartir
            </button>
          </div>

          <p className="text-[10px] text-muted text-center mt-3 flex items-center justify-center gap-1">
            <InstagramIcon className="h-3 w-3" /> Ideal para Instagram Stories
          </p>
        </div>
      </div>
    </div>
  );
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" ");
  let line = "";
  let offsetY = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, y + offsetY);
      line = word;
      offsetY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x, y + offsetY);
}

function drawTrophy(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.fillStyle = "#fbbf24";
  // Cup
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.5, cy - size * 0.5);
  ctx.lineTo(cx + size * 0.5, cy - size * 0.5);
  ctx.lineTo(cx + size * 0.35, cy + size * 0.2);
  ctx.lineTo(cx - size * 0.35, cy + size * 0.2);
  ctx.closePath();
  ctx.fill();
  // Base
  ctx.fillRect(cx - size * 0.3, cy + size * 0.2, size * 0.6, size * 0.15);
  ctx.fillRect(cx - size * 0.5, cy + size * 0.35, size, size * 0.1);
  ctx.restore();
}
