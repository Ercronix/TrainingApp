// A workout exercise's plan: sets of a rep count, or of a rep range (reps up to repsMax).
// For exercises timed in seconds, both hold seconds.

/** A planned rep count or range, e.g. "8" or "8–12"; a top not above the bottom is left out. */
export function formatRepRange(reps: number, repsMax?: number | null): string {
  return repsMax != null && repsMax > reps ? `${reps}–${repsMax}` : String(reps);
}

/** E.g. "3 × 8–12 reps @ 60 kg"; null without planned sets and reps. A weight of 0 is left out. */
export function formatPlan(
  plan: { sets?: number | null; reps?: number | null; repsMax?: number | null; weight?: number | null },
  unit: string,
): string | null {
  if (!plan.sets || !plan.reps) return null;
  return `${plan.sets} × ${formatRepRange(plan.reps, plan.repsMax)}${unit ? ` ${unit}` : ''}${plan.weight ? ` @ ${plan.weight} kg` : ''}`;
}

/**
 * Why the reps and "up to" fields of a plan form can't be saved, null when they can. An empty
 * top is a fixed rep count.
 */
export function repRangeError(reps: string, repsMax: string): string | null {
  const top = repsMax.trim();
  if (!top) return null;
  if (!/^\d+$/.test(top)) return 'The top of the rep range must be a whole number';
  const bottom = parseInt(reps, 10);
  if (!Number.isFinite(bottom)) return 'A rep range needs a minimum';
  if (parseInt(top, 10) < bottom) return `The top of the rep range (${parseInt(top, 10)}) is below its minimum (${bottom})`;
  return null;
}

/** The "up to" field as the API takes it: a number, or `empty` (null on create, 0 to clear on update). */
export function repsMaxOf(repsMax: string, empty: null | 0): number | null {
  const top = parseInt(repsMax, 10);
  return Number.isFinite(top) && top > 0 ? top : empty;
}
