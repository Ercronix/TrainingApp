import {
  doneSetsOf, elapsedSeconds, formatNumber, formatTarget, gainOf, isInvalidRow, keyOf, loggedPatch, nextRow, payloadFromKey,
  parseNumber, payloadOf, prefillRows, previousLabel, reachedTarget, restorableDraft, rowDefaultsOf, savedKeyOf, setLabels,
  steppedReps, steppedWeight, suggestionOf, targetOf, timedTargetSeconds, toRow, toSet,
} from '@/utils/logExercise';
import { exerciseLog, set, setRow, warmup } from '@/test/factories';

const done = (weight: string, reps: string, overrides = {}) => setRow({ weight, reps, done: true, ...overrides });

describe('toRow', () => {
  it('keeps the RPE only of logged sets', () => {
    expect(toRow({ reps: 8, weight: 60, rpe: 8.5, warmup: false }, true))
      .toEqual(setRow({ weight: '60', reps: '8', rpe: '8.5', done: true }));
    expect(toRow({ reps: 8, weight: null, rpe: 8.5, warmup: true }, false))
      .toEqual(setRow({ reps: '8', warmup: true }));
  });
});

describe('prefillRows', () => {
  it('starts with one empty row without a log', () => {
    expect(prefillRows(undefined)).toEqual([setRow()]);
  });

  it('prefers the sets already logged this session', () => {
    const log = exerciseLog({ sets: [set(8, 60)], previousSetLogs: [set(5, 100)], plannedSets: 3 });
    expect(prefillRows(log)).toEqual([done('60', '8')]);
  });

  it('adds the sets still to do of an exercise not marked done, from last session', () => {
    const log = exerciseLog({ sets: [set(8, 60)], previousSetLogs: [set(8, 57.5), set(8, 57.5), set(7, 57.5)], completed: false });
    expect(prefillRows(log)).toEqual([done('60', '8'), setRow({ weight: '57.5', reps: '8' }), setRow({ weight: '57.5', reps: '7' })]);
  });

  it('adds the sets still to do from the plan, and nothing once the plan is met', () => {
    const log = exerciseLog({ sets: [set(8, 60)], plannedSets: 3, plannedReps: 8, plannedWeight: 60, completed: false });
    expect(prefillRows(log)).toEqual([done('60', '8'), setRow({ weight: '60', reps: '8' }), setRow({ weight: '60', reps: '8' })]);
    const met = exerciseLog({ sets: [set(8, 60), set(8, 60)], plannedSets: 2, plannedReps: 8, completed: false });
    expect(prefillRows(met)).toEqual([done('60', '8'), done('60', '8')]);
  });

  it('then repeats last session, not done', () => {
    const log = exerciseLog({ previousSetLogs: [warmup(10, 20), set(5, 100)], plannedSets: 3, plannedReps: 8 });
    expect(prefillRows(log)).toEqual([setRow({ weight: '20', reps: '10', warmup: true }), setRow({ weight: '100', reps: '5' })]);
  });

  it('then fills the plan, at least one row', () => {
    expect(prefillRows(exerciseLog({ plannedSets: 2, plannedReps: 8, plannedWeight: 62.5 })))
      .toEqual([setRow({ weight: '62.5', reps: '8' }), setRow({ weight: '62.5', reps: '8' })]);
    expect(prefillRows(exerciseLog({ plannedReps: 30 }))).toEqual([setRow({ reps: '30' })]);
  });

  describe('with a suggestion', () => {
    const suggestion = { weight: 62.5, reps: 8, reason: 'Hit 12 reps on all sets last time → +2.5 kg' };

    it('gives last session\'s working sets the suggested values, keeping its warm-ups', () => {
      const log = exerciseLog({ previousSetLogs: [warmup(10, 20), set(12, 60), set(12, 60)], plannedReps: 8, plannedRepsMax: 12 });
      expect(prefillRows(log, suggestion)).toEqual([
        setRow({ weight: '20', reps: '10', warmup: true }),
        setRow({ weight: '62.5', reps: '8' }),
        setRow({ weight: '62.5', reps: '8' }),
      ]);
    });

    it('leaves the weight empty for a suggestion without weight', () => {
      const log = exerciseLog({ previousSetLogs: [set(10)], plannedReps: 8, plannedRepsMax: 12 });
      expect(prefillRows(log, { weight: null, reps: 11, reason: '' })).toEqual([setRow({ reps: '11' })]);
    });

    it('gives the sets still to do the suggested values', () => {
      const log = exerciseLog({ sets: [set(8, 62.5)], previousSetLogs: [set(12, 60), set(12, 60)], completed: false });
      expect(prefillRows(log, suggestion)).toEqual([done('62.5', '8'), setRow({ weight: '62.5', reps: '8' })]);
    });

    it('never replaces sets already logged this session', () => {
      const log = exerciseLog({ sets: [set(9, 60)], previousSetLogs: [set(12, 60), set(12, 60)], plannedSets: 2 });
      expect(prefillRows(log, suggestion)).toEqual([done('60', '9')]);
    });

    it('works with the real suggestion of a log', () => {
      const log = exerciseLog({
        plannedSets: 3, plannedReps: 8, plannedRepsMax: 12, plannedWeight: 60,
        previousSetLogs: [set(12, 60), set(11, 60), set(10, 60)],
      });
      expect(prefillRows(log, suggestionOf(log))).toEqual([
        setRow({ weight: '60', reps: '11' }), setRow({ weight: '60', reps: '11' }), setRow({ weight: '60', reps: '11' }),
      ]);
    });
  });
});

