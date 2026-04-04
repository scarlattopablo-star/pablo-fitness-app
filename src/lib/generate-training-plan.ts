// Training plan generator based on ACSM & NSCA guidelines
// Sources:
// - ACSM 2026 Resistance Training Guidelines Update (137 systematic reviews, >30k participants)
//   Key: "Training all major muscle groups at least twice a week matters far more than any specific split"
// - Schoenfeld BJ et al. (2016) "Effects of Resistance Training Frequency on Measures of Muscle
//   Hypertrophy: A Systematic Review and Meta-Analysis" - PMID 27102172
//   Key: Frequency of 2x/week per muscle group produces superior hypertrophy vs 1x/week
// - ACSM Position Stand: Progression Models in Resistance Training (2009)
// - NSCA: Muscle Prioritization Principle (weak/emphasis group trained first when fresh)
// - Ainsworth BE et al. (2011) Compendium of Physical Activities (MET values for calorie estimation)
//
// PROGRAMMING PRINCIPLE (Schoenfeld 2016 + ACSM 2026):
// - Every muscle trained 2x/week (frequency 2)
// - Each session pairs 1 large muscle + 1 small muscle (agonist/antagonist or push/pull)
// - Large: pecho, espalda, piernas | Small: hombros, biceps, triceps, abdomen
// - Splits by days:
//   3 days → Full Body A/B/C (each muscle hit 2x naturally)
//   4 days → Upper/Lower x2 (freq 2 built-in)
//   5 days → Push/Pull/Legs/Upper/Lower (freq 2 for all)
//   6 days → Push/Pull/Legs x2 (perfect freq 2)
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
  estimatedCalories?: number; // Estimated kcal burned (based on Compendium of Physical Activities)
}

// ============================================================
// Calorie estimation using MET values
// Source: Ainsworth BE et al. (2011) Compendium of Physical Activities
// Formula: Calories = MET × body_weight_kg × duration_hours
//
// MET values used:
// - Resistance training (general): 6.0 MET (code 02054)
// - Resistance training (vigorous): 6.0 MET (code 02054)
// - HIIT / vigorous calisthenics: 8.0 MET (code 02050)
// - Jumping rope: 8.8 MET (code 15551)
// - Bodyweight exercises: 3.8-8.0 MET (codes 02010-02050)
//
// Time estimation per exercise:
// - Compound set: ~3 min (work time + rest)
// - Isolation set: ~2 min (work time + rest)
// - Cardio block: 15 min
// ============================================================

const CARDIO_IDS_SET = new Set([
  "hiit-cinta", "hiit-casa", "burpees", "jumping-jacks",
  "high-knees", "saltar-cuerda",
]);

const TIME_BASED_IDS = new Set([
  "plancha", "plancha-lateral", "hollow-hold", "wall-sit", "handstand-wall",
]);

function estimateSessionCalories(exercises: TrainingExercise[], weightKg: number): number {
  // MET values from Compendium of Physical Activities (Ainsworth 2011)
  const MET_STRENGTH = 6.0;  // Resistance training, vigorous (code 02054)
  const MET_CARDIO = 8.0;    // Vigorous calisthenics/HIIT (code 02050)

  let strengthMinutes = 0;
  let cardioMinutes = 0;

  for (const exercise of exercises) {
    if (CARDIO_IDS_SET.has(exercise.id)) {
      cardioMinutes += 15;
    } else if (TIME_BASED_IDS.has(exercise.id)) {
      // Isometric holds: ~1.5 min per set (45s work + 45s rest)
      strengthMinutes += exercise.sets * 1.5;
    } else {
      // Each set: ~30s work + rest time
      const restSeconds = parseInt(exercise.rest) || 60;
      const workSeconds = 30; // average rep time per set
      const timePerSet = (workSeconds + restSeconds) / 60; // in minutes
      strengthMinutes += exercise.sets * timePerSet;
    }
  }

  // Formula: MET × weight_kg × time_hours
  const strengthCal = MET_STRENGTH * weightKg * (strengthMinutes / 60);
  const cardioCal = MET_CARDIO * weightKg * (cardioMinutes / 60);

  return Math.round(strengthCal + cardioCal);
}

interface TrainingParams {
  sets: number;
  reps: string;
  restCompound: string;
  restIsolation: string;
  instructions: string;
}

