// The set rows of the log-exercise screen: the strings a user types, and how they turn into sets.
import type { SetRow } from '@/store/setDraftStore';
import { ExerciseLog, SetLog } from '@/types';
import { previousSetsOf, workingSets } from './sets';
import { detectPersonalRecord, estimateOneRepMax, formatKg } from './strength';

export const emptyRow: SetRow = { weight: '', reps: '', rpe: '', warmup: false, done: false };

export const toRow = (s: SetLog, logged: boolean): SetRow => ({
  weight: s.weight != null ? String(s.weight) : '',
  reps: String(s.reps),
  rpe: logged && s.rpe != null ? String(s.rpe) : '',
  warmup: s.warmup,
  done: logged,
});

// Prefill: what's already logged this session, else last session, else the plan
export function initialRows(log: ExerciseLog | undefined): SetRow[] {
  if (!log) return [{ ...emptyRow }];
  if (log.sets?.length) return log.sets.map((s) => toRow(s, true));
  const previous = previousSetsOf(log);
  if (previous.length) return previous.map((s) => toRow(s, false));
  const planned = log.plannedSets ?? 0;
  const row: SetRow = {
    weight: log.plannedWeight != null ? String(log.plannedWeight) : '',
    reps: log.plannedReps != null ? String(log.plannedReps) : '',
    rpe: '',
    warmup: false,
    done: false,
  };
  return Array.from({ length: Math.max(planned, 1) }, () => ({ ...row }));
}

export const parseNumber = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const formatNumber = (n: number) => String(Math.round(n * 100) / 100);

/** The set a row describes, or null when its values can't be saved. */
export function toSet(row: SetRow): SetLog | null {
  const reps = parseInt(row.reps, 10);
  if (!/^\d+$/.test(row.reps.trim()) || !Number.isFinite(reps)) return null;
  const weight = row.weight.trim() ? parseNumber(row.weight) : null;
  if (row.weight.trim() && (weight == null || weight < 0 || weight > 999.99)) return null;
  const rpe = row.rpe.trim() ? parseNumber(row.rpe) : null;
  if (row.rpe.trim() && (rpe == null || rpe < 1 || rpe > 10)) return null;
  return { reps, weight, rpe, warmup: row.warmup };
}

export interface SetsPayload {
  sets: SetLog[];
  completed: boolean | undefined;
}

/**
 * The update a set of rows saves: every done set, and `completed` once the working sets
 * reach the plan. Without a plan, completion stays manual (undefined leaves it unchanged).
 */
export function payloadOf(sets: SetLog[], log: ExerciseLog | undefined): SetsPayload {
  const planned = log?.plannedSets;
  return { sets, completed: planned ? workingSets(sets).length >= planned : undefined };
}

/** Seconds a timed set aims for: its entered value, else the plan. NaN when neither is set. */
export const targetOf = (rows: SetRow[], index: number, log: ExerciseLog | undefined) =>
  parseInt(rows[index]?.reps || String(log?.plannedReps ?? ''), 10);

export interface Gain {
  /** Beats the sessions before (and the sets before it in this one). */
  record: string | null;
  label: string;
}

/**
 * What a logged working set improves on: a record, else the set at the same position last
 * session (more weight without losing strength, or more reps at the same weight). Null when it
 * improves on nothing; falling short isn't called out.
 */
export function gainOf(rows: SetRow[], index: number, log: ExerciseLog | undefined, previous: SetLog[]): Gain | null {
  const row = rows[index];
  const set = row?.done && !row.warmup ? toSet(row) : null;
  if (!set || !log) return null;
  const timed = log.repUnit === 'seconds';
  const weight = Number(set.weight ?? 0);

  const earlier = rows.slice(0, index)
    .filter((r) => r.done && !r.warmup)
    .map(toSet)
    .filter((s): s is SetLog => s != null);
  const record = log.bestWeight == null ? null : detectPersonalRecord({
    bestWeight: Math.max(log.bestWeight, ...earlier.map((s) => Number(s.weight ?? 0))),
    bestOneRepMax: timed || log.bestOneRepMax == null
      ? null
      : Math.max(log.bestOneRepMax, ...earlier.map((s) => estimateOneRepMax(Number(s.weight ?? 0), s.reps))),
  }, weight, set.reps);
  if (record) return { record, label: 'PR' };

  const last = previous[index];
  if (!last || last.warmup) return null;
  const lastWeight = Number(last.weight ?? 0);
  const stronger = set.reps >= last.reps
    || (!timed && estimateOneRepMax(weight, set.reps) > estimateOneRepMax(lastWeight, last.reps));
  if (weight > lastWeight && stronger) return { record: null, label: `+${formatKg(weight - lastWeight)} kg` };
  const more = set.reps - last.reps;
  if (weight === lastWeight && more > 0) {
    return { record: null, label: `+${more}${timed ? 's' : more === 1 ? ' rep' : ' reps'}` };
  }
  return null;
}
