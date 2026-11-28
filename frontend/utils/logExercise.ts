// Pure logic of the log exercise screen: set rows (the editable, string-valued form of a set),
// their prefill, what they save, the target line, steppers, and what a logged set improves on.
import { ExerciseLog, SetLog } from '@/types';
import type { SetDraft, SetRow } from '@/store/setDraftStore';
import { previousSetsOf, workingSets } from './sets';
import { formatRepRange } from './plan';
import { detectPersonalRecord, estimateOneRepMax, formatKg } from './strength';
import { Suggestion, suggestTarget } from './progression';

export const SAVE_DEBOUNCE_MS = 600;

// RPE below 7 is rarely worth logging; halves cover the common 8.5-style calls
export const RPE_OPTIONS = ['7', '7.5', '8', '8.5', '9', '9.5', '10'];

export const emptyRow: SetRow = { weight: '', reps: '', rpe: '', warmup: false, done: false };

export const toRow = (s: SetLog, logged: boolean): SetRow => ({
  weight: s.weight != null ? String(s.weight) : '',
  reps: String(s.reps),
  rpe: logged && s.rpe != null ? String(s.rpe) : '',
  warmup: s.warmup,
  done: logged,
});

export const parseNumber = (value: string) => {
  const n = parseFloat(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export const formatNumber = (n: number) => String(Math.round(n * 100) / 100);

/** A number as a row value, '' for none. */
export const textOf = (n: number | null) => (n != null ? String(n) : '');

/** Options for the suggested next target. */
export interface SuggestionContext {
  /** The session is a deload, which runs the plan as it is. */
  deload?: boolean;
}

/**
 * The suggested next target (see `suggestTarget`) after the last session, null when the plan
 * stands as it is (no history, no planned reps, or a deload).
 */
export function suggestionOf(log: ExerciseLog | undefined, context: SuggestionContext = {}): Suggestion | null {
  if (!log) return null;
  return suggestTarget(
    { reps: log.plannedReps, repsMax: log.plannedRepsMax, weight: log.plannedWeight, timed: log.repUnit === 'seconds' },
    previousSetsOf(log),
    { increment: log.weightIncrement, earlierSessionSets: log.earlierSetLogs, deload: context.deload },
  );
}

/**
 * What a row's empty weight and reps stand for: the suggested next target, else the plan's
 * values. They show as placeholders, a one-tap log takes them, the steppers start from them,
 * and so does a new session's prefill when there is no last session.
 */
export interface RowDefaults {
  weight: number | null;
  reps: number | null;
}

export const rowDefaultsOf = (log: ExerciseLog | undefined, suggestion: Suggestion | null = null): RowDefaults =>
  suggestion
    ? { weight: suggestion.weight, reps: suggestion.reps }
    : { weight: log?.plannedWeight ?? null, reps: log?.plannedReps ?? null };

/**
 * The rows the screen opens with: what's already logged this session (never replaced), then the
 * rows still to do from last session's layout, else from the plan. An exercise marked done opens
 * with only its logged sets. With a suggestion, last session's working sets take its weight and
 * reps instead of their own; its warm-ups stay as they were.
 *
 * The sets still to do are filled in again so that reopening a partly logged exercise without its
 * draft (on another device, or once the draft is gone) doesn't drop them, which would also make a
 * superset count the exercise as finished.
 */
export function prefillRows(log: ExerciseLog | undefined, suggestion: Suggestion | null = null): SetRow[] {
  if (!log) return [{ ...emptyRow }];
  const logged = (log.sets ?? []).map((s) => toRow(s, true));
  if (logged.length && log.completed) return logged;
  return [...logged, ...freshRows(log, suggestion).slice(logged.length)];
}

/** The rows of an exercise with nothing logged yet: last session's layout, else the plan. */
function freshRows(log: ExerciseLog, suggestion: Suggestion | null): SetRow[] {
  const previous = previousSetsOf(log);
  if (previous.length) {
    return previous.map((s) => (suggestion && !s.warmup
      ? { ...emptyRow, weight: textOf(suggestion.weight), reps: String(suggestion.reps) }
      : toRow(s, false)));
  }
  const defaults = rowDefaultsOf(log, suggestion);
  const row: SetRow = { ...emptyRow, weight: textOf(defaults.weight), reps: textOf(defaults.reps) };
  return Array.from({ length: Math.max(log.plannedSets ?? 0, 1) }, () => ({ ...row }));
}

/** The row a new set starts as: a copy of the last one's values, not done. */
export function nextRow(rows: SetRow[]): SetRow {
  const last = rows[rows.length - 1];
  return last ? { ...last, rpe: '', warmup: false, done: false } : { ...emptyRow };
}

/** What a one-tap log sets on a row: done, with empty values taking the defaults. */
export const loggedPatch = (row: SetRow, defaults: RowDefaults): Pick<SetRow, 'done' | 'reps' | 'weight'> => ({
  done: true,
  reps: row.reps.trim() || textOf(defaults.reps),
  weight: row.weight.trim() || textOf(defaults.weight),
});

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

/** A done row whose values can't be saved; it's outlined and holds the save back. */
export const isInvalidRow = (row: SetRow) => row.done && toSet(row) == null;

/** The done rows and their sets; `sets` is null while one of them is invalid. */
export function doneSetsOf(rows: SetRow[]): { doneRows: SetRow[]; sets: SetLog[] | null } {
  const doneRows = rows.filter((r) => r.done);
  const sets = doneRows.map(toSet);
  return { doneRows, sets: sets.some((s) => s == null) ? null : (sets as SetLog[]) };
}

export interface SavePayload {
  sets: SetLog[];
  completed: boolean | undefined;
}

/**
 * The update a set of rows saves: every done set, and `completed` once the working sets
 * reach the plan. Without a plan, completion stays manual (undefined leaves it unchanged).
 */
export function payloadOf(sets: SetLog[], log: ExerciseLog | undefined): SavePayload {
  const planned = log?.plannedSets;
  return { sets, completed: planned ? workingSets(sets).length >= planned : undefined };
}

/**
 * Whether closing the screen with DONE marks the exercise done: once every row is logged, or
 * once any working set is, even short of the plan (sets left out count as not done, the
 * exercise as done). Not while a done row is invalid, nor with only warm-ups logged short of
 * the rows.
 */
export function completesOnDone(rows: SetRow[], sets: SetLog[] | null): sets is SetLog[] {
  if (sets == null || rows.length === 0) return false;
  return rows.every((r) => r.done) || workingSets(sets).length > 0;
}

export const keyOf = (payload: SavePayload) => JSON.stringify(payload);

export const payloadFromKey = (key: string) => JSON.parse(key) as SavePayload;

/**
 * The key of what the server already has, so only real changes are sent (through the same
 * row conversion, so equal sets give equal keys).
 */
export const savedKeyOf = (log: ExerciseLog | undefined) =>
  keyOf(payloadOf((log?.sets ?? []).map((s) => toSet(toRow(s, true)) as SetLog), log));

/**
 * A draft left on an earlier visit, if it may replace the prefill: not when the sets it logged
 * no longer match the server's (e.g. the exercise was ticked off on the training screen
 * since), as it would otherwise be saved back over them.
 */
export function restorableDraft(saved: SetDraft | undefined, log: ExerciseLog | undefined): SetDraft | undefined {
  if (!saved) return undefined;
  const draftSets = saved.rows.filter((r) => r.done).map(toSet);
  // A done set with invalid values was never saved, so there is nothing to compare
  if (draftSets.some((s) => s == null)) return saved;
  const serverSets = (log?.sets ?? []).map((s) => toSet(toRow(s, true)));
  return JSON.stringify(draftSets) === JSON.stringify(serverSets) ? saved : undefined;
}

/** Seconds a timed set aims for: its entered value, else the default. NaN when neither is set. */
export const timedTargetSeconds = (rows: SetRow[], index: number, defaults: RowDefaults) =>
  parseInt(rows[index]?.reps || textOf(defaults.reps), 10);

/** Whole seconds a stopwatch has run at `nowMs`. */
export const elapsedSeconds = (startedAt: number, nowMs: number) =>
  Math.max(0, Math.floor((nowMs - startedAt) / 1000));

/** Whether a stopwatch reached its set's target by `nowMs`. */
export function reachedTarget(timing: SetDraft['timing'], rows: SetRow[], defaults: RowDefaults, nowMs: number) {
  return timing != null && nowMs - timing.startedAt >= timedTargetSeconds(rows, timing.index, defaults) * 1000;
}

/** A weight stepper tap: the value (else the fallback, else 0) moved by one step, not below 0. */
export function steppedWeight(value: string, fallback: number | null, step: number, direction: 1 | -1): string {
  const base = parseNumber(value) ?? fallback ?? 0;
  return formatNumber(Math.max(0, base + direction * step));
}

/** A reps (or seconds) stepper tap: the value (else the fallback, else 0) moved by one, not below 0. */
export function steppedReps(value: string, fallback: number | null, direction: 1 | -1): string {
  const base = parseInt(value, 10);
  const current = Number.isFinite(base) ? base : (fallback ?? 0);
  return String(Math.max(0, current + direction));
}

/** Set numbers count working sets only; warm-ups show as W. */
export function setLabels(rows: SetRow[]): string[] {
  let workingNumber = 0;
  return rows.map((r) => (r.warmup ? 'W' : String(++workingNumber)));
}

/** What a set was last session, e.g. 80×8 (or 45s), null when there was none. */
export function previousLabel(previous: SetLog | undefined, timed: boolean): string | null {
  if (!previous) return null;
  const reps = `${previous.reps}${timed ? 's' : ''}`;
  return previous.weight != null && Number(previous.weight) > 0 ? `${formatKg(Number(previous.weight))}×${reps}` : reps;
}

/** The plan the target line shows. `repsMax` is the top of a rep range, null for a fixed count. */
export interface Target {
  sets: number;
  reps: number;
  repsMax: number | null;
  weight: number | null;
}

/** The plan's target, or null without planned sets and reps. */
export function targetOf(log: ExerciseLog | undefined): Target | null {
  if (log?.plannedSets == null || log.plannedReps == null) return null;
  return { sets: log.plannedSets, reps: log.plannedReps, repsMax: log.plannedRepsMax ?? null, weight: log.plannedWeight };
}

/** E.g. "PLAN: 3 × 8–12 reps @ 60 kg"; a weight of 0 is left out. */
export const formatTarget = (target: Target, unitShort: string) =>
  `PLAN: ${target.sets} × ${formatRepRange(target.reps, target.repsMax)} ${unitShort}${target.weight ? ` @ ${target.weight} kg` : ''}`;

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
