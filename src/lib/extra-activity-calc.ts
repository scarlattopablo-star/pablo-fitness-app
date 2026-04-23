// Catalogo de actividades extras (fuera del plan) + calculo de kcal aproximado
// via formula MET: kcal/min = (MET × 3.5 × peso_kg) / 200  →  kcal = kcal/min × min.
// (Es la formula estandar derivada del VO2: 1 MET = 3.5 ml O2/kg/min → 5 kcal/L O2.)
//
// Valores MET tomados del "Compendium of Physical Activities" (Ainsworth et al. 2011,
// actualizacion publicada en Medicine & Science in Sports & Exercise), que es la
// fuente estandar usada por ACSM y por la mayoria de apps fitness.
// https://sites.google.com/site/compendiumofphysicalactivities/
//
// Opcion 2 confirmada: estos registros NO modifican target_calories — solo suman
// XP y quedan en historial para mostrar progreso.

export type ActivityIntensity = "baja" | "media" | "alta";

export interface ActivityPreset {
  id: string;
  label: string;
  emoji: string;
  met: number;                 // MET base a intensidad "media"
  defaultMinutes: number;
  supportsDistance?: boolean;  // si tiene sentido pedirle kilometraje al usuario
  compendiumCode?: string;     // codigo en el Compendium de Ainsworth (referencia)
}

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  // Correr a ~8 km/h (7.5 min/km) = 8.3 MET (Compendium 12150)
  { id: "correr",    label: "Correr",    emoji: "🏃", met: 8.3, defaultMinutes: 30, supportsDistance: true,  compendiumCode: "12150" },
  // Futbol casual = 7.0, competitivo = 10.0. Media = 8.0 (Compendium 15610)
  { id: "futbol",    label: "Futbol",    emoji: "⚽", met: 8.0, defaultMinutes: 60, compendiumCode: "15610" },
  // Ciclismo <19 km/h (recreativo) = 6.8 MET (Compendium 01015)
  { id: "ciclismo",  label: "Ciclismo",  emoji: "🚴", met: 6.8, defaultMinutes: 45, supportsDistance: true,  compendiumCode: "01015" },
  // Kitesurf/surf = 5.0 MET (Compendium 18350 surfing general)
  { id: "kitesurf",  label: "Kitesurf",  emoji: "🪁", met: 5.0, defaultMinutes: 60, compendiumCode: "18350" },
  // Caminata a ~5 km/h (paso firme) = 3.8 MET (Compendium 17200)
  { id: "caminata",  label: "Caminata",  emoji: "🚶", met: 3.8, defaultMinutes: 40, supportsDistance: true,  compendiumCode: "17200" },
  // HIIT vigoroso = 8.0 MET (Compendium 02068)
  { id: "hiit",      label: "HIIT",      emoji: "🔥", met: 8.0, defaultMinutes: 20, compendiumCode: "02068" },
  // Entrenamiento funcional/calistenia vigorosa = 6.0 MET (Compendium 02050)
  { id: "funcional", label: "Funcional", emoji: "💪", met: 6.0, defaultMinutes: 45, compendiumCode: "02050" },
  // Generica / otra actividad moderada = 5.0 MET
  { id: "otro",      label: "Otro",      emoji: "✨", met: 5.0, defaultMinutes: 30 },
];

// Ajuste por intensidad respecto del MET base (baja = ritmo suave, alta = al maximo).
// Pegamos con los rangos del Compendium: baja ≈ 0.75× MET, media = 1.0, alta ≈ 1.25×.
const INTENSITY_MULT: Record<ActivityIntensity, number> = {
  baja: 0.75,
  media: 1.0,
  alta: 1.25,
};

export function getActivityById(id: string): ActivityPreset {
  return ACTIVITY_PRESETS.find((a) => a.id === id) ?? ACTIVITY_PRESETS[0];
}

/**
 * Si hay kilometraje para actividades que lo soportan, ajustamos el MET con el pace real.
 * Formulas:
 *   - Correr: MET ≈ (velocidad_kmh × 1.035) (aprox lineal para 6-16 km/h, Pate & Kriska 1984)
 *   - Ciclismo: MET base 6.8 a <19 km/h, 8.0 a 19-22, 10.0 a >22.
 *   - Caminata: MET base 3.8 a 5 km/h, 4.5 a 6 km/h, 5.5 a 7 km/h.
 * Si no hay distancia, usamos el MET base del preset.
 */
function metAjustadoPorPace(preset: ActivityPreset, durationMin: number, distanceKm?: number | null): number {
  if (!distanceKm || distanceKm <= 0 || durationMin <= 0) return preset.met;
  const velKmh = distanceKm / (durationMin / 60);

  if (preset.id === "correr") {
    // Pate & Kriska linear aprox, rango razonable 5-18 km/h
    return Math.min(16, Math.max(5, velKmh * 1.035));
  }
  if (preset.id === "ciclismo") {
    if (velKmh < 16) return 4.0;
    if (velKmh < 19) return 6.8;
    if (velKmh < 22) return 8.0;
    if (velKmh < 25) return 10.0;
    return 12.0;
  }
  if (preset.id === "caminata") {
    if (velKmh < 3.2) return 2.8;
    if (velKmh < 4.8) return 3.5;
    if (velKmh < 5.6) return 3.8;
    if (velKmh < 6.4) return 4.5;
    return 5.5;
  }
  return preset.met;
}

/** kcal quemadas estimadas (fuente: Compendium of Physical Activities, Ainsworth 2011). */
export function estimateKcal(params: {
  activityId: string;
  durationMin: number;
  intensity: ActivityIntensity;
  weightKg?: number | null;
  distanceKm?: number | null;
}): number {
  const preset = getActivityById(params.activityId);
  const metBase = metAjustadoPorPace(preset, params.durationMin, params.distanceKm);
  const metFinal = metBase * INTENSITY_MULT[params.intensity];
  const weight = params.weightKg && params.weightKg > 0 ? params.weightKg : 70;
  // Formula VO2: kcal/min = (MET × 3.5 × peso) / 200
  const kcalPerMin = (metFinal * 3.5 * weight) / 200;
  return Math.round(kcalPerMin * Math.max(0, params.durationMin));
}

export const INTENSITY_LABELS: Record<ActivityIntensity, string> = {
  baja: "Suave",
  media: "Moderada",
  alta: "Intensa",
};

export function supportsDistance(activityId: string): boolean {
  return !!getActivityById(activityId).supportsDistance;
}
