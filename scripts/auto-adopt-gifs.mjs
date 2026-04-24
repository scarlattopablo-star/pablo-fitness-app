// Autoadopta GIFs de ExerciseDB para los 15 ejercicios nuevos (y cualquier otro
// que indiquemos). Busca por nombre en el catalogo publico de free-exercise-db,
// toma el mejor match y hace UPSERT en custom_exercise_gifs via REST.
// No requiere API key — solo service_role de Supabase.

import fs from "node:fs";

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

const DATA_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";

// Mapeo: id local -> lista de nombres probables (en ingles, como estan en free-exercise-db)
const TARGETS = [
  { id: "glute-bridge-pausa",       names: ["glute bridge", "hip bridge"] },
  { id: "hip-thrust-unipodal",      names: ["one leg hip thrust", "single leg bridge", "one legged bridge", "hip thrust"] },
  { id: "frog-pump",                names: ["frog pump", "glute bridge"] },
  { id: "curtsy-lunge",             names: ["crossover lunge", "cross body lunge", "side lunge", "lunge"] },
  { id: "kickback-banda",           names: ["kickback", "donkey kick"] },
  { id: "cable-glute-kickback",     names: ["cable kickback", "cable glute kick"] },
  { id: "abduccion-banda-acostada", names: ["iliotibial tract", "side leg raise", "lying abduction", "hip abduction", "leg raise"] },
  { id: "donkey-kick-banda",        names: ["glute kickback", "kickback", "floor donkey kick", "bent leg kickback"] },
  { id: "good-morning-banda",       names: ["good morning"] },
  { id: "box-jump",                 names: ["box jump"] },
  { id: "sentadilla-jefferson",     names: ["jefferson squat", "jefferson curl"] },
  { id: "flutter-kicks",            names: ["flutter kick", "scissor kick"] },
  { id: "scissor-kicks",            names: ["scissor kick", "flutter kick"] },
  { id: "toe-touches",              names: ["toe touch crunch", "v up", "toe touch"] },
  { id: "crunch-maquina",           names: ["machine crunch", "seated crunch", "weighted crunch"] },
];

function normalize(s) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function bestMatch(list, queries) {
  let best = null;
  let bestScore = 0;
  for (const ex of list) {
    if (!ex.images || ex.images.length === 0) continue;
    const n = normalize(ex.name);
    for (const q of queries) {
      const qn = normalize(q);
      let score = 0;
      if (n === qn) score = 100;
      else if (n.startsWith(qn)) score = 80;
      else if (n.includes(qn)) score = 60;
      else {
        const qt = qn.split(" ");
        const nt = n.split(" ");
        const hit = qt.filter(t => nt.includes(t)).length;
        score = hit > 0 ? (hit / qt.length) * 50 : 0;
      }
      if (score > bestScore) { bestScore = score; best = ex; }
    }
  }
  return best && bestScore >= 50 ? best : null;
}

console.log("Bajando catalogo ExerciseDB...");
const res = await fetch(DATA_URL);
if (!res.ok) { console.error("Error bajando catalogo:", res.status); process.exit(1); }
const list = await res.json();
console.log(`Catalogo: ${list.length} ejercicios\n`);

const headers = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" };

let ok = 0, skipped = 0, fail = 0;

for (const target of TARGETS) {
  const match = bestMatch(list, target.names);
  if (!match) { console.log(`  ✗ ${target.id}  (sin match)`); skipped++; continue; }
  const gifUrl = `${IMG_BASE}/${match.images[0]}`;

  const resp = await fetch(`${SB_URL}/rest/v1/custom_exercise_gifs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      exercise_id: target.id,
      gif_url: gifUrl,
      source: "exercisedb-auto",
      updated_at: new Date().toISOString(),
    }),
  });
  if (resp.ok) {
    console.log(`  ✓ ${target.id}  ->  ${match.name}`);
    ok++;
  } else {
    console.error(`  ✗ ${target.id}  (${resp.status} ${await resp.text()})`);
    fail++;
  }
}

console.log(`\n✓ ${ok} adoptados · ${skipped} sin match · ${fail} errores`);
