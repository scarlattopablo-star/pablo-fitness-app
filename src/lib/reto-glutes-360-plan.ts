// Plan especifico del reto "Gluteos 360 - 21 dias".
// Pensado para ser distinto a los 12 planes estandar: 100% enfocado en gluteos + abdomen,
// con dos modos (casa y gym) que el cliente elige al activar. Progresion semanal explicita.

import type { TrainingDay, MealPlan } from "@/types";

export type RetoMode = "casa" | "gym";

export interface RetoTrainingPlan {
  mode: RetoMode;
  instructions: string;
  // 7 dias estructurales. Se repite 3 semanas con progresion: S1=3 sets · S2=4 sets · S3=5 sets + tempo 3-1-1.
  days: TrainingDay[];
}

/* --------------------------------------------------------------------- *
 * MODO CASA — sin equipo (banda opcional) · 100% core + gluteos
 * --------------------------------------------------------------------- */
export const RETO_GLUTES_360_HOME: RetoTrainingPlan = {
  mode: "casa",
  instructions:
    "Reto 21 dias en casa. 6 dias de entrenamiento + 1 descanso. Se repite 3 semanas con progresion: " +
    "Semana 1 = 3 sets (tecnica). Semana 2 = 4 sets (volumen). Semana 3 = 5 sets + tempo bajada 3s (intensidad). " +
    "Banda elastica opcional pero recomendada.",
  days: [
    {
      day: "Dia 1 · Gluteos foco (home)",
      exercises: [
        { exerciseId: "home-hip-thrust-piso", name: "Hip thrust de piso", sets: 3, reps: "15", rest: "45s", notes: "Aprieta gluteo arriba 2s" },
        { exerciseId: "home-glute-bridge", name: "Glute bridge con pausa", sets: 3, reps: "15", rest: "45s", notes: "Pausa 2s arriba" },
        { exerciseId: "home-patada-atras", name: "Patada atras en 4 puntos", sets: 3, reps: "15 c/lado", rest: "30s" },
        { exerciseId: "home-abduccion-lateral", name: "Abduccion lateral acostada", sets: 3, reps: "20 c/lado", rest: "30s", notes: "Banda opcional" },
        { exerciseId: "home-firehydrant", name: "Fire hydrant", sets: 3, reps: "15 c/lado", rest: "30s" },
      ],
      instructions: "Activacion + volumen de gluteo. Foco en apretar, no en cantidad.",
    },
    {
      day: "Dia 2 · Core y abdomen",
      exercises: [
        { exerciseId: "home-dead-bug", name: "Dead bug", sets: 3, reps: "10 c/lado", rest: "30s", notes: "Lumbar pegada al piso" },
        { exerciseId: "home-plancha", name: "Plancha frontal", sets: 3, reps: "30-45s", rest: "30s" },
        { exerciseId: "home-plancha-lateral", name: "Plancha lateral", sets: 3, reps: "20-30s c/lado", rest: "30s" },
        { exerciseId: "home-crunch-inverso", name: "Crunch inverso", sets: 3, reps: "15", rest: "30s" },
        { exerciseId: "home-russian-twist", name: "Russian twist", sets: 3, reps: "20 totales", rest: "30s" },
        { exerciseId: "home-bicicleta", name: "Bicicleta abdominal", sets: 3, reps: "30s", rest: "30s" },
      ],
      instructions: "Core 360 — anti-extension, anti-rotacion y flexion.",
    },
    {
      day: "Dia 3 · Piernas y gluteos pesado (home)",
      exercises: [
        { exerciseId: "home-sentadilla-sumo", name: "Sentadilla sumo", sets: 4, reps: "15", rest: "60s", notes: "Pies abiertos 45°" },
        { exerciseId: "home-desplante-adelante", name: "Desplante adelante", sets: 3, reps: "12 c/lado", rest: "45s" },
        { exerciseId: "home-pdm-rumano-unilateral", name: "PDM rumano unilateral", sets: 3, reps: "12 c/lado", rest: "45s", notes: "Sin peso o con botella" },
        { exerciseId: "home-step-up", name: "Step up en silla", sets: 3, reps: "12 c/lado", rest: "45s" },
        { exerciseId: "home-sentadilla-iso", name: "Sentadilla isometrica pared", sets: 3, reps: "30s", rest: "45s" },
      ],
      instructions: "Dia mas exigente. Descansa bien entre series.",
    },
    {
      day: "Dia 4 · Cardio HIIT + activacion",
      exercises: [
        { exerciseId: "home-jumping-jacks", name: "Jumping jacks", sets: 4, reps: "30s ON / 30s OFF", rest: "30s" },
        { exerciseId: "home-mountain-climbers", name: "Mountain climbers", sets: 4, reps: "30s ON / 30s OFF", rest: "30s" },
        { exerciseId: "home-skater", name: "Skater lateral", sets: 4, reps: "30s ON / 30s OFF", rest: "30s" },
        { exerciseId: "home-burpee-sin-salto", name: "Burpee sin salto", sets: 3, reps: "10", rest: "45s", notes: "Si sos principiante, sustitui por step ups rapidos" },
      ],
      instructions: "15-20 min. Quema calorias y activa cadera.",
    },
    {
      day: "Dia 5 · Gluteos y full body (home)",
      exercises: [
        { exerciseId: "home-hip-thrust-unipodal", name: "Hip thrust unipodal", sets: 3, reps: "12 c/lado", rest: "45s" },
        { exerciseId: "home-curtsy-lunge", name: "Curtsy lunge (desplante cruzado)", sets: 3, reps: "12 c/lado", rest: "45s" },
        { exerciseId: "home-buenosdias-banda", name: "Buenos dias con banda", sets: 3, reps: "15", rest: "45s", notes: "Sin banda: usa toalla" },
        { exerciseId: "home-flexion-rodillas", name: "Flexion de brazos con rodillas", sets: 3, reps: "10-12", rest: "45s" },
        { exerciseId: "home-superman", name: "Superman", sets: 3, reps: "15", rest: "30s" },
      ],
      instructions: "Segunda dosis de gluteo + trabajo de espalda para postura.",
    },
    {
      day: "Dia 6 · Abs + cardio corto",
      exercises: [
        { exerciseId: "home-hollow-hold", name: "Hollow hold", sets: 3, reps: "20-30s", rest: "30s" },
        { exerciseId: "home-tijeras", name: "Tijeras (scissor kicks)", sets: 3, reps: "30s", rest: "30s" },
        { exerciseId: "home-toe-touches", name: "Toe touches", sets: 3, reps: "15", rest: "30s" },
        { exerciseId: "home-high-knees", name: "High knees", sets: 3, reps: "40s", rest: "30s" },
      ],
      instructions: "30 min. Foco en contraccion abdominal.",
    },
    {
      day: "Dia 7 · Descanso activo",
      exercises: [
        { exerciseId: "home-caminar", name: "Caminata al aire libre", sets: 1, reps: "30-40 min", rest: "-", notes: "Ritmo comodo" },
        { exerciseId: "home-movilidad-cadera", name: "Movilidad de cadera y foam roll", sets: 1, reps: "10 min", rest: "-" },
      ],
      instructions: "Descansar es parte del plan. No te lo saltes.",
    },
  ],
};