describe('rowDefaultsOf', () => {
  it('is the plan without a suggestion', () => {
    expect(rowDefaultsOf(exerciseLog({ plannedReps: 8, plannedRepsMax: 12, plannedWeight: 60 }))).toEqual({ weight: 60, reps: 8 });
    expect(rowDefaultsOf(undefined)).toEqual({ weight: null, reps: null });
  });

  it('is the suggestion when there is one', () => {
    const log = exerciseLog({ plannedReps: 8, plannedWeight: 60 });
    expect(rowDefaultsOf(log, { weight: 62.5, reps: 8, reason: '' })).toEqual({ weight: 62.5, reps: 8 });
    expect(rowDefaultsOf(log, { weight: null, reps: 35, reason: '' })).toEqual({ weight: null, reps: 35 });
  });

  it('drives a one-tap log and a timed set\'s target', () => {
    const defaults = rowDefaultsOf(exerciseLog({ plannedReps: 30, repUnit: 'seconds' }), { weight: null, reps: 35, reason: '' });
    expect(loggedPatch(setRow(), defaults)).toEqual({ done: true, reps: '35', weight: '' });
    expect(timedTargetSeconds([setRow()], 0, defaults)).toBe(35);
  });
});

describe('nextRow', () => {
  it('copies the last row\'s values as a fresh working set', () => {
    expect(nextRow([done('60', '8', { rpe: '9', warmup: true })])).toEqual(setRow({ weight: '60', reps: '8' }));
    expect(nextRow([])).toEqual(setRow());
  });
});

describe('loggedPatch', () => {
  it('marks done and fills empty values from the defaults', () => {
    const defaults = rowDefaultsOf(exerciseLog({ plannedReps: 8, plannedWeight: 60 }));
    expect(loggedPatch(setRow({ reps: ' ' }), defaults)).toEqual({ done: true, reps: '8', weight: '60' });
    expect(loggedPatch(setRow({ reps: '6', weight: '70' }), defaults)).toEqual({ done: true, reps: '6', weight: '70' });
    expect(loggedPatch(setRow(), rowDefaultsOf(undefined))).toEqual({ done: true, reps: '', weight: '' });
  });
});

describe('toSet', () => {
  it('parses a row, with a comma as decimal separator', () => {
    expect(toSet(setRow({ weight: '62,5', reps: '8', rpe: '8.5' }))).toEqual({ reps: 8, weight: 62.5, rpe: 8.5, warmup: false });
    expect(toSet(setRow({ reps: '8', warmup: true }))).toEqual({ reps: 8, weight: null, rpe: null, warmup: true });
  });

  it('rejects values that can\'t be saved', () => {
    expect(toSet(setRow({ reps: '' }))).toBeNull();
    expect(toSet(setRow({ reps: '8.5' }))).toBeNull();
    expect(toSet(setRow({ reps: '8', weight: 'x' }))).toBeNull();
    expect(toSet(setRow({ reps: '8', weight: '1000' }))).toBeNull();
    expect(toSet(setRow({ reps: '8', rpe: '11' }))).toBeNull();
  });
});

