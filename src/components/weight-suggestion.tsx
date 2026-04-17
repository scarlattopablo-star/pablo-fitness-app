"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Suggestion {
  suggestedWeight: number;
  direction: "increase" | "hold" | "deload";
  delta: number;
  confidence: "low" | "medium" | "high";
  reason: string;
}

interface Props {
  exerciseId: string;
  targetReps?: number;
  compound?: boolean;
  compact?: boolean;
}

export function WeightSuggestion({ exerciseId, targetReps = 8, compound = false, compact = false }: Props) {
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const res = await fetch(
          `/api/suggest-weight?exerciseId=${exerciseId}&targetReps=${targetReps}&compound=${compound}`,
          { headers: { Authorization: `Bearer ${session.access_token}` } }
        );
        const data = await res.json();
        setSuggestion(data.suggestion || null);
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [exerciseId, targetReps, compound]);

  if (loading) {
    return (
      <div className="inline-flex items-center gap-1 text-[10px] text-muted">
        <Loader2 className="h-3 w-3 animate-spin" /> Calculando...
      </div>
    );
  }

  if (!suggestion) {
    return compact ? null : (
      <p className="text-[10px] text-muted">Sin datos previos para sugerir peso</p>
    );
  }

  const Icon = suggestion.direction === "increase" ? TrendingUp : suggestion.direction === "deload" ? TrendingDown : Minus;
  const color =
    suggestion.direction === "increase"
      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : suggestion.direction === "deload"
        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
        : "text-muted bg-card-bg border-card-border";

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold border rounded-md px-1.5 py-0.5 ${color}`}>
        <Icon className="h-3 w-3" />
        {suggestion.suggestedWeight}kg
        {suggestion.delta !== 0 && <span className="opacity-70">({suggestion.delta > 0 ? "+" : ""}{suggestion.delta})</span>}
      </span>
    );
  }

  return (
    <div className={`border rounded-lg p-2.5 ${color}`}>
      <div className="flex items-center gap-2 mb-0.5">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-xs font-bold">
          Proximo set: {suggestion.suggestedWeight}kg
          {suggestion.delta !== 0 && (
            <span className="opacity-70 ml-1">
              ({suggestion.delta > 0 ? "+" : ""}{suggestion.delta}kg)
            </span>
          )}
        </p>
      </div>
      <p className="text-[10px] opacity-80 leading-tight">{suggestion.reason}</p>
    </div>
  );
}
