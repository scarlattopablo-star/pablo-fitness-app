// Moderation system for Gym Bro chat
// Detects inappropriate language and manages warnings/blocks

const BANNED_WORDS = [
  // Insultos
  "pelotudo", "pelotuda", "boludo", "boluda", "forro", "forra",
  "hijo de puta", "hdp", "la concha", "conchudo", "conchuda",
  "puto", "puta", "putazo", "mierda", "carajo", "verga",
  "pendejo", "pendeja", "imbecil", "idiota", "estupido", "estupida",
  "tarado", "tarada", "mogolico", "mogolica", "retrasado", "retrasada",
  "down", "subnormal", "inutil",
  // Sexual explícito
  "chupar", "cogerte", "coger", "garchar", "culear", "follar",
  "tetas", "culo", "pija", "poronga", "pene", "vagina",
  "nudes", "desnuda", "desnudo", "sexo",
  // Amenazas
  "te voy a matar", "te mato", "te reviento", "te rompo",
  "te cago a trompadas", "te pego",
  // Discriminación
  "negro de mierda", "negra de mierda", "sudaca", "villero",
  "trolo", "trola", "maricon", "marica", "tortillera",
];

// Regex patterns for letter substitutions (e.g., p3lotu2o)
const LEET_MAP: Record<string, string> = {
  "0": "o", "1": "i", "3": "e", "4": "a", "5": "s",
  "7": "t", "@": "a", "$": "s",
};

function normalizeLeet(text: string): string {
  return text.replace(/[013457@$]/g, (char) => LEET_MAP[char] || char);
}

function normalizeText(text: string): string {
  return normalizeLeet(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s]/g, " ")   // Keep only alphanumeric
      .replace(/\s+/g, " ")
      .trim()
  );
}

export function checkMessage(content: string): { flagged: boolean; reason: string } {
  const normalized = normalizeText(content);

  for (const word of BANNED_WORDS) {
    const normalizedWord = normalizeText(word);
    if (normalized.includes(normalizedWord)) {
      return { flagged: true, reason: `Lenguaje inapropiado detectado` };
    }
  }

  return { flagged: false, reason: "" };
}

export const WARNING_MESSAGES = {
  first: "⚠️ Tu mensaje contiene lenguaje inapropiado. Esta es tu primera advertencia. Al tercer aviso serás bloqueado del chat.",
  second: "⚠️⚠️ Segunda advertencia por lenguaje inapropiado. Una más y serás bloqueado del chat.",
  blocked: "🚫 Has sido bloqueado del chat por uso reiterado de lenguaje inapropiado. Contacta al administrador si crees que es un error.",
};