// Simple shuffle using Fisher-Yates
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Pick N random items from array
function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
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
      return { sets: 4, reps: "12-15", restCompound: "60s", restIsolation: "45s", instructions: "Ritmo alto, descansos cortos. Mantener frecuencia cardiaca elevada." };
    case "tonificacion":
    case "post-parto":
      return { sets: 4, reps: "12-15", restCompound: "60s", restIsolation: "45s", instructions: "Peso moderado. Movimientos controlados. Enfocarse en la contraccion." };
    case "principiante-total":
      return { sets: 3, reps: "10-15", restCompound: "90s", restIsolation: "60s", instructions: "Aprender tecnica. Peso liviano, aumentar gradualmente semana a semana." };
    case "entrenamiento-casa":
      return { sets: 4, reps: "12-20", restCompound: "60s", restIsolation: "45s", instructions: "Sin equipamiento. Controlar el movimiento. Aumentar repeticiones progresivamente." };
    default:
      return { sets: 4, reps: "10-12", restCompound: "90s", restIsolation: "60s", instructions: "Peso moderado. Buena tecnica. Aumentar carga progresivamente." };
  }
}

function ex(id: string, name: string, p: TrainingParams, compound: boolean): TrainingExercise {
  const isTimeBased = ["plancha", "plancha-lateral", "hollow-hold", "wall-sit", "handstand-wall"].includes(id);
  const isCardio = ["hiit-cinta", "hiit-casa", "burpees", "jumping-jacks", "high-knees", "saltar-cuerda"].includes(id);
  return {
    id, name,
    sets: compound ? p.sets : Math.max(3, p.sets - 1),
    reps: isTimeBased ? "45s" : isCardio ? "15 min" : p.reps,
    rest: compound ? p.restCompound : p.restIsolation,
  };
}

// ============================================================
// GYM exercise pools (with machines/barbells/dumbbells)
// ============================================================
const GYM_EXERCISES: Record<string, { compound: { id: string; name: string }[]; isolation: { id: string; name: string }[] }> = {
  pecho: {
    compound: [
      { id: "press-banca-plano", name: "Press Banca Plano" },
      { id: "press-inclinado", name: "Press Inclinado Mancuernas" },
      { id: "press-declinado", name: "Press Declinado con Barra" },
      { id: "flexiones", name: "Flexiones de Brazos" },
    ],
    isolation: [
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas" },
      { id: "cruces-polea", name: "Cruces en Polea" },
      { id: "flexiones-diamante", name: "Flexiones Diamante" },
      { id: "flexiones-abiertas", name: "Flexiones Abiertas" },
    ],
  },
  espalda: {
    compound: [
      { id: "jalon-polea-alta", name: "Jalon Polea Alta" },
      { id: "remo-con-barra", name: "Remo con Barra" },
      { id: "dominadas", name: "Dominadas" },
      { id: "remo-polea-baja", name: "Remo en Polea Baja" },
    ],
    isolation: [
      { id: "remo-mancuerna", name: "Remo Mancuerna" },
      { id: "pullover", name: "Pullover con Mancuerna" },
      { id: "face-pull", name: "Face Pull" },
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
      { id: "zancadas-atras", name: "Zancadas Inversas" },
      { id: "elevacion-pantorrillas", name: "Elevacion de Pantorrillas" },
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
      { id: "v-up", name: "V-Up" },
    ],
    isolation: [
      { id: "plancha", name: "Plancha" },
      { id: "crunch-polea", name: "Crunch en Polea" },
      { id: "mountain-climbers", name: "Mountain Climbers" },
      { id: "plancha-lateral", name: "Plancha Lateral" },
      { id: "russian-twist", name: "Russian Twist" },
      { id: "crunch-bicicleta", name: "Crunch Bicicleta" },
      { id: "dead-bug", name: "Dead Bug" },
      { id: "hollow-hold", name: "Hollow Hold" },
    ],
  },
  biceps: {
    compound: [
      { id: "curl-biceps-barra", name: "Curl Biceps Barra" },
      { id: "chin-up", name: "Chin-Up" },
    ],
    isolation: [
      { id: "curl-martillo", name: "Curl Martillo" },
      { id: "curl-concentrado", name: "Curl Concentrado" },
      { id: "curl-scott", name: "Curl Banco Scott" },
    ],
  },
  triceps: {
    compound: [
      { id: "fondos-triceps", name: "Fondos de Triceps" },
      { id: "press-frances", name: "Press Frances" },
    ],
    isolation: [
      { id: "extension-triceps-polea", name: "Extension Triceps Polea" },
      { id: "kickback-triceps", name: "Kickback de Triceps" },
      { id: "flexiones-diamante", name: "Flexiones Diamante" },
    ],
  },
};

