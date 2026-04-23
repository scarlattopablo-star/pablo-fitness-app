// Limpia duplicados de training_plans y nutrition_plans via REST API.
// Mantiene la fila mas reciente (created_at DESC) por user_id.
// Uso: node scripts/clean-duplicate-plans.mjs
// (preview-only: correr con PREVIEW=1 para ver sin borrar)

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
if (!SB_URL || !SB_KEY) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const PREVIEW = process.env.PREVIEW === "1";

const headers = {
  apikey: SB_KEY,
  Authorization: `Bearer ${SB_KEY}`,
  "Content-Type": "application/json",
};

async function cleanTable(table) {
  console.log(`\n=== ${table} ===`);

  // 1) Listar todas las filas con user_id + created_at.
  const getRes = await fetch(
    `${SB_URL}/rest/v1/${table}?select=id,user_id,created_at&order=user_id.asc,created_at.desc`,
    { headers }
  );
  if (!getRes.ok) {
    console.error(`Error GET ${table}: HTTP ${getRes.status} — ${await getRes.text()}`);
    return;
  }
  const rows = await getRes.json();
  console.log(`  Total filas: ${rows.length}`);

  // 2) Agrupar por user_id, marcar duplicados (todos menos la mas reciente).
  const byUser = new Map();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id).push(r);
  }

  const toDelete = [];
  let dupUsers = 0;
  for (const [userId, list] of byUser) {
    if (list.length > 1) {
      dupUsers++;
      // list ya esta ordenada created_at DESC — descartamos el primero, borramos el resto.
      const keep = list[0];
      const dropList = list.slice(1);
      console.log(`  user_id=${userId}: ${list.length} filas (se mantiene ${keep.id.slice(0, 8)}, a borrar ${dropList.length})`);
      for (const d of dropList) toDelete.push(d.id);
    }
  }

  console.log(`  Users con duplicados: ${dupUsers}`);
  console.log(`  Filas a borrar: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log(`  ✓ ${table} sin duplicados.`);
    return;
  }

  if (PREVIEW) {
    console.log(`  (PREVIEW=1 — no se borra nada)`);
    return;
  }

  // 3) DELETE en tandas de 50 (PostgREST soporta in.() con muchas ids pero cuidamos el URL length).
  const BATCH = 50;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = toDelete.slice(i, i + BATCH);
    const idsParam = batch.map((id) => `"${id}"`).join(",");
    const delUrl = `${SB_URL}/rest/v1/${table}?id=in.(${idsParam})`;
    const delRes = await fetch(delUrl, { method: "DELETE", headers });
    if (!delRes.ok) {
      console.error(`  Error DELETE batch: HTTP ${delRes.status} — ${await delRes.text()}`);
      continue;
    }
    deleted += batch.length;
    process.stdout.write(`\r  Borrados: ${deleted}/${toDelete.length}`);
  }
  console.log(`\n  ✓ ${table}: ${deleted} filas duplicadas borradas.`);
}

await cleanTable("training_plans");
await cleanTable("nutrition_plans");

console.log("\nHecho. El endpoint de pegar rutina ya funciona con o sin UNIQUE constraint.");
