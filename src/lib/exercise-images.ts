// Exercise GIF mappings from ExerciseDB (animated muscle figures)
// Style: grey 3D muscular figure, target muscles highlighted, animated movement
// Downloaded locally to /public/exercises/gifs/ — no API dependency at runtime

export function getExerciseGif(exerciseId: string): string | undefined {
  return EXERCISE_GIFS[exerciseId];
}

const gif = (name: string): string => `/exercises/gifs/${name}.gif`;

const EXERCISE_GIFS: Record<string, string> = {
  // PECHO
  'press-banca-plano': gif('press-banca'),
  'press-inclinado': gif('press-inclinado'),
  'press-declinado': gif('press-declinado'),
  'aperturas-inclinadas': gif('aperturas'),
  'cruces-polea': gif('cruces-polea'),
  'flexiones': gif('flexiones'),
  'flexiones-diamante': gif('flexiones-diamante'),
  'flexiones-declinadas': gif('flexiones-declinadas'),
  'flexiones-abiertas': gif('flexiones'),
  'dips-silla': gif('fondos-triceps'),

  // ESPALDA
  'jalon-polea-alta': gif('jalon-polea'),
  'remo-con-barra': gif('remo-barra'),
  'remo-mancuerna': gif('remo-mancuerna'),
  'dominadas': gif('dominadas'),
  'pullover': gif('pullover'),
  'remo-polea-baja': gif('remo-polea'),
  'remo-invertido': gif('remo-invertido'),
  'superman': gif('superman'),
  'superman-alterno': gif('superman'),
  'remo-toalla': gif('remo-invertido'),

  // HOMBROS
  'press-hombros': gif('press-hombros'),
  'press-arnold': gif('press-arnold'),
  'elevaciones-laterales': gif('elevaciones-laterales'),
  'face-pull': gif('remo-polea'),
  'elevaciones-frontales': gif('elevaciones-frontales'),
  'pike-push-up': gif('pike-push-up'),
  'handstand-wall': gif('handstand'),
  'plancha-lateral-con-elevacion': gif('plancha-lateral'),

  // BICEPS
  'curl-biceps-barra': gif('curl-biceps'),
  'curl-martillo': gif('curl-martillo'),
  'curl-concentrado': gif('curl-concentrado'),
  'curl-scott': gif('curl-scott'),
  'chin-up': gif('chin-up'),
  'curl-mochila': gif('curl-biceps'),

  // TRICEPS
  'extension-triceps-polea': gif('extension-triceps'),
  'fondos-triceps': gif('fondos-triceps'),
  'fondos-triceps-suelo': gif('fondos-triceps'),
  'press-frances': gif('press-frances'),
  'kickback-triceps': gif('kickback-triceps'),
  'flexiones-triceps': gif('flexiones-diamante'),

  // PIERNAS
  'sentadilla': gif('sentadilla'),
  'sentadilla-cuerpo': gif('sentadilla-cuerpo'),
  'sentadilla-sumo': gif('sentadilla-sumo'),
  'peso-muerto': gif('peso-muerto'),
  'prensa-piernas': gif('prensa-piernas'),
  'zancadas': gif('zancadas'),
  'zancadas-atras': gif('zancadas'),
  'zancadas-laterales': gif('zancadas'),
  'sentadilla-bulgara': gif('sentadilla-bulgara'),
  'hip-thrust': gif('puente-gluteo'),
  'extension-cuadriceps': gif('extension-cuadriceps'),
  'curl-femoral': gif('curl-femoral'),
  'step-up': gif('step-up'),
  'puente-gluteo': gif('puente-gluteo'),
  'puente-gluteo-unilateral': gif('puente-gluteo'),
  'pistol-squat': gif('pistol-squat'),
  'wall-sit': gif('sentadilla-cuerpo'),
  'elevacion-pantorrillas': gif('elevacion-pantorrillas'),

  // PIERNAS / GLUTEOS — nuevos
  'patada-gluteo': gif('patada-gluteo'),
  'extension-cadera-polea': gif('extension-cadera-polea'),
  'abduccion-cadera': gif('abduccion-cadera'),
  'aduccion-cadera': gif('aduccion-cadera'),
  'aduccion-cable': gif('aduccion-cable'),
  'donkey-kicks': gif('donkey-kicks'),
  'fire-hydrants': gif('fire-hydrants'),
  'abduccion-cuerpo': gif('abduccion-cuerpo'),
  'sentadilla-smith': gif('sentadilla-smith'),
  'sentadilla-frontal': gif('sentadilla-frontal'),
  'curl-femoral-pie': gif('curl-femoral-pie'),
  'peso-muerto-sumo': gif('peso-muerto-sumo'),
  'zancadas-caminando': gif('zancadas-caminando'),
  'hip-thrust-barbell': gif('hip-thrust-barbell'),
  'hip-thrust-banda': gif('hip-thrust-banda'),
  'peso-muerto-mancuerna': gif('peso-muerto-mancuerna'),
  'elevacion-cadera-banco': gif('elevacion-cadera-banco'),

  // ABDOMEN
  'plancha': gif('plancha'),
  'plancha-lateral': gif('plancha-lateral'),
  'crunch-polea': gif('crunch-polea'),
  'crunch-suelo': gif('crunch-polea'),
  'crunch-bicicleta': gif('crunch-polea'),
  'mountain-climbers': gif('mountain-climbers'),
  'dead-bug': gif('dead-bug'),
  'hollow-hold': gif('plancha'),
  'russian-twist': gif('russian-twist'),
  'v-up': gif('v-up'),
  'elevacion-piernas': gif('elevacion-piernas'),

  'rueda-abdominal': gif('rueda-abdominal'),

  // NUEVOS EJERCICIOS
  'press-mancuernas-plano': gif('press-mancuernas-plano'),
  'press-mancuernas-inclinado': gif('press-mancuernas-inclinado'),
  'apertura-mancuerna-plano': gif('apertura-mancuerna-plano'),
  'remo-t': gif('remo-t'),
  'pullover-mancuerna': gif('pullover-mancuerna'),
  'remo-posterior-cable': gif('remo-posterior-cable'),
  'elevacion-posterior': gif('elevacion-posterior'),
  'elevacion-posterior-mancuerna': gif('elevacion-posterior-mancuerna'),
  'elevacion-lateral-cable': gif('elevacion-lateral-cable'),
  'encogimientos-trapecio': gif('encogimientos-trapecio'),
  'curl-cable': gif('curl-cable'),
  'curl-inclinado-martillo': gif('curl-inclinado-martillo'),
  'curl-reverso': gif('curl-reverso'),
  'extension-triceps-overhead': gif('extension-triceps-overhead'),
  'fondos-paralelas': gif('fondos-paralelas'),
  'hack-squat': gif('hack-squat'),
  'peso-muerto-rumano': gif('peso-muerto-rumano'),
  'sentadilla-goblet': gif('sentadilla-goblet'),
  'buenos-dias': gif('buenos-dias'),
  'pantorrilla-sentado': gif('pantorrilla-sentado'),
  'zancadas-mancuerna': gif('zancadas-mancuerna'),

  // UNILATERALES
  'remo-cable-unilateral': gif('remo-cable-unilateral'),
  'remo-barra-unilateral': gif('remo-barra-unilateral'),
  'press-suelo-unilateral': gif('press-suelo-unilateral'),
  'peso-muerto-unilateral': gif('peso-muerto-unilateral'),
  'split-squat-mancuerna': gif('split-squat-mancuerna'),
  'sentadilla-unilateral': gif('sentadilla-unilateral'),
  'pantorrilla-unilateral': gif('pantorrilla-unilateral'),
  'remo-maquina-unilateral': gif('remo-maquina-unilateral'),

  // CARDIO
  'hiit-cinta': gif('hiit-cinta'),
  'saltar-cuerda': gif('saltar-cuerda'),
  'burpees': gif('burpees'),
  'jumping-jacks': gif('saltar-cuerda'),
  'high-knees': gif('high-knees'),
  'hiit-casa': gif('burpees'),
};
