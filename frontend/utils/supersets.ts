// Supersets and circuits: adjacent exercises with the same superset group, done a set of each in
// turn before resting. Shared by the plan (workout exercises) and the session (exercise logs).
import { ExerciseLog } from '@/types';
import type { SetDraft, SetRow } from '@/store/setDraftStore';
import { prefillRows, restorableDraft } from './logExercise';

/** Where an exercise sits in its superset. */
export interface SupersetPosition {
  /** Place in the group, from 0. */
  index: number;
  size: number;
}

/**
 * Each item's place in its superset, null when it isn't in one. A group is a run of adjacent
 * items with the same `supersetGroup`; a run of one is no group (the server clears those, but a
 * session's swapped exercise can still split one).
 */
export function supersetPositions(items: { supersetGroup?: number | null }[]): (SupersetPosition | null)[] {
  const positions: (SupersetPosition | null)[] = items.map(() => null);
  let start = 0;
  while (start < items.length) {
    const group = items[start].supersetGroup;
    let end = start + 1;
    while (group != null && end < items.length && items[end].supersetGroup === group) end++;
    if (end - start > 1) {
      for (let i = start; i < end; i++) positions[i] = { index: i - start, size: end - start };
    }
    start = end;
  }
  return positions;
}

/** The items of the superset the item at `index` is in, in order, or null when it's in none. */
export function supersetOf<T extends { supersetGroup?: number | null }>(items: T[], index: number): T[] | null {
  const position = supersetPositions(items)[index];
  if (!position) return null;
  const start = index - position.index;
  return items.slice(start, start + position.size);
}

/** "Superset" for two exercises, "Circuit" for three or more. */
export const supersetLabel = (size: number) => (size > 2 ? 'Circuit' : 'Superset');

/** How far an exercise of a superset is: its working sets logged, and all it will do. */
export interface MemberProgress {
  id: number;
  done: number;
  total: number;
}

/**
 * The progress of a superset member, from the rows of its log screen: `rows` for the one open
 * now, else the rows its screen would open with (its draft, else the prefill). Warm-ups don't
 * count, so they don't take a turn in the rotation. A member marked done is finished.
 */
export function memberProgress(log: ExerciseLog, rows?: SetRow[], draft?: SetDraft): MemberProgress {
  const working = (rows ?? restorableDraft(draft, log)?.rows ?? prefillRows(log)).filter((r) => !r.warmup);
  const done = working.filter((r) => r.done).length;
  return { id: log.id, done, total: !rows && log.completed ? done : working.length };
}

/** The progress of every member of a superset, the open one (`currentId`) from its screen's `rows`. */
export function supersetProgress(
  members: ExerciseLog[], currentId: number, rows: SetRow[], drafts: Record<string, SetDraft>,
): MemberProgress[] {
  return members.map((m) => memberProgress(m, m.id === currentId ? rows : undefined, drafts[String(m.id)]));
}

/** What follows a set logged in a superset. */
export type SupersetStep =
  /** Straight on to this exercise for its set of the round, without resting. */
  | { kind: 'next'; exerciseLogId: number }
  /** The round is over: rest, then this exercise opens the next one (possibly the current one). */
  | { kind: 'rest'; exerciseLogId: number }
  /** Every set of the group is logged: rest as usual before what comes after it. */
  | { kind: 'done' };

/**
 * What happens after a working set of `currentId` is logged (its progress already counting it).
 * The set belongs to round n, n being the sets that exercise has done. Members that still owe
 * round n (and have that many sets) come next, the first after the current one in order, else
 * the first before it (skipped ones). Once nobody owes the round, it's over: rest, and the
 * first member with sets left starts the next round.
 */
export function stepAfterSet(members: MemberProgress[], currentId: number): SupersetStep {
  const current = members.findIndex((m) => m.id === currentId);
  if (current < 0) return { kind: 'done' };
  const round = members[current].done;
  const owes = (m: MemberProgress) => m.done < Math.min(round, m.total);
  const owing = [...members.slice(current + 1), ...members.slice(0, current)].find(owes);
  if (owing) return { kind: 'next', exerciseLogId: owing.id };
  const left = members.find((m) => m.done < m.total);
  return left ? { kind: 'rest', exerciseLogId: left.id } : { kind: 'done' };
}

/**
 * The round in progress (the lowest set count among the members with sets left, plus one; the
 * last round once all are done) and how many there are (the most sets of any member).
 */
export function supersetRound(members: MemberProgress[]): { round: number; rounds: number } {
  const rounds = Math.max(1, ...members.map((m) => m.total));
  const left = members.filter((m) => m.done < m.total);
  if (left.length === 0) return { round: rounds, rounds };
  return { round: Math.min(rounds, 1 + Math.min(...left.map((m) => m.done))), rounds };
}

/** E.g. "Superset · 1 of 2 · Round 2 of 3". */
export function formatSupersetPlace(position: SupersetPosition, members: MemberProgress[]): string {
  const { round, rounds } = supersetRound(members);
  return `${supersetLabel(position.size)} · ${position.index + 1} of ${position.size} · Round ${round} of ${rounds}`;
}
