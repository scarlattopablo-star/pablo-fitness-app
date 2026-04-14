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

// Advanced training methods with explanations
// Sources: NSCA Foundations of Fitness Programming, Schoenfeld (2018), ACSM Position Stand (2009)
export type TrainingMethod = 'standard' | 'superset' | 'giant-set' | 'drop-set' | 'pyramid' | 'rest-pause' | 'cluster';

export const TRAINING_METHOD_INFO: Record<TrainingMethod, { name: string; explanation: string; objectives: string[] }> = {
  'standard': {
    name: 'Series Normales',
    explanation: 'Haces todas las series de un ejercicio con descanso entre cada una antes de pasar al siguiente.',
    objectives: ['principiante-total', 'entrenamiento-casa', 'tonificacion', 'post-parto'],
  },
  'superset': {
    name: 'Super Serie',
    explanation: 'Dos ejercicios seguidos sin descanso entre ellos (ej: biceps + triceps). Descansas solo despues de completar ambos. Ahorra tiempo y aumenta la intensidad.',
    objectives: ['ganancia-muscular', 'quema-grasa', 'recomposicion-corporal', 'tonificacion'],
  },
  'giant-set': {
    name: 'Serie Gigante',
    explanation: '3 o mas ejercicios del mismo musculo ejecutados sin pausa. Descansas 2-3 min despues de completar todos. Genera un gran bombeo muscular.',
    objectives: ['ganancia-muscular', 'quema-grasa'],
  },
  'drop-set': {
    name: 'Serie Descendente (Drop Set)',
    explanation: 'Haces reps hasta el fallo, bajas el peso un 20-25% y seguis sin descanso. Podes hacer 2-3 bajadas. Ideal para el ultimo ejercicio de cada musculo.',
    objectives: ['ganancia-muscular', 'tonificacion', 'recomposicion-corporal'],
  },
  'pyramid': {
    name: 'Piramidal',
    explanation: 'Empezas con peso liviano y muchas reps, cada serie subis el peso y bajas las reps (ej: 15, 12, 10, 8). Permite calentar progresivamente y llegar al maximo.',
    objectives: ['fuerza-funcional', 'ganancia-muscular', 'competicion', 'rendimiento-deportivo'],
  },
  'rest-pause': {
    name: 'Rest-Pause (Pausa-Descanso)',
    explanation: 'Haces reps hasta casi el fallo, descansas 15-20 segundos, y seguis con mas reps con el mismo peso. Repetis 2-3 veces. Acumulas mas volumen en menos tiempo.',
    objectives: ['ganancia-muscular', 'fuerza-funcional'],
  },
  'cluster': {
    name: 'Series Cluster',
    explanation: 'Dividis una serie larga en mini-series de 2-3 reps con 15-20s de pausa entre ellas. Permite mantener la fuerza y la tecnica con pesos altos.',
    objectives: ['fuerza-funcional', 'competicion', 'rendimiento-deportivo'],
  },
};