describe('doneSetsOf and isInvalidRow', () => {
  it('collects the done sets, or null while one is invalid', () => {
    const rows = [done('60', '8'), setRow({ reps: 'x' })];
    expect(doneSetsOf(rows)).toEqual({ doneRows: [rows[0]], sets: [{ reps: 8, weight: 60, rpe: null, warmup: false }] });
    expect(isInvalidRow(rows[1])).toBe(false);
    const invalid = done('60', '');
    expect(isInvalidRow(invalid)).toBe(true);
    expect(doneSetsOf([rows[0], invalid]).sets).toBeNull();
  });
});

describe('payloadOf', () => {
  it('completes once the working sets reach the plan', () => {
    const log = exerciseLog({ plannedSets: 2 });
    expect(payloadOf([warmup(10), set(8)], log).completed).toBe(false);
    expect(payloadOf([set(8), set(8)], log).completed).toBe(true);
  });

  it('leaves completion unchanged without a plan', () => {
    expect(payloadOf([set(8)], exerciseLog()).completed).toBeUndefined();
  });

  it('round-trips through its key', () => {
    const payload = payloadOf([set(8, 60)], exerciseLog({ plannedSets: 1 }));
    expect(payloadFromKey(keyOf(payload))).toEqual(payload);
  });

  it('keys the server\'s sets like the rows that show them', () => {
    const log = exerciseLog({ sets: [{ reps: 8, weight: 60, rpe: 8, warmup: false }] });
    expect(savedKeyOf(log)).toBe(keyOf(payloadOf(doneSetsOf(prefillRows(log)).sets!, log)));
    expect(savedKeyOf(undefined)).toBe(keyOf({ sets: [], completed: undefined }));
  });
});

describe('restorableDraft', () => {
  const log = exerciseLog({ sets: [set(8, 60)] });

  it('restores a draft whose logged sets match the server\'s', () => {
    const draft = { rows: [done('60', '8'), setRow({ reps: '8' })], timing: null };
    expect(restorableDraft(draft, log)).toBe(draft);
  });

  it('drops a draft the server has moved on from', () => {
    expect(restorableDraft({ rows: [done('60', '6')], timing: null }, log)).toBeUndefined();
    expect(restorableDraft({ rows: [setRow()], timing: null }, log)).toBeUndefined();
  });

  it('keeps a draft with an invalid done set, which was never saved', () => {
    const draft = { rows: [done('60', '')], timing: null };
    expect(restorableDraft(draft, log)).toBe(draft);
  });

  it('is undefined without a draft', () => {
    expect(restorableDraft(undefined, log)).toBeUndefined();
  });
});

describe('timed sets', () => {
  const defaults = rowDefaultsOf(exerciseLog({ plannedReps: 30, repUnit: 'seconds' }));

  it('aims for the entered seconds, else the plan', () => {
    expect(timedTargetSeconds([setRow({ reps: '45' })], 0, defaults)).toBe(45);
    expect(timedTargetSeconds([setRow()], 0, defaults)).toBe(30);
    expect(timedTargetSeconds([setRow()], 0, rowDefaultsOf(undefined))).toBeNaN();
  });

  it('counts whole seconds, never below zero', () => {
    expect(elapsedSeconds(1000, 3999)).toBe(2);
    expect(elapsedSeconds(1000, 500)).toBe(0);
  });

  it('knows when the stopwatch reached the target', () => {
    const rows = [setRow()];
    expect(reachedTarget({ index: 0, startedAt: 0 }, rows, defaults, 30_000)).toBe(true);
    expect(reachedTarget({ index: 0, startedAt: 0 }, rows, defaults, 29_999)).toBe(false);
    expect(reachedTarget(null, rows, defaults, 99_000)).toBe(false);
    expect(reachedTarget({ index: 0, startedAt: 0 }, rows, rowDefaultsOf(undefined), 99_000)).toBe(false);
  });
});

