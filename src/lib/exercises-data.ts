import type { Exercise } from '@/types';

export const EXERCISES: Exercise[] = [
  // PECHO
  {
    id: 'press-banca-plano',
    name: 'Press Banca Plano',
    muscleGroup: 'pecho',
    description: 'Ejercicio fundamental para el desarrollo del pecho. Trabaja pectoral mayor, deltoides anterior y tríceps.',
    steps: [
      'Acostarse en el banco plano con los pies firmes en el suelo',
      'Agarrar la barra con un agarre ligeramente más ancho que los hombros',
      'Bajar la barra controladamente hasta tocar el pecho medio',
      'Empujar la barra hacia arriba hasta extender los brazos sin bloquear los codos',
      'Mantener los omóplatos retraídos durante todo el movimiento',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'aperturas-inclinadas',
    name: 'Aperturas Inclinadas',
    muscleGroup: 'pecho',
    description: 'Ejercicio de aislamiento para la parte superior del pecho con mancuernas.',
    steps: [
      'Sentarse en un banco inclinado a 30-45 grados',
      'Sostener las mancuernas con los brazos extendidos sobre el pecho',
      'Abrir los brazos en arco bajando las mancuernas a los lados',
      'Mantener una ligera flexión en los codos durante todo el recorrido',
      'Volver a la posición inicial apretando el pecho',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'press-inclinado',
    name: 'Press Inclinado con Mancuernas',
    muscleGroup: 'pecho',
    description: 'Variante del press banca que enfatiza la parte superior del pecho.',
    steps: [
      'Ajustar el banco a 30-45 grados de inclinación',
      'Sostener una mancuerna en cada mano a la altura del pecho',
      'Empujar las mancuernas hacia arriba y ligeramente hacia adentro',
      'Bajar controladamente hasta que los codos estén a 90 grados',
      'Mantener los pies firmes en el suelo',
    ],
    videoUrl: 'SEARCH',
  },
  // ESPALDA
  {
    id: 'jalon-polea-alta',
    name: 'Jalón Polea Alta',
    muscleGroup: 'espalda',
    description: 'Ejercicio clave para el desarrollo del dorsal ancho y la amplitud de la espalda.',
    steps: [
      'Sentarse en la máquina con las piernas aseguradas',
      'Agarrar la barra con agarre ancho, palmas mirando hacia adelante',
      'Tirar la barra hacia abajo hasta la parte superior del pecho',
      'Apretar los omóplatos al final del movimiento',
      'Volver arriba controladamente sin soltar completamente la tensión',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'remo-con-barra',
    name: 'Remo con Barra',
    muscleGroup: 'espalda',
    description: 'Ejercicio compuesto para el grosor de la espalda.',
    steps: [
      'De pie, inclinar el torso a 45 grados con las rodillas ligeramente flexionadas',
      'Agarrar la barra con agarre prono a la anchura de los hombros',
      'Tirar la barra hacia el abdomen bajo',
      'Apretar los omóplatos al final del movimiento',
      'Bajar controladamente manteniendo la postura',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'remo-mancuerna',
    name: 'Remo con Mancuerna',
    muscleGroup: 'espalda',
    description: 'Ejercicio unilateral para trabajar cada lado de la espalda independientemente.',
    steps: [
      'Apoyar una rodilla y una mano en el banco',
      'Con la otra mano sostener la mancuerna con el brazo extendido',
      'Tirar la mancuerna hacia la cadera manteniendo el codo cerca del cuerpo',
      'Apretar el dorsal en la parte alta del movimiento',
      'Bajar controladamente y repetir',
    ],
    videoUrl: 'SEARCH',
  },
  // HOMBROS
  {
    id: 'press-hombros',
    name: 'Press de Hombros',
    muscleGroup: 'hombros',
    description: 'Ejercicio principal para el desarrollo de los deltoides.',
    steps: [
      'Sentarse con la espalda apoyada en el banco vertical',
      'Sostener las mancuernas a la altura de los hombros',
      'Empujar hacia arriba hasta casi extender los brazos',
      'Bajar controladamente hasta la posición inicial',
      'No bloquear los codos en la extensión',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'elevaciones-laterales',
    name: 'Elevaciones Laterales',
    muscleGroup: 'hombros',
    description: 'Ejercicio de aislamiento para el deltoides lateral.',
    steps: [
      'De pie con una mancuerna en cada mano a los lados',
      'Elevar los brazos hacia los lados hasta la altura de los hombros',
      'Mantener una ligera flexión en los codos',
      'Bajar controladamente sin dejar caer el peso',
      'Evitar usar impulso del cuerpo',
    ],
    videoUrl: 'SEARCH',
  },
  // BICEPS
  {
    id: 'curl-biceps-barra',
    name: 'Curl Bíceps con Barra',
    muscleGroup: 'biceps',
    description: 'Ejercicio clásico para el desarrollo del bíceps.',
    steps: [
      'De pie con la barra a la anchura de los hombros',
      'Flexionar los codos llevando la barra hacia los hombros',
      'Mantener los codos pegados al cuerpo durante todo el movimiento',
      'Bajar controladamente sin extender completamente los codos',
      'No balancear el cuerpo para subir el peso',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'curl-martillo',
    name: 'Curl Martillo',
    muscleGroup: 'biceps',
    description: 'Variante del curl que trabaja bíceps y braquial.',
    steps: [
      'De pie con mancuernas a los lados, palmas mirando hacia el cuerpo',
      'Flexionar los codos sin rotar las muñecas',
      'Subir las mancuernas hasta la altura de los hombros',
      'Mantener los codos fijos a los lados',
      'Bajar controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  // TRICEPS
  {
    id: 'extension-triceps-polea',
    name: 'Extensión de Tríceps en Polea',
    muscleGroup: 'triceps',
    description: 'Ejercicio de aislamiento para los tres cabezas del tríceps.',
    steps: [
      'De pie frente a la polea alta con agarre de cuerda o barra',
      'Mantener los codos pegados al cuerpo a 90 grados',
      'Extender los brazos hacia abajo completamente',
      'Apretar los tríceps en la extensión completa',
      'Volver controladamente a 90 grados',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'fondos-triceps',
    name: 'Fondos de Tríceps',
    muscleGroup: 'triceps',
    description: 'Ejercicio con peso corporal para tríceps.',
    steps: [
      'Apoyar las manos en un banco detrás del cuerpo',
      'Extender las piernas hacia adelante',
      'Flexionar los codos bajando el cuerpo',
      'Bajar hasta que los codos formen 90 grados',
      'Empujar hacia arriba extendiendo los brazos',
    ],
    videoUrl: 'SEARCH',
  },
  // PIERNAS
  {
    id: 'sentadilla',
    name: 'Sentadilla con Barra',
    muscleGroup: 'piernas',
    description: 'El rey de los ejercicios. Trabaja cuádriceps, glúteos, isquiotibiales y core.',
    steps: [
      'Colocar la barra sobre los trapecios, no sobre el cuello',
      'Pies a la anchura de los hombros, puntas ligeramente hacia afuera',
      'Bajar como si te sentaras en una silla',
      'Mantener las rodillas en línea con las puntas de los pies',
      'Bajar hasta que los muslos estén paralelos al suelo o más abajo',
      'Subir empujando con los talones',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'peso-muerto',
    name: 'Peso Muerto',
    muscleGroup: 'piernas',
    description: 'Ejercicio compuesto que trabaja toda la cadena posterior.',
    steps: [
      'De pie con los pies a la anchura de las caderas',
      'Agarrar la barra con agarre mixto o doble prono',
      'Mantener la espalda recta y el pecho arriba',
      'Levantar la barra extendiendo caderas y rodillas simultáneamente',
      'Mantener la barra cerca del cuerpo durante todo el recorrido',
      'Bajar controladamente manteniendo la espalda recta',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'prensa-piernas',
    name: 'Prensa de Piernas',
    muscleGroup: 'piernas',
    description: 'Ejercicio de máquina para cuádriceps y glúteos.',
    steps: [
      'Sentarse en la máquina con la espalda bien apoyada',
      'Colocar los pies a la anchura de los hombros en la plataforma',
      'Soltar los seguros y bajar la plataforma flexionando las rodillas',
      'Bajar hasta que las rodillas formen 90 grados',
      'Empujar hacia arriba sin bloquear las rodillas',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'zancadas',
    name: 'Zancadas',
    muscleGroup: 'piernas',
    description: 'Ejercicio unilateral para cuádriceps y glúteos.',
    steps: [
      'De pie con mancuernas a los lados o barra en los hombros',
      'Dar un paso largo hacia adelante',
      'Flexionar ambas rodillas bajando la trasera hacia el suelo',
      'La rodilla delantera no debe pasar la punta del pie',
      'Empujar con el pie delantero para volver a la posición inicial',
    ],
    videoUrl: 'SEARCH',
  },
  // ABDOMEN
  {
    id: 'plancha',
    name: 'Plancha',
    muscleGroup: 'abdomen',
    description: 'Ejercicio isométrico para fortalecer todo el core.',
    steps: [
      'Apoyar los antebrazos y las puntas de los pies en el suelo',
      'Mantener el cuerpo en línea recta de cabeza a pies',
      'Apretar el abdomen y los glúteos',
      'No dejar caer las caderas ni subirlas demasiado',
      'Mantener la posición el tiempo indicado',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'crunch-polea',
    name: 'Crunch en Polea',
    muscleGroup: 'abdomen',
    description: 'Ejercicio con resistencia para el recto abdominal.',
    steps: [
      'Arrodillarse frente a la polea alta con la cuerda',
      'Sostener la cuerda a los lados de la cabeza',
      'Flexionar el torso hacia abajo contrayendo el abdomen',
      'No tirar con los brazos, el movimiento es del core',
      'Volver controladamente a la posición inicial',
    ],
    videoUrl: 'SEARCH',
  },
  // CARDIO
  {
    id: 'hiit-cinta',
    name: 'HIIT en Cinta',
    muscleGroup: 'cardio',
    description: 'Intervalos de alta intensidad para quemar grasa.',
    steps: [
      'Calentar 3 minutos caminando rápido',
      'Sprint 30 segundos a máxima intensidad',
      'Descanso activo 60 segundos caminando',
      'Repetir el ciclo 8-12 veces',
      'Enfriar 3 minutos caminando suave',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'saltar-cuerda',
    name: 'Saltar la Cuerda',
    muscleGroup: 'cardio',
    description: 'Ejercicio cardiovascular completo y accesible.',
    steps: [
      'De pie con la cuerda detrás de los pies',
      'Girar la cuerda con las muñecas, no con los brazos',
      'Saltar lo justo para que pase la cuerda',
      'Mantener el core activado',
      'Aterrizar suavemente sobre la parte delantera de los pies',
    ],
    videoUrl: 'SEARCH',
  },
];

export function getVideoUrl(exercise: Exercise): string {
  if (exercise.videoUrl && exercise.videoUrl !== 'SEARCH') {
    return exercise.videoUrl;
  }
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' tecnica correcta ejercicio gym')}`;
}

export function getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
  return EXERCISES.filter(e => e.muscleGroup === muscleGroup);
}

export function getExerciseById(id: string): Exercise | undefined {
  return EXERCISES.find(e => e.id === id);
}

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombros: 'Hombros',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  piernas: 'Piernas',
  abdomen: 'Abdomen',
  cardio: 'Cardio',
};
