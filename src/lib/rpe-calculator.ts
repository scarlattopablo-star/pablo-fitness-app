// RPE-based auto progression (Rate of Perceived Exertion 1-10)
// Evidence-based double progression: if last session was easy, add weight;
// if it was max effort, hold or deload.

export interface SetWithRPE {
  weight: number;
  reps: number;
  rpe?: number;
}

export interface Session {
  date: string | Date;
  sets: SetWithRPE[];
}

export interface Suggestion {
  suggestedWeight: number;
  suggestedReps?: number;
  direction: "increase" | "hold" | "deload";
  delta: number;
  confidence: "low" | "medium" | "high";
  reason: string;
}

/**
 * Given recent sessions (most recent first), suggest the next working weight.
 *
 * Rules (target range RPE 7-9):
 *  - Avg RPE <= 6.5 and all reps hit target: +5% (min +2.5kg for compound, +1kg for isolation)
 *  - Avg RPE 7-8: +2.5% (smaller jump)
 *  - Avg RPE 8-9: hold
 *  - Avg RPE >= 9.5 OR failed reps: deload -5%
 *  - No RPE data: base on reps hit vs target only
 */
export function suggestNextWeight(
  sessions: Session[],
  targetReps: number,
  opts?: { compound?: boolean; minIncrement?: number }
): Suggestion | null {
  if (!sessions.length) return null;

  const lastSession = sessions[0];
  if (!lastSession.sets?.length) return null;

  const minIncrement = opts?.minIncrement ?? (opts?.compound ? 2.5 : 1);

  // Use the heaviest working set of the last session as the anchor
  const anchor = lastSession.sets.reduce((b, s) => (s.weight > b.weight ? s : b), lastSession.sets[0]);
  const baseWeight = anchor.weight;

  // RPE data
  const rpes = lastSession.sets.map(s => s.rpe).filter((r): r is number => typeof r === "number" && r > 0);
  const avgRpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null;

  // Reps completion — did all working sets meet target reps?
  const allHitTarget = lastSession.sets.every(s => s.reps >= targetReps);
  const anyFailed = lastSession.sets.some(s => s.reps < Math.max(1, targetReps - 2));

  // With RPE
  if (avgRpe != null) {
    if (avgRpe <= 6.5 && allHitTarget) {
      const pct = 0.05;
      const raw = baseWeight * pct;
      const delta = Math.max(minIncrement, Math.round(raw / minIncrement) * minIncrement);
      return {
        suggestedWeight: +(baseWeight + delta).toFixed(1),
        direction: "increase",
        delta,
        confidence: "high",
        reason: `Ultima sesion facil (RPE ${avgRpe.toFixed(1)}). Subi ${delta}kg.`,
      };
    }
    if (avgRpe <= 8 && allHitTarget) {
      const pct = 0.025;
      const raw = baseWeight * pct;
      const delta = Math.max(minIncrement, Math.round(raw / minIncrement) * minIncrement);
      return {
        suggestedWeight: +(baseWeight + delta).toFixed(1),
        direction: "increase",
        delta,
        confidence: "high",
        reason: `RPE ideal (${avgRpe.toFixed(1)}). Pequeño salto: +${delta}kg.`,
      };
    }
    if (avgRpe >= 9.5 || anyFailed) {
      const delta = Math.max(minIncrement, Math.round((baseWeight * 0.05) / minIncrement) * minIncrement);
      return {
        suggestedWeight: +Math.max(0, baseWeight - delta).toFixed(1),
        direction: "deload",
        delta: -delta,
        confidence: "medium",
        reason: `Muy exigente (RPE ${avgRpe.toFixed(1)}). Baja ${delta}kg para recuperar rango.`,
      };
    }
    return {
      suggestedWeight: baseWeight,
      direction: "hold",
      delta: 0,
      confidence: "high",
      reason: `RPE ${avgRpe.toFixed(1)} = zona ideal. Manteneme el peso hasta que se sienta facil.`,
    };
  }

  // Without RPE — fall back to reps completion
  if (allHitTarget) {
    const delta = minIncrement;
    return {
      suggestedWeight: +(baseWeight + delta).toFixed(1),
      direction: "increase",
      delta,
      confidence: "medium",
      reason: `Completaste todas las reps objetivo. Subi ${delta}kg.`,
    };
  }
  if (anyFailed) {
    return {
      suggestedWeight: baseWeight,
      direction: "hold",
      delta: 0,
      confidence: "low",
      reason: `No completaste las reps. Mismo peso hasta completar.`,
    };
  }
  return {
    suggestedWeight: baseWeight,
    direction: "hold",
    delta: 0,
    confidence: "low",
    reason: `Repetí el mismo peso. Pista: marca tu RPE para recomendaciones mas precisas.`,
  };
}
