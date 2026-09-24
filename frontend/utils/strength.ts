import { ExerciseProgressEntry } from '@/types';

/** Epley estimate of a one-rep max. Returns the weight itself for singles. */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export interface PersonalRecords {
  bestWeight: number | null;
  bestOneRepMax: number | null;
  sessions: number;
}

export function getPersonalRecords(entries: ExerciseProgressEntry[]): PersonalRecords {
  let bestWeight: number | null = null;
  let bestOneRepMax: number | null = null;
  for (const e of entries) {
    // Every working set counts (e.g. a lighter set for more reps can be the best 1RM).
    // Entries cached before per-set logging only have the heaviest set.
    const sets = e.sets
      ? e.sets.filter((s) => !s.warmup)
      : [{ weight: e.weightUsed, reps: e.repsCompleted }];
    for (const set of sets) {
      const weight = Number(set.weight ?? 0);
      if (weight <= 0) continue;
      bestWeight = Math.max(bestWeight ?? 0, weight);
      const e1rm = estimateOneRepMax(weight, set.reps);
      if (e1rm > 0) bestOneRepMax = Math.max(bestOneRepMax ?? 0, e1rm);
    }
  }
  return { bestWeight, bestOneRepMax, sessions: entries.length };
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
  if (records.bestOneRepMax != null && e1rm > records.bestOneRepMax) {
    return `Best estimated 1RM: ${formatKg(e1rm)} kg (previous ${formatKg(records.bestOneRepMax)} kg)`;
  }
  return null;
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
