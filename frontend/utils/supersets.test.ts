import {
  formatSupersetPlace, memberProgress, MemberProgress, stepAfterSet, supersetLabel, supersetOf, supersetPositions,
  supersetRound,
} from './supersets';
import { exerciseLog, set, setRow, warmup } from '@/test/factories';

const grouped = (...groups: (number | null)[]) => groups.map((supersetGroup) => ({ supersetGroup }));
const member = (id: number, done: number, total: number): MemberProgress => ({ id, done, total });

describe('supersetPositions', () => {
  it('places adjacent items with the same group, and leaves the rest out', () => {
    expect(supersetPositions(grouped(null, 1, 1, null, 2, 2, 2))).toEqual([
      null,
      { index: 0, size: 2 }, { index: 1, size: 2 },
      null,
      { index: 0, size: 3 }, { index: 1, size: 3 }, { index: 2, size: 3 },
    ]);
  });

  it('treats a lone member as ungrouped, also when a group is split apart', () => {
    expect(supersetPositions(grouped(1, null, 1))).toEqual([null, null, null]);
    expect(supersetPositions(grouped(1, 2, 2, 1, 1))).toEqual([
      null, { index: 0, size: 2 }, { index: 1, size: 2 }, { index: 0, size: 2 }, { index: 1, size: 2 },
    ]);
  });

  it('handles missing groups (data cached before supersets) and no items', () => {
    expect(supersetPositions([{}, {}])).toEqual([null, null]);
    expect(supersetPositions([])).toEqual([]);
  });
});

describe('supersetOf', () => {
  it('returns the run an item is in', () => {
    const items = [{ id: 1, supersetGroup: null }, { id: 2, supersetGroup: 4 }, { id: 3, supersetGroup: 4 }];
    expect(supersetOf(items, 2)?.map((i) => i.id)).toEqual([2, 3]);
    expect(supersetOf(items, 0)).toBeNull();
  });
});

describe('supersetLabel', () => {
  it('calls two a superset and more a circuit', () => {
    expect(supersetLabel(2)).toBe('Superset');
    expect(supersetLabel(3)).toBe('Circuit');
  });
});

describe('stepAfterSet', () => {
  it('alternates through a superset, resting after each round, until it is done', () => {
    // A and B, 3 sets each: A1 → B1 → rest → A2 → B2 → rest → A3 → B3 → done
    expect(stepAfterSet([member(1, 1, 3), member(2, 0, 3)], 1)).toEqual({ kind: 'next', exerciseLogId: 2 });
    expect(stepAfterSet([member(1, 1, 3), member(2, 1, 3)], 2)).toEqual({ kind: 'rest', exerciseLogId: 1 });
    expect(stepAfterSet([member(1, 2, 3), member(2, 1, 3)], 1)).toEqual({ kind: 'next', exerciseLogId: 2 });
    expect(stepAfterSet([member(1, 2, 3), member(2, 2, 3)], 2)).toEqual({ kind: 'rest', exerciseLogId: 1 });
    expect(stepAfterSet([member(1, 3, 3), member(2, 2, 3)], 1)).toEqual({ kind: 'next', exerciseLogId: 2 });
    expect(stepAfterSet([member(1, 3, 3), member(2, 3, 3)], 2)).toEqual({ kind: 'done' });
  });

  it('goes through every exercise of a circuit before resting', () => {
    const circuit = (a: number, b: number, c: number) => [member(1, a, 2), member(2, b, 2), member(3, c, 2)];
    expect(stepAfterSet(circuit(1, 0, 0), 1)).toEqual({ kind: 'next', exerciseLogId: 2 });
    expect(stepAfterSet(circuit(1, 1, 0), 2)).toEqual({ kind: 'next', exerciseLogId: 3 });
    expect(stepAfterSet(circuit(1, 1, 1), 3)).toEqual({ kind: 'rest', exerciseLogId: 1 });
  });

  it('skips a member that has no sets left in an uneven group', () => {
    // A has 4 sets, B 3: after the third round, A does its last set alone
    expect(stepAfterSet([member(1, 3, 4), member(2, 3, 3)], 2)).toEqual({ kind: 'rest', exerciseLogId: 1 });
    expect(stepAfterSet([member(1, 4, 4), member(2, 3, 3)], 1)).toEqual({ kind: 'done' });
    // B has more: once A is done, B rests between its own sets and stays put
    expect(stepAfterSet([member(1, 2, 2), member(2, 3, 4)], 2)).toEqual({ kind: 'rest', exerciseLogId: 2 });
  });

  it('sends back to a member skipped earlier in the round, without resting', () => {
    // Started with B: A still owes the first round
    expect(stepAfterSet([member(1, 0, 3), member(2, 1, 3), member(3, 0, 3)], 2)).toEqual({ kind: 'next', exerciseLogId: 3 });
    expect(stepAfterSet([member(1, 0, 3), member(2, 1, 3), member(3, 1, 3)], 3)).toEqual({ kind: 'next', exerciseLogId: 1 });
  });

  it('keeps pointing at the partner when sets of one exercise are logged in a row', () => {
    expect(stepAfterSet([member(1, 2, 3), member(2, 0, 3)], 1)).toEqual({ kind: 'next', exerciseLogId: 2 });
  });

  it('says done for an exercise that is not in the group', () => {
    expect(stepAfterSet([member(1, 1, 3)], 9)).toEqual({ kind: 'done' });
  });
});

