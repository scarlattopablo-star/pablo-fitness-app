// Lista emails de profiles para cargar como testers en Play Console
// Usage: node scripts/list-tester-emails.mjs (ejecutar desde el directorio del proyecto principal)

import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("FALTAN ENV VARS. NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY requeridas.");
  process.exit(1);
}

async function getProfiles() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=email,full_name,is_admin,created_at&order=created_at.desc`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

const profiles = await getProfiles();

if (!Array.isArray(profiles)) {
  console.error("Error fetching profiles:", profiles);
  process.exit(1);
}

const valid = profiles.filter(p => p.email && p.email.includes("@"));
const gmail = valid.filter(p => /@gmail\.com$/i.test(p.email));
const otros = valid.filter(p => !/@gmail\.com$/i.test(p.email));

console.log("\n========================================");
console.log(`TOTAL profiles: ${profiles.length}`);
console.log(`Con email valido: ${valid.length}`);
console.log(`Gmail (mejor para Play Console): ${gmail.length}`);
console.log(`Otros (Hotmail/Yahoo/etc): ${otros.length}`);
console.log("========================================\n");

console.log("=== GMAIL (cargar PRIMERO en Play Console) ===");
gmail.forEach(p => console.log(p.email));

console.log("\n=== OTROS DOMINIOS (pueden o no tener cuenta Google) ===");
otros.forEach(p => console.log(p.email));

console.log("\n=== TODOS JUNTOS, separados por coma (para pegar) ===");
console.log(valid.map(p => p.email).join(", "));

console.log("\n=== TODOS JUNTOS, uno por linea (para pegar) ===");
valid.forEach(p => console.log(p.email));