describe('steppers', () => {
  it('steps the weight from the value, else the fallback, not below zero', () => {
    expect(steppedWeight('60', 40, 2.5, 1)).toBe('62.5');
    expect(steppedWeight('', 40, 2.5, -1)).toBe('37.5');
    expect(steppedWeight('', null, 2.5, 1)).toBe('2.5');
    expect(steppedWeight('1', null, 2.5, -1)).toBe('0');
    expect(steppedWeight('0.1', null, 0.2, 1)).toBe('0.3');
  });

  it('steps the reps by one from the value, else the fallback, not below zero', () => {
    expect(steppedReps('8', 5, 1)).toBe('9');
    expect(steppedReps('', 5, -1)).toBe('4');
    expect(steppedReps('', null, 1)).toBe('1');
    expect(steppedReps('0', null, -1)).toBe('0');
  });
});

describe('setLabels', () => {
  it('numbers working sets and marks warm-ups W', () => {
    expect(setLabels([setRow({ warmup: true }), setRow(), setRow({ warmup: true }), setRow()])).toEqual(['W', '1', 'W', '2']);
  });
});

describe('previousLabel', () => {
  it('shows weight × reps, or only the reps without weight', () => {
    expect(previousLabel(set(8, 82.5), false)).toBe('82.5×8');
    expect(previousLabel(set(8, 0), false)).toBe('8');
    expect(previousLabel(set(45), true)).toBe('45s');
    expect(previousLabel(undefined, false)).toBeNull();
  });
});

describe('targetOf and formatTarget', () => {
  it('needs planned sets and reps', () => {
    expect(targetOf(exerciseLog({ plannedSets: 3 }))).toBeNull();
    expect(targetOf(undefined)).toBeNull();
    expect(targetOf(exerciseLog({ plannedSets: 3, plannedReps: 8, plannedWeight: 60 })))
      .toEqual({ sets: 3, reps: 8, repsMax: null, weight: 60 });
  });

  it('carries the top of a rep range', () => {
    expect(targetOf(exerciseLog({ plannedSets: 3, plannedReps: 8, plannedRepsMax: 12, plannedWeight: 60 })))
      .toEqual({ sets: 3, reps: 8, repsMax: 12, weight: 60 });
  });

  it('formats the line, leaving out a missing or zero weight', () => {
    expect(formatTarget({ sets: 3, reps: 8, repsMax: null, weight: 62.5 }, 'reps')).toBe('PLAN: 3 × 8 reps @ 62.5 kg');
    expect(formatTarget({ sets: 3, reps: 30, repsMax: null, weight: 0 }, 'sec')).toBe('PLAN: 3 × 30 sec');
    expect(formatTarget({ sets: 3, reps: 30, repsMax: null, weight: null }, 'sec')).toBe('PLAN: 3 × 30 sec');
  });

  it('formats a rep range', () => {
    expect(formatTarget({ sets: 3, reps: 8, repsMax: 12, weight: 60 }, 'reps')).toBe('PLAN: 3 × 8–12 reps @ 60 kg');
    expect(formatTarget({ sets: 2, reps: 30, repsMax: 45, weight: null }, 'sec')).toBe('PLAN: 2 × 30–45 sec');
  });
});

describe('suggestionOf', () => {
  it('suggests from the plan, last session, the session before and the increment', () => {
    const log = exerciseLog({
      plannedSets: 3, plannedReps: 8, plannedRepsMax: 12, plannedWeight: 60, weightIncrement: 5,
      previousSetLogs: [warmup(10, 20), set(12, 60), set(12, 60), set(12, 60)],
    });
    expect(suggestionOf(log)).toEqual({ weight: 65, reps: 8, reason: 'Hit 12 reps on all sets last time → +5 kg' });

    const struggling = exerciseLog({
      plannedReps: 8, plannedRepsMax: 12, previousSetLogs: [set(6, 60)], earlierSetLogs: [set(7, 60)],
    });
    expect(suggestionOf(struggling)?.reason).toBe('Below 8 reps two sessions in a row → stay at 60 kg');
  });

  it('adds seconds for timed exercises', () => {
    const log = exerciseLog({ plannedReps: 30, repUnit: 'seconds', previousSetLogs: [set(30), set(32)] });
    expect(suggestionOf(log)).toEqual({ weight: null, reps: 35, reason: 'Held 30 s on all sets last time → +5 s' });
  });

  it('is null without a log, without history and in a deload', () => {
    const log = exerciseLog({ plannedReps: 8, plannedWeight: 60, previousSetLogs: [set(8, 60)] });
    expect(suggestionOf(undefined)).toBeNull();
    expect(suggestionOf(exerciseLog({ plannedReps: 8, plannedWeight: 60 }))).toBeNull();
    expect(suggestionOf(log)).not.toBeNull();
    expect(suggestionOf(log, { deload: true })).toBeNull();
  });
});

