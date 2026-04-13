"use client";

import { useState } from "react";

interface MuscleHeatmapProps {
  trainedMuscles: Record<string, number>;
}

const MUSCLE_LABELS: Record<string, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Biceps",
  triceps: "Triceps",
  piernas: "Piernas",
  abdomen: "Abdomen",
};

function getMuscleColor(count: number): string {
  if (count === 0) return "#27272a";
  if (count === 1) return "#059669";
  return "#10b981";
}

function getMuscleGlow(count: number): string {
  if (count === 0) return "none";
  if (count === 1) return "drop-shadow(0 0 4px rgba(5,150,105,0.4))";
  return "drop-shadow(0 0 8px rgba(16,185,129,0.6))";
}

export default function MuscleHeatmap({ trainedMuscles }: MuscleHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ muscle: string; count: number } | null>(null);

  const totalTrained = Object.values(trainedMuscles).filter(v => v > 0).length;
  const totalMuscles = Object.keys(MUSCLE_LABELS).length;

  return (
    <div className="card-premium rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Musculos esta semana</h3>
        <span className="text-xs text-primary font-bold">{totalTrained}/{totalMuscles}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* SVG Body */}
        <div className="relative w-28 shrink-0">
          <svg viewBox="0 0 120 200" className="w-full">
            {/* Head */}
            <circle cx="60" cy="20" r="12" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />

            {/* Neck */}
            <rect x="55" y="32" width="10" height="8" fill="#27272a" rx="2" />

            {/* Shoulders */}
            <ellipse cx="35" cy="48" rx="14" ry="8"
              fill={getMuscleColor(trainedMuscles.hombros || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.hombros || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "hombros", count: trainedMuscles.hombros || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />
            <ellipse cx="85" cy="48" rx="14" ry="8"
              fill={getMuscleColor(trainedMuscles.hombros || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.hombros || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "hombros", count: trainedMuscles.hombros || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Chest */}
            <path d="M38 48 L82 48 L78 72 L42 72 Z"
              fill={getMuscleColor(trainedMuscles.pecho || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.pecho || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "pecho", count: trainedMuscles.pecho || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Biceps */}
            <ellipse cx="24" cy="72" rx="7" ry="16"
              fill={getMuscleColor(trainedMuscles.biceps || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.biceps || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "biceps", count: trainedMuscles.biceps || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />
            <ellipse cx="96" cy="72" rx="7" ry="16"
              fill={getMuscleColor(trainedMuscles.biceps || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.biceps || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "biceps", count: trainedMuscles.biceps || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Triceps (behind biceps, slightly offset) */}
            <ellipse cx="20" cy="72" rx="5" ry="14"
              fill={getMuscleColor(trainedMuscles.triceps || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.triceps || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "triceps", count: trainedMuscles.triceps || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />
            <ellipse cx="100" cy="72" rx="5" ry="14"
              fill={getMuscleColor(trainedMuscles.triceps || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.triceps || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "triceps", count: trainedMuscles.triceps || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Abs */}
            <rect x="44" y="74" width="32" height="28" rx="4"
              fill={getMuscleColor(trainedMuscles.abdomen || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.abdomen || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "abdomen", count: trainedMuscles.abdomen || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Back (shown as outline behind torso) */}
            <rect x="42" y="48" width="36" height="24" rx="2"
              fill="none" stroke={getMuscleColor(trainedMuscles.espalda || 0)} strokeWidth="2" strokeDasharray="3 2"
              style={{ filter: getMuscleGlow(trainedMuscles.espalda || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "espalda", count: trainedMuscles.espalda || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Legs */}
            <ellipse cx="47" cy="130" rx="10" ry="28"
              fill={getMuscleColor(trainedMuscles.piernas || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.piernas || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "piernas", count: trainedMuscles.piernas || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />
            <ellipse cx="73" cy="130" rx="10" ry="28"
              fill={getMuscleColor(trainedMuscles.piernas || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.piernas || 0) }}
              className="cursor-pointer transition-all duration-300"
              onPointerEnter={() => setTooltip({ muscle: "piernas", count: trainedMuscles.piernas || 0 })}
              onPointerLeave={() => setTooltip(null)}
            />

            {/* Lower legs */}
            <ellipse cx="45" cy="172" rx="7" ry="20"
              fill={getMuscleColor(trainedMuscles.piernas || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.piernas || 0) }}
              className="transition-all duration-300"
            />
            <ellipse cx="75" cy="172" rx="7" ry="20"
              fill={getMuscleColor(trainedMuscles.piernas || 0)}
              style={{ filter: getMuscleGlow(trainedMuscles.piernas || 0) }}
              className="transition-all duration-300"
            />

            {/* Forearms */}
            <ellipse cx="18" cy="95" rx="4" ry="12" fill="#27272a" />
            <ellipse cx="102" cy="95" rx="4" ry="12" fill="#27272a" />
          </svg>
        </div>

        {/* Muscle list */}
        <div className="flex-1 space-y-1.5">
          {Object.entries(MUSCLE_LABELS).map(([key, label]) => {
            const count = trainedMuscles[key] || 0;
            return (
              <div key={key} className="flex items-center gap-2"
                onPointerEnter={() => setTooltip({ muscle: key, count })}
                onPointerLeave={() => setTooltip(null)}
              >
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getMuscleColor(count) }} />
                <span className={`text-xs flex-1 ${count > 0 ? "text-foreground" : "text-muted"}`}>{label}</span>
                <span className={`text-xs font-bold ${count > 0 ? "text-primary" : "text-muted/50"}`}>
                  {count > 0 ? `${count}x` : "-"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-3 text-center">
          <p className="text-xs text-muted">
            <span className="font-bold text-foreground">{MUSCLE_LABELS[tooltip.muscle]}</span>
            {": "}
            {tooltip.count > 0
              ? `${tooltip.count} ${tooltip.count === 1 ? "ejercicio" : "ejercicios"} esta semana`
              : "Sin entrenar esta semana"}
          </p>
        </div>
      )}
    </div>
  );
}