/* --------------------------------------------------------------------- *
 * MODO GYM — con equipo · 100% core + gluteos
 * --------------------------------------------------------------------- */
export const RETO_GLUTES_360_GYM: RetoTrainingPlan = {
  mode: "gym",
  instructions:
    "Reto 21 dias en gym. 6 dias de entrenamiento + 1 descanso. Se repite 3 semanas con progresion: " +
    "Semana 1 = 3 sets (aprender tecnica y cargas). Semana 2 = 4 sets (sumar 1 set). Semana 3 = 5 sets + tempo bajada 3s. " +
    "En semana 2 y 3 subi el peso 5-10% cuando llegues al tope de reps con tecnica limpia.",
  days: [
    {
      day: "Dia 1 · Gluteos heavy (gym)",
      exercises: [
        { exerciseId: "gym-hip-thrust-barra", name: "Hip thrust con barra", sets: 4, reps: "10-12", rest: "90s", notes: "Apoyo alto. Empuja con talones." },
        { exerciseId: "gym-sentadilla-bulgara", name: "Sentadilla bulgara con mancuernas", sets: 3, reps: "10 c/lado", rest: "75s" },
        { exerciseId: "gym-pdm-rumano", name: "Peso muerto rumano con barra", sets: 3, reps: "10-12", rest: "75s", notes: "Cadera atras, rodilla semiflexionada." },
        { exerciseId: "gym-abductor-maquina", name: "Abductor en maquina", sets: 3, reps: "15", rest: "45s", notes: "Inclina tronco adelante para activar mas gluteo medio." },
        { exerciseId: "gym-kickback-polea", name: "Kickback en polea baja", sets: 3, reps: "12 c/lado", rest: "45s" },
      ],
      instructions: "Gluteo mayor prioritario. Tecnica impecable en hip thrust.",
    },
    {
      day: "Dia 2 · Core y abdomen",
      exercises: [
        { exerciseId: "gym-crunch-polea", name: "Crunch en polea (de rodillas)", sets: 3, reps: "15", rest: "45s" },
        { exerciseId: "gym-plancha-peso", name: "Plancha con peso en espalda", sets: 3, reps: "30-45s", rest: "45s" },
        { exerciseId: "gym-pallof-press", name: "Pallof press en polea", sets: 3, reps: "12 c/lado", rest: "45s", notes: "Anti-rotacion" },
        { exerciseId: "gym-elevacion-piernas", name: "Elevacion de piernas colgado", sets: 3, reps: "12", rest: "45s", notes: "Si no llegas, rodillas al pecho." },
        { exerciseId: "gym-ab-roller", name: "Ab roller (si hay)", sets: 3, reps: "10", rest: "45s" },
      ],
      instructions: "Core 360 con carga. Apreta costillas hacia pelvis.",
    },
    {
      day: "Dia 3 · Piernas y gluteos pesado (gym)",
      exercises: [
        { exerciseId: "gym-sentadilla-barra", name: "Sentadilla con barra", sets: 4, reps: "10", rest: "90s" },
        { exerciseId: "gym-prensa-pies-altos", name: "Prensa inclinada con pies altos", sets: 4, reps: "12", rest: "75s", notes: "Pies altos activa mas gluteo." },
        { exerciseId: "gym-desplante-caminando", name: "Desplante caminando con mancuernas", sets: 3, reps: "10 c/lado", rest: "60s" },
        { exerciseId: "gym-curl-femoral", name: "Curl femoral en maquina", sets: 3, reps: "12-15", rest: "45s" },
      ],
      instructions: "Dia mas pesado. Hidratacion y descanso entre series.",
    },
    {
      day: "Dia 4 · Cardio HIIT + movilidad",
      exercises: [
        { exerciseId: "gym-escalador", name: "Escalador (stair master)", sets: 1, reps: "15-20 min", rest: "-", notes: "Intensidad 6/10." },
        { exerciseId: "gym-intervalos-bici", name: "Intervalos en bicicleta", sets: 6, reps: "30s fuerte / 60s suave", rest: "-" },
        { exerciseId: "gym-movilidad-cadera", name: "Movilidad de cadera (rutina guiada)", sets: 1, reps: "10 min", rest: "-" },
      ],
      instructions: "30-35 min total. Cardio que NO te rompe las piernas del dia 5.",
    },
    {
      day: "Dia 5 · Gluteos (medio y menor) + espalda",
      exercises: [
        { exerciseId: "gym-hip-abduction-cable", name: "Abduccion de cadera en polea baja", sets: 4, reps: "15 c/lado", rest: "45s" },
        { exerciseId: "gym-glute-kickback", name: "Kickback en maquina", sets: 3, reps: "15 c/lado", rest: "45s" },
        { exerciseId: "gym-step-up-mancuerna", name: "Step up con mancuernas", sets: 3, reps: "10 c/lado", rest: "60s" },
        { exerciseId: "gym-remo-polea", name: "Remo sentado en polea", sets: 3, reps: "12", rest: "60s", notes: "Postura — cuando gluteo crece, la espalda tiene que acompanar." },
        { exerciseId: "gym-hiper-extensiones", name: "Hiperextensiones de gluteo", sets: 3, reps: "15", rest: "45s", notes: "Redondea un poco la espalda alta para evitar lumbar." },
      ],
      instructions: "Zona media y menor del gluteo — clave para la forma redondeada.",
    },
    {
      day: "Dia 6 · Abs + cardio finisher",
      exercises: [
        { exerciseId: "gym-ab-crunch-maquina", name: "Crunch en maquina", sets: 3, reps: "15", rest: "45s" },
        { exerciseId: "gym-rotaciones-polea", name: "Rotaciones en polea (woodchop)", sets: 3, reps: "12 c/lado", rest: "45s" },
        { exerciseId: "gym-elev-piernas", name: "Elevacion de piernas en banco", sets: 3, reps: "15", rest: "45s" },
        { exerciseId: "gym-cinta-inclinada", name: "Caminata en cinta inclinada (15%)", sets: 1, reps: "20 min", rest: "-", notes: "Gluteo silencioso pero constante." },
      ],
      instructions: "Cierre de semana. Inclinacion alta en cinta = gluteo.",
    },
    {
      day: "Dia 7 · Descanso activo",
      exercises: [
        { exerciseId: "gym-caminata", name: "Caminata o yoga suave", sets: 1, reps: "30-40 min", rest: "-" },
        { exerciseId: "gym-foam-roll", name: "Foam roll cadera y espalda", sets: 1, reps: "10 min", rest: "-" },
      ],
      instructions: "Descanso activo. El cuerpo crece y se define descansando.",
    },
  ],
};

