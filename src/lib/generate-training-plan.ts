export interface TrainingExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
}

export interface TrainingDay {
  day: string;
  exercises: TrainingExercise[];
  instructions: string;
}

export function generateTrainingPlan(days: number): TrainingDay[] {
  if (days === 3) return PLAN_3_DAYS;
  if (days === 4) return PLAN_4_DAYS;
  if (days === 6) return PLAN_6_DAYS;
  return PLAN_5_DAYS; // default
}

const PLAN_3_DAYS: TrainingDay[] = [
  {
    day: "Dia 1 - Full Body A",
    instructions: "Calentar 5 min. Descanso entre series como indicado.",
    exercises: [
      { id: "sentadilla", name: "Sentadilla con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "press-banca-plano", name: "Press Banca Plano", sets: 4, reps: "10", rest: "90s" },
      { id: "jalon-polea-alta", name: "Jalon Polea Alta", sets: 4, reps: "10", rest: "90s" },
      { id: "press-hombros", name: "Press Hombros Mancuernas", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-biceps-barra", name: "Curl Biceps Barra", sets: 3, reps: "12", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "45s", rest: "30s" },
    ],
  },
  {
    day: "Dia 2 - Full Body B",
    instructions: "Trabajar con control en la fase excentrica.",
    exercises: [
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-con-barra", name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", sets: 3, reps: "15", rest: "60s" },
      { id: "extension-triceps-polea", name: "Extension Triceps Polea", sets: 3, reps: "12", rest: "60s" },
      { id: "crunch-polea", name: "Crunch en Polea", sets: 3, reps: "15", rest: "30s" },
    ],
  },
  {
    day: "Dia 3 - Full Body C",
    instructions: "Circuito: 90s entre vueltas. Cardio al final.",
    exercises: [
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas", sets: 3, reps: "12", rest: "60s" },
      { id: "remo-mancuerna", name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-martillo", name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
      { id: "fondos-triceps", name: "Fondos de Triceps", sets: 3, reps: "15", rest: "60s" },
      { id: "hiit-cinta", name: "HIIT Cinta", sets: 1, reps: "15 min", rest: "-" },
    ],
  },
];

const PLAN_4_DAYS: TrainingDay[] = [
  {
    day: "Dia 1 - Tren Superior A",
    instructions: "Calentar 5 min. Enfoque en pecho y espalda.",
    exercises: [
      { id: "press-banca-plano", name: "Press Banca Plano", sets: 4, reps: "10", rest: "90s" },
      { id: "jalon-polea-alta", name: "Jalon Polea Alta", sets: 4, reps: "10", rest: "90s" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas", sets: 3, reps: "12", rest: "60s" },
      { id: "remo-mancuerna", name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-biceps-barra", name: "Curl Biceps Barra", sets: 3, reps: "12", rest: "60s" },
      { id: "extension-triceps-polea", name: "Extension Triceps Polea", sets: 3, reps: "12", rest: "60s" },
    ],
  },
  {
    day: "Dia 2 - Tren Inferior A",
    instructions: "En sentadilla: bajar hasta paralelo o mas abajo.",
    exercises: [
      { id: "sentadilla", name: "Sentadilla con Barra", sets: 4, reps: "10", rest: "120s" },
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "prensa-piernas", name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "60s", rest: "30s" },
    ],
  },
  {
    day: "Dia 3 - Tren Superior B",
    instructions: "Enfoque en hombros y brazos.",
    exercises: [
      { id: "press-hombros", name: "Press Hombros Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-con-barra", name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", sets: 4, reps: "15", rest: "60s" },
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-martillo", name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
      { id: "fondos-triceps", name: "Fondos de Triceps", sets: 3, reps: "15", rest: "60s" },
    ],
  },
  {
    day: "Dia 4 - Tren Inferior B + Cardio",
    instructions: "Circuito final con cardio HIIT.",
    exercises: [
      { id: "prensa-piernas", name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "crunch-polea", name: "Crunch en Polea", sets: 4, reps: "15", rest: "30s" },
      { id: "hiit-cinta", name: "HIIT Cinta", sets: 1, reps: "15 min", rest: "-" },
    ],
  },
];

const PLAN_5_DAYS: TrainingDay[] = [
  {
    day: "Dia 1 - Pecho y Triceps",
    instructions: "Calentar 5 min en cinta.",
    exercises: [
      { id: "press-banca-plano", name: "Press Banca Plano", sets: 4, reps: "10", rest: "90s" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas", sets: 4, reps: "12", rest: "60s" },
      { id: "extension-triceps-polea", name: "Extension Triceps Polea", sets: 4, reps: "12", rest: "60s" },
      { id: "fondos-triceps", name: "Fondos de Triceps", sets: 3, reps: "15", rest: "60s" },
    ],
  },
  {
    day: "Dia 2 - Espalda y Biceps",
    instructions: "Trabajar con control en la fase excentrica.",
    exercises: [
      { id: "jalon-polea-alta", name: "Jalon Polea Alta", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-con-barra", name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-mancuerna", name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-biceps-barra", name: "Curl Biceps Barra", sets: 4, reps: "10", rest: "60s" },
      { id: "curl-martillo", name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
    ],
  },
  {
    day: "Dia 3 - Piernas",
    instructions: "En sentadilla: bajar hasta paralelo o mas abajo.",
    exercises: [
      { id: "sentadilla", name: "Sentadilla con Barra", sets: 4, reps: "10", rest: "120s" },
      { id: "prensa-piernas", name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "45s", rest: "30s" },
    ],
  },
  {
    day: "Dia 4 - Hombros y Abdomen",
    instructions: "Elevaciones laterales con peso controlado.",
    exercises: [
      { id: "press-hombros", name: "Press Hombros Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", sets: 4, reps: "15", rest: "60s" },
      { id: "crunch-polea", name: "Crunch en Polea", sets: 4, reps: "15", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "60s", rest: "30s" },
    ],
  },
  {
    day: "Dia 5 - Full Body + Cardio",
    instructions: "Circuito: 90s entre vueltas. 3 vueltas.",
    exercises: [
      { id: "sentadilla", name: "Sentadilla", sets: 3, reps: "15", rest: "30s" },
      { id: "press-banca-plano", name: "Press Banca", sets: 3, reps: "12", rest: "30s" },
      { id: "jalon-polea-alta", name: "Jalon Polea", sets: 3, reps: "12", rest: "30s" },
      { id: "press-hombros", name: "Press Hombros", sets: 3, reps: "12", rest: "30s" },
      { id: "hiit-cinta", name: "HIIT Cinta", sets: 1, reps: "15 min", rest: "-" },
    ],
  },
];

const PLAN_6_DAYS: TrainingDay[] = [
  {
    day: "Dia 1 - Push (Pecho/Hombros/Triceps)",
    instructions: "Calentar 5 min.",
    exercises: [
      { id: "press-banca-plano", name: "Press Banca Plano", sets: 4, reps: "10", rest: "90s" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas", sets: 4, reps: "10", rest: "90s" },
      { id: "press-hombros", name: "Press Hombros", sets: 3, reps: "12", rest: "60s" },
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", sets: 3, reps: "15", rest: "60s" },
      { id: "extension-triceps-polea", name: "Extension Triceps", sets: 3, reps: "12", rest: "60s" },
    ],
  },
  {
    day: "Dia 2 - Pull (Espalda/Biceps)",
    instructions: "Control en la fase excentrica.",
    exercises: [
      { id: "jalon-polea-alta", name: "Jalon Polea Alta", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-con-barra", name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-mancuerna", name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-biceps-barra", name: "Curl Biceps", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-martillo", name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
    ],
  },
  {
    day: "Dia 3 - Legs (Piernas)",
    instructions: "Sentadilla profunda. Descanso largo en compuestos.",
    exercises: [
      { id: "sentadilla", name: "Sentadilla con Barra", sets: 4, reps: "10", rest: "120s" },
      { id: "prensa-piernas", name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "45s", rest: "30s" },
    ],
  },
  {
    day: "Dia 4 - Push B",
    instructions: "Variaciones distintas al dia 1.",
    exercises: [
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas", sets: 4, reps: "12", rest: "60s" },
      { id: "press-banca-plano", name: "Press Banca", sets: 4, reps: "10", rest: "90s" },
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", sets: 4, reps: "15", rest: "60s" },
      { id: "fondos-triceps", name: "Fondos de Triceps", sets: 3, reps: "15", rest: "60s" },
      { id: "crunch-polea", name: "Crunch en Polea", sets: 3, reps: "15", rest: "30s" },
    ],
  },
  {
    day: "Dia 5 - Pull B",
    instructions: "Mas volumen en espalda.",
    exercises: [
      { id: "remo-con-barra", name: "Remo con Barra", sets: 4, reps: "10", rest: "90s" },
      { id: "jalon-polea-alta", name: "Jalon Polea Alta", sets: 4, reps: "10", rest: "90s" },
      { id: "remo-mancuerna", name: "Remo Mancuerna", sets: 3, reps: "12", rest: "60s" },
      { id: "curl-biceps-barra", name: "Curl Biceps", sets: 4, reps: "10", rest: "60s" },
      { id: "curl-martillo", name: "Curl Martillo", sets: 3, reps: "12", rest: "60s" },
    ],
  },
  {
    day: "Dia 6 - Legs B + Cardio",
    instructions: "Piernas + HIIT al final.",
    exercises: [
      { id: "prensa-piernas", name: "Prensa de Piernas", sets: 4, reps: "12", rest: "90s" },
      { id: "zancadas", name: "Zancadas", sets: 3, reps: "12 c/pierna", rest: "60s" },
      { id: "peso-muerto", name: "Peso Muerto Rumano", sets: 4, reps: "10", rest: "90s" },
      { id: "plancha", name: "Plancha", sets: 3, reps: "60s", rest: "30s" },
      { id: "hiit-cinta", name: "HIIT Cinta", sets: 1, reps: "15 min", rest: "-" },
    ],
  },
];
