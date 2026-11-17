import {
  formatNumber, gainOf, initialRows, parseNumber, payloadOf, targetOf, toRow, toSet,
} from '@/utils/setRows';
import type { SetRow } from '@/store/setDraftStore';
import { exerciseLog, set, warmup } from '@/test/factories';

const row = (weight: string, reps: string, overrides: Partial<SetRow> = {}): SetRow =>
  ({ weight, reps, rpe: '', warmup: false, done: true, ...overrides });

describe('initialRows', () => {
  it('starts with one empty row without a log', () => {
    expect(initialRows(undefined)).toEqual([{ weight: '', reps: '', rpe: '', warmup: false, done: false }]);
  });

  it('prefers the sets already logged this session, marked done', () => {
    const log = exerciseLog({ sets: [{ reps: 8, weight: 60, rpe: 8.5, warmup: false }], previousSetLogs: [set(5, 100)] });
    expect(initialRows(log)).toEqual([row('60', '8', { rpe: '8.5' })]);
  });

  it('falls back to last session, not done and without its RPE', () => {
    const log = exerciseLog({ previousSetLogs: [{ reps: 5, weight: 100, rpe: 9, warmup: false }, warmup(10, 40)] });
    expect(initialRows(log)).toEqual([
      row('100', '5', { done: false }),
      row('40', '10', { done: false, warmup: true }),
    ]);
  });

  it('falls back to the plan, one row per planned set', () => {
    const log = exerciseLog({ plannedSets: 3, plannedReps: 8, plannedWeight: 50 });
    expect(initialRows(log)).toEqual(Array(3).fill(row('50', '8', { done: false })));
    expect(initialRows(exerciseLog())).toEqual([row('', '', { done: false })]);
  });
});

describe('parseNumber / formatNumber', () => {
  it('accepts a decimal comma', () => {
    expect(parseNumber('62,5')).toBe(62.5);
    expect(parseNumber('abc')).toBeNull();
  });

  it('rounds to two decimals', () => {
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
  });
});

describe('toSet', () => {
  it('round-trips a logged set', () => {
    const logged = { reps: 8, weight: 60, rpe: 8, warmup: true };
    expect(toSet(toRow(logged, true))).toEqual(logged);
  });

  it('leaves out an empty weight and RPE', () => {
    expect(toSet(row('', '12'))).toEqual({ reps: 12, weight: null, rpe: null, warmup: false });
  });

  it('rejects values the server would refuse', () => {
    expect(toSet(row('60', ''))).toBeNull();
    expect(toSet(row('60', '8.5'))).toBeNull();
    expect(toSet(row('-5', '8'))).toBeNull();
    expect(toSet(row('1000', '8'))).toBeNull();
    expect(toSet(row('60', '8', { rpe: '11' }))).toBeNull();
  });
});

describe('payloadOf', () => {
  it('completes once the working sets reach the plan', () => {
    const log = exerciseLog({ plannedSets: 2 });
    expect(payloadOf([warmup(10, 20), set(8, 60)], log).completed).toBe(false);
    expect(payloadOf([set(8, 60), set(8, 60)], log).completed).toBe(true);
  });

  it('leaves completion unchanged without a plan', () => {
    expect(payloadOf([set(8, 60)], exerciseLog()).completed).toBeUndefined();
  });
});

describe('targetOf', () => {
  it('uses the entered seconds, else the plan', () => {
    const log = exerciseLog({ plannedReps: 45 });
    expect(targetOf([row('', '30')], 0, log)).toBe(30);
    expect(targetOf([row('', '')], 0, log)).toBe(45);
    expect(targetOf([row('', '')], 0, exerciseLog())).toBeNaN();
  });
});

describe('gainOf', () => {
  const log = exerciseLog({ bestWeight: 100, bestOneRepMax: 120 });

  it('calls out a record first', () => {
    expect(gainOf([row('105', '1')], 0, log, [])?.label).toBe('PR');
  });

  it('counts earlier sets of this session towards the record', () => {
    const rows = [row('105', '1'), row('102.5', '1')];
    expect(gainOf(rows, 1, log, [])).toBeNull();
  });

  it('compares with the same set last session', () => {
    const previous = [set(8, 60)];
    expect(gainOf([row('62.5', '8')], 0, log, previous)).toEqual({ record: null, label: '+2.5 kg' });
    expect(gainOf([row('60', '9')], 0, log, previous)).toEqual({ record: null, label: '+1 rep' });
    expect(gainOf([row('60', '7')], 0, log, previous)).toBeNull();
  });

  it('uses seconds for timed exercises', () => {
    const timed = exerciseLog({ repUnit: 'seconds' });
    expect(gainOf([row('', '50')], 0, timed, [set(45)])?.label).toBe('+5s');
  });

  it('ignores warm-ups and sets not done', () => {
    expect(gainOf([row('62.5', '8', { warmup: true })], 0, log, [set(8, 60)])).toBeNull();
    expect(gainOf([row('62.5', '8', { done: false })], 0, log, [set(8, 60)])).toBeNull();
  });
});
