// Exercise image mappings - illustrations from wger.de (open source, AGPL license)
// Images stored locally in /public/exercises/ for unlimited usage
// Each exercise has 1-2 images showing concentric and eccentric phases

export interface ExerciseImageSet {
  img1: string; // concentric/start position
  img2?: string; // eccentric/end position
}

const img = (name: string): string => `/exercises/${name}`;

// Map exercise IDs to their illustration image paths
export const EXERCISE_IMAGES: Record<string, ExerciseImageSet> = {
  // PECHO
  'press-banca-plano': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },
  'press-inclinado': { img1: img('press-inclinado-1.png'), img2: img('press-inclinado-2.png') },
  'press-declinado': { img1: img('press-declinado-1.png'), img2: img('press-declinado-2.png') },
  'aperturas-inclinadas': { img1: img('aperturas-1.png'), img2: img('aperturas-2.png') },
  'cruces-polea': { img1: img('cruces-polea-1.png'), img2: img('cruces-polea-2.png') },
  'flexiones': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },
  'flexiones-diamante': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },
  'flexiones-declinadas': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },
  'flexiones-abiertas': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },
  'dips-silla': { img1: img('fondos-triceps-1.png'), img2: img('fondos-triceps-2.png') },

  // ESPALDA
  'jalon-polea-alta': { img1: img('dominadas-1.png'), img2: img('dominadas-2.png') },
  'remo-con-barra': { img1: img('remo-barra-1.png'), img2: img('remo-barra-2.png') },
  'remo-mancuerna': { img1: img('remo-barra-1.png'), img2: img('remo-barra-2.png') },
  'dominadas': { img1: img('dominadas-1.png'), img2: img('dominadas-2.png') },
  'pullover': { img1: img('press-banca-1.png') },
  'remo-polea-baja': { img1: img('remo-polea-1.png'), img2: img('remo-polea-2.png') },
  'remo-invertido': { img1: img('remo-barra-1.png'), img2: img('remo-barra-2.png') },
  'superman': { img1: img('superman-1.png'), img2: img('superman-2.png') },
  'superman-alterno': { img1: img('superman-1.png'), img2: img('superman-2.png') },
  'remo-toalla': { img1: img('remo-barra-1.png'), img2: img('remo-barra-2.png') },

  // HOMBROS
  'press-hombros': { img1: img('press-hombros-1.png'), img2: img('press-hombros-2.png') },
  'press-arnold': { img1: img('press-hombros-1.png'), img2: img('press-hombros-2.png') },
  'elevaciones-laterales': { img1: img('elevaciones-laterales-1.png'), img2: img('elevaciones-laterales-2.png') },
  'face-pull': { img1: img('remo-polea-1.png'), img2: img('remo-polea-2.png') },
  'elevaciones-frontales': { img1: img('elevaciones-laterales-1.png'), img2: img('elevaciones-laterales-2.png') },
  'pike-push-up': { img1: img('press-hombros-1.png'), img2: img('press-hombros-2.png') },
  'handstand-wall': { img1: img('press-hombros-1.png'), img2: img('press-hombros-2.png') },
  'plancha-lateral-con-elevacion': { img1: img('elevaciones-laterales-1.png') },

  // BICEPS
  'curl-biceps-barra': { img1: img('curl-biceps-1.png'), img2: img('curl-biceps-2.png') },
  'curl-martillo': { img1: img('curl-martillo-1.png'), img2: img('curl-martillo-2.png') },
  'curl-concentrado': { img1: img('curl-biceps-1.png'), img2: img('curl-biceps-2.png') },
  'curl-scott': { img1: img('curl-scott-1.png') },
  'chin-up': { img1: img('dominadas-1.png'), img2: img('dominadas-2.png') },
  'curl-mochila': { img1: img('curl-biceps-1.png'), img2: img('curl-biceps-2.png') },

  // TRICEPS
  'extension-triceps-polea': { img1: img('triceps-polea-1.png'), img2: img('triceps-polea-2.png') },
  'fondos-triceps': { img1: img('fondos-triceps-1.png'), img2: img('fondos-triceps-2.png') },
  'press-frances': { img1: img('press-frances-1.png'), img2: img('press-frances-2.png') },
  'kickback-triceps': { img1: img('triceps-polea-1.png'), img2: img('triceps-polea-2.png') },
  'fondos-triceps-suelo': { img1: img('fondos-triceps-1.png'), img2: img('fondos-triceps-2.png') },
  'flexiones-triceps': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },

  // PIERNAS
  'sentadilla': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'peso-muerto': { img1: img('peso-muerto-1.png'), img2: img('peso-muerto-2.png') },
  'prensa-piernas': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'zancadas': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'hip-thrust': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'sentadilla-bulgara': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'extension-cuadriceps': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'curl-femoral': { img1: img('curl-femoral-1.png'), img2: img('curl-femoral-2.png') },
  'sentadilla-cuerpo': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'sentadilla-sumo': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'step-up': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'puente-gluteo': { img1: img('superman-1.png'), img2: img('superman-2.png') },
  'puente-gluteo-unilateral': { img1: img('superman-1.png'), img2: img('superman-2.png') },
  'pistol-squat': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'wall-sit': { img1: img('sentadilla-1.png') },
  'zancadas-atras': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'zancadas-laterales': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'elevacion-pantorrillas': { img1: img('sentadilla-1.png') },

  // ABDOMEN
  'plancha': { img1: img('crunch-1.png') },
  'crunch-polea': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'mountain-climbers': { img1: img('crunch-1.png') },
  'crunch-bicicleta': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'dead-bug': { img1: img('elevacion-piernas-1.png'), img2: img('elevacion-piernas-2.png') },
  'hollow-hold': { img1: img('crunch-1.png') },
  'russian-twist': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'v-up': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'plancha-lateral': { img1: img('crunch-1.png') },
  'crunch-suelo': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'elevacion-piernas': { img1: img('elevacion-piernas-1.png'), img2: img('elevacion-piernas-2.png') },

  // CARDIO
  'hiit-cinta': { img1: img('zancadas-1.png') },
  'saltar-cuerda': { img1: img('sentadilla-1.png') },
  'burpees': { img1: img('crunch-1.png') },
  'jumping-jacks': { img1: img('sentadilla-1.png') },
  'high-knees': { img1: img('zancadas-1.png') },
  'hiit-casa': { img1: img('crunch-1.png') },
};

export function getExerciseImage(exerciseId: string): ExerciseImageSet | undefined {
  return EXERCISE_IMAGES[exerciseId];
}
