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
  // PECHO (extras para enfasis)
  {
    id: 'press-declinado',
    name: 'Press Declinado con Barra',
    muscleGroup: 'pecho',
    description: 'Enfatiza la parte inferior del pectoral. Basado en ACSM para desarrollo completo del pecho.',
    steps: [
      'Acostarse en banco declinado (-15 grados) con pies asegurados',
      'Agarrar la barra ligeramente mas ancho que los hombros',
      'Bajar la barra al pecho bajo de forma controlada',
      'Empujar hacia arriba hasta extender los brazos',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'cruces-polea',
    name: 'Cruces en Polea',
    muscleGroup: 'pecho',
    description: 'Aislamiento del pectoral con tension constante. Ideal para volumen y definicion.',
    steps: [
      'De pie entre las poleas altas con un pie adelante',
      'Agarrar las manijas con los brazos abiertos',
      'Llevar las manos hacia el centro apretando el pecho',
      'Volver controladamente manteniendo tension',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'flexiones',
    name: 'Flexiones de Brazos',
    muscleGroup: 'pecho',
    description: 'Ejercicio con peso corporal para pecho, hombros y triceps.',
    steps: [
      'Manos en el suelo a la anchura de los hombros',
      'Cuerpo recto de cabeza a pies, core activado',
      'Bajar el pecho hasta casi tocar el suelo',
      'Empujar hacia arriba hasta extender los brazos',
    ],
    videoUrl: 'SEARCH',
  },
  // ESPALDA (extras para enfasis)
  {
    id: 'dominadas',
    name: 'Dominadas',
    muscleGroup: 'espalda',
    description: 'Ejercicio con peso corporal para dorsales. Referencia NSCA para fuerza de traccion.',
    steps: [
      'Colgarse de la barra con agarre prono mas ancho que los hombros',
      'Tirar del cuerpo hacia arriba hasta pasar la barbilla de la barra',
      'Bajar controladamente sin dejarse caer',
      'Mantener el core activado durante todo el movimiento',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'pullover',
    name: 'Pullover con Mancuerna',
    muscleGroup: 'espalda',
    description: 'Trabaja dorsales y serrato. Ejercicio clasico para amplitud de espalda.',
    steps: [
      'Acostarse en el banco con solo los hombros apoyados',
      'Sostener una mancuerna con ambas manos sobre el pecho',
      'Bajar la mancuerna detras de la cabeza con los brazos semi-extendidos',
      'Volver a la posicion inicial apretando dorsales',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'remo-polea-baja',
    name: 'Remo en Polea Baja',
    muscleGroup: 'espalda',
    description: 'Ejercicio para grosor de espalda con tension constante.',
    steps: [
      'Sentarse con los pies en la plataforma y rodillas ligeramente flexionadas',
      'Agarrar la manija V con ambas manos',
      'Tirar hacia el abdomen apretando los omoplatos',
      'Volver controladamente estirando los brazos',
    ],
    videoUrl: 'SEARCH',
  },
  // HOMBROS (extras para enfasis)
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscleGroup: 'hombros',
    description: 'Ejercicio para deltoides posterior y salud del hombro. Recomendado por ACSM para prevencion de lesiones.',
    steps: [
      'De pie frente a la polea alta con cuerda',
      'Tirar la cuerda hacia la cara separando las manos',
      'Rotar los hombros hacia atras apretando los omoplatos',
      'Volver controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'press-arnold',
    name: 'Press Arnold',
    muscleGroup: 'hombros',
    description: 'Variante del press que trabaja las tres cabezas del deltoides con rotacion.',
    steps: [
      'Sentado con mancuernas frente al pecho, palmas hacia vos',
      'Rotar las mancuernas mientras las empujas hacia arriba',
      'Terminar con las palmas mirando hacia adelante arriba',
      'Bajar rotando de vuelta a la posicion inicial',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'elevaciones-frontales',
    name: 'Elevaciones Frontales',
    muscleGroup: 'hombros',
    description: 'Aislamiento del deltoides anterior.',
    steps: [
      'De pie con mancuernas frente a los muslos',
      'Elevar un brazo al frente hasta la altura de los hombros',
      'Bajar controladamente y alternar con el otro brazo',
      'No usar impulso del cuerpo',
    ],
    videoUrl: 'SEARCH',
  },
  // BICEPS (extras para enfasis)
  {
    id: 'curl-concentrado',
    name: 'Curl Concentrado',
    muscleGroup: 'biceps',
    description: 'Aislamiento maximo del biceps. Elimina trampa de impulso.',
    steps: [
      'Sentado, apoyar el codo en la cara interna del muslo',
      'Con mancuerna, flexionar el brazo concentrando en el biceps',
      'Apretar arriba por 1 segundo',
      'Bajar controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'curl-scott',
    name: 'Curl en Banco Scott',
    muscleGroup: 'biceps',
    description: 'Curl con soporte que aisla el biceps y previene trampa.',
    steps: [
      'Sentarse en el banco Scott con los brazos sobre la almohadilla',
      'Agarrar la barra o mancuernas con agarre supino',
      'Flexionar los codos subiendo el peso',
      'Bajar controladamente sin extender completamente',
    ],
    videoUrl: 'SEARCH',
  },
  // TRICEPS (extras para enfasis)
  {
    id: 'press-frances',
    name: 'Press Frances',
    muscleGroup: 'triceps',
    description: 'Ejercicio compuesto para las tres cabezas del triceps. Basado en NSCA.',
    steps: [
      'Acostado en banco plano con barra o mancuernas sobre el pecho',
      'Flexionar los codos bajando el peso hacia la frente',
      'Mantener los codos apuntando al techo, no abrirlos',
      'Extender los brazos volviendo a la posicion inicial',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'kickback-triceps',
    name: 'Kickback de Triceps',
    muscleGroup: 'triceps',
    description: 'Aislamiento del triceps con mancuerna.',
    steps: [
      'Inclinar el torso a 90 grados, un brazo apoyado en el banco',
      'Codo a 90 grados pegado al cuerpo',
      'Extender el brazo hacia atras apretando el triceps',
      'Volver a 90 grados controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  // PIERNAS (extras para enfasis)
  {
    id: 'extension-cuadriceps',
    name: 'Extension de Cuadriceps',
    muscleGroup: 'piernas',
    description: 'Aislamiento del cuadriceps en maquina.',
    steps: [
      'Sentarse en la maquina con la espalda apoyada',
      'Colocar los pies detras del rodillo',
      'Extender las piernas hasta la extension completa',
      'Apretar el cuadriceps arriba por 1 segundo',
      'Bajar controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'curl-femoral',
    name: 'Curl Femoral',
    muscleGroup: 'piernas',
    description: 'Aislamiento de isquiotibiales en maquina.',
    steps: [
      'Acostarse boca abajo en la maquina',
      'Colocar los tobillos debajo del rodillo',
      'Flexionar las rodillas llevando los talones hacia los gluteos',
      'Apretar arriba por 1 segundo',
      'Bajar controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscleGroup: 'piernas',
    description: 'Ejercicio principal para gluteos. Referencia NSCA para activacion glutea maxima.',
    steps: [
      'Sentarse en el suelo con la espalda alta apoyada en un banco',
      'Colocar la barra sobre las caderas con proteccion',
      'Empujar las caderas hacia arriba apretando los gluteos',
      'Mantener arriba 1 segundo',
      'Bajar controladamente',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'sentadilla-bulgara',
    name: 'Sentadilla Bulgara',
    muscleGroup: 'piernas',
    description: 'Ejercicio unilateral avanzado para cuadriceps y gluteos.',
    steps: [
      'De pie con un pie apoyado en un banco detras',
      'Bajar flexionando la rodilla delantera',
      'Mantener el torso erguido',
      'Bajar hasta que el muslo delantero este paralelo al suelo',
      'Subir empujando con el talon delantero',
    ],
    videoUrl: 'SEARCH',
  },
  // ABDOMEN (extras para enfasis)
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    muscleGroup: 'abdomen',
    description: 'Ejercicio dinamico para core y cardio simultaneo.',
    steps: [
      'Posicion de flexion con brazos extendidos',
      'Llevar una rodilla al pecho rapidamente',
      'Alternar las piernas de forma rapida y controlada',
      'Mantener las caderas bajas y el core activado',
    ],
    videoUrl: 'SEARCH',
  },
  {
    id: 'elevacion-piernas',
    name: 'Elevacion de Piernas Colgado',
    muscleGroup: 'abdomen',
    description: 'Ejercicio avanzado para abdomen inferior. Alta activacion segun ACSM.',
    steps: [
      'Colgarse de una barra con agarre prono',
      'Elevar las piernas rectas hasta 90 grados',
      'Bajar controladamente sin balancear',
      'Para principiantes: elevar las rodillas al pecho',
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