export interface TrainingExercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
  method?: TrainingMethod;
  methodExplanation?: string;
  pairedWith?: string; // exercise name for supersets
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
    case "kitesurf":
      return { sets: 4, reps: "10-15", restCompound: "75s", restIsolation: "45s", instructions: "Resistencia muscular y estabilidad. Core activado en todo momento. Movimientos controlados y funcionales." };
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
      { id: "press-mancuernas-plano", name: "Press Mancuernas Plano" },
      { id: "press-mancuernas-inclinado", name: "Press Mancuernas Inclinado" },
      { id: "flexiones", name: "Flexiones de Brazos" },
    ],
    isolation: [
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas" },
      { id: "apertura-mancuerna-plano", name: "Apertura Mancuerna Plano" },
      { id: "cruces-polea", name: "Cruces en Polea" },
      { id: "flexiones-diamante", name: "Flexiones Diamante" },
      { id: "flexiones-abiertas", name: "Flexiones Abiertas" },
      { id: "press-suelo-unilateral", name: "Press Suelo Unilateral" },
    ],
  },
  espalda: {
    compound: [
      { id: "jalon-polea-alta", name: "Jalon Polea Alta" },
      { id: "remo-con-barra", name: "Remo con Barra" },
      { id: "dominadas", name: "Dominadas" },
      { id: "remo-polea-baja", name: "Remo en Polea Baja" },
      { id: "remo-t", name: "Remo en T" },
    ],
    isolation: [
      { id: "remo-mancuerna", name: "Remo Mancuerna" },
      { id: "pullover-mancuerna", name: "Pullover con Mancuerna" },
      { id: "face-pull", name: "Face Pull" },
      { id: "remo-posterior-cable", name: "Remo Posterior Cable" },
      { id: "remo-cable-unilateral", name: "Remo Unilateral Cable" },
      { id: "remo-barra-unilateral", name: "Remo Unilateral Barra" },
    ],
  },
  piernas: {
    compound: [
      { id: "sentadilla", name: "Sentadilla con Barra" },
      { id: "prensa-piernas", name: "Prensa de Piernas" },
      { id: "peso-muerto", name: "Peso Muerto" },
      { id: "hip-thrust", name: "Hip Thrust" },
      { id: "hack-squat", name: "Hack Squat" },
      { id: "peso-muerto-rumano", name: "Peso Muerto Rumano" },
      { id: "sentadilla-goblet", name: "Sentadilla Goblet" },
      { id: "sentadilla-smith", name: "Sentadilla en Smith" },
      { id: "sentadilla-frontal", name: "Sentadilla Frontal" },
      { id: "peso-muerto-sumo", name: "Peso Muerto Sumo" },
      { id: "hip-thrust-barbell", name: "Hip Thrust con Barra" },
    ],
    isolation: [
      { id: "zancadas", name: "Zancadas" },
      { id: "zancadas-mancuerna", name: "Zancadas con Mancuerna" },
      { id: "sentadilla-bulgara", name: "Sentadilla Bulgara" },
      { id: "split-squat-mancuerna", name: "Split Squat Mancuerna" },
      { id: "peso-muerto-unilateral", name: "Peso Muerto a Una Pierna" },
      { id: "sentadilla-unilateral", name: "Sentadilla a Una Pierna" },
      { id: "pantorrilla-unilateral", name: "Pantorrilla a Una Pierna" },
      { id: "extension-cuadriceps", name: "Extension Cuadriceps" },
      { id: "curl-femoral", name: "Curl Femoral" },
      { id: "zancadas-atras", name: "Zancadas Inversas" },
      { id: "elevacion-pantorrillas", name: "Elevacion de Pantorrillas" },
      { id: "pantorrilla-sentado", name: "Pantorrilla Sentado" },
      { id: "buenos-dias", name: "Buenos Dias" },
      { id: "abduccion-cadera", name: "Abduccion de Cadera" },
      { id: "aduccion-cadera", name: "Aduccion de Cadera" },
      { id: "extension-cadera-polea", name: "Extension Cadera en Polea" },
      { id: "patada-gluteo", name: "Patada de Gluteo" },
      { id: "zancadas-caminando", name: "Zancadas Caminando" },
      { id: "curl-femoral-pie", name: "Curl Femoral de Pie" },
      { id: "peso-muerto-mancuerna", name: "Peso Muerto con Mancuernas" },
      { id: "aduccion-cable", name: "Aduccion Cadera en Polea" },
    ],
  },
  hombros: {
    compound: [
      { id: "press-hombros", name: "Press Hombros" },
      { id: "press-arnold", name: "Press Arnold" },
    ],
    isolation: [
      { id: "elevaciones-laterales", name: "Elevaciones Laterales" },
      { id: "elevacion-lateral-cable", name: "Elevacion Lateral Cable" },
      { id: "face-pull", name: "Face Pull" },
      { id: "elevaciones-frontales", name: "Elevaciones Frontales" },
      { id: "elevacion-posterior", name: "Elevacion Posterior" },
      { id: "elevacion-posterior-mancuerna", name: "Pajaro con Mancuerna" },
      { id: "encogimientos-trapecio", name: "Encogimientos Trapecio" },
    ],
  },
  abdomen: {
    compound: [
      { id: "elevacion-piernas", name: "Elevacion de Piernas" },
      { id: "v-up", name: "V-Up" },
      { id: "rueda-abdominal", name: "Rueda Abdominal" },
    ],
    isolation: [
      { id: "plancha", name: "Plancha" },
      { id: "crunch-polea", name: "Crunch en Polea" },
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
      { id: "chin-up", name: "Dominadas Supino" },
    ],
    isolation: [
      { id: "curl-martillo", name: "Curl Martillo" },
      { id: "curl-concentrado", name: "Curl Concentrado" },
      { id: "curl-scott", name: "Curl Banco Scott" },
      { id: "curl-cable", name: "Curl en Cable" },
      { id: "curl-inclinado-martillo", name: "Curl Inclinado Martillo" },
      { id: "curl-reverso", name: "Curl Reverso" },
    ],
  },
  triceps: {
    compound: [
      { id: "fondos-triceps", name: "Fondos de Triceps" },
      { id: "press-frances", name: "Press Frances" },
      { id: "fondos-paralelas", name: "Fondos en Paralelas" },
    ],
    isolation: [
      { id: "extension-triceps-polea", name: "Extension Triceps Polea" },
      { id: "extension-triceps-overhead", name: "Extension Overhead" },
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
      { id: "zancadas-caminando", name: "Zancadas Caminando" },
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
      { id: "donkey-kicks", name: "Donkey Kicks" },
      { id: "fire-hydrants", name: "Fire Hydrants" },
      { id: "abduccion-cuerpo", name: "Abduccion Cadera Lateral" },
      { id: "hip-thrust-banda", name: "Hip Thrust con Banda" },
      { id: "elevacion-cadera-banco", name: "Elevacion Cadera en Banco" },
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
      { id: "chin-up", name: "Dominadas Supino" },
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

// Pick random exercises from a pool, excluding already-used IDs within the session
function pickExercises(
  pool: { compound: { id: string; name: string }[]; isolation: { id: string; name: string }[] },
  numCompound: number,
  numIsolation: number,
  p: TrainingParams,
  usedIds?: Set<string>,
): TrainingExercise[] {
  const available = {
    compound: usedIds ? pool.compound.filter(e => !usedIds.has(e.id)) : pool.compound,
    isolation: usedIds ? pool.isolation.filter(e => !usedIds.has(e.id)) : pool.isolation,
  };
  const compounds = pickRandom(available.compound, numCompound);
  const isolations = pickRandom(available.isolation, numIsolation);
  // Track picked IDs
  if (usedIds) {
    compounds.forEach(e => usedIds.add(e.id));
    isolations.forEach(e => usedIds.add(e.id));
  }
  return [
    ...compounds.map(e => ex(e.id, e.name, p, true)),
    ...isolations.map(e => ex(e.id, e.name, p, false)),
  ];
}

// ============================================================
// ADVANCED TRAINING METHODS — Applied based on objective
// Sources: NSCA, Schoenfeld (2018), ACSM Position Stand (2009)
// ============================================================
function getMethodsForObjective(objective: string): TrainingMethod[] {
  switch (objective) {
    case "ganancia-muscular":
      return ['superset', 'drop-set', 'rest-pause', 'giant-set', 'pyramid'];
    case "fuerza-funcional":
    case "competicion":
    case "rendimiento-deportivo":
      return ['pyramid', 'cluster', 'rest-pause'];
    case "quema-grasa":
    case "recomposicion-corporal":
      return ['superset', 'giant-set', 'drop-set'];
    case "tonificacion":
      return ['superset', 'drop-set'];
    case "principiante-total":
    case "entrenamiento-casa":
    case "post-parto":
    case "kitesurf":
      return ['standard'];
    default:
      return ['superset', 'drop-set'];
  }
}

function applyAdvancedMethods(plan: TrainingDay[], objective: string): TrainingDay[] {
  const availableMethods = getMethodsForObjective(objective);

  // Beginners/home/kitesurf: no advanced methods
  if (availableMethods.length === 1 && availableMethods[0] === 'standard') return plan;

  return plan.map(day => {
    const exercises = [...day.exercises];
    const nonCardio = exercises.filter(e => !CARDIO_IDS_SET.has(e.id) && !TIME_BASED_IDS.has(e.id));

    if (nonCardio.length < 4) return day;

    // Pick 1-2 methods per session to keep variety
    const sessionMethods = pickRandom(availableMethods, Math.min(2, availableMethods.length));

    for (const method of sessionMethods) {
      const info = TRAINING_METHOD_INFO[method];

      switch (method) {
        case 'superset': {
          // Pair exercises 1+2 as a superset (typically agonist-antagonist)
          const e1 = nonCardio[0];
          const e2 = nonCardio[1];
          if (e1 && e2) {
            const idx1 = exercises.findIndex(e => e.id === e1.id);
            const idx2 = exercises.findIndex(e => e.id === e2.id);
            if (idx1 >= 0) exercises[idx1] = { ...exercises[idx1], method: 'superset', methodExplanation: info.explanation, pairedWith: e2.name, rest: '0s', notes: `SUPER SERIE con ${e2.name}: hace ambos ejercicios seguidos, descansa 60-90s despues de completar los dos.` };
            if (idx2 >= 0) exercises[idx2] = { ...exercises[idx2], method: 'superset', pairedWith: e1.name, rest: '60s', notes: `(Parte 2 de Super Serie con ${e1.name})` };
          }
          break;
        }
        case 'drop-set': {
          // Apply to last isolation exercise
          const lastIso = [...nonCardio].reverse().find(e => exercises.find(ex => ex.id === e.id));
          if (lastIso) {
            const idx = exercises.findIndex(e => e.id === lastIso.id);
            if (idx >= 0) exercises[idx] = { ...exercises[idx], method: 'drop-set', methodExplanation: info.explanation, notes: `DROP SET: al terminar las reps, baja el peso 20-25% y segui sin descanso. Repeti 2-3 veces. Solo en la ultima serie.` };
          }
          break;
        }
        case 'pyramid': {
          // Apply to first compound exercise
          const firstCompound = nonCardio[0];
          if (firstCompound) {
            const idx = exercises.findIndex(e => e.id === firstCompound.id);
            if (idx >= 0) exercises[idx] = { ...exercises[idx], method: 'pyramid', methodExplanation: info.explanation, reps: '15, 12, 10, 8', sets: 4, notes: `PIRAMIDAL: Serie 1: peso liviano x15. Serie 2: subi peso x12. Serie 3: mas peso x10. Serie 4: peso maximo x8.` };
          }
          break;
        }
        case 'rest-pause': {
          // Apply to a compound exercise (2nd or 3rd)
          const target = nonCardio[2] || nonCardio[1];
          if (target) {
            const idx = exercises.findIndex(e => e.id === target.id);
            if (idx >= 0) exercises[idx] = { ...exercises[idx], method: 'rest-pause', methodExplanation: info.explanation, notes: `REST-PAUSE: hace reps hasta casi el fallo, descansa 15-20s, segui con mas reps. Repeti 2-3 veces. Usa el mismo peso.` };
          }
          break;
        }
        case 'cluster': {
          // Apply to first heavy compound
          const firstCompound = nonCardio[0];
          if (firstCompound) {
            const idx = exercises.findIndex(e => e.id === firstCompound.id);
            if (idx >= 0) exercises[idx] = { ...exercises[idx], method: 'cluster', methodExplanation: info.explanation, reps: '2+2+2 (x4)', sets: 4, rest: '15s entre clusters, 3min entre series', notes: `CLUSTER: hace 2 reps, descansa 15s, hace 2 mas, descansa 15s, hace 2 mas. Eso es 1 serie. Descansa 3min y repeti.` };
          }
          break;
        }
        case 'giant-set': {
          // Group 3 exercises for the same muscle
          if (nonCardio.length >= 5) {
            const e1 = nonCardio[0], e2 = nonCardio[1], e3 = nonCardio[2];
            const idx1 = exercises.findIndex(e => e.id === e1.id);
            if (idx1 >= 0) exercises[idx1] = { ...exercises[idx1], method: 'giant-set', methodExplanation: info.explanation, rest: '0s', notes: `SERIE GIGANTE: hace ${e1.name} + ${e2.name} + ${e3.name} sin descanso entre ellos. Descansa 2-3 min al completar los 3.` };
            const idx2 = exercises.findIndex(e => e.id === e2.id);
            if (idx2 >= 0) exercises[idx2] = { ...exercises[idx2], method: 'giant-set', rest: '0s', notes: `(Parte 2 de Serie Gigante)` };
            const idx3 = exercises.findIndex(e => e.id === e3.id);
            if (idx3 >= 0) exercises[idx3] = { ...exercises[idx3], method: 'giant-set', rest: '2-3min', notes: `(Parte 3 de Serie Gigante — descansa 2-3 min)` };
          }
          break;
        }
      }
    }

    return { ...day, exercises };
  });
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

// Volume config based on activity level — determines exercises per muscle group per session
// Progresses from less volume (sedentario) to more volume (muy-activo)
interface VolumeConfig {
  compoundMain: number;  // compound exercises for the primary (large) muscle
  isolationMain: number; // isolation exercises for the primary (large) muscle
  compoundSmall: number; // compound exercises for the secondary (small) muscle
  isolationSmall: number; // isolation exercises for the secondary (small) muscle
}

function getVolumeConfig(activityLevel: string, sex: string = "hombre"): VolumeConfig {
  // Large muscles (piernas, gluteos, espalda, pecho, hombros): 4-5 exercises
  // Always 8 exercises per session: 5 large muscle + 3 small muscle
  // Rest: large muscles need 2 days rest, small muscles need 1 day rest
  return {
    compoundMain: 3,     // 3 compound for large muscle
    isolationMain: 2,    // 2 isolation for large muscle = 5 total
    compoundSmall: 2,    // 2 compound for small muscle
    isolationSmall: 1,   // 1 isolation for small muscle = 3 total
  };
}

// ============================================================
// KITESURF — Sport-specific exercise pool with performance notes
// ============================================================
interface KitesurfExercise { id: string; name: string; note: string }
const KITESURF_POOL: Record<string, { compound: KitesurfExercise[]; isolation: KitesurfExercise[] }> = {
  abdomen: {
    compound: [
      { id: "rueda-abdominal", name: "Rueda Abdominal", note: "Core explosivo — estabiliza el torso contra la traccion de la cometa" },
      { id: "v-up", name: "V-Up", note: "Fuerza abdominal para mantener postura en saltos y aterrizajes" },
      { id: "pallof-press", name: "Pallof Press", note: "Anti-rotacion — resiste el tirón lateral de la cometa" },
      { id: "woodchop-polea", name: "Wood Chop en Polea", note: "Potencia rotacional para giros y maniobras" },
      { id: "turkish-getup", name: "Turkish Get-Up", note: "Estabilidad total del cuerpo — levantarse en la tabla tras caidas" },
    ],
    isolation: [
      { id: "plancha", name: "Plancha", note: "Resistencia del core para sesiones largas en el agua" },
      { id: "plancha-lateral", name: "Plancha Lateral", note: "Estabilidad lateral — controlar la tabla con las piernas" },
      { id: "bird-dog", name: "Bird Dog", note: "Coordinacion contralateral — equilibrio dinámico en la tabla" },
      { id: "stir-the-pot", name: "Stir the Pot", note: "Anti-extension y anti-rotacion — core funcional avanzado" },
      { id: "hollow-hold", name: "Hollow Hold", note: "Posicion corporal compacta para saltos y rotaciones" },
    ],
  },
  espalda: {
    compound: [
      { id: "dominadas", name: "Dominadas", note: "Fuerza de traccion — controlar y dirigir la barra de kite" },
      { id: "remo-con-barra", name: "Remo con Barra", note: "Tirón horizontal — resistir la fuerza de la cometa" },
      { id: "renegade-row", name: "Renegade Row", note: "Anti-rotacion + traccion — core y espalda al mismo tiempo" },
      { id: "remo-polea-baja", name: "Remo Polea Baja", note: "Retraccion escapular — proteccion de hombros en traccion" },
    ],
    isolation: [
      { id: "dead-hang", name: "Dead Hang", note: "Resistencia de agarre — aguantar la barra en sesiones largas" },
      { id: "farmer-walk", name: "Farmer Walk", note: "Agarre bajo fatiga + core — simula sesiones prolongadas" },
      { id: "towel-pull-up", name: "Dominadas con Toalla", note: "Agarre inestable — replica el grip de la barra de kite" },
      { id: "face-pull", name: "Face Pull", note: "Salud de hombros — compensa la traccion frontal constante" },
    ],
  },
  piernas: {
    compound: [
      { id: "sentadilla", name: "Sentadilla", note: "Fuerza de base — absorber impactos y mantener postura en la tabla" },
      { id: "peso-muerto-rumano", name: "Peso Muerto Rumano", note: "Cadena posterior — estabilidad de cadera en posicion de navegacion" },
      { id: "single-leg-rdl", name: "Peso Muerto Rumano a Una Pierna", note: "Equilibrio unilateral — control de la tabla con una pierna dominante" },
      { id: "zancadas", name: "Zancadas", note: "Fuerza unilateral — estabilizar al aterrizar tras saltos" },
    ],
    isolation: [
      { id: "bosu-squat", name: "Sentadilla en Bosu", note: "Propiocepcion — simula la inestabilidad de la tabla en el agua" },
      { id: "sentadilla-bulgara", name: "Sentadilla Bulgara", note: "Fuerza y equilibrio unilateral de piernas" },
      { id: "elevacion-pantorrillas", name: "Elevación de Pantorrillas", note: "Estabilidad del tobillo — control fino de la tabla" },
    ],
  },
  hombros: {
    compound: [
      { id: "press-hombros", name: "Press de Hombros", note: "Fuerza overhead — controlar la cometa en posicion alta" },
      { id: "landmine-press", name: "Landmine Press", note: "Empuje angular seguro — patron de movimiento del kitesurf" },
    ],
    isolation: [
      { id: "elevaciones-laterales", name: "Elevaciones Laterales", note: "Estabilidad del deltoides — soporte de la articulacion del hombro" },
      { id: "band-pull-apart", name: "Band Pull Apart", note: "Manguito rotador — prevencion de lesiones por traccion repetida" },
      { id: "external-rotation", name: "Rotación Externa con Banda", note: "Rotador externo — la lesion #1 en kitesurf es el hombro" },
    ],
  },
  pecho: {
    compound: [
      { id: "press-banca-plano", name: "Press Banca Plano", note: "Fuerza de empuje — estabilidad del tren superior" },
      { id: "flexiones", name: "Flexiones de Brazos", note: "Empuje funcional + core — patron de movimiento completo" },
    ],
    isolation: [
      { id: "aperturas-inclinadas", name: "Aperturas Inclinadas", note: "Apertura pectoral — rango de movimiento para brazos con la cometa" },
    ],
  },
  biceps: {
    compound: [
      { id: "curl-biceps-barra", name: "Curl Bíceps Barra", note: "Fuerza de flexion — complementa el agarre de la barra" },
    ],
    isolation: [
      { id: "curl-martillo", name: "Curl Martillo", note: "Braquiorradial — fuerza del antebrazo para el grip" },
    ],
  },
  triceps: {
    compound: [
      { id: "fondos-triceps", name: "Fondos de Tríceps", note: "Extensión de brazos — empujar y controlar la barra" },
    ],
    isolation: [
      { id: "extension-triceps-polea", name: "Extensión Tríceps Polea", note: "Aislamiento del tríceps — soporte de la articulación del codo" },
    ],
  },
};

// Build a kitesurf exercise with its performance note
function exKite(e: KitesurfExercise, p: TrainingParams, compound: boolean): TrainingExercise & { notes?: string } {
  const base = ex(e.id, e.name, p, compound);
  return { ...base, notes: e.note };
}

function pickKitesurfExercises(
  pool: { compound: KitesurfExercise[]; isolation: KitesurfExercise[] },
  numCompound: number, numIsolation: number, p: TrainingParams
): (TrainingExercise & { notes?: string })[] {
  const compounds = pickRandom(pool.compound, numCompound);
  const isolations = pickRandom(pool.isolation, numIsolation);
  return [
    ...compounds.map(e => exKite(e, p, true)),
    ...isolations.map(e => exKite(e, p, false)),
  ];
}

function generateKitesurfPlan(days: number, p: TrainingParams, vol: VolumeConfig): TrainingDay[] {
  const kp = KITESURF_POOL;

  if (days === 3) {
    // Full body sessions with kitesurf priority
    return [
      { day: "Dia 1 - Core + Espalda + Grip",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.abdomen, 2, 1, p),
          ...pickKitesurfExercises(kp.espalda, 2, 2, p),
          ...pickKitesurfExercises(kp.hombros, 0, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 2 - Piernas + Equilibrio + Core",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.piernas, 3, 2, p),
          ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
          ...pickKitesurfExercises(kp.hombros, 0, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 3 - Upper Body + Rotacional",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.espalda, 2, 1, p),
          ...pickKitesurfExercises(kp.pecho, 1, 1, p),
          ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
          ...pickKitesurfExercises(kp.biceps, 1, 0, p),
        ] as TrainingExercise[] },
    ];
  }

  if (days === 4) {
    return [
      { day: "Dia 1 - Core + Grip",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.abdomen, 3, 2, p),
          ...pickKitesurfExercises(kp.espalda, 0, 3, p), // grip-focused: dead-hang, farmer, towel
        ] as TrainingExercise[] },
      { day: "Dia 2 - Piernas + Equilibrio",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.piernas, 3, 2, p),
          ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
          ...pickKitesurfExercises(kp.hombros, 0, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 3 - Pull + Hombros",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.espalda, 3, 1, p),
          ...pickKitesurfExercises(kp.hombros, 1, 2, p),
          ...pickKitesurfExercises(kp.biceps, 1, 0, p),
        ] as TrainingExercise[] },
      { day: "Dia 4 - Full Body Funcional",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.abdomen, 2, 1, p),
          ...pickKitesurfExercises(kp.pecho, 1, 1, p),
          ...pickKitesurfExercises(kp.piernas, 1, 1, p),
          ...pickKitesurfExercises(kp.triceps, 1, 0, p),
        ] as TrainingExercise[] },
    ];
  }

  if (days === 5) {
    return [
      { day: "Dia 1 - Core + Anti-rotacion",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.abdomen, 3, 2, p),
          ...pickKitesurfExercises(kp.espalda, 0, 2, p),
          ...pickKitesurfExercises(kp.hombros, 0, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 2 - Piernas + Equilibrio",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.piernas, 3, 2, p),
          ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
          ...pickKitesurfExercises(kp.hombros, 0, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 3 - Pull + Grip",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.espalda, 3, 2, p),
          ...pickKitesurfExercises(kp.biceps, 1, 1, p),
          ...pickKitesurfExercises(kp.hombros, 0, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 4 - Push + Core",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.pecho, 2, 1, p),
          ...pickKitesurfExercises(kp.hombros, 1, 1, p),
          ...pickKitesurfExercises(kp.triceps, 1, 0, p),
          ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
        ] as TrainingExercise[] },
      { day: "Dia 5 - Full Body Funcional",
        instructions: "KITESURF: " + p.instructions,
        exercises: [
          ...pickKitesurfExercises(kp.piernas, 2, 1, p),
          ...pickKitesurfExercises(kp.espalda, 1, 1, p),
          ...pickKitesurfExercises(kp.abdomen, 2, 1, p),
        ] as TrainingExercise[] },
    ];
  }

  // 6 days: PPL x2 with kitesurf focus
  return [
    { day: "Dia 1 - Core + Grip",
      instructions: "KITESURF: " + p.instructions,
      exercises: [
        ...pickKitesurfExercises(kp.abdomen, 3, 2, p),
        ...pickKitesurfExercises(kp.espalda, 0, 3, p),
      ] as TrainingExercise[] },
    { day: "Dia 2 - Piernas + Equilibrio",
      instructions: "KITESURF: " + p.instructions,
      exercises: [
        ...pickKitesurfExercises(kp.piernas, 3, 2, p),
        ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
        ...pickKitesurfExercises(kp.hombros, 0, 1, p),
      ] as TrainingExercise[] },
    { day: "Dia 3 - Pull + Hombros",
      instructions: "KITESURF: " + p.instructions,
      exercises: [
        ...pickKitesurfExercises(kp.espalda, 3, 1, p),
        ...pickKitesurfExercises(kp.hombros, 1, 2, p),
        ...pickKitesurfExercises(kp.biceps, 1, 0, p),
      ] as TrainingExercise[] },
    { day: "Dia 4 - Core + Rotacional",
      instructions: "KITESURF: " + p.instructions,
      exercises: [
        ...pickKitesurfExercises(kp.abdomen, 3, 2, p),
        ...pickKitesurfExercises(kp.pecho, 1, 1, p),
        ...pickKitesurfExercises(kp.triceps, 1, 0, p),
      ] as TrainingExercise[] },
    { day: "Dia 5 - Piernas + Unilateral",
      instructions: "KITESURF: " + p.instructions,
      exercises: [
        ...pickKitesurfExercises(kp.piernas, 2, 3, p),
        ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
        ...pickKitesurfExercises(kp.hombros, 0, 1, p),
      ] as TrainingExercise[] },
    { day: "Dia 6 - Full Body Funcional",
      instructions: "KITESURF: " + p.instructions,
      exercises: [
        ...pickKitesurfExercises(kp.espalda, 2, 1, p),
        ...pickKitesurfExercises(kp.pecho, 1, 0, p),
        ...pickKitesurfExercises(kp.abdomen, 1, 1, p),
        ...pickKitesurfExercises(kp.piernas, 1, 0, p),
        ...pickKitesurfExercises(kp.biceps, 0, 1, p),
      ] as TrainingExercise[] },
  ];
}