// ============================================================
// HOME exercise pools (bodyweight only, no machines)
// ============================================================
const HOME_EXERCISES: Record<string, { compound: { id: string; name: string }[]; isolation: { id: string; name: string }[] }> = {
  pecho: {
    compound: [
      { id: "flexiones", name: "Flexiones de Brazos" },
      { id: "flexiones-abiertas", name: "Flexiones Abiertas" },
      { id: "flexiones-declinadas", name: "Flexiones Declinadas" },
      { id: "dips-silla", name: "Fondos entre Sillas" },
    ],
    isolation: [
      { id: "flexiones-diamante", name: "Flexiones Diamante" },
      { id: "flexiones-triceps", name: "Flexiones de Triceps" },
    ],
  },
  espalda: {
    compound: [
      { id: "remo-invertido", name: "Remo Invertido" },
      { id: "dominadas", name: "Dominadas" },
      { id: "remo-toalla", name: "Remo con Toalla" },
    ],
    isolation: [
      { id: "superman", name: "Superman" },
      { id: "superman-alterno", name: "Superman Alterno" },
    ],
  },
  piernas: {
    compound: [
      { id: "sentadilla-cuerpo", name: "Sentadilla sin Peso" },
      { id: "sentadilla-sumo", name: "Sentadilla Sumo" },
      { id: "zancadas", name: "Zancadas" },
      { id: "step-up", name: "Step-Up" },
    ],
    isolation: [
      { id: "puente-gluteo", name: "Puente de Gluteo" },
      { id: "puente-gluteo-unilateral", name: "Puente de Gluteo a Una Pierna" },
      { id: "sentadilla-bulgara", name: "Sentadilla Bulgara" },
      { id: "pistol-squat", name: "Sentadilla Pistol" },
      { id: "wall-sit", name: "Sentadilla en Pared" },
      { id: "zancadas-atras", name: "Zancadas Inversas" },
      { id: "zancadas-laterales", name: "Zancadas Laterales" },
      { id: "elevacion-pantorrillas", name: "Elevacion de Pantorrillas" },
    ],
  },
  hombros: {
    compound: [
      { id: "pike-push-up", name: "Pike Push-Up" },
      { id: "handstand-wall", name: "Handstand en Pared" },
    ],
    isolation: [
      { id: "plancha-lateral-con-elevacion", name: "Plancha Lateral con Elevacion" },
      { id: "elevaciones-frontales", name: "Elevaciones Frontales" },
    ],
  },
  abdomen: {
    compound: [
      { id: "elevacion-piernas", name: "Elevacion de Piernas" },
      { id: "v-up", name: "V-Up" },
    ],
    isolation: [
      { id: "plancha", name: "Plancha" },
      { id: "plancha-lateral", name: "Plancha Lateral" },
      { id: "mountain-climbers", name: "Mountain Climbers" },
      { id: "crunch-bicicleta", name: "Crunch Bicicleta" },
      { id: "dead-bug", name: "Dead Bug" },
      { id: "hollow-hold", name: "Hollow Hold" },
      { id: "russian-twist", name: "Russian Twist" },
      { id: "crunch-suelo", name: "Crunch en Suelo" },
    ],
  },
  biceps: {
    compound: [
      { id: "chin-up", name: "Chin-Up" },
      { id: "curl-mochila", name: "Curl con Mochila" },
    ],
    isolation: [
      { id: "remo-invertido", name: "Remo Invertido (supino)" },
    ],
  },
  triceps: {
    compound: [
      { id: "flexiones-diamante", name: "Flexiones Diamante" },
      { id: "fondos-triceps-suelo", name: "Fondos de Triceps en Silla" },
    ],
    isolation: [
      { id: "flexiones-triceps", name: "Flexiones de Triceps" },
    ],
  },
};

// Alias for emphasis system
const EMPHASIS_EXERCISES = GYM_EXERCISES;

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

