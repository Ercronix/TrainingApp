import { ExerciseLog, SetLog } from '@/types';

/** Epley estimate of a one-rep max. Returns the weight itself for singles. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export interface PersonalRecords {
  bestWeight: number | null;
  bestOneRepMax: number | null;
}

/** Describes what a new set beats compared to previous records, or null if nothing. */
export function detectPersonalRecord(
  records: PersonalRecords,
  weight: number,
  reps: number,
): string | null {
  // No history yet: the first log isn't a "record" worth celebrating
  if (records.bestWeight == null || weight <= 0) return null;
  if (weight > records.bestWeight) {
    return `Heaviest ever: ${formatKg(weight)} kg (previous best ${formatKg(records.bestWeight)} kg)`;
  }
  const e1rm = estimateOneRepMax(weight, reps);
  // Tolerance: the best may be computed on the server, with different rounding
  if (records.bestOneRepMax != null && e1rm > records.bestOneRepMax + 0.01) {
    return `Best estimated 1RM: ${formatKg(e1rm)} kg (previous ${formatKg(records.bestOneRepMax)} kg)`;
  }
  return null;
}

/**
 * The record a log's working sets set against the sessions before it, or null. Checks the
 * heaviest set first, then the one with the best estimated 1RM.
 */
export function personalRecordOf(log: ExerciseLog): string | null {
  const records: PersonalRecords = {
    bestWeight: log.bestWeight ?? null,
    // Timed sets hold seconds in reps, so only their weight can set a record
    bestOneRepMax: log.repUnit === 'seconds' ? null : log.bestOneRepMax ?? null,
  };
  const working = (log.sets ?? []).filter((s) => !s.warmup && Number(s.weight ?? 0) > 0);
  const byWeight = [...working].sort((a, b) => Number(b.weight) - Number(a.weight) || b.reps - a.reps)[0];
  const byOneRepMax = log.repUnit === 'seconds' ? undefined : [...working].sort((a, b) =>
    estimateOneRepMax(Number(b.weight), b.reps) - estimateOneRepMax(Number(a.weight), a.reps))[0];
  return [byWeight, byOneRepMax]
    .filter((s): s is SetLog => s != null)
    .map((s) => detectPersonalRecord(records, Number(s.weight), s.reps))
    .find((r) => r != null) ?? null;
}

export const BAR_WEIGHT_KG = 20;
const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

export interface PlateBreakdown {
  perSide: number[];
  /** Weight that can't be made with the available plates (0 if exact). */
  remainder: number;
}

/** Plates to load on each side of the bar for a target total weight. */
export function calculatePlates(total: number, bar = BAR_WEIGHT_KG): PlateBreakdown | null {
  if (!Number.isFinite(total) || total < bar) return null;
  // Work in hundredths to avoid float drift (e.g. 1.25 kg plates)
  let perSide = Math.round(((total - bar) / 2) * 100);
  const plates: number[] = [];
  for (const plate of PLATES_KG) {
    const p = Math.round(plate * 100);
    while (perSide >= p) {
      plates.push(plate);
      perSide -= p;
    }
  }
  return { perSide: plates, remainder: (perSide * 2) / 100 };
}

export function formatKg(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '');
}
