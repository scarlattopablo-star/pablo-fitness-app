// Training plan generator based on ACSM & NSCA guidelines
// Sources:
// - ACSM Position Stand: Progression Models in Resistance Training (2009)
// - NSCA: Using Intensity Based on Sets and Repetitions
// - ACSM 2026 Resistance Training Guidelines Update
//
// HYPERTROPHY: 3-4 sets x 8-12 reps, 60-75% 1RM, 60-90s rest
// STRENGTH: 3-5 sets x 4-6 reps, 80-90% 1RM, 2-3min rest
// FAT LOSS: 3-4 sets x 12-15 reps, 50-65% 1RM, 30-60s rest
// BEGINNER: 2-3 sets x 10-15 reps, 50-65% 1RM, 60-90s rest

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

interface TrainingParams {
  sets: number;
  reps: string;
  restCompound: string;
  restIsolation: string;
  instructions: string;
}

function getParams(objective: string): TrainingParams {
  switch (objective) {
    case "ganancia-muscular":
      return { sets: 4, reps: "8-12", restCompound: "90s", restIsolation: "60s", instructions: "Fase excentrica lenta (2-3s). Peso moderado-alto. 10-20 series/musculo/semana." };
    case "fuerza-funcional":
    case "competicion":
    case "rendimiento-deportivo":
      return { sets: 4, reps: "4-6", restCompound: "3min", restIsolation: "90s", instructions: "Peso alto (80-90% 1RM). Tecnica perfecta. Descanso completo." };
    case "quema-grasa":
    case "recomposicion-corporal":
      return { sets: 3, reps: "12-15", restCompound: "60s", restIsolation: "45s", instructions: "Ritmo alto, descansos cortos. Mantener frecuencia cardiaca elevada." };
    case "tonificacion":
    case "post-parto":
      return { sets: 3, reps: "12-15", restCompound: "60s", restIsolation: "45s", instructions: "Peso moderado. Movimientos controlados. Enfocarse en la contraccion." };
    case "principiante-total":
      return { sets: 3, reps: "10-15", restCompound: "90s", restIsolation: "60s", instructions: "Aprender tecnica. Peso liviano, aumentar gradualmente semana a semana." };
    default:
      return { sets: 4, reps: "10-12", restCompound: "90s", restIsolation: "60s", instructions: "Peso moderado. Buena tecnica. Aumentar carga progresivamente." };
  }
}

function ex(id: string, name: string, p: TrainingParams, compound: boolean): TrainingExercise {
  const isSpecial = id === "plancha" || id === "plancha-lateral";
  return {
    id, name,
    sets: compound ? p.sets : Math.max(3, p.sets - 1),
    reps: isSpecial ? "45s" : id === "hiit-cinta" ? "15 min" : p.reps,
    rest: compound ? p.restCompound : p.restIsolation,
  };
}

