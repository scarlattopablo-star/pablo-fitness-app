// XP Level thresholds
export const LEVELS = [
  { level: 1, name: "Novato", minXp: 0 },
  { level: 2, name: "Iniciado", minXp: 200 },
  { level: 3, name: "Intermedio", minXp: 500 },
  { level: 4, name: "Avanzado", minXp: 1200 },
  { level: 5, name: "Experto", minXp: 2500 },
  { level: 6, name: "Elite", minXp: 5000 },
  { level: 7, name: "Leyenda", minXp: 10000 },
];

export function getLevelForXp(totalXp: number) {
  let current = LEVELS[0];
  for (const l of LEVELS) {
    if (totalXp >= l.minXp) current = l;
    else break;
  }
  const nextLevel = LEVELS.find(l => l.minXp > totalXp);
  return {
    ...current,
    nextLevel: nextLevel || null,
    xpToNext: nextLevel ? nextLevel.minXp - totalXp : 0,
    progress: nextLevel ? (totalXp - current.minXp) / (nextLevel.minXp - current.minXp) : 1,
  };
}

// XP rewards for actions
export const XP_REWARDS = {
  SESSION_LOGGED: 30,
  PERSONAL_RECORD: 50,
  STREAK_DAY: 10,
  PROGRESS_PHOTO: 20,
  FOOD_SWAP: 5,
  CHAT_MESSAGE: 2,
};

// Achievement check conditions
export const ACHIEVEMENT_CHECKS = {
  "first-session": (stats: { sessions: number }) => stats.sessions >= 1,
  "sessions-5": (stats: { sessions: number }) => stats.sessions >= 5,
  "sessions-10": (stats: { sessions: number }) => stats.sessions >= 10,
  "sessions-25": (stats: { sessions: number }) => stats.sessions >= 25,
  "sessions-50": (stats: { sessions: number }) => stats.sessions >= 50,
  "sessions-100": (stats: { sessions: number }) => stats.sessions >= 100,
  "streak-3": (stats: { streak: number }) => stats.streak >= 3,
  "streak-7": (stats: { streak: number }) => stats.streak >= 7,
  "streak-14": (stats: { streak: number }) => stats.streak >= 14,
  "streak-30": (stats: { streak: number }) => stats.streak >= 30,
  "first-progress": (stats: { progressPhotos: number }) => stats.progressPhotos >= 1,
  "weight-lost-5": (stats: { weightLost: number }) => stats.weightLost >= 5,
  "weight-lost-10": (stats: { weightLost: number }) => stats.weightLost >= 10,
} as unknown as Record<string, (stats: Record<string, number>) => boolean>;

// Motivational messages for notifications
export const MOTIVATION_MESSAGES = {
  streakRisk: [
    "No pierdas tu racha de {streak} dias! Entrena hoy",
    "Tu racha de {streak} dias esta en riesgo! Dale que podes",
    "{streak} dias sin parar. No cortes ahora!",
  ],
  rankingUp: [
    "Subiste al puesto #{rank} del ranking! Segui asi",
    "Estas en el top {rank}! Podes llegar mas alto",
  ],
  rankingDown: [
    "{name} te paso en el ranking! Recupera tu lugar",
    "Perdiste posiciones esta semana. Hora de entrenar!",
  ],
  newBadge: [
    "Nuevo logro desbloqueado: {badge}!",
    "Ganaste el badge {badge}! +{xp}XP",
  ],
  levelUp: [
    "Subiste a nivel {level}: {levelName}! Segui asi",
    "Nuevo nivel desbloqueado: {levelName}!",
  ],
  weeklyReminder: [
    "El ranking se reinicia el lunes. Asegura tu posicion!",
    "Quedan {days} dias para cerrar el ranking semanal",
  ],
};

export function getRandomMessage(category: keyof typeof MOTIVATION_MESSAGES): string {
  const msgs = MOTIVATION_MESSAGES[category];
  return msgs[Math.floor(Math.random() * msgs.length)];
}
