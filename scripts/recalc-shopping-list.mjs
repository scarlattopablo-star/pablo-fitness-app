// Dispara /api/admin/recalc-shopping-list contra el dev server local.
// Recalcula shoppingList + budget para TODOS los nutrition_plans existentes
// usando los meals que YA estan persistidos (no toca dieta ni entrenamiento).
//
// Uso:
//   node scripts/recalc-shopping-list.mjs --dry-run  -> simula (no aplica nada en DB)
//   node scripts/recalc-shopping-list.mjs            -> dispara contra localhost:3000
//
// Para dispararlo en produccion (vercel), cambiar BASE_URL.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKTREE = path.resolve(__dirname, "..");

async function loadEnv() {
  const envPath = path.resolve(WORKTREE, "../../..", ".env.local");
  const txt = await readFile(envPath, "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
await loadEnv();

const DRY_RUN = process.argv.includes("--dry-run");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Falta SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (DRY_RUN) {
  console.log("DRY-RUN — no se va a llamar al endpoint.");
  console.log("URL que se llamaria:", `${BASE_URL}/api/admin/recalc-shopping-list`);
  console.log("Method: POST, header x-admin-secret: <service-role>");
  process.exit(0);
}

console.log(`Disparando recalc en ${BASE_URL} ...`);
const res = await fetch(`${BASE_URL}/api/admin/recalc-shopping-list`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-secret": process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  body: JSON.stringify({}),
});

const data = await res.json();
console.log(`HTTP ${res.status}\n`);
console.log(JSON.stringify(data, null, 2));

if (!res.ok) process.exit(1);

console.log(`\n✔ Hecho:`);
console.log(`  Total planes: ${data.total}`);
console.log(`  Actualizados: ${data.updated}`);
console.log(`  Saltados:     ${data.skipped?.length ?? 0}`);
console.log(`  Errores:      ${data.errors?.length ?? 0}`);
if (data.skipped?.length) {
  console.log(`\n  Detalle saltados:`);
  for (const s of data.skipped) console.log(`    - ${s.userId}: ${s.reason}`);
}
if (data.errors?.length) {
  console.log(`\n  Detalle errores:`);
  for (const e of data.errors) console.log(`    - ${e.userId}: ${e.reason}`);
}