export function generateTrainingPlan(
  days: number = 5,
  objective: string = "quema-grasa",
  emphasis: string = "ninguno",
  weightKg: number = 70,
  sex: string = "hombre",
  activityLevel: string = "moderado"
): TrainingDay[] {
  const p = getParams(objective);
  const isHome = objective === "entrenamiento-casa";
  const isBeginner = objective === "principiante-total";
  const vol = getVolumeConfig(isBeginner ? "sedentario" : activityLevel, sex);

  // For women: default emphasis on glutes/legs if no specific emphasis chosen
  const effectiveEmphasis = (sex === "mujer" && emphasis === "ninguno")
    ? "tren-inferior"
    : emphasis;

  // Filter exercises by sex
  if (sex === "hombre") {
    // Hip-thrust only for women
    GYM_EXERCISES.piernas.compound = GYM_EXERCISES.piernas.compound.filter(e => e.id !== "hip-thrust");
  } else {
    // Ensure hip-thrust is in the pool for women
    if (!GYM_EXERCISES.piernas.compound.some(e => e.id === "hip-thrust")) {
      GYM_EXERCISES.piernas.compound.push({ id: "hip-thrust", name: "Hip Thrust" });
    }
    // No dominadas for women
    GYM_EXERCISES.espalda.compound = GYM_EXERCISES.espalda.compound.filter(e => e.id !== "dominadas");
  }

  let plan: TrainingDay[];

  if (objective === "kitesurf") {
    plan = generateKitesurfPlan(days, p, vol);
  } else if (isBeginner) {
    plan = isHome
      ? generateBeginnerHomePlan(days, p)
      : generateBeginnerPlan(days, p);
  } else if (isHome) {
    plan = generateHomePlan(days, p, vol);
  } else {
    const emphasisGroups = getEmphasisGroups(effectiveEmphasis);
    const hasEmphasis = emphasisGroups.length > 0;
    const primaryGroup = emphasisGroups[0] || "";

    if (!hasEmphasis) {
      plan = generateBalancedPlan(days, p, vol, sex);
    } else {
      plan = generateEmphasisPlan(days, p, primaryGroup, emphasisGroups, vol, sex);
    }
  }

  // Women upper body reduction is now handled by the plan structure itself
  // (women get 1 large + 2 small muscles per session, with piernas as primary focus)

  // Remove duplicate exercises within each session
  plan = plan.map(day => {
    const seen = new Set<string>();
    return {
      ...day,
      exercises: day.exercises.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      }),
    };
  });

  // Apply advanced training methods based on objective
  // Sources: NSCA, Schoenfeld (2018) Strength & Conditioning Journal, ACSM (2009)
  plan = applyAdvancedMethods(plan, objective);

  // Order is already correct from pickExercises:
  // 1. Large muscle (compounds then isolations)
  // 2. Small muscle (compounds then isolations)
  // 3. Cardio at the end
  // No reordering needed — muscles stay grouped together

  // Enforce exactly 8 exercises per session (excluding cardio finisher)
  const isKitesurf = objective === "kitesurf";
  const exercisePool = isHome ? HOME_EXERCISES : GYM_EXERCISES;
  plan = plan.map(day => {
    const nonCardio = day.exercises.filter(e => !CARDIO_IDS_SET.has(e.id));
    const cardio = day.exercises.filter(e => CARDIO_IDS_SET.has(e.id));
    if (nonCardio.length > 8) {
      return { ...day, exercises: [...nonCardio.slice(0, 8), ...cardio] };
    }
    // If less than 8, fill with abdomen exercises to reach 8
    if (nonCardio.length < 8) {
      const needed = 8 - nonCardio.length;
      const usedIds = new Set(nonCardio.map(e => e.id));
      const abPoolSrc = isKitesurf ? KITESURF_POOL.abdomen : exercisePool.abdomen;
      const abPool = [...abPoolSrc.compound, ...abPoolSrc.isolation]
        .filter(e => !usedIds.has(e.id));
      const extras = pickRandom(abPool, Math.min(needed, abPool.length))
        .map(e => ex(e.id, e.name, p, false));
      return { ...day, exercises: [...nonCardio, ...extras, ...cardio] };
    }
    return day;
  });

  // Add cardio finisher to every session
  const cardioPool = isHome ? HOME_CARDIO : GYM_CARDIO;
  plan = addCardioFinisher(plan, cardioPool, p);

  // Cardio/HIIT exercises: no weight, just time
  plan = plan.map(day => ({
    ...day,
    exercises: day.exercises.map(e =>
      CARDIO_IDS_SET.has(e.id) ? { ...e, sets: 1, reps: "15 min", rest: "-" } : e
    ),
  }));

  // Estimate calories burned per session (Compendium of Physical Activities - Ainsworth 2011)
  return plan.map(day => ({
    ...day,
    estimatedCalories: estimateSessionCalories(day.exercises, weightKg),
  }));
}