/* --------------------------------------------------------------------- *
 * NUTRICION — guia flexible (no dieta estricta)
 * --------------------------------------------------------------------- */
export const RETO_GLUTES_360_NUTRITION: MealPlan = {
  meals: [
    {
      name: "Desayuno",
      time: "08:00",
      foods: [
        "2 huevos revueltos + 1 tostada integral",
        "o yogur griego natural + 1 fruta + 1 cda miel",
        "1 cafe o te sin azucar",
      ],
      calories: 350,
      protein: 25,
      carbs: 30,
      fats: 12,
    },
    {
      name: "Media manana",
      time: "11:00",
      foods: [
        "1 fruta (manzana, pera, naranja)",
        "o un punado de almendras (20g)",
      ],
      calories: 150,
      protein: 4,
      carbs: 20,
      fats: 6,
    },
    {
      name: "Almuerzo",
      time: "13:30",
      foods: [
        "150g proteina magra (pollo, pescado, carne magra)",
        "1/2 plato de verduras libres",
        "1 puno de carbo (arroz, pasta, boniato, papa)",
        "1 cdita de aceite de oliva",
      ],
      calories: 550,
      protein: 45,
      carbs: 55,
      fats: 15,
    },
    {
      name: "Merienda",
      time: "17:30",
      foods: [
        "1 yogur + 1 fruta",
        "o tostadas integrales + queso untable light",
      ],
      calories: 250,
      protein: 15,
      carbs: 30,
      fats: 6,
    },
    {
      name: "Cena",
      time: "21:00",
      foods: [
        "150g proteina (huevos, pescado, pollo)",
        "Verduras al horno o ensalada grande",
        "Porcion chica de carbo SOLO si entrenaste fuerte ese dia",
      ],
      calories: 450,
      protein: 40,
      carbs: 25,
      fats: 18,
    },
  ],
  importantNotes: [
    "No es una dieta estricta. Se trata de comer bien el 80% del tiempo.",
    "Toma 2.5 litros de agua por dia.",
    "Proteina en TODAS las comidas (clave para gluteo y saciedad).",
    "Evita alcohol durante los 21 dias. Acelera el resultado x2.",
    "Un 'libre' por semana esta permitido — elegi sabado o domingo al mediodia.",
    "Si tenes hambre entre comidas, suma verdura libre o una fruta.",
  ],
};