describe('gainOf', () => {
  const log = exerciseLog({ bestWeight: 100, bestOneRepMax: 120 });

  it('is null for sets not logged, warm-ups and without a log', () => {
    expect(gainOf([setRow({ weight: '200', reps: '1' })], 0, log, [])).toBeNull();
    expect(gainOf([done('200', '1', { warmup: true })], 0, log, [])).toBeNull();
    expect(gainOf([done('200', '1')], 0, undefined, [])).toBeNull();
  });

  it('calls out a record', () => {
    expect(gainOf([done('105', '1')], 0, log, [])).toEqual({ record: expect.stringContaining('Heaviest ever'), label: 'PR' });
  });

  it('counts the earlier sets of this session toward the record', () => {
    const rows = [done('105', '1'), done('105', '1')];
    expect(gainOf(rows, 1, log, [])).toBeNull();
  });

  it('has no record without history', () => {
    expect(gainOf([done('105', '1')], 0, exerciseLog(), [])).toBeNull();
  });

  it('compares with the set at the same position last session', () => {
    const previous = [set(8, 60), set(8, 60)];
    const noRecord = exerciseLog();
    expect(gainOf([done('62.5', '8')], 0, noRecord, previous)).toEqual({ record: null, label: '+2.5 kg' });
    expect(gainOf([done('60', '9')], 0, noRecord, previous)).toEqual({ record: null, label: '+1 rep' });
    expect(gainOf([done('60', '8'), done('60', '10')], 1, noRecord, previous)).toEqual({ record: null, label: '+2 reps' });
    expect(gainOf([done('60', '7')], 0, noRecord, previous)).toBeNull();
    // More weight but weaker
    expect(gainOf([done('62.5', '4')], 0, noRecord, previous)).toBeNull();
  });

  it('labels extra seconds of timed sets', () => {
    const timed = exerciseLog({ repUnit: 'seconds' });
    expect(gainOf([done('', '45')], 0, timed, [set(30)])).toEqual({ record: null, label: '+15s' });
  });

  it('ignores a warm-up last session', () => {
    expect(gainOf([done('60', '10')], 0, exerciseLog(), [warmup(8, 60)])).toBeNull();
  });
});

describe('parseNumber, formatNumber and the toSet round trip', () => {
  it('accepts a decimal comma and rejects text', () => {
    expect(parseNumber('62,5')).toBe(62.5);
    expect(parseNumber('abc')).toBeNull();
  });

  it('rounds to two decimals', () => {
    expect(formatNumber(2.5)).toBe('2.5');
    expect(formatNumber(0.1 + 0.2)).toBe('0.3');
  });

  it('round-trips a logged set and leaves out an empty weight and RPE', () => {
    const logged = { reps: 8, weight: 60, rpe: 8, warmup: true };
    expect(toSet(toRow(logged, true))).toEqual(logged);
    expect(toSet(setRow({ reps: '12', done: true }))).toEqual({ reps: 12, weight: null, rpe: null, warmup: false });
  });

  it('rejects the values the server would refuse', () => {
    expect(toSet(setRow({ weight: '60', reps: '8.5' }))).toBeNull();
    expect(toSet(setRow({ weight: '-5', reps: '8' }))).toBeNull();
    expect(toSet(setRow({ weight: '1000', reps: '8' }))).toBeNull();
    expect(toSet(setRow({ weight: '60', reps: '8', rpe: '11' }))).toBeNull();
  });
});
