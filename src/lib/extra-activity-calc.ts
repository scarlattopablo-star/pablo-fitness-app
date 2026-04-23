// Catalogo de actividades extras (fuera del plan) + calculo de kcal aproximado
// via formula MET: kcal = MET * peso(kg) * horas.
// Opcion 2 confirmada: estos registros NO modifican target_calories — solo suman XP y quedan en historial.

export type ActivityIntensity = "baja" | "media" | "alta";

export interface ActivityPreset {
  id: string;                 // activity_type de la DB
  label: string;              // visible al usuario
  emoji: string;
  met: number;                // MET base a intensidad "media"
  defaultMinutes: number;     // sugerencia inicial del slider
}

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  { id: "correr",    label: "Correr",      emoji: "🏃", met: 8,   defaultMinutes: 30 },
  { id: "futbol",    label: "Futbol",      emoji: "⚽", met: 8,   defaultMinutes: 60 },
  { id: "ciclismo",  label: "Ciclismo",    emoji: "🚴", met: 6,   defaultMinutes: 45 },
  { id: "kitesurf",  label: "Kitesurf",    emoji: "🪁", met: 7,   defaultMinutes: 60 },
  { id: "caminata",  label: "Caminata",    emoji: "🚶", met: 3.5, defaultMinutes: 40 },
  { id: "hiit",      label: "HIIT",        emoji: "🔥", met: 10,  defaultMinutes: 20 },
  { id: "funcional", label: "Funcional",   emoji: "💪", met: 6,   defaultMinutes: 45 },
  { id: "otro",      label: "Otro",        emoji: "✨", met: 5,   defaultMinutes: 30 },
];

// Ajuste de MET por intensidad (baja=-20%, alta=+20%).
const INTENSITY_MULT: Record<ActivityIntensity, number> = {
  baja: 0.8,
  media: 1.0,
  alta: 1.2,
};

export function getActivityById(id: string): ActivityPreset {
  return ACTIVITY_PRESETS.find((a) => a.id === id) ?? ACTIVITY_PRESETS[0];
}

/** kcal quemadas estimadas. Si no hay peso usa 70kg como fallback razonable. */
export function estimateKcal(params: {
  activityId: string;
  durationMin: number;
  intensity: ActivityIntensity;
  weightKg?: number | null;
}): number {
  const a = getActivityById(params.activityId);
  const metAdj = a.met * INTENSITY_MULT[params.intensity];
  const weight = params.weightKg && params.weightKg > 0 ? params.weightKg : 70;
  const hours = Math.max(0, params.durationMin) / 60;
  return Math.round(metAdj * weight * hours);
}

export const INTENSITY_LABELS: Record<ActivityIntensity, string> = {
  baja: "Suave",
  media: "Moderada",
  alta: "Intensa",
};
