"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, Share2, Crown } from "lucide-react";
import { InstagramIcon } from "@/components/icons";

interface Props {
  open: boolean;
  onClose: () => void;
  userName: string;
  rank: number;
  totalUsers: number;
  level: number;
  levelName: string;
  xp: number;
  streak: number;
  weekXp?: number;
}

export function RankingShareModal({
  open, onClose, userName, rank, totalUsers, level, levelName, xp, streak, weekXp,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    setRendered(false);
    const canvas = canvasRef.current;
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, 1920);
    bg.addColorStop(0, "#0a0a0a");
    bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1080, 1920);

    // Radial green glow
    const glow = ctx.createRadialGradient(540, 800, 100, 540, 800, 900);
    glow.addColorStop(0, "rgba(205, 255, 0, 0.18)");
    glow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 1080, 1920);

    // Top accent
    ctx.fillStyle = "#CDFF00";
    ctx.fillRect(80, 180, 120, 6);
    ctx.fillStyle = "#CDFF00";
    ctx.font = "bold 36px system-ui, sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("MI RANKING SEMANAL", 80, 220);

    // Level name
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 100px system-ui, sans-serif";
    ctx.fillText(levelName.toUpperCase(), 80, 310);

    ctx.fillStyle = "#888";
    ctx.font = "500 40px system-ui, sans-serif";
    ctx.fillText(`Nivel ${level}`, 80, 440);

    // Rank big number
    ctx.textAlign = "center";
    ctx.fillStyle = "#CDFF00";
    ctx.font = "900 380px system-ui, sans-serif";
    ctx.fillText(`#${rank}`, 540, 620);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px system-ui, sans-serif";
    ctx.fillText(`de ${totalUsers}`, 540, 1030);

    // Stats row
    ctx.textAlign = "left";
    const statY = 1220;
    const colW = 1080 / 3;

    drawStat(ctx, colW * 0.5, statY, "🔥", `${streak}`, streak === 1 ? "DIA RACHA" : "DIAS RACHA");
    drawStat(ctx, colW * 1.5, statY, "⚡", `${xp}`, "XP TOTAL");
    drawStat(ctx, colW * 2.5, statY, "📊", `${weekXp || 0}`, "XP ESTA SEMANA");

    // Footer
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 52px system-ui, sans-serif";
    ctx.fillText(userName.toUpperCase(), 80, 1660);
    ctx.fillStyle = "#888";
    ctx.font = "500 32px system-ui, sans-serif";
    ctx.fillText(new Date().toLocaleDateString("es", { day: "numeric", month: "long" }), 80, 1730);

    ctx.textAlign = "right";
    ctx.fillStyle = "#CDFF00";
    ctx.font = "900 38px system-ui, sans-serif";
    ctx.fillText("PABLO SCARLATTO", 1000, 1660);
    ctx.fillStyle = "#888";
    ctx.font = "500 28px system-ui, sans-serif";
    ctx.fillText("@pabloscarlattoentrenamientos", 1000, 1710);

    setRendered(true);
  }, [open, userName, rank, totalUsers, level, levelName, xp, streak, weekXp]);

  if (!open) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ranking-${userName}-puesto-${rank}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "ranking.png", { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (d: { files?: File[] }) => boolean };
      if (nav.canShare && nav.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Puesto #${rank} — Pablo Scarlatto Entrenamientos`,
            text: `Mi ranking esta semana`,
          });
        } catch (err: unknown) {
          const name = (err as { name?: string })?.name;
          if (name !== "AbortError") handleDownload();
        }
      } else {
        handleDownload();
      }
    }, "image/png");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-card-border rounded-2xl max-w-sm w-full overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <p className="font-bold text-sm">Compartir mi ranking</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-4">
          <div className="aspect-[9/16] rounded-xl overflow-hidden bg-black mb-4">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
          {!rendered && <p className="text-xs text-muted text-center mb-2">Generando...</p>}
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
              disabled={!rendered}
              className="flex-[2] py-3 rounded-xl gradient-primary text-black text-sm font-bold disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              <Share2 className="h-4 w-4" /> Compartir
            </button>
          </div>
          <p className="text-[10px] text-muted text-center mt-3 flex items-center justify-center gap-1">
            <InstagramIcon className="h-3 w-3" /> Para Instagram Stories
          </p>
        </div>
      </div>
    </div>
  );
}

function drawStat(ctx: CanvasRenderingContext2D, cx: number, cy: number, emoji: string, value: string, label: string) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "60px system-ui, sans-serif";
  ctx.fillText(emoji, cx, cy);
  ctx.fillStyle = "#CDFF00";
  ctx.font = "900 72px system-ui, sans-serif";
  ctx.fillText(value, cx, cy + 110);
  ctx.fillStyle = "#888";
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText(label, cx, cy + 170);
  ctx.restore();
}
