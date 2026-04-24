// Solo recalcula los macros (TMB, TDEE, target_calories, proteina, carbs, grasas)
// de TODAS las surveys existentes usando la logica arreglada de harris-benedict.
// NO toca training_plans ni nutrition_plans — las rutinas y dietas quedan como
// el admin las tiene ahora. Solo se corrigen los numeros que se muestran en la UI.
//
// Uso: node scripts/recalculate-macros-all.mjs       (aplica)
//      PREVIEW=1 node scripts/recalculate-macros-all.mjs   (solo muestra)

import fs from "node:fs";

// Cargar .env.local
const envPath = ".env.local";
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error("Falta config"); process.exit(1); }

const PREVIEW = process.env.PREVIEW === "1";

const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };

// --- Logica replicada de harris-benedict (fix aplicado: objetivo manda sobre nutritional_goal) ---
const ACTIVITY_FACTORS = { sedentario: 1.2, moderado: 1.375, activo: 1.55, "muy-activo": 1.725 };
const OBJECTIVE_ADJUSTMENTS = {
  "quema-grasa": -0.25, "ganancia-muscular": 0.15, "tonificacion": -0.15,
  "principiante-total": 0, "rendimiento-deportivo": 0.10, "post-parto": -0.15,
  "fuerza-funcional": 0.05, "recomposicion-corporal": -0.15, "plan-pareja": 0,
  "competicion": -0.20, "kitesurf": 0.10, "direct-client": 0, "entrenamiento-casa": 0,
  "glutes-360": -0.15,
};
const NUTRITIONAL_GOAL_ADJUSTMENTS = { "perder-grasa": -0.25, "ganar-musculo": 0.15, mantenimiento: 0 };

function calcTMB(sex, weight, height, age) {
  if (sex === "hombre") return 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age;
  return 447.593 + 9.247 * weight + 3.098 * height - 4.330 * age;
}

function calcMacros(sex, weight, height, age, activity, objective, nutritionalGoal) {
  const tmb = calcTMB(sex, weight, height, age);
  const tdee = tmb * (ACTIVITY_FACTORS[activity] ?? 1.375);

  const objAdj = OBJECTIVE_ADJUSTMENTS[objective] ?? 0;
  const goalAdj = nutritionalGoal ? (NUTRITIONAL_GOAL_ADJUSTMENTS[nutritionalGoal] ?? 0) : undefined;
  const effective = Math.abs(objAdj) >= 0.10 ? objAdj : (goalAdj ?? objAdj);

  // Offset fijo de 500 kcal (Pablo): deficit=-500, superavit=+500, mantenimiento=0.
  const calOffset = effective < 0 ? -500 : effective > 0 ? 500 : 0;
  const targetCalories = Math.max(1200, Math.round(tdee + calOffset));
  const protein = Math.round(weight * 2);
  const proteinCalories = protein * 4;
  const isDeficit = calOffset < 0;
  const fatPercentage = isDeficit ? 0.25 : 0.30;
  const fats = Math.round(Math.round(targetCalories * fatPercentage) / 9);
  const carbs = Math.max(50, Math.round((targetCalories - proteinCalories - fats * 9) / 4));

  return { tmb: Math.round(tmb), tdee: Math.round(tdee), targetCalories, protein, carbs, fats, offset: calOffset };
}

// --- Main ---
const res = await fetch(
  `${SB_URL}/rest/v1/surveys?select=id,user_id,age,sex,weight,height,activity_level,objective,nutritional_goal,target_calories,protein,carbs,fats,tmb,tdee&order=created_at.desc`,
  { headers }
);
if (!res.ok) { console.error("GET surveys:", res.status, await res.text()); process.exit(1); }
const surveys = await res.json();
console.log(`Surveys totales: ${surveys.length}`);

// Quedarnos con la survey mas reciente por user
const latestByUser = new Map();
for (const s of surveys) if (!latestByUser.has(s.user_id)) latestByUser.set(s.user_id, s);

let changed = 0;
let heightFixed = 0;
const changes = [];

for (const s of latestByUser.values()) {
  // Saltar direct-client: esos los gestiona Pablo a mano.
  if ((s.objective || "") === "direct-client") continue;

  let heightCm = Number(s.height) || 170;
  let fixedH = false;
  if (heightCm > 0 && heightCm < 10) { heightCm = Math.round(heightCm * 100); fixedH = true; }

  const m = calcMacros(
    s.sex || "mujer",
    Number(s.weight) || 70,
    heightCm,
    Number(s.age) || 30,
    s.activity_level || "moderado",
    s.objective || "quema-grasa",
    s.nutritional_goal || null
  );

  // Comparar con los valores actuales
  const diffs = {};
  if (Number(s.tmb) !== m.tmb) diffs.tmb = [s.tmb, m.tmb];
  if (Number(s.tdee) !== m.tdee) diffs.tdee = [s.tdee, m.tdee];
  if (Number(s.target_calories) !== m.targetCalories) diffs.target_calories = [s.target_calories, m.targetCalories];
  if (Number(s.protein) !== m.protein) diffs.protein = [s.protein, m.protein];
  if (Number(s.carbs) !== m.carbs) diffs.carbs = [s.carbs, m.carbs];
  if (Number(s.fats) !== m.fats) diffs.fats = [s.fats, m.fats];

  if (Object.keys(diffs).length === 0 && !fixedH) continue; // nada que cambiar

  // Opcion C: solo aplicar si el cambio en target_calories es > 50 kcal
  // (ignoramos retoques menores para no tocar clientes que estan 'cerca').
  // La altura corregida siempre se aplica.
  const targetDelta = Math.abs(Number(s.target_calories) - m.targetCalories);
  if (targetDelta <= 50 && !fixedH) continue;

  changed++;
  if (fixedH) heightFixed++;

  const label = `${s.user_id.slice(0, 8)}  obj=${s.objective}  goal=${s.nutritional_goal ?? "-"}  ${fixedH ? "[alt:m→cm] " : ""}kcal:${s.target_calories}→${m.targetCalories}`;
  changes.push(label);

  if (!PREVIEW) {
    const patch = {
      tmb: m.tmb, tdee: m.tdee, target_calories: m.targetCalories,
      protein: m.protein, carbs: m.carbs, fats: m.fats,
      ...(fixedH ? { height: heightCm } : {}),
    };
    const pr = await fetch(`${SB_URL}/rest/v1/surveys?id=eq.${s.id}`, {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(patch),
    });
    if (!pr.ok) console.error(`Error PATCH ${s.id}: ${await pr.text()}`);
  }
}

console.log(`\nClientes con cambios: ${changed}/${latestByUser.size}  (altura corregida: ${heightFixed})`);
for (const c of changes) console.log("  -", c);
if (PREVIEW) console.log("\n(PREVIEW=1 — no se tocaron datos. Correr sin PREVIEW para aplicar.)");
else console.log("\n✓ Surveys actualizadas. Rutinas y dietas NO fueron tocadas.");