// ============================================================
// HOME PLAN — Frequency 2 (bodyweight only)
// ============================================================
function generateHomePlan(days: number, p: TrainingParams, vol: VolumeConfig = { compoundMain: 2, isolationMain: 2, compoundSmall: 1, isolationSmall: 2 }): TrainingDay[] {
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
      { day: "Dia 1 - Pecho + Triceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
      ]},
      { day: "Dia 2 - Piernas + Abdomen", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
      { day: "Dia 3 - Espalda + Biceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 1, p),
      ]},
      { day: "Dia 4 - Piernas + Hombros", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.hombros, 1, 1, p),
      ]},
    ];
  }

  if (days === 5) {
    return [
      { day: "Dia 1 - Pecho + Triceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
      ]},
      { day: "Dia 2 - Espalda + Biceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 1, p),
      ]},
      { day: "Dia 3 - Piernas + Abdomen", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 2, p),
        ...pickExercises(pool.abdomen, 1, 1, p),
      ]},
      { day: "Dia 4 - Hombros + Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.hombros, 2, 1, p),
        ...pickExercises(pool.triceps, 1, 1, p),
      ]},
      { day: "Dia 5 - Piernas + Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.piernas, 2, 1, p),
        ...pickExercises(pool.biceps, 1, 1, p),
      ]},
    ];
  }

  // 6 days: Each session = 1 large + 1 small (PPL x2)
  return [
    { day: "Dia 1 - Pecho + Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, 2, 1, p),
      ...pickExercises(pool.triceps, 1, 1, p),
    ]},
    { day: "Dia 2 - Espalda + Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 1, 1, p),
    ]},
    { day: "Dia 3 - Piernas + Abdomen", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, 2, 2, p),
      ...pickExercises(pool.abdomen, 1, 1, p),
    ]},
    { day: "Dia 4 - Hombros + Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.hombros, 2, 1, p),
      ...pickExercises(pool.triceps, 1, 1, p),
    ]},
    { day: "Dia 5 - Espalda + Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.espalda, 2, 1, p),
      ...pickExercises(pool.biceps, 1, 1, p),
    ]},
    { day: "Dia 6 - Piernas + Abdomen", instructions: "Frecuencia 2. " + p.instructions, exercises: [
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
function generateBalancedPlan(days: number, p: TrainingParams, vol: VolumeConfig = { compoundMain: 2, isolationMain: 2, compoundSmall: 1, isolationSmall: 2 }, sex: string = "hombre"): TrainingDay[] {
  const pool = GYM_EXERCISES;
  const { compoundMain: cM, isolationMain: iM, compoundSmall: cS, isolationSmall: iS } = vol;

  // Agonist-Antagonist pairing:
  // Hombres: 1 grande + 1 chico antagonista (5+3=8 ejercicios)
  // Mujeres: 1 grande + 2 chicos agonista-antagonista (5+2+1=8 ejercicios, or 4+2+2=8)
  // Rest: piernas/pecho 2 days, gluteos 1 day, small muscles 1 day

  // Women variant: large(4) + small_a(2) + small_b(2) = 8
  const wCM = 2; // compound for large in women multi-small sessions
  const wIM = 2; // isolation for large in women multi-small sessions
  const wCS = 1; // compound per small muscle in women
  const wIS = 1; // isolation per small muscle in women

  // Abdomen: 2 exercises added to 2 lightest days (hombros or freq 2 days)
  // NOT a main muscle — just a complement at the end
  const abs2 = () => pickExercises(pool.abdomen, 1, 1, p); // always 2 abs exercises

  if (days === 3) {
    if (sex === "mujer") {
      return [
        { day: "Dia 1 - Piernas + Biceps y Triceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.piernas, wCM, wIM, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
        ]},
        { day: "Dia 2 - Espalda + Biceps y Triceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.espalda, wCM, wIM, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
          ...abs2(),
        ]},
        { day: "Dia 3 - Piernas + Hombros y Biceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.piernas, wCM, wIM, p),
          ...pickExercises(pool.hombros, wCS, wIS, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...abs2(),
        ]},
      ];
    }
    return [
      { day: "Dia 1 - Pecho + Biceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, cM, iM, p),
        ...pickExercises(pool.biceps, cS, iS, p),
      ]},
      { day: "Dia 2 - Espalda + Triceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, cM, iM, p),
        ...pickExercises(pool.triceps, cS, iS, p),
        ...abs2(),
      ]},
      { day: "Dia 3 - Piernas + Hombros", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, cM, iM, p),
        ...pickExercises(pool.hombros, cS, iS, p),
        ...abs2(),
      ]},
    ];
  }

  // RULE: No muscle can be trained on consecutive days
  // Large muscles (piernas, pecho, espalda): min 2 days rest
  // Small muscles (biceps, triceps, hombros): min 1 day rest

  if (days === 4) {
    if (sex === "mujer") {
      // D1:Piernas+Bic/Tric → D2:Pecho+Hombros/Tric → D3:Espalda+Bic/Hombros → D4:Piernas+Tric/Bic
      // No muscle repeats on consecutive days ✓
      return [
        { day: "Dia 1 - Piernas + Biceps y Triceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.piernas, wCM, wIM, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
        ]},
        { day: "Dia 2 - Pecho + Hombros y Triceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.pecho, wCM, wIM, p),
          ...pickExercises(pool.hombros, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
          ...abs2(),
        ]},
        { day: "Dia 3 - Espalda + Biceps y Hombros", instructions: p.instructions, exercises: [
          ...pickExercises(pool.espalda, wCM, wIM, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...pickExercises(pool.hombros, wCS, wIS, p),
        ]},
        { day: "Dia 4 - Piernas + Triceps y Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
          ...pickExercises(pool.piernas, wCM, wIM, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...abs2(),
        ]},
      ];
    }
    // Men 4 days: no muscle on consecutive days
    // D1:Pecho+Biceps → D2:Espalda+Triceps → D3:Piernas+Hombros → D4:Pecho+Triceps
    return [
      { day: "Dia 1 - Pecho + Biceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, cM, iM, p),
        ...pickExercises(pool.biceps, cS, iS, p),
      ]},
      { day: "Dia 2 - Espalda + Triceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, cM, iM, p),
        ...pickExercises(pool.triceps, cS, iS, p),
      ]},
      { day: "Dia 3 - Piernas + Hombros", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, cM, iM, p),
        ...pickExercises(pool.hombros, cS, iS, p),
        ...abs2(),
      ]},
      { day: "Dia 4 - Pecho + Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.pecho, cM, iM, p),
        ...pickExercises(pool.biceps, cS, iS, p),
        ...abs2(),
      ]},
    ];
  }

  if (days === 5) {
    if (sex === "mujer") {
      // D1:Piernas+Bic/Tric → D2:Pecho+Hombros/Bic → D3:Espalda+Tric/Hombros → D4:Piernas+Bic/Tric → D5:Pecho+Hombros/Tric
      // No consecutive muscle repeats ✓
      return [
        { day: "Dia 1 - Piernas + Biceps y Triceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.piernas, wCM, wIM, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
        ]},
        { day: "Dia 2 - Pecho + Hombros y Biceps", instructions: p.instructions, exercises: [
          ...pickExercises(pool.pecho, wCM, wIM, p),
          ...pickExercises(pool.hombros, wCS, wIS, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
        ]},
        { day: "Dia 3 - Espalda + Triceps y Hombros", instructions: p.instructions, exercises: [
          ...pickExercises(pool.espalda, wCM, wIM, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
          ...pickExercises(pool.hombros, wCS, wIS, p),
          ...abs2(),
        ]},
        { day: "Dia 4 - Piernas + Biceps y Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
          ...pickExercises(pool.piernas, wCM, wIM, p),
          ...pickExercises(pool.biceps, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
          ...abs2(),
        ]},
        { day: "Dia 5 - Pecho + Hombros y Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
          ...pickExercises(pool.pecho, wCM, wIM, p),
          ...pickExercises(pool.hombros, wCS, wIS, p),
          ...pickExercises(pool.triceps, wCS, wIS, p),
        ]},
      ];
    }
    // Men 5 days: D1:Pecho+Bic → D2:Espalda+Tric → D3:Piernas+Hombros → D4:Pecho+Bic → D5:Espalda+Tric
    // No consecutive repeats ✓ (Pecho D1→D4=2days, Espalda D2→D5=2days, Bic D1→D4=2days)
    return [
      { day: "Dia 1 - Pecho + Biceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, cM, iM, p),
        ...pickExercises(pool.biceps, cS, iS, p),
      ]},
      { day: "Dia 2 - Espalda + Triceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, cM, iM, p),
        ...pickExercises(pool.triceps, cS, iS, p),
      ]},
      { day: "Dia 3 - Piernas + Hombros", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, cM, iM, p),
        ...pickExercises(pool.hombros, cS, iS, p),
        ...abs2(),
      ]},
      { day: "Dia 4 - Pecho + Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.pecho, cM, iM, p),
        ...pickExercises(pool.biceps, cS, iS, p),
      ]},
      { day: "Dia 5 - Espalda + Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.espalda, cM, iM, p),
        ...pickExercises(pool.triceps, cS, iS, p),
        ...abs2(),
      ]},
    ];
  }

  // 6 days — no muscle on consecutive days
  if (sex === "mujer") {
    // D1:Piernas+Bic/Tric → D2:Pecho+Hombros/Bic → D3:Espalda+Tric/Hombros → D4:Piernas+Bic/Tric → D5:Pecho+Hombros/Bic → D6:Espalda+Tric/Hombros
    return [
      { day: "Dia 1 - Piernas + Biceps y Triceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, wCM, wIM, p),
        ...pickExercises(pool.biceps, wCS, wIS, p),
        ...pickExercises(pool.triceps, wCS, wIS, p),
      ]},
      { day: "Dia 2 - Pecho + Hombros y Biceps", instructions: p.instructions, exercises: [
        ...pickExercises(pool.pecho, wCM, wIM, p),
        ...pickExercises(pool.hombros, wCS, wIS, p),
        ...pickExercises(pool.biceps, wCS, wIS, p),
        ...abs2(),
      ]},
      { day: "Dia 3 - Espalda + Triceps y Hombros", instructions: p.instructions, exercises: [
        ...pickExercises(pool.espalda, wCM, wIM, p),
        ...pickExercises(pool.triceps, wCS, wIS, p),
        ...pickExercises(pool.hombros, wCS, wIS, p),
      ]},
      { day: "Dia 4 - Piernas + Biceps y Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.piernas, wCM, wIM, p),
        ...pickExercises(pool.biceps, wCS, wIS, p),
        ...pickExercises(pool.triceps, wCS, wIS, p),
        ...abs2(),
      ]},
      { day: "Dia 5 - Pecho + Hombros y Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.pecho, wCM, wIM, p),
        ...pickExercises(pool.hombros, wCS, wIS, p),
        ...pickExercises(pool.biceps, wCS, wIS, p),
      ]},
      { day: "Dia 6 - Espalda + Triceps y Hombros", instructions: "Frecuencia 2. " + p.instructions, exercises: [
        ...pickExercises(pool.espalda, wCM, wIM, p),
        ...pickExercises(pool.triceps, wCS, wIS, p),
        ...pickExercises(pool.hombros, wCS, wIS, p),
        ...abs2(),
      ]},
    ];
  }
  // Men 6 days: D1:Pecho+Bic → D2:Espalda+Tric → D3:Piernas+Hombros → D4:Pecho+Bic → D5:Espalda+Tric → D6:Piernas+Hombros
  // No consecutive repeats ✓
  return [
    { day: "Dia 1 - Pecho + Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, cM, iM, p),
      ...pickExercises(pool.biceps, cS, iS, p),
    ]},
    { day: "Dia 2 - Espalda + Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, cM, iM, p),
      ...pickExercises(pool.triceps, cS, iS, p),
    ]},
    { day: "Dia 3 - Piernas + Hombros", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, cM, iM, p),
      ...pickExercises(pool.hombros, cS, iS, p),
      ...abs2(),
    ]},
    { day: "Dia 4 - Pecho + Biceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.pecho, cM, iM, p),
      ...pickExercises(pool.biceps, cS, iS, p),
    ]},
    { day: "Dia 5 - Espalda + Triceps", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.espalda, cM, iM, p),
      ...pickExercises(pool.triceps, cS, iS, p),
    ]},
    { day: "Dia 6 - Piernas + Hombros", instructions: "Frecuencia 2. " + p.instructions, exercises: [
      ...pickExercises(pool.piernas, cM, iM, p),
      ...pickExercises(pool.hombros, cS, iS, p),
      ...abs2(),
    ]},
  ];
}

