// Weekly challenges system — auto-rotates every Monday
// Integrates with existing gamification (XP rewards)

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  target: number;
  unit: string;
  xpReward: number;
  type: "sessions" | "streak" | "exercises" | "weight_logged" | "progress_photo" | "chat_message";
}

// Pool of challenges that rotate weekly
const CHALLENGE_POOL: WeeklyChallenge[] = [
  // SESSION-BASED
  { id: "4-sessions", title: "Semana Consistente", description: "Completa 4 sesiones de entrenamiento esta semana", icon: "💪", target: 4, unit: "sesiones", xpReward: 80, type: "sessions" },
  { id: "5-sessions", title: "Semana Guerrera", description: "Completa 5 sesiones de entrenamiento esta semana", icon: "🔥", target: 5, unit: "sesiones", xpReward: 120, type: "sessions" },
  { id: "3-sessions", title: "Triple Amenaza", description: "Entrena al menos 3 veces esta semana", icon: "⚡", target: 3, unit: "sesiones", xpReward: 60, type: "sessions" },
  { id: "6-sessions", title: "Bestia de Gym", description: "6 sesiones en una semana. Solo para los mas dedicados.", icon: "🦁", target: 6, unit: "sesiones", xpReward: 150, type: "sessions" },

  // STREAK-BASED
  { id: "streak-5", title: "Racha de Fuego", description: "Mantene una racha de 5 dias consecutivos", icon: "🔥", target: 5, unit: "dias seguidos", xpReward: 100, type: "streak" },
  { id: "streak-7", title: "Semana Perfecta", description: "7 dias consecutivos entrenando. La semana perfecta.", icon: "⭐", target: 7, unit: "dias seguidos", xpReward: 200, type: "streak" },

  // EXERCISE VARIETY
  { id: "20-exercises", title: "Variedad Total", description: "Registra al menos 20 ejercicios diferentes esta semana", icon: "🎯", target: 20, unit: "ejercicios", xpReward: 80, type: "exercises" },
  { id: "30-exercises", title: "Maquina de Ejercicios", description: "30 ejercicios diferentes en una semana", icon: "🏋️", target: 30, unit: "ejercicios", xpReward: 120, type: "exercises" },

  // WEIGHT LOGGING
  { id: "log-all", title: "Todo Registrado", description: "Registra el peso en todos los ejercicios de 3 sesiones", icon: "📝", target: 3, unit: "sesiones completas", xpReward: 60, type: "weight_logged" },

  // PROGRESS
  { id: "progress-photo", title: "Foto de Progreso", description: "Subi una foto de progreso esta semana", icon: "📸", target: 1, unit: "foto", xpReward: 40, type: "progress_photo" },

  // COMMUNITY
  { id: "chat-5", title: "Gym Bro Activo", description: "Envia 5 mensajes en el chat de la comunidad", icon: "💬", target: 5, unit: "mensajes", xpReward: 30, type: "chat_message" },
  { id: "chat-10", title: "Lider de la Comunidad", description: "10 mensajes en el chat esta semana", icon: "🗣️", target: 10, unit: "mensajes", xpReward: 50, type: "chat_message" },
];

// Get current week number (ISO week)
function getWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  return Math.ceil((diff / 86400000 + start.getDay() + 1) / 7);
}

// Get 2 challenges for this week (deterministic based on week number)
export function getWeeklyChallenges(): WeeklyChallenge[] {
  const week = getWeekNumber();
  const year = new Date().getFullYear();
  const seed = week * 31 + year;

  // Pick 2 challenges from different types
  const sessionChallenges = CHALLENGE_POOL.filter(c => c.type === "sessions");
  const otherChallenges = CHALLENGE_POOL.filter(c => c.type !== "sessions");

  const challenge1 = sessionChallenges[seed % sessionChallenges.length];
  const challenge2 = otherChallenges[(seed * 7) % otherChallenges.length];

  return [challenge1, challenge2];
}

// Get Monday of current week (ISO)
export function getWeekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0];
}

// Days remaining in the week
export function getDaysRemaining(): number {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 6=Sat
  if (day === 0) return 0; // Sunday = last day
  return 7 - day;
}