describe('supersetRound', () => {
  it('is the round in progress out of the most sets of a member', () => {
    expect(supersetRound([member(1, 0, 3), member(2, 0, 3)])).toEqual({ round: 1, rounds: 3 });
    expect(supersetRound([member(1, 1, 3), member(2, 0, 3)])).toEqual({ round: 1, rounds: 3 });
    expect(supersetRound([member(1, 1, 3), member(2, 1, 3)])).toEqual({ round: 2, rounds: 3 });
    expect(supersetRound([member(1, 3, 4), member(2, 3, 3)])).toEqual({ round: 4, rounds: 4 });
    expect(supersetRound([member(1, 3, 3), member(2, 3, 3)])).toEqual({ round: 3, rounds: 3 });
  });

  it('counts one round when nothing is planned', () => {
    expect(supersetRound([member(1, 0, 0), member(2, 0, 0)])).toEqual({ round: 1, rounds: 1 });
  });
});

describe('formatSupersetPlace', () => {
  it('names the group, the place in it and the round', () => {
    expect(formatSupersetPlace({ index: 0, size: 2 }, [member(1, 1, 3), member(2, 1, 3)]))
      .toBe('Superset · 1 of 2 · Round 2 of 3');
    expect(formatSupersetPlace({ index: 2, size: 3 }, [member(1, 0, 2), member(2, 0, 2), member(3, 0, 2)]))
      .toBe('Circuit · 3 of 3 · Round 1 of 2');
  });
});

describe('memberProgress', () => {
  it('counts the working rows of the open screen', () => {
    const log = exerciseLog({ completed: false });
    const rows = [setRow({ warmup: true, done: true }), setRow({ done: true }), setRow(), setRow()];
    expect(memberProgress(log, rows)).toEqual({ id: log.id, done: 1, total: 3 });
  });

  it('counts what a closed exercise would open with: its logged sets, else last session, else the plan', () => {
    const logged = exerciseLog({ completed: false, plannedSets: 3, sets: [set(8, 60), set(8, 60)] });
    expect(memberProgress(logged)).toEqual({ id: logged.id, done: 2, total: 2 });
    const fresh = exerciseLog({ completed: false, plannedSets: 3, sets: [], previousSetLogs: [warmup(10, 20), set(8, 60), set(8, 60), set(6, 60)] });
    expect(memberProgress(fresh)).toEqual({ id: fresh.id, done: 0, total: 3 });
    const planned = exerciseLog({ completed: false, plannedSets: 4, plannedReps: 10, sets: [] });
    expect(memberProgress(planned)).toEqual({ id: planned.id, done: 0, total: 4 });
  });

  it('prefers the draft left on its screen', () => {
    const log = exerciseLog({ completed: false, plannedSets: 3, sets: [set(8, 60)] });
    const draft = { rows: [setRow({ reps: '8', weight: '60', done: true }), setRow(), setRow(), setRow()], timing: null };
    expect(memberProgress(log, undefined, draft)).toEqual({ id: log.id, done: 1, total: 4 });
  });

  it('treats an exercise marked done as finished', () => {
    const log = exerciseLog({ completed: true, plannedSets: 3, sets: [set(8, 60)] });
    const draft = { rows: [setRow({ reps: '8', weight: '60', done: true }), setRow(), setRow()], timing: null };
    expect(memberProgress(log, undefined, draft)).toEqual({ id: log.id, done: 1, total: 1 });
  });
});
