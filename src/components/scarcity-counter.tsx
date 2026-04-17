"use client";

import { useEffect, useState } from "react";
import { Users, Zap } from "lucide-react";

interface Stats {
  monthlyCapacity: { cap: number; taken: number; remaining: number; percentFull: number };
  totalActive: number;
}

export function ScarcityCounter() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/public-stats")
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;
  const { cap, taken, remaining, percentFull } = stats.monthlyCapacity;

  // Color by urgency
  const urgent = remaining <= 5;
  const nearFull = percentFull >= 70;

  return (
    <div
      className={`rounded-2xl border p-4 mb-6 ${
        urgent
          ? "border-red-500/30 bg-red-500/5"
          : nearFull
            ? "border-amber-500/30 bg-amber-500/5"
            : "border-primary/20 bg-primary/5"
      }`}
    >
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              urgent ? "bg-red-500/20" : nearFull ? "bg-amber-500/20" : "bg-primary/15"
            }`}
          >
            <Zap className={`h-4 w-4 ${urgent ? "text-red-400" : nearFull ? "text-amber-400" : "text-primary"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate">
              {urgent ? "Ultimos cupos este mes" : nearFull ? "Cupos limitados este mes" : "Cupos disponibles este mes"}
            </p>
            <p className="text-[11px] text-muted">
              Pablo toma hasta {cap} clientes nuevos por mes para dar atencion personal
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className={`text-xl font-black ${urgent ? "text-red-400" : nearFull ? "text-amber-400" : "text-primary"}`}>
            {remaining}
            <span className="text-xs text-muted font-semibold">/{cap}</span>
          </p>
          <p className="text-[9px] text-muted uppercase tracking-wider">restantes</p>
        </div>
      </div>
      <div className="h-1.5 bg-card-border/50 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            urgent ? "bg-red-400" : nearFull ? "bg-amber-400" : "bg-primary"
          }`}
          style={{ width: `${Math.min(100, percentFull)}%` }}
        />
      </div>
      {stats.totalActive > 0 && (
        <p className="text-[10px] text-muted mt-2 flex items-center gap-1">
          <Users className="h-3 w-3" />
          {stats.totalActive}+ personas entrenando con Pablo actualmente
        </p>
      )}
    </div>
  );
}
