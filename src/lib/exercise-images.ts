// Exercise image mappings
// Sources: wger.de (AGPL) + free-exercise-db (public domain)
// Images stored locally in /public/exercises/

export interface ExerciseImageSet {
  img1: string;
  img2?: string;
}

const img = (name: string): string => `/exercises/${name}`;

export const EXERCISE_IMAGES: Record<string, ExerciseImageSet> = {
  // PECHO
  'press-banca-plano': { img1: img('press-banca-1.png'), img2: img('press-banca-2.png') },
  'press-inclinado': { img1: img('press-inclinado-1.png'), img2: img('press-inclinado-2.png') },
  'press-declinado': { img1: img('press-declinado-1.png'), img2: img('press-declinado-2.png') },
  'aperturas-inclinadas': { img1: img('aperturas-1.png'), img2: img('aperturas-2.png') },
  'cruces-polea': { img1: img('cruces-polea-1.png'), img2: img('cruces-polea-2.png') },
  'flexiones': { img1: img('flexiones-1.png') },
  'flexiones-diamante': { img1: img('flexiones-diamante-1.jpg') },
  'flexiones-declinadas': { img1: img('flexiones-declinadas-1.png') },
  'flexiones-abiertas': { img1: img('flexiones-abiertas-1.jpg') },
  'dips-silla': { img1: img('fondos-triceps-1.png'), img2: img('fondos-triceps-2.png') },

  // ESPALDA
  'jalon-polea-alta': { img1: img('jalon-polea-1.jpg'), img2: img('jalon-polea-2.jpg') },
  'remo-con-barra': { img1: img('remo-barra-1.png'), img2: img('remo-barra-2.png') },
  'remo-mancuerna': { img1: img('remo-mancuerna-1.png') },
  'dominadas': { img1: img('dominadas-1.png'), img2: img('dominadas-2.png') },
  'pullover': { img1: img('pullover-1.jpg'), img2: img('pullover-2.jpg') },
  'remo-polea-baja': { img1: img('remo-polea-1.png'), img2: img('remo-polea-2.png') },
  'remo-invertido': { img1: img('remo-invertido-1.jpg') },
  'superman': { img1: img('superman-1.png'), img2: img('superman-2.png') },
  'superman-alterno': { img1: img('superman-1.png'), img2: img('superman-2.png') },
  'remo-toalla': { img1: img('remo-invertido-1.jpg') },

  // HOMBROS
  'press-hombros': { img1: img('press-hombros-1.png'), img2: img('press-hombros-2.png') },
  'press-arnold': { img1: img('press-hombros-1.png'), img2: img('press-hombros-2.png') },
  'elevaciones-laterales': { img1: img('elevaciones-laterales-1.png'), img2: img('elevaciones-laterales-2.png') },
  'face-pull': { img1: img('face-pull-1.jpg') },
  'elevaciones-frontales': { img1: img('elevaciones-frontales-1.png') },
  'pike-push-up': { img1: img('handstand-1.jpg') },
  'handstand-wall': { img1: img('handstand-1.jpg') },
  'plancha-lateral-con-elevacion': { img1: img('plancha-lateral-1.jpg') },

  // BICEPS
  'curl-biceps-barra': { img1: img('curl-biceps-1.png'), img2: img('curl-biceps-2.png') },
  'curl-martillo': { img1: img('curl-martillo-1.png'), img2: img('curl-martillo-2.png') },
  'curl-concentrado': { img1: img('curl-concentrado-1.jpg') },
  'curl-scott': { img1: img('curl-scott-1.png') },
  'chin-up': { img1: img('dominadas-1.png'), img2: img('dominadas-2.png') },
  'curl-mochila': { img1: img('curl-biceps-1.png') },

  // TRICEPS
  'extension-triceps-polea': { img1: img('triceps-polea-1.png'), img2: img('triceps-polea-2.png') },
  'fondos-triceps': { img1: img('fondos-triceps-1.png'), img2: img('fondos-triceps-2.png') },
  'fondos-triceps-suelo': { img1: img('fondos-triceps-1.png'), img2: img('fondos-triceps-2.png') },
  'press-frances': { img1: img('press-frances-1.png'), img2: img('press-frances-2.png') },
  'kickback-triceps': { img1: img('kickback-1.jpg'), img2: img('kickback-2.jpg') },
  'flexiones-triceps': { img1: img('flexiones-diamante-1.jpg') },

  // PIERNAS
  'sentadilla': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'sentadilla-cuerpo': { img1: img('sentadilla-cuerpo-1.jpg') },
  'sentadilla-sumo': { img1: img('sentadilla-1.png'), img2: img('sentadilla-2.png') },
  'peso-muerto': { img1: img('peso-muerto-1.png'), img2: img('peso-muerto-2.png') },
  'prensa-piernas': { img1: img('prensa-piernas-1.jpg'), img2: img('prensa-piernas-2.jpg') },
  'zancadas': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'zancadas-atras': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'zancadas-laterales': { img1: img('zancadas-laterales-1.png') },
  'sentadilla-bulgara': { img1: img('zancadas-1.png'), img2: img('zancadas-2.png') },
  'hip-thrust': { img1: img('hip-thrust-1.jpg'), img2: img('hip-thrust-2.jpg') },
  'extension-cuadriceps': { img1: img('extension-cuadriceps-1.png') },
  'curl-femoral': { img1: img('curl-femoral-1.png'), img2: img('curl-femoral-2.png') },
  'step-up': { img1: img('step-up-1.jpg'), img2: img('step-up-2.jpg') },
  'puente-gluteo': { img1: img('puente-gluteo-1.jpg'), img2: img('puente-gluteo-2.jpg') },
  'puente-gluteo-unilateral': { img1: img('puente-gluteo-unilateral-1.jpg') },
  'pistol-squat': { img1: img('pistol-squat-1.jpg') },
  'wall-sit': { img1: img('sentadilla-cuerpo-1.jpg') },
  'elevacion-pantorrillas': { img1: img('elevacion-pantorrillas-1.jpg') },

  // ABDOMEN
  'plancha': { img1: img('plancha-1.png') },
  'plancha-lateral': { img1: img('plancha-lateral-1.jpg') },
  'crunch-polea': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'crunch-suelo': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'crunch-bicicleta': { img1: img('crunch-1.png'), img2: img('crunch-2.png') },
  'mountain-climbers': { img1: img('mountain-climbers-1.jpg') },
  'dead-bug': { img1: img('dead-bug-1.jpg') },
  'hollow-hold': { img1: img('plancha-1.png') },
  'russian-twist': { img1: img('russian-twist-1.png') },
  'v-up': { img1: img('v-up-1.jpg') },
  'elevacion-piernas': { img1: img('elevacion-piernas-1.png'), img2: img('elevacion-piernas-2.png') },

  // CARDIO
  'hiit-cinta': { img1: img('hiit-cinta-1.jpg') },
  'saltar-cuerda': { img1: img('saltar-cuerda-1.jpg') },
  'burpees': { img1: img('mountain-climbers-1.jpg') },
  'jumping-jacks': { img1: img('saltar-cuerda-1.jpg') },
  'high-knees': { img1: img('hiit-cinta-1.jpg') },
  'hiit-casa': { img1: img('mountain-climbers-1.jpg') },
};

export function getExerciseImage(exerciseId: string): ExerciseImageSet | undefined {
  return EXERCISE_IMAGES[exerciseId];
}