// Pick random exercises from a pool
function pickExercises(
  pool: { compound: { id: string; name: string }[]; isolation: { id: string; name: string }[] },
  numCompound: number,
  numIsolation: number,
  p: TrainingParams,
): TrainingExercise[] {
  const compounds = pickRandom(pool.compound, numCompound);
  const isolations = pickRandom(pool.isolation, numIsolation);
  return [
    ...compounds.map(e => ex(e.id, e.name, p, true)),
    ...isolations.map(e => ex(e.id, e.name, p, false)),
  ];
}

// Build an emphasis day with more exercises for the target group
function buildEmphasisDay(dayName: string, group: string, variant: "fuerza" | "volumen", p: TrainingParams): TrainingDay {
  const pool = EMPHASIS_EXERCISES[group];
  if (!pool) return { day: dayName, exercises: [], instructions: p.instructions };

  const label = variant === "fuerza" ? "Fuerza" : "Volumen";
  let exercises: TrainingExercise[];

  if (variant === "fuerza") {
    exercises = pickExercises(pool, 2, 2, p);
  } else {
    exercises = pickExercises(pool, 1, Math.min(3, pool.isolation.length), p);
  }

  const groupLabel = group.charAt(0).toUpperCase() + group.slice(1);
  return {
    day: `${dayName} - ${groupLabel} (${label})`,
    instructions: `ENFASIS: ${groupLabel}. ${p.instructions}`,
    exercises,
  };
}

// Cardio options per context
const GYM_CARDIO = [
  { id: "hiit-cinta", name: "HIIT en Cinta" },
  { id: "saltar-cuerda", name: "Saltar la Cuerda" },
  { id: "burpees", name: "Burpees" },
];
const HOME_CARDIO = [
  { id: "hiit-casa", name: "HIIT en Casa" },
  { id: "burpees", name: "Burpees" },
  { id: "jumping-jacks", name: "Jumping Jacks" },
  { id: "high-knees", name: "Rodillas Altas" },
  { id: "saltar-cuerda", name: "Saltar la Cuerda" },
];

const CARDIO_IDS = new Set([
  "hiit-cinta", "hiit-casa", "burpees", "jumping-jacks",
  "high-knees", "saltar-cuerda",
]);

// Add a cardio finisher to every day that doesn't already have one
function addCardioFinisher(plan: TrainingDay[], cardioPool: { id: string; name: string }[], p: TrainingParams): TrainingDay[] {
  return plan.map(day => {
    const hasCardio = day.exercises.some(e => CARDIO_IDS.has(e.id));
    if (hasCardio) return day;
    const cardio = pickRandom(cardioPool, 1)[0];
    return {
      ...day,
      exercises: [...day.exercises, ex(cardio.id, cardio.name, p, false)],
    };
  });
}

export function generateTrainingPlan(
  days: number = 5,
  objective: string = "quema-grasa",
  emphasis: string = "ninguno",
  weightKg: number = 70,
  sex: string = "hombre"
): TrainingDay[] {
  const p = getParams(objective);
  const isHome = objective === "entrenamiento-casa";
  const isBeginner = objective === "principiante-total";

  // For women: default emphasis on glutes/legs if no specific emphasis chosen
  const effectiveEmphasis = (sex === "mujer" && emphasis === "ninguno")
    ? "tren-inferior"
    : emphasis;

  let plan: TrainingDay[];

  if (isBeginner) {
    // Beginners: simpler splits, lower volume, 3 sets
    plan = isHome
      ? generateBeginnerHomePlan(days, p)
      : generateBeginnerPlan(days, p);
  } else if (isHome) {
    plan = generateHomePlan(days, p);
  } else {
    const emphasisGroups = getEmphasisGroups(effectiveEmphasis);
    const hasEmphasis = emphasisGroups.length > 0;
    const primaryGroup = emphasisGroups[0] || "";

    if (!hasEmphasis) {
      plan = generateBalancedPlan(days, p);
    } else {
      plan = generateEmphasisPlan(days, p, primaryGroup, emphasisGroups);
    }
  }

  // Add cardio finisher to every session
  const cardioPool = isHome ? HOME_CARDIO : GYM_CARDIO;
  plan = addCardioFinisher(plan, cardioPool, p);

  // Estimate calories burned per session (Compendium of Physical Activities - Ainsworth 2011)
  return plan.map(day => ({
    ...day,
    estimatedCalories: estimateSessionCalories(day.exercises, weightKg),
  }));
}

