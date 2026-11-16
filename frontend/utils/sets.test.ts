import { formatSets, previousSetsOf, setsOf, setVolume, summarizeSets, workingSets } from '@/utils/sets';
import { exerciseLog, set, warmup } from '@/test/factories';

describe('setsOf', () => {
  it('returns the logged sets when there are any', () => {
    const sets = [set(8, 60), set(6, 70)];
    expect(setsOf({ sets, setsCompleted: 99, repsCompleted: 99, weightUsed: 99 })).toBe(sets);
  });

  it('keeps an explicitly empty set list', () => {
    expect(setsOf({ sets: [], setsCompleted: 3, repsCompleted: 8, weightUsed: 60 })).toEqual([]);
  });

  it('expands a summary from before per-set logging into identical working sets', () => {
    expect(setsOf({ sets: null, setsCompleted: 3, repsCompleted: 8, weightUsed: 60 })).toEqual([
      set(8, 60), set(8, 60), set(8, 60),
    ]);
    expect(setsOf({ setsCompleted: 2, repsCompleted: 10, weightUsed: null })).toEqual([set(10), set(10)]);
    expect(setsOf({ setsCompleted: 0, repsCompleted: 0, weightUsed: null })).toEqual([]);
  });
});

describe('previousSetsOf', () => {
  it('prefers the previous session\'s logged sets', () => {
    const previousSetLogs = [set(5, 100)];
    expect(previousSetsOf(exerciseLog({ previousSetLogs, previousSets: 3, previousReps: 8, previousWeight: 60 })))
      .toBe(previousSetLogs);
  });

  it('falls back to the previous summary', () => {
    expect(previousSetsOf(exerciseLog({ previousSets: 2, previousReps: 8, previousWeight: 60 })))
      .toEqual([set(8, 60), set(8, 60)]);
    expect(previousSetsOf(exerciseLog({ previousSets: 1, previousReps: null, previousWeight: null })))
      .toEqual([set(0)]);
  });

  it('is empty when the exercise was never trained', () => {
    expect(previousSetsOf(exerciseLog())).toEqual([]);
  });
});

describe('workingSets', () => {
  it('drops warm-ups', () => {
    expect(workingSets([warmup(10, 20), set(8, 60), warmup(5, 40), set(6, 70)])).toEqual([set(8, 60), set(6, 70)]);
    expect(workingSets([])).toEqual([]);
  });
});

describe('summarizeSets', () => {
  it('counts working sets and takes reps and weight of the heaviest', () => {
    expect(summarizeSets([warmup(10, 100), set(8, 60), set(6, 70), set(10, 50)]))
      .toEqual({ setsCompleted: 3, repsCompleted: 6, weightUsed: 70 });
  });

  it('breaks weight ties by reps', () => {
    expect(summarizeSets([set(6, 70), set(8, 70), set(7, 70)]))
      .toEqual({ setsCompleted: 3, repsCompleted: 8, weightUsed: 70 });
  });

  it('treats missing weight as zero (bodyweight work)', () => {
    expect(summarizeSets([set(10), set(12), set(8)])).toEqual({ setsCompleted: 3, repsCompleted: 12, weightUsed: null });
    expect(summarizeSets([set(12), set(5, 10)])).toEqual({ setsCompleted: 2, repsCompleted: 5, weightUsed: 10 });
  });

  it('is empty without working sets', () => {
    expect(summarizeSets([])).toEqual({ setsCompleted: 0, repsCompleted: 0, weightUsed: null });
    expect(summarizeSets([warmup(10, 40)])).toEqual({ setsCompleted: 0, repsCompleted: 0, weightUsed: null });
  });
});

describe('setVolume', () => {
  it('sums weight × reps over working sets', () => {
    expect(setVolume([warmup(10, 20), set(8, 60), set(6, 62.5)])).toBe(8 * 60 + 6 * 62.5);
  });

  it('counts sets without weight as zero', () => {
    expect(setVolume([set(10), set(10, null)])).toBe(0);
    expect(setVolume([])).toBe(0);
  });
});

describe('formatSets', () => {
  it('collapses identical working sets', () => {
    expect(formatSets([set(8, 60), set(8, 60), set(8, 60)])).toBe('3×8 @ 60 kg');
    expect(formatSets([set(5, 62.5)])).toBe('1×5 @ 62.5 kg');
  });

  it('leaves out the weight for bodyweight sets', () => {
    expect(formatSets([set(12), set(12)])).toBe('2×12');
    expect(formatSets([set(12, 0), set(12, 0)])).toBe('2×12');
  });

  it('lists differing sets, with the unit once at the end', () => {
    expect(formatSets([set(8, 60), set(8, 65), set(6, 70)])).toBe('8@60 · 8@65 · 6@70 kg');
    expect(formatSets([set(12), set(10), set(8)])).toBe('12 · 10 · 8');
    expect(formatSets([set(10), set(8, 10)])).toBe('10 · 8@10 kg');
  });

  it('marks timed sets in seconds', () => {
    expect(formatSets([set(60), set(60)], 'seconds')).toBe('2×60s');
    expect(formatSets([set(60), set(45, 10)], 'seconds')).toBe('60s · 45s@10 kg');
    expect(formatSets([set(10)], 'reps')).toBe('1×10');
    expect(formatSets([set(10)], null)).toBe('1×10');
  });

  it('counts warm-ups separately', () => {
    expect(formatSets([warmup(10, 20), warmup(5, 40), set(8, 60)])).toBe('1×8 @ 60 kg (+2 warm-up)');
    expect(formatSets([warmup(10, 20)])).toBe('1 warm-up');
  });

  it('is empty without sets', () => {
    expect(formatSets([])).toBe('');
  });
});
