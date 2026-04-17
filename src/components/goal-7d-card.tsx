"use client";

import { useEffect, useState } from "react";
import { Target, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  userId: string;
}

export function Goal7dCard({ userId }: Props) {
  const [goal, setGoal] = useState<string | null>(null);
  const [setAt, setSetAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("welcome_goal_7d, welcome_goal_set_at")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        setGoal(data?.welcome_goal_7d || null);
        setSetAt(data?.welcome_goal_set_at || null);
        setLoading(false);
      });
  }, [userId]);

  if (loading || !goal || !setAt) return null;

  const start = new Date(setAt).getTime();
  const now = Date.now();
  const elapsedDays = Math.floor((now - start) / 86400000);
  const remaining = Math.max(0, 7 - elapsedDays);
  const progress = Math.min(100, Math.round((elapsedDays / 7) * 100));
  const completed = elapsedDays >= 7;

  return (
    <div className="card-premium rounded-2xl p-4 mb-6 border border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
            {completed ? "Meta de 7 dias" : "Tu meta de 7 dias"}
          </h3>
        </div>
        {completed ? (
          <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Cumplida
          </span>
        ) : (
          <span className="text-[10px] text-muted">
            {remaining === 0 ? "Ultimo dia!" : `${remaining} ${remaining === 1 ? "dia" : "dias"} restantes`}
          </span>
        )}
      </div>

      <p className="text-sm font-semibold mb-3 leading-snug">{goal}</p>

      <div className="h-1.5 bg-card-border/50 rounded-full overflow-hidden">
        <div
          className="h-full gradient-primary rounded-full transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-muted">Dia {Math.min(elapsedDays + 1, 7)} de 7</span>
        <span className="text-[10px] font-bold text-primary">{progress}%</span>
      </div>
    </div>
  );
}
