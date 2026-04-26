// Nutrition v2 — F4: motor de recomendacion de suplementos
//
// Dado el perfil del cliente (encuesta + macros calculados), decide cuales
// suplementos del catalogo recomendar y con que prioridad. Filtra por
// contraindicaciones (patologias declaradas).
//
// Salida en 3 niveles:
//   - esencial:    casi todo cliente activo deberia considerar
//   - recomendado: depende del perfil (objetivo, dieta, region)
//   - opcional:    "nice to have" segun preferencia y presupuesto
//
// La lista final se persiste en nutrition_plans.data.supplements y se muestra
// en la tab "Suplementos" del dashboard.

import type { SupabaseClient } from "@supabase/supabase-js";

export type SupplementPriority = "esencial" | "recomendado" | "opcional";

export interface SupplementRecommendation {
  id: string;
  name: string;
  category: string;
  defaultDose: string;
  timing: string;
  monthlyCostUyu: number | null;
  priority: SupplementPriority;
  reason: string;                 // por que se recomienda a ESTE cliente
  evidenceLevel: number;          // 1-5
  alreadyTakes: boolean;          // si el cliente ya lo declaro en current_supplements
  notes: string | null;
}

interface SupplementRow {
  id: string;
  name: string;
  category: string;
  evidence_level: number;
  recommended_for: string[];
  contraindications: string[];
  default_dose: string | null;
  timing: string | null;
  monthly_cost_uyu: number | null;
  notes: string | null;
}

interface AdvisorInput {
  // De surveys
  sex: string;
  age: number;
  objective: string;              // PlanSlug
  nutritionalGoal: string | null; // 'perder-grasa','ganar-musculo','mantenimiento'
  activityLevel: string;
  trainingDays: number;
  dietaryRestrictions: string[];  // ['Vegano','Vegetariano','Sin lactosa',...]
  pathologies: string[];          // ['Hipertension','Diabetes tipo 2',...]
  intolerances: string[];
  country: string | null;
  currentSupplements: string[];   // lo que el cliente ya toma (nombres)
  wantsAdvice: boolean;
  // Calculo
  proteinTarget: number;          // gramos/dia
  isDeficit: boolean;
}

// Mapeo de patologias del survey a contraindicaciones del catalogo.
function pathologyToContraindications(pathologies: string[]): string[] {
  const out: string[] = [];
  const lower = pathologies.map(p => p.toLowerCase());
  if (lower.some(p => p.includes("hipertension"))) out.push("hipertension");
  if (lower.some(p => p.includes("renal") || p.includes("rinion"))) out.push("enfermedad-renal");
  if (lower.some(p => p.includes("arritmia") || p.includes("cardiac"))) out.push("arritmias");
  if (lower.some(p => p.includes("ansied"))) out.push("ansiedad");
  if (lower.some(p => p.includes("anticoagulante"))) out.push("anticoagulantes");
  if (lower.some(p => p.includes("hipercalcem"))) out.push("hipercalcemia");
  if (lower.some(p => p.includes("hemocromatos"))) out.push("hemocromatosis");
  if (lower.some(p => p.includes("tiroides"))) out.push("tiroides-medicada");
  return out;
}

// Detecta si la dieta es vegana / vegetariana / sin lactosa
function dietFlags(restrictions: string[]) {
  const r = restrictions.map(s => s.toLowerCase());
  return {
    vegan: r.some(s => s.includes("vegano")),
    vegetarian: r.some(s => s.includes("vegetariano")),
    lactoseFree: r.some(s => s.includes("lactosa")),
  };
}

// Heuristica: cliente "ya toma" si su current_supplements contiene el id o el name del catalogo.
function alreadyTaking(catalog: SupplementRow, current: string[]): boolean {
  if (current.length === 0) return false;
  const cur = current.map(s => s.toLowerCase().trim());
  return cur.some(s =>
    s === catalog.id ||
    s.includes(catalog.id) ||
    catalog.name.toLowerCase().includes(s) ||
    s.includes(catalog.name.toLowerCase())
  );
}

