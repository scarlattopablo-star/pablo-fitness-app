// Training plan generator based on ACSM & NSCA guidelines
// Sources:
// - ACSM Position Stand: Progression Models in Resistance Training (2009)
// - NSCA: Using Intensity Based on Sets and Repetitions
// - NSCA: Muscle Prioritization Principle (weak/emphasis group trained first when fresh)
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

// Exercise pools by muscle group for emphasis variation
const EMPHASIS_EXERCISES: Record<string, { compound: { id: string; name: string }[]; isolation: { id: string; name: string }[] }> = {
  pecho: {
    compound: [
      { id: "press-banca-plano", name: "Press Banca Plano" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas" },
      { id: "press-declinado", name: "Press Declinado con Barra" },
    ],
    isolation: [
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas" },
      { id: "cruces-polea", name: "Cruces en Polea" },
      { id: "flexiones", name: "Flexiones de Brazos" },
    ],
  },
  espalda: {
    compound: [
      { id: "jalon-polea-alta", name: "Jalon Polea Alta" },
      { id: "remo-con-barra", name: "Remo con Barra" },
      { id: "dominadas", name: "Dominadas" },
    ],
    isolation: [
      { id: "remo-mancuerna", name: "Remo Mancuerna" },
      { id: "pullover", name: "Pullover con Mancuerna" },
      { id: "remo-polea-baja", name: "Remo en Polea Baja" },
    ],
  },
  piernas: {
    compound: [
      { id: "sentadilla", name: "Sentadilla con Barra" },
      { id: "prensa-piernas", name: "Prensa de Piernas" },
      { id: "peso-muerto", name: "Peso Muerto" },
      { id: "hip-thrust", name: "Hip Thrust" },
    ],
    isolation: [
      { id: "zancadas", name: "Zancadas" },
      { id: "sentadilla-bulgara", name: "Sentadilla Bulgara" },
      { id: "extension-cuadriceps", name: "Extension Cuadriceps" },
      { id: "curl-femoral", name: "Curl Femoral" },
    ],
  },
  hombros: {
    compound: [
      { id: "press-hombros", name: "Press Hombros" },
      { id: "press-arnold", name: "Press Arnold" },
    ],
    isolation: [
      { id: "elevaciones-laterales", name: "Elevaciones Laterales" },
      { id: "face-pull", name: "Face Pull" },
      { id: "elevaciones-frontales", name: "Elevaciones Frontales" },
    ],
  },
  abdomen: {
    compound: [
      { id: "elevacion-piernas", name: "Elevacion de Piernas" },
    ],
    isolation: [
      { id: "plancha", name: "Plancha" },
      { id: "crunch-polea", name: "Crunch en Polea" },
      { id: "mountain-climbers", name: "Mountain Climbers" },
    ],
  },
};

// Map emphasis options to muscle groups
function getEmphasisGroups(emphasis: string): string[] {
  switch (emphasis) {
    case "pecho": return ["pecho"];
    case "espalda": return ["espalda", "hombros"];
    case "piernas": return ["piernas"];
    case "abdomen": return ["abdomen"];
    case "tren-superior": return ["pecho", "espalda", "hombros"];
    case "tren-inferior": return ["piernas", "abdomen"];
    default: return [];
  }
}

// Build an emphasis day with more exercises for the target group
function buildEmphasisDay(dayName: string, group: string, variant: "fuerza" | "volumen", p: TrainingParams): TrainingDay {
  const pool = EMPHASIS_EXERCISES[group];
  if (!pool) return { day: dayName, exercises: [], instructions: p.instructions };

  const exercises: TrainingExercise[] = [];
  const label = variant === "fuerza" ? "Fuerza" : "Volumen";

  if (variant === "fuerza") {
    // 2 compound + 2 isolation = 4-5 exercises
    pool.compound.slice(0, 2).forEach(e => exercises.push(ex(e.id, e.name, p, true)));
    pool.isolation.slice(0, 2).forEach(e => exercises.push(ex(e.id, e.name, p, false)));
  } else {
    // Different exercises for volume day: 1 compound + 3 isolation
    const startC = Math.min(1, pool.compound.length - 1);
    exercises.push(ex(pool.compound[startC].id, pool.compound[startC].name, p, true));
    pool.isolation.forEach(e => exercises.push(ex(e.id, e.name, p, false)));
  }

  const groupLabel = group.charAt(0).toUpperCase() + group.slice(1);
  return {
    day: `${dayName} - ${groupLabel} (${label})`,
    instructions: `ENFASIS: ${groupLabel}. ${p.instructions}`,
    exercises,
  };
}

export function generateTrainingPlan(
  days: number = 5,
  objective: string = "quema-grasa",
  emphasis: string = "ninguno"
): TrainingDay[] {
  const p = getParams(objective);
  const emphasisGroups = getEmphasisGroups(emphasis);
  const hasEmphasis = emphasisGroups.length > 0;
  const primaryGroup = emphasisGroups[0] || "";

  // No emphasis: use standard balanced plans
  if (!hasEmphasis) {
    return generateBalancedPlan(days, p);
  }

  // With emphasis: primary group gets 2 days (fuerza + volumen)
  return generateEmphasisPlan(days, p, primaryGroup, emphasisGroups);
}

function generateBalancedPlan(days: number, p: TrainingParams): TrainingDay[] {
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
        ex("peso-muerto", "Peso Muerto", p, true),
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
        ex("peso-muerto", "Peso Muerto", p, true),
        ex("zancadas", "Zancadas", p, false),
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
        ex("peso-muerto", "Peso Muerto", p, true),
        ex("zancadas", "Zancadas", p, false),
      ]},
      { day: "Dia 4 - Hombros y Abdomen", instructions: p.instructions, exercises: [
        ex("press-hombros", "Press Hombros", p, true),
        ex("elevaciones-laterales", "Elevaciones Laterales", p, false),
        ex("face-pull", "Face Pull", p, false),
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

  // 6 days
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
      ex("peso-muerto", "Peso Muerto", p, true),
      ex("zancadas", "Zancadas", p, false),
      ex("crunch-polea", "Crunch en Polea", p, false),
    ]},
    { day: "Dia 4 - Hombros y Triceps", instructions: p.instructions, exercises: [
      ex("press-hombros", "Press Hombros", p, true),
      ex("elevaciones-laterales", "Elevaciones Laterales", p, false),
      ex("face-pull", "Face Pull", p, false),
      ex("fondos-triceps", "Fondos de Triceps", p, false),
      ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
    ]},
    { day: "Dia 5 - Espalda y Biceps (Volumen)", instructions: p.instructions, exercises: [
      ex("dominadas", "Dominadas", p, true),
      ex("pullover", "Pullover con Mancuerna", p, false),
      ex("remo-polea-baja", "Remo en Polea Baja", p, false),
      ex("curl-martillo", "Curl Martillo", p, false),
      ex("curl-scott", "Curl Banco Scott", p, false),
    ]},
    { day: "Dia 6 - Piernas (Volumen) + Cardio", instructions: p.instructions, exercises: [
      ex("prensa-piernas", "Prensa de Piernas", p, true),
      ex("hip-thrust", "Hip Thrust", p, true),
      ex("extension-cuadriceps", "Extension Cuadriceps", p, false),
      ex("curl-femoral", "Curl Femoral", p, false),
      ex("hiit-cinta", "HIIT en Cinta", p, false),
    ]},
  ];
}