export function generateTrainingPlan(days: number = 5, objective: string = "quema-grasa"): TrainingDay[] {
  const p = getParams(objective);

  if (days === 3) {
    return [
      { day: "Dia 1 - Full Body A", instructions: p.instructions, exercises: [
        ex("press-banca-plano", "Press Banca Plano", p, true),
        ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
        ex("sentadilla", "Sentadilla con Barra", p, true),
        ex("press-hombros", "Press Hombros", p, true),
        ex("plancha", "Plancha", p, false),
      ]},
      { day: "Dia 2 - Full Body B", instructions: p.instructions, exercises: [
        ex("peso-muerto", "Peso Muerto Rumano", p, true),
        ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
        ex("remo-con-barra", "Remo con Barra", p, true),
        ex("prensa-piernas", "Prensa de Piernas", p, true),
        ex("crunch-polea", "Crunch en Polea", p, false),
      ]},
      { day: "Dia 3 - Full Body C + Cardio", instructions: "Circuito: 2 min descanso entre rondas. " + p.instructions, exercises: [
        ex("sentadilla", "Sentadilla", { ...p, sets: 3 }, true),
        ex("press-banca-plano", "Press Banca", { ...p, sets: 3 }, true),
        ex("jalon-polea-alta", "Jalon Polea", { ...p, sets: 3 }, true),
        ex("elevaciones-laterales", "Elevaciones Laterales", { ...p, sets: 3 }, false),
        ex("hiit-cinta", "HIIT en Cinta", p, false),
      ]},
    ];
  }

  if (days === 4) {
    return [
      { day: "Dia 1 - Tren Superior (Fuerza)", instructions: p.instructions, exercises: [
        ex("press-banca-plano", "Press Banca Plano", p, true),
        ex("remo-con-barra", "Remo con Barra", p, true),
        ex("press-hombros", "Press Hombros", p, true),
        ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
        ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
      ]},
      { day: "Dia 2 - Tren Inferior (Fuerza)", instructions: p.instructions, exercises: [
        ex("sentadilla", "Sentadilla con Barra", p, true),
        ex("peso-muerto", "Peso Muerto Rumano", p, true),
        ex("zancadas", "Zancadas", p, false),
        ex("elevacion-gemelos", "Elevacion de Gemelos", p, false),
        ex("crunch-polea", "Crunch en Polea", p, false),
      ]},
      { day: "Dia 3 - Tren Superior (Volumen)", instructions: p.instructions, exercises: [
        ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
        ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
        ex("aperturas-inclinadas", "Aperturas Inclinadas", p, false),
        ex("elevaciones-laterales", "Elevaciones Laterales", p, false),
        ex("curl-martillo", "Curl Martillo", p, false),
        ex("fondos-triceps", "Fondos de Triceps", p, false),
      ]},
      { day: "Dia 4 - Tren Inferior (Volumen)", instructions: p.instructions, exercises: [
        ex("prensa-piernas", "Prensa de Piernas", p, true),
        ex("extension-cuadriceps", "Extension Cuadriceps", p, false),
        ex("curl-femoral", "Curl Femoral", p, false),
        ex("elevacion-gemelos", "Elevacion de Gemelos", p, false),
        ex("plancha", "Plancha", p, false),
        ex("elevacion-piernas", "Elevacion de Piernas", p, false),
      ]},
    ];
  }

  if (days === 5) {
    return [
      { day: "Dia 1 - Pecho y Triceps", instructions: p.instructions, exercises: [
        ex("press-banca-plano", "Press Banca Plano", p, true),
        ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
        ex("aperturas-inclinadas", "Aperturas Inclinadas", p, false),
        ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
        ex("fondos-triceps", "Fondos de Triceps", p, false),
      ]},
      { day: "Dia 2 - Espalda y Biceps", instructions: p.instructions, exercises: [
        ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
        ex("remo-con-barra", "Remo con Barra", p, true),
        ex("remo-mancuerna", "Remo Mancuerna", p, false),
        ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
        ex("curl-martillo", "Curl Martillo", p, false),
      ]},
      { day: "Dia 3 - Piernas", instructions: p.instructions, exercises: [
        ex("sentadilla", "Sentadilla con Barra", p, true),
        ex("prensa-piernas", "Prensa de Piernas", p, true),
        ex("peso-muerto", "Peso Muerto Rumano", p, true),
        ex("zancadas", "Zancadas", p, false),
        ex("elevacion-gemelos", "Elevacion de Gemelos", p, false),
      ]},
      { day: "Dia 4 - Hombros y Abdomen", instructions: p.instructions, exercises: [
        ex("press-hombros", "Press Hombros", p, true),
        ex("elevaciones-laterales", "Elevaciones Laterales", p, false),
        ex("pajaros", "Pajaros (Deltoides Posterior)", p, false),
        ex("crunch-polea", "Crunch en Polea", p, false),
        ex("plancha", "Plancha", p, false),
      ]},
      { day: "Dia 5 - Full Body + Cardio", instructions: "Circuito con descanso minimo. " + p.instructions, exercises: [
        ex("sentadilla", "Sentadilla", { ...p, sets: 3 }, true),
        ex("press-banca-plano", "Press Banca", { ...p, sets: 3 }, true),
        ex("jalon-polea-alta", "Jalon Polea", { ...p, sets: 3 }, true),
        ex("press-hombros", "Press Hombros", { ...p, sets: 3 }, true),
        ex("hiit-cinta", "HIIT en Cinta", p, false),
      ]},
    ];
  }

  // 6 days: Push/Pull/Legs x2
  return [
    { day: "Dia 1 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ex("press-banca-plano", "Press Banca Plano", p, true),
      ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
      ex("aperturas-inclinadas", "Aperturas Inclinadas", p, false),
      ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
      ex("press-frances", "Press Frances", p, false),
    ]},
    { day: "Dia 2 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
      ex("remo-con-barra", "Remo con Barra", p, true),
      ex("remo-mancuerna", "Remo Mancuerna", p, false),
      ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
      ex("curl-concentrado", "Curl Concentrado", p, false),
    ]},
    { day: "Dia 3 - Piernas y Abdomen", instructions: p.instructions, exercises: [
      ex("sentadilla", "Sentadilla con Barra", p, true),
      ex("peso-muerto", "Peso Muerto Rumano", p, true),
      ex("zancadas", "Zancadas", p, false),
      ex("elevacion-gemelos", "Elevacion de Gemelos", p, false),
      ex("crunch-polea", "Crunch en Polea", p, false),
    ]},
    { day: "Dia 4 - Hombros y Triceps", instructions: p.instructions, exercises: [
      ex("press-hombros", "Press Hombros", p, true),
      ex("elevaciones-laterales", "Elevaciones Laterales", p, false),
      ex("pajaros", "Pajaros (Deltoides Posterior)", p, false),
      ex("fondos-triceps", "Fondos de Triceps", p, false),
      ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
    ]},
    { day: "Dia 5 - Espalda y Biceps (Volumen)", instructions: p.instructions, exercises: [
      ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
      ex("pullover", "Pullover con Mancuerna", p, false),
      ex("remo-mancuerna", "Remo Mancuerna", p, false),
      ex("curl-martillo", "Curl Martillo", p, false),
      ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
    ]},
    { day: "Dia 6 - Piernas (Volumen) + Cardio", instructions: p.instructions, exercises: [
      ex("prensa-piernas", "Prensa de Piernas", p, true),
      ex("extension-cuadriceps", "Extension Cuadriceps", p, false),
      ex("curl-femoral", "Curl Femoral", p, false),
      ex("elevacion-gemelos", "Elevacion de Gemelos", p, false),
      ex("elevacion-piernas", "Elevacion de Piernas", p, false),
      ex("hiit-cinta", "HIIT en Cinta", p, false),
    ]},
  ];
}