// ============================================================
// HOME PLAN — Frequency 2 (bodyweight only)
// ============================================================
function generateHomePlan(days: number, p: TrainingParams): TrainingDay[] {
  const pool = HOME_EXERCISES;

  if (days === 3) {
    return [
      { day: "Dia 1 - Full Body A (Pecho + Biceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 0, p),
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 2 - Full Body B (Espalda + Triceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 3 - Full Body C (Piernas + Hombros)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.hombros, 1, 1, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
    ];
  }

  if (days === 4) {
    return [
      { day: "Dia 1 - Tren Superior A (Pecho + Triceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
        ...pickExercises(pool.hombros, 0, 1, p),
      ]},
      { day: "Dia 2 - Tren Inferior A (Piernas + Abdomen)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
      { day: "Dia 3 - Tren Superior B (Espalda + Biceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 0, p),
        ...pickExercises(pool.hombros, 0, 1, p),
      ]},
      { day: "Dia 4 - Tren Inferior B (Piernas + Abdomen)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
    ];
  }

  if (days === 5) {
    return [
      { day: "Dia 1 - Push (Pecho + Triceps + Hombros)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
        ...pickExercises(pool.hombros, 0, 1, p),
      ]},
      { day: "Dia 2 - Pull (Espalda + Biceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 0, p),
      ]},
      { day: "Dia 3 - Piernas + Abdomen", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
      { day: "Dia 4 - Tren Superior (Pecho + Espalda + Hombros)", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.pecho, 1, 1, p),
        ...pickExercises(pool.espalda, 1, 1, p),
        ...pickExercises(pool.hombros, 1, 0, p),
      ]},
      { day: "Dia 5 - Tren Inferior + Brazos", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 0, p),
        ...pickExercises(pool.triceps, 1, 0, p),
      ]},
    ];
  }

  // 6 days: PPL x2
  return [
    { day: "Dia 1 - Push A (Pecho + Triceps)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 2, 1, p),
      ...pickExercises(pool.triceps, 1, 1, p),
      ...pickExercises(pool.hombros, 0, 1, p),
    ]},
    { day: "Dia 2 - Pull A (Espalda + Biceps)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 1, 0, p),
    ]},
    { day: "Dia 3 - Piernas A + Abdomen", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 2, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
    { day: "Dia 4 - Push B (Hombros + Triceps + Pecho)", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.hombros, 1, 1, p),
      ...pickExercises(pool.pecho, 1, 1, p),
      ...pickExercises(pool.triceps, 1, 0, p),
    ]},
    { day: "Dia 5 - Pull B (Espalda + Biceps)", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 1, 0, p),
    ]},
    { day: "Dia 6 - Piernas B + Abdomen", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 2, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
  ];
}

// ============================================================
// BEGINNER GYM PLAN — Lower volume, Full Body, 3 sets (ACSM 2026 novice)
// ============================================================
function generateBeginnerPlan(days: number, p: TrainingParams): TrainingDay[] {
  const pool = GYM_EXERCISES;

  if (days <= 3) {
    return [
      { day: "Dia 1 - Full Body A", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 1, 0, p),
        ...pickExercises(pool.espalda, 1, 0, p),
        ...pickExercises(pool.piernas, 1, 1, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 2 - Full Body B", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.hombros, 1, 0, p),
        ...pickExercises(pool.espalda, 1, 0, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 3 - Full Body C", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 1, 0, p),
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.espalda, 0, 1, p),
        ...pickExercises(pool.biceps, 0, 1, p),
        ...pickExercises(pool.triceps, 0, 1, p),
      ]},
    ].slice(0, days);
  }

  // 4+ days: still full body but with slightly more focus
  return [
    { day: "Dia 1 - Full Body (Pecho + Espalda)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 1, 1, p),
      ...pickExercises(pool.espalda, 1, 1, p),
      ...pickExercises(pool.abdomen, 0, 1, p),
    ]},
    { day: "Dia 2 - Full Body (Piernas + Hombros)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 1, 2, p),
      ...pickExercises(pool.hombros, 1, 0, p),
      ...pickExercises(pool.abdomen, 0, 1, p),
    ]},
    { day: "Dia 3 - Full Body (Espalda + Brazos)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 1, 0, p),
      ...pickExercises(pool.pecho, 1, 0, p),
      ...pickExercises(pool.biceps, 0, 1, p),
      ...pickExercises(pool.triceps, 0, 1, p),
    ]},
    { day: "Dia 4 - Full Body (Piernas + Core)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 1, 1, p),
      ...pickExercises(pool.hombros, 0, 1, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
  ].slice(0, days);
}