/** Devuelve el plan de entrenamiento segun el modo elegido por la clienta. */
export function getRetoTrainingPlan(mode: RetoMode): RetoTrainingPlan {
  return mode === "gym" ? RETO_GLUTES_360_GYM : RETO_GLUTES_360_HOME;
}

/* --------------------------------------------------------------------- *
 * CUPOS — cierran el 1ro de cada mes (cohorte mensual que se auto-renueva)
 * --------------------------------------------------------------------- */

const MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/** Primer dia del mes SIGUIENTE a hoy. Es el cierre del cupo actual. */
export function getFinDeCuposDate(ref: Date = new Date()): Date {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 1);
}

/** Texto tipo "1 de mayo" para mostrar al usuario. */
export function formatFinDeCupos(ref: Date = new Date()): string {
  const d = getFinDeCuposDate(ref);
  return `1 de ${MESES_ES[d.getMonth()]}`;
}

/** Dias restantes hasta que cierre la cohorte actual. */
export function diasHastaCierre(ref: Date = new Date()): number {
  const fin = getFinDeCuposDate(ref);
  const diffMs = fin.getTime() - ref.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/* --------------------------------------------------------------------- *
 * ESTADO DE CUPOS — controles manuales que Pablo ajusta mes a mes
 * --------------------------------------------------------------------- *
 * CUPOS_RESTANTES_ESTE_MES: cuando baje a 0, el componente muestra "sin cupos"
 *                          y deriva a lista de espera. Numero bajo crea urgencia.
 */
export const CUPOS_RESTANTES_ESTE_MES = 3;
export const CUPOS_AGOTADOS_ESTE_MES = CUPOS_RESTANTES_ESTE_MES <= 0;

/** Texto del proximo mes disponible (el que abre el 1ro del mes siguiente). */
export function formatProximoCohorte(ref: Date = new Date()): string {
  // Si este mes esta agotado, el proximo cohorte empieza el 1ro del mes siguiente (=cierre actual).
  // Si no, el proximo cohorte es el que YA esta abierto (empieza la clase el mismo cierre).
  const d = getFinDeCuposDate(ref);
  return `1 de ${MESES_ES[d.getMonth()]}`;
}

export function getWaitlistWhatsAppUrl(): string {
  return (
    "https://wa.me/59897336318?text=" +
    encodeURIComponent(
      "Hola Pablo, los cupos del reto Gluteos 360 se agotaron este mes. Quiero anotarme para el proximo cohorte."
    )
  );
}