// ============================================================
// EMPHASIS plan (randomized)
// ============================================================
function generateEmphasisPlan(days: number, p: TrainingParams, primary: string, allGroups: string[], vol: VolumeConfig = { compoundMain: 2, isolationMain: 2, compoundSmall: 1, isolationSmall: 2 }, sex: string = "hombre"): TrainingDay[] {
  const emphasisDay1 = buildEmphasisDay("Dia 1", primary, "fuerza", p);
  const emphasisDay2 = buildEmphasisDay(`Dia ${Math.min(days, 4)}`, primary, "volumen", p);

  const pool = GYM_EXERCISES;
  const { compoundMain: cM, isolationMain: iM, compoundSmall: cS, isolationSmall: iS } = vol;
  // For women with leg emphasis: reduce upper body volume (2 compound + 1 isolation = 3 exercises for chest/shoulders)
  const isWomanLegFocus = sex === "mujer" && (primary === "piernas" || allGroups.includes("piernas"));
  const upperCM = isWomanLegFocus ? 2 : cM;
  const upperIM = isWomanLegFocus ? 1 : iM;
  const otherDays: TrainingDay[] = [];

  if (primary !== "pecho" && primary !== "espalda") {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, upperCM, upperIM, p),
      ...pickExercises(pool.triceps, cS, iS, p),
    ]});
    otherDays.push({ day: "Dia 3 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, upperCM, upperIM, p),
      ...pickExercises(pool.biceps, cS, iS, p),
    ]});
  }
  if (primary === "pecho") {
    otherDays.push({ day: "Dia 2 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, cM, iM, p),
      ...pickExercises(pool.biceps, cS, iS, p),
    ]});
    otherDays.push({ day: "Dia 3 - Piernas y Abdomen", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, cM, iM, p),
      ...pickExercises(pool.abdomen, cS, iS, p),
    ]});
  }
  if (primary === "espalda") {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, cM, iM, p),
      ...pickExercises(pool.triceps, cS, iS, p),
    ]});
    otherDays.push({ day: "Dia 3 - Piernas y Abdomen", instructions: p.instructions, exercises: [
      ...pickExercises(pool.piernas, cM, iM, p),
      ...pickExercises(pool.abdomen, cS, iS, p),
    ]});
  }
  if (primary !== "piernas") {
    if (!otherDays.some(d => d.day.includes("Piernas"))) {
      otherDays.push({ day: `Dia ${otherDays.length + 2} - Piernas y Abdomen`, instructions: p.instructions, exercises: [
        ...pickExercises(pool.piernas, cM, iM, p),
        ...pickExercises(pool.abdomen, cS, iS, p),
      ]});
    }
  } else {
    otherDays.push({ day: "Dia 2 - Pecho y Triceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.pecho, upperCM, upperIM, p),
      ...pickExercises(pool.triceps, cS, iS, p),
    ]});
    otherDays.push({ day: "Dia 3 - Espalda y Biceps", instructions: p.instructions, exercises: [
      ...pickExercises(pool.espalda, upperCM, upperIM, p),
      ...pickExercises(pool.biceps, cS, iS, p),
    ]});
  }

  const plan: TrainingDay[] = [emphasisDay1, ...otherDays.slice(0, 2), emphasisDay2];

  const cardioOptions = [
    { id: "hiit-cinta", name: "HIIT en Cinta" },
    { id: "saltar-cuerda", name: "Saltar la Cuerda" },
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