function generateEmphasisPlan(days: number, p: TrainingParams, primary: string, allGroups: string[]): TrainingDay[] {
  // NSCA Prioritization: emphasis group trained first when fresh, appears 2x/week
  const emphasisDay1 = buildEmphasisDay("Dia 1", primary, "fuerza", p);
  const emphasisDay2 = buildEmphasisDay(`Dia ${Math.min(days, 4)}`, primary, "volumen", p);

  // Fill remaining days with other muscle groups
  const otherDays: TrainingDay[] = [];

  // Standard complementary days based on what's NOT the emphasis
  if (primary !== "pecho" && primary !== "espalda") {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ex("press-banca-plano", "Press Banca Plano", p, true),
      ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
      ex("aperturas-inclinadas", "Aperturas Inclinadas", p, false),
      ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
    ]});
    otherDays.push({ day: "Dia 3 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
      ex("remo-con-barra", "Remo con Barra", p, true),
      ex("remo-mancuerna", "Remo Mancuerna", p, false),
      ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
    ]});
  }
  if (primary === "pecho") {
    otherDays.push({ day: "Dia 2 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
      ex("remo-con-barra", "Remo con Barra", p, true),
      ex("remo-mancuerna", "Remo Mancuerna", p, false),
      ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
    ]});
    otherDays.push({ day: "Dia 3 - Piernas", instructions: p.instructions, exercises: [
      ex("sentadilla", "Sentadilla con Barra", p, true),
      ex("prensa-piernas", "Prensa de Piernas", p, true),
      ex("zancadas", "Zancadas", p, false),
      ex("crunch-polea", "Crunch en Polea", p, false),
    ]});
  }
  if (primary === "espalda") {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ex("press-banca-plano", "Press Banca Plano", p, true),
      ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
      ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
      ex("fondos-triceps", "Fondos de Triceps", p, false),
    ]});
    otherDays.push({ day: "Dia 3 - Piernas", instructions: p.instructions, exercises: [
      ex("sentadilla", "Sentadilla con Barra", p, true),
      ex("prensa-piernas", "Prensa de Piernas", p, true),
      ex("zancadas", "Zancadas", p, false),
      ex("crunch-polea", "Crunch en Polea", p, false),
    ]});
  }
  if (primary !== "piernas") {
    if (!otherDays.some(d => d.day.includes("Piernas"))) {
      otherDays.push({ day: `Dia ${otherDays.length + 2} - Piernas`, instructions: p.instructions, exercises: [
        ex("sentadilla", "Sentadilla con Barra", p, true),
        ex("prensa-piernas", "Prensa de Piernas", p, true),
        ex("peso-muerto", "Peso Muerto", p, true),
        ex("zancadas", "Zancadas", p, false),
      ]});
    }
  } else {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ex("press-banca-plano", "Press Banca Plano", p, true),
      ex("press-inclinado", "Press Inclinado Mancuernas", p, true),
      ex("extension-triceps-polea", "Extension Triceps Polea", p, false),
    ]});
    otherDays.push({ day: "Dia 3 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ex("jalon-polea-alta", "Jalon Polea Alta", p, true),
      ex("remo-con-barra", "Remo con Barra", p, true),
      ex("curl-biceps-barra", "Curl Biceps Barra", p, false),
    ]});
  }

  // Assemble: emphasis first, other days, emphasis volume, optional cardio
  const plan: TrainingDay[] = [emphasisDay1, ...otherDays.slice(0, 2), emphasisDay2];

  // Add remaining days up to target
  if (days >= 5) {
    plan.push({ day: `Dia 5 - Hombros y Abdomen`, instructions: p.instructions, exercises: [
      ex("press-hombros", "Press Hombros", p, true),
      ex("elevaciones-laterales", "Elevaciones Laterales", p, false),
      ex("face-pull", "Face Pull", p, false),
      ex("plancha", "Plancha", p, false),
      ex("crunch-polea", "Crunch en Polea", p, false),
    ]});
  }
  if (days >= 6) {
    plan.push({ day: "Dia 6 - Full Body + Cardio", instructions: "Circuito. " + p.instructions, exercises: [
      ex("sentadilla", "Sentadilla", { ...p, sets: 3 }, true),
      ex("press-banca-plano", "Press Banca", { ...p, sets: 3 }, true),
      ex("jalon-polea-alta", "Jalon Polea", { ...p, sets: 3 }, true),
      ex("hiit-cinta", "HIIT en Cinta", p, false),
    ]});
  }

  // Renumber days
  return plan.slice(0, days).map((d, i) => ({
    ...d,
    day: d.day.replace(/Dia \d+/, `Dia ${i + 1}`),
  }));
}
