// The suggested next target of an exercise, by double progression: reps go up within the
// planned range, and once every working set reaches its top, the weight goes up and the reps
// start again at the bottom. Timed exercises add seconds instead.
import { SetLog } from '@/types';
import { workingSets } from './sets';

/** Kg added when a library entry has no increment of its own. */
export const DEFAULT_WEIGHT_INCREMENT = 2.5;

/** Seconds a timed exercise adds per step. */
export const TIMED_INCREMENT_SECONDS = 5;

/** The highest average RPE that still earns more weight. */
export const MAX_RPE_TO_PROGRESS = 9;

/** The planned values a suggestion builds on. `reps` and `repsMax` hold seconds when timed. */
export interface Plan {
  /** The bottom of the range, or the fixed rep count. */
  reps: number | null;
  /** The top of the range; null (or not above `reps`) for a fixed rep count. */
  repsMax?: number | null;
  weight: number | null;
  timed?: boolean;
}

export interface Suggestion {
  /** Null without weight (bodyweight, or a hold without load). */
  weight: number | null;
  /** Reps, or seconds when timed. */
  reps: number;
  /** Why, e.g. "Hit 12 reps on all sets last time → +2.5 kg". */
  reason: string;
}

export interface SuggestOptions {
  /** Kg to add; null for DEFAULT_WEIGHT_INCREMENT. */
  increment?: number | null;
  /** The sets of the session before the last one, for the "two sessions in a row" rule. */
  earlierSessionSets?: SetLog[] | null;
  /** A deload session runs the plan as it is, so there is no suggestion. */
  deload?: boolean;
}

const round2 = (n: number) => Math.round(n * 100) / 100;
const round1 = (n: number) => Math.round(n * 10) / 10;

// Two decimals, so 1.25 kg plates and 61.25 kg show as they are
const kg = (w: number) => `${round2(w)} kg`;

const lowestReps = (sets: SetLog[]) => Math.min(...sets.map((s) => s.reps));

/** The heaviest working weight, null when no set had any. */
function workingWeight(sets: SetLog[]): number | null {
  const weights = sets.map((s) => Number(s.weight ?? 0)).filter((w) => w > 0);
  return weights.length ? Math.max(...weights) : null;
}

/** Average RPE of the sets that have one, null when none do. */
function averageRpe(sets: SetLog[]): number | null {
  const rpes = sets.map((s) => s.rpe).filter((r): r is number => r != null);
  return rpes.length ? rpes.reduce((a, b) => a + Number(b), 0) / rpes.length : null;
}

/**
 * The next target after `lastSessionSets` (warm-ups are ignored), or null when the plan should
 * be shown as it is: no planned reps, no working sets last time (no history), or a deload.
 *
 * - With a range: when every working set reached its top at an average RPE (where given) of at
 *   most 9, the weight goes up by the increment, at the bottom of the range. Otherwise the weight
 *   stays and the reps aim one above the lowest set, up to the top.
 * - With a fixed rep count: every set reaching it (at RPE ≤ 9) adds the increment; otherwise the
 *   weight stays.
 * - Timed: seconds go up by 5 instead of weight, up to the top of a range.
 * - Without weight last time, the reps progress the same way, and reaching the top is called out
 *   instead of adding weight.
 * - Below the bottom two sessions in a row: the weight stays (it is never lowered), and the
 *   reason says so.
 */
export function suggestTarget(plan: Plan, lastSessionSets: SetLog[] | null | undefined, options: SuggestOptions = {}): Suggestion | null {
  if (options.deload) return null;
  const bottom = plan.reps;
  if (bottom == null || bottom <= 0) return null;
  const last = workingSets(lastSessionSets ?? []);
  if (!last.length) return null;

  const timed = !!plan.timed;
  const top = plan.repsMax != null && plan.repsMax > bottom ? plan.repsMax : null;
  const lowest = lowestReps(last);
  const highest = Math.max(...last.map((s) => s.reps));
  const weight = workingWeight(last);
  const rpe = averageRpe(last);
  const easyEnough = rpe == null || rpe <= MAX_RPE_TO_PROGRESS;
  const step = timed ? TIMED_INCREMENT_SECONDS : 1;
  const capped = (n: number) => (top != null ? Math.min(n, top) : n);

  const amount = (n: number) => (timed ? `${n} s` : `${n} ${n === 1 ? 'rep' : 'reps'}`);
  const done = timed ? 'Held' : 'Hit';
  const got = lowest === highest ? amount(lowest) : `${lowest}–${amount(highest)}`;
  const at = weight != null ? ` at ${kg(weight)}` : '';
  const keep = (reps: number, reason: string): Suggestion => ({ weight, reps, reason });

  // Short of the bottom again: hold the weight (no automatic drop) and say so
  const earlier = workingSets(options.earlierSessionSets ?? []);
  if (lowest < bottom && earlier.length && lowestReps(earlier) < bottom) {
    const reps = top != null ? capped(lowest + step) : bottom;
    return keep(reps, `Below ${amount(bottom)} two sessions in a row → ${weight != null ? `stay at ${kg(weight)}` : `aim for ${amount(reps)}`}`);
  }

  if (timed) {
    if (top != null) {
      if (lowest >= top) return keep(top, `${done} ${amount(top)} on all sets last time → top of the range`);
      if (!easyEnough) return keep(Math.max(lowest, bottom), `${done} ${got} at RPE ${round1(rpe!)} last time → stay at ${amount(Math.max(lowest, bottom))}`);
      return keep(capped(lowest + step), `${done} ${got} last time → aim for ${amount(capped(lowest + step))}`);
    }
    if (lowest < bottom) return keep(bottom, `Short of ${amount(bottom)} on a set last time → aim for ${amount(bottom)} again`);
    if (!easyEnough) return keep(lowest, `${done} ${got} at RPE ${round1(rpe!)} last time → stay at ${amount(lowest)}`);
    return keep(lowest + step, `${done} ${amount(lowest)} on all sets last time → +${amount(step)}`);
  }

  // Every working set has to reach the top of the range (or the fixed count) to add weight
  const goal = top ?? bottom;
  if (lowest >= goal) {
    if (!easyEnough) {
      return keep(goal, `${done} ${amount(goal)} on all sets, but at RPE ${round1(rpe!)} → stay${weight != null ? ` at ${kg(weight)}` : ''}`);
    }
    if (weight == null) {
      return keep(goal, `${done} ${amount(goal)} on all sets last time → add weight or a harder variation`);
    }
    const increment = options.increment != null && options.increment > 0 ? options.increment : DEFAULT_WEIGHT_INCREMENT;
    return { weight: round2(weight + increment), reps: bottom, reason: `${done} ${amount(goal)} on all sets last time → +${kg(increment)}` };
  }

  if (top != null) {
    const reps = capped(lowest + step);
    return keep(reps, `Got ${got} last time → aim for ${amount(reps)}${at}`);
  }
  return keep(bottom, `Missed ${amount(bottom)} on a set last time → ${weight != null ? `stay at ${kg(weight)}` : `aim for ${amount(bottom)} again`}`);
}

/** E.g. "NEXT: 62.5 kg × 8 reps", "NEXT: 35 sec" or "NEXT: 11 reps". */
export function formatSuggestion(suggestion: Suggestion, unitShort: string): string {
  const weight = suggestion.weight != null && suggestion.weight > 0 ? `${kg(suggestion.weight)} × ` : '';
  return `NEXT: ${weight}${suggestion.reps} ${unitShort}`;
}
