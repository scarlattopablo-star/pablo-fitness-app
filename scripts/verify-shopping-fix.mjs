// Verificacion numerica del fix de shopping-list multiplier.
// Reproduce la matematica del helper en JS plano y compara antes/despues.
//
// Caso de prueba: cliente con weekMenu de 7 dias variados,
// 5 comidas/dia × 200g de pollo cada una = 1kg pollo/dia × 7 dias = 7kg/semana.
// Cliente con shoppingFrequency = mensual (targetDays=30).

const SCENARIOS = [
  { freq: "semanal", targetDays: 7 },
  { freq: "quincenal", targetDays: 15 },
  { freq: "mensual", targetDays: 30 },
];

// 7 dias × 5 comidas × 200g = 7000g acumulados al recorrer las 35 comidas
const sumGrams = 35 * 200;

console.log("Caso: cliente que come 1kg de pollo por dia (200g × 5 comidas)");
console.log("flattenWeekMealsForShopping devuelve 35 comidas → suma=7000g (cubren 7 dias)\n");

console.log("freq        target  daysInWeek   gramos    kg     dias-equiv  veredicto");
console.log("─".repeat(85));

for (const s of SCENARIOS) {
  // ❌ ANTES (bug): daysInWeek=1
  const multiplierBug = s.targetDays / 1;
  const gramsBug = sumGrams * multiplierBug;
  const daysCoveredBug = gramsBug / 1000; // 1kg = 1 dia

  // ✅ DESPUES (fix): daysInWeek=7
  const multiplierFix = s.targetDays / 7;
  const gramsFix = sumGrams * multiplierFix;
  const daysCoveredFix = gramsFix / 1000;

  console.log(
    `${s.freq.padEnd(10)} ${String(s.targetDays).padStart(4)}    ` +
    `❌ 1 (BUG)   ${String(gramsBug).padStart(7)}g  ${(gramsBug/1000).toFixed(1).padStart(5)}kg  ` +
    `${String(Math.round(daysCoveredBug)).padStart(4)} dias    ` +
    (daysCoveredBug === s.targetDays ? "OK" : `OFF ×${(daysCoveredBug/s.targetDays).toFixed(1)}`)
  );
  console.log(
    `${" ".padEnd(10)} ${String(s.targetDays).padStart(4)}    ` +
    `✅ 7 (FIX)   ${String(Math.round(gramsFix)).padStart(7)}g  ${(gramsFix/1000).toFixed(1).padStart(5)}kg  ` +
    `${String(Math.round(daysCoveredFix)).padStart(4)} dias    ` +
    (Math.round(daysCoveredFix) === s.targetDays ? "OK" : `OFF ×${(daysCoveredFix/s.targetDays).toFixed(1)}`)
  );
  console.log();
}

console.log("Caso kitesurf: 5 comidas (1 dia que se repite), targetDays=7");
console.log("─".repeat(85));

const sumKite = 5 * 200; // 1000g acumulados
for (const s of SCENARIOS) {
  // ❌ ANTES (bug): daysInWeek=7
  const multiplierBug = s.targetDays / 7;
  const gramsBug = sumKite * multiplierBug;

  // ✅ DESPUES (fix): daysInWeek=1
  const multiplierFix = s.targetDays / 1;
  const gramsFix = sumKite * multiplierFix;

  console.log(
    `kite-${s.freq.padEnd(10)} target=${s.targetDays}    ` +
    `❌ 7 (BUG): ${(gramsBug/1000).toFixed(2)}kg (cubre solo ${(gramsBug/1000).toFixed(0)} dias) | ` +
    `✅ 1 (FIX): ${(gramsFix/1000).toFixed(2)}kg (cubre ${gramsFix/1000} dias) ${gramsFix/1000===s.targetDays?"OK":""}`
  );
}