// Decision por suplemento: prioridad y razon especifica al cliente.
function decideForSupplement(
  s: SupplementRow,
  input: AdvisorInput,
  contraindicated: Set<string>
): { priority: SupplementPriority; reason: string } | null {

  // Filtro 1: contraindicaciones declaradas → omitir totalmente
  for (const c of s.contraindications) {
    if (contraindicated.has(c)) return null;
  }

  const flags = dietFlags(input.dietaryRestrictions);
  const isHighProtein = input.proteinTarget >= 130;
  const trainsRegularly = input.trainingDays >= 3;
  const isVeganOrVeg = flags.vegan || flags.vegetarian;

  // === Reglas por suplemento ===
  switch (s.id) {
    case "whey":
      // Lacteos: si no tolera, prescindir o usar aislada (catalogo permite "lactosa-severa")
      if (flags.vegan) return null;
      if (isHighProtein && trainsRegularly) {
        return { priority: "esencial", reason: `Tu meta es ${input.proteinTarget}g de proteina diaria — el whey ayuda a cerrar la cuota cuando comer mas no es viable.` };
      }
      return { priority: "recomendado", reason: "Util cuando el dia se complica y no alcanzas la cuota proteica solo con comida." };

    case "creatina":
      if (input.objective === "kitesurf" || trainsRegularly) {
        return { priority: "esencial", reason: "Suplemento con la mejor evidencia para fuerza, volumen y rendimiento. Bajo costo, alto impacto." };
      }
      return { priority: "recomendado", reason: "Beneficia incluso a entrenamientos casuales; no necesita ciclo." };

    case "omega-3":
      if (flags.vegan || flags.vegetarian) {
        return { priority: "esencial", reason: "Sin pescado en la dieta — necesario para EPA/DHA antiinflamatorio." };
      }
      return { priority: "recomendado", reason: "Si no comes pescado azul 2 veces por semana, suma." };

    case "vitamina-b12":
      if (flags.vegan) return { priority: "esencial", reason: "OBLIGATORIO en dieta vegana: la B12 solo viene de fuentes animales o suplementos." };
      if (flags.vegetarian) return { priority: "recomendado", reason: "Aunque consumas lacteos/huevos, la B12 puede quedar baja en dieta vegetariana." };
      return null;

    case "magnesio":
      if (trainsRegularly) {
        return { priority: "recomendado", reason: "Entrenas seguido — el magnesio ayuda en relajacion muscular, sueno y prevencion de calambres." };
      }
      return null;

    case "vitamina-d":
      // En UY, otono-invierno (mayo-septiembre) la exposicion solar es baja.
      const month = new Date().getMonth() + 1;
      const isWinter = input.country === "UY" && month >= 5 && month <= 9;
      if (isWinter) {
        return { priority: "recomendado", reason: "Estamos en otono/invierno UY — poca exposicion solar baja la vitamina D. Soporta inmunidad y huesos." };
      }
      return { priority: "opcional", reason: "Util si te exponees poco al sol." };

    case "multivitaminico":
      if (input.isDeficit) {
        return { priority: "recomendado", reason: "Estas en deficit calorico — un multi cubre micros que pueden quedar bajos al comer menos." };
      }
      return { priority: "opcional", reason: "Cubre micronutrientes en dietas variadas." };

    case "cafeina":
      if (input.objective === "competicion" || input.objective === "kitesurf" || input.objective === "rendimiento-deportivo") {
        return { priority: "recomendado", reason: "Tu objetivo demanda alto rendimiento — la cafeina pre-entreno mejora intensidad y resistencia." };
      }
      return { priority: "opcional", reason: "Util pre-entreno cuando estas cansado. Evitar cerca del horario de sueno." };

    case "pre-entreno":
      // Solo opcional, ya hay cafeina como esencial
      if (trainsRegularly) {
        return { priority: "opcional", reason: "Si te gusta entrenar con energia extra. Cuidado con cafeina nocturna." };
      }
      return null;

    case "caseina":
      if (flags.vegan) return null;
      if (input.objective === "ganancia-muscular" || input.objective === "competicion") {
        return { priority: "opcional", reason: "Para tu objetivo de masa, caseina antes de dormir aporta proteina de liberacion lenta." };
      }
      return null;

    case "bcaa":
      // Casi nunca esencial, opcional solo si entrena en ayunas
      return { priority: "opcional", reason: "Util solo si entrenas en ayunas. Si comes proteina suficiente, prescindible." };

    case "glutamina":
      return { priority: "opcional", reason: "Evidencia mixta. Considerar en cargas de entreno muy altas o malestar digestivo." };

    case "zma":
      return { priority: "opcional", reason: "Suma si te cuesta el descanso o entrenas mucho. Tomar lejos de lacteos." };

    case "ashwagandha":
      return { priority: "opcional", reason: "Adaptogeno. Suma cuando hay estres alto o problemas de descanso." };

    case "hierro":
      // Solo recomendar a mujer + activa o vegano. NUNCA esencial sin analisis.
      if (input.sex === "mujer" && trainsRegularly) {
        return { priority: "opcional", reason: "Mujeres activas pueden tener hierro bajo — confirmar con analisis antes de suplementar." };
      }
      if (flags.vegan) {
        return { priority: "opcional", reason: "El hierro vegetal se absorbe menos. Confirmar con analisis antes de suplementar." };
      }
      return null;
  }

  return null;
}

// === API publica ===

export async function recommendSupplements(
  supabase: SupabaseClient,
  input: AdvisorInput
): Promise<SupplementRecommendation[]> {
  if (!input.wantsAdvice) return [];

  const { data: catalog, error } = await supabase
    .from("supplement_catalog")
    .select("*")
    .eq("active", true)
    .order("evidence_level", { ascending: false });

  if (error || !catalog) return [];

  const contraindicated = new Set(pathologyToContraindications(input.pathologies));
  // Lactosa intolerance → excluye whey/caseina (ambos lacteos)
  if (input.intolerances.some(i => i.toLowerCase().includes("lactosa"))) {
    contraindicated.add("lactosa-severa");
  }

  const recs: SupplementRecommendation[] = [];

  for (const s of (catalog as SupplementRow[])) {
    const decision = decideForSupplement(s, input, contraindicated);
    if (!decision) continue;

    recs.push({
      id: s.id,
      name: s.name,
      category: s.category,
      defaultDose: s.default_dose ?? "",
      timing: s.timing ?? "",
      monthlyCostUyu: s.monthly_cost_uyu != null ? Number(s.monthly_cost_uyu) : null,
      priority: decision.priority,
      reason: decision.reason,
      evidenceLevel: s.evidence_level,
      alreadyTakes: alreadyTaking(s, input.currentSupplements),
      notes: s.notes,
    });
  }

  // Ordenar: esencial → recomendado → opcional, dentro de cada uno por evidencia
  const order: Record<SupplementPriority, number> = { esencial: 0, recomendado: 1, opcional: 2 };
  recs.sort((a, b) => {
    if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
    return b.evidenceLevel - a.evidenceLevel;
  });

  return recs;
}