function generateBeginnerHomePlan(days: number, p: TrainingParams): TrainingDay[] {
  const pool = HOME_EXERCISES;

  if (days <= 3) {
    return [
      { day: "Dia 1 - Full Body A", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 1, 0, p),
        ...pickExercises(pool.espalda, 1, 0, p),
        ...pickExercises(pool.piernas, 1, 1, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 2 - Full Body B", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.hombros, 1, 0, p),
        ...pickExercises(pool.espalda, 1, 0, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 3 - Full Body C", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 1, 0, p),
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.biceps, 1, 0, p),
        ...pickExercises(pool.triceps, 1, 0, p),
      ]},
    ].slice(0, days);
  }

  return [
    { day: "Dia 1 - Full Body (Pecho + Espalda)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 1, 1, p),
      ...pickExercises(pool.espalda, 1, 1, p),
      ...pickExercises(pool.abdomen, 0, 1, p),
    ]},
    { day: "Dia 2 - Full Body (Piernas + Hombros)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 1, 2, p),
      ...pickExercises(pool.hombros, 1, 0, p),
      ...pickExercises(pool.abdomen, 0, 1, p),
    ]},
    { day: "Dia 3 - Full Body (Espalda + Brazos)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 1, 0, p),
      ...pickExercises(pool.pecho, 1, 0, p),
      ...pickExercises(pool.biceps, 1, 0, p),
      ...pickExercises(pool.triceps, 1, 0, p),
    ]},
    { day: "Dia 4 - Full Body (Piernas + Core)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 1, 1, p),
      ...pickExercises(pool.hombros, 0, 1, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
  ].slice(0, days);
}

// ============================================================
// GYM balanced plan — Frequency 2 (Schoenfeld 2016 + ACSM 2026)
// Each session: 1 large muscle + 1 small muscle
// Every muscle trained 2x/week
// ============================================================
function generateBalancedPlan(days: number, p: TrainingParams): TrainingDay[] {
  const pool = GYM_EXERCISES;

  // 3 days: Full Body A/B/C — each muscle hit 2-3x/week (ACSM 2026 novice/intermediate)
  if (days === 3) {
    return [
      { day: "Dia 1 - Full Body A (Pecho + Biceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 1, p),
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 2 - Full Body B (Espalda + Triceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
        ...pickExercises(pool.piernas, 1, 0, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
      { day: "Dia 3 - Full Body C (Piernas + Hombros)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.hombros, 1, 1, p),
        ...pickExercises(pool.abdomen, 0, 1, p),
      ]},
    ];
  }

  // 4 days: Upper/Lower x2 — freq 2 built-in (ACSM 2026 intermediate)
  if (days === 4) {
    return [
      { day: "Dia 1 - Tren Superior A (Pecho + Triceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
        ...pickExercises(pool.hombros, 0, 1, p),
      ]},
      { day: "Dia 2 - Tren Inferior A (Piernas + Abdomen)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
      { day: "Dia 3 - Tren Superior B (Espalda + Biceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 1, p),
        ...pickExercises(pool.hombros, 0, 1, p),
      ]},
      { day: "Dia 4 - Tren Inferior B (Piernas + Abdomen)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
    ];
  }

  // 5 days: Push/Pull/Legs/Upper/Lower — freq 2 for all (ACSM 2026 advanced)
  if (days === 5) {
    return [
      { day: "Dia 1 - Push (Pecho + Triceps + Hombros)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.triceps, 0, 1, p),
        ...pickExercises(pool.hombros, 0, 1, p),
      ]},
      { day: "Dia 2 - Pull (Espalda + Biceps)", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 1, p),
      ]},
      { day: "Dia 3 - Piernas + Abdomen", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
      { day: "Dia 4 - Tren Superior (Pecho + Espalda + Hombros)", instructions: "Frecuencia 2: segunda pasada de tren superior. " + p.instructions, exercises: [
        ...pickExercises(pool.pecho, 1, 1, p),
        ...pickExercises(pool.espalda, 1, 1, p),
        ...pickExercises(pool.hombros, 1, 0, p),
      ]},
      { day: "Dia 5 - Tren Inferior + Brazos", instructions: "Frecuencia 2: segunda pasada de piernas y brazos. " + p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 1, p),
        ...pickExercises(pool.biceps, 0, 1, p),
        ...pickExercises(pool.triceps, 0, 1, p),
      ]},
    ];
  }

  // 6 days: Push/Pull/Legs x2 — perfect freq 2 (Schoenfeld 2016 optimal)
  return [
    { day: "Dia 1 - Push A (Pecho + Triceps)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 2, 1, p),
      ...pickExercises(pool.triceps, 1, 1, p),
      ...pickExercises(pool.hombros, 0, 1, p),
    ]},
    { day: "Dia 2 - Pull A (Espalda + Biceps)", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 1, 1, p),
    ]},
    { day: "Dia 3 - Piernas A + Abdomen", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 2, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
    { day: "Dia 4 - Push B (Hombros + Triceps + Pecho)", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.hombros, 1, 1, p),
      ...pickExercises(pool.pecho, 1, 1, p),
      ...pickExercises(pool.triceps, 0, 1, p),
    ]},
    { day: "Dia 5 - Pull B (Espalda + Biceps)", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 1, 1, p),
    ]},
    { day: "Dia 6 - Piernas B + Abdomen", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 2, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
  ];
}

// ============================================================
// EMPHASIS plan (randomized)
// ============================================================
function generateEmphasisPlan(days: number, p: TrainingParams, primary: string, allGroups: string[]): TrainingDay[] {
  const emphasisDay1 = buildEmphasisDay("Dia 1", primary, "fuerza", p);
  const emphasisDay2 = buildEmphasisDay(`Dia ${Math.min(days, 4)}`, primary, "volumen", p);

  const pool = GYM_EXERCISES;
  const otherDays: TrainingDay[] = [];

  if (primary !== "pecho" && primary !== "espalda") {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 2, 1, p),
      ...pickExercises(pool.triceps, 0, 1, p),
    ]});
    otherDays.push({ day: "Dia 3 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 0, 1, p),
    ]});
  }
  if (primary === "pecho") {
    otherDays.push({ day: "Dia 2 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 0, 1, p),
    ]});
    otherDays.push({ day: "Dia 3 - Piernas", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 1, p),
      ...pickExercises(pool.abdomen, 0, 1, p),
    ]});
  }
  if (primary === "espalda") {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 2, 1, p),
      ...pickExercises(pool.triceps, 0, 1, p),
    ]});
    otherDays.push({ day: "Dia 3 - Piernas", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 1, p),
      ...pickExercises(pool.abdomen, 0, 1, p),
    ]});
  }
  if (primary !== "piernas") {
    if (!otherDays.some(d => d.day.includes("Piernas"))) {
      otherDays.push({ day: `Dia ${otherDays.length + 2} - Piernas`, instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
      ]});
    }
  } else {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 2, 1, p),
      ...pickExercises(pool.triceps, 0, 1, p),
    ]});
    otherDays.push({ day: "Dia 3 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 0, 1, p),
    ]});
  }

  const plan: TrainingDay[] = [emphasisDay1, ...otherDays.slice(0, 2), emphasisDay2];

  const cardioOptions = [
    { id: "hiit-cinta", name: "HIIT en Cinta" },
    { id: "saltar-cuerda", name: "Saltar la Cuerda" },
    { id: "burpees", name: "Burpees" },
  ];

  if (days >= 5) {
    plan.push({ day: `Dia 5 - Hombros y Abdomen`, instructions: p.instructions, exercises: [
      ...pickExercises(pool.hombros, 1, 2, p),
      ...pickExercises(pool.abdomen, 0, 2, p),
    ]});
  }
  if (days >= 6) {
    const cardio = pickRandom(cardioOptions, 1)[0];
    plan.push({ day: "Dia 6 - Full Body + Cardio", instructions: "Circuito. " + p.instructions, exercises: [
      ...pickExercises(pool.piernas, 1, 0, { ...p, sets: 3 }),
      ...pickExercises(pool.pecho, 1, 0, { ...p, sets: 3 }),
      ...pickExercises(pool.espalda, 1, 0, { ...p, sets: 3 }),
      ex(cardio.id, cardio.name, p, false),
    ]});
  }

  return plan.slice(0, days).map((d, i) => ({
    ...d,
    day: d.day.replace(/Dia \d+/, `Dia ${i + 1}`),
  }));
}
