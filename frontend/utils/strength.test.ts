import {
  calculatePlates,
  detectPersonalRecord,
  estimateOneRepMax,
  formatKg,
  personalRecordOf,
} from '@/utils/strength';
import { exerciseLog, set, warmup } from '@/test/factories';

describe('estimateOneRepMax', () => {
  it('uses Epley for rep sets', () => {
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2);
    expect(estimateOneRepMax(60, 5)).toBeCloseTo(70, 10);
  });

  it('returns the weight itself for a single', () => {
    expect(estimateOneRepMax(140, 1)).toBe(140);
  });

  it('is zero without weight or reps', () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
    expect(estimateOneRepMax(100, 0)).toBe(0);
    expect(estimateOneRepMax(-10, 5)).toBe(0);
  });
});

describe('detectPersonalRecord', () => {
  const records = { bestWeight: 100, bestOneRepMax: 120 };

  it('is silent without history or weight', () => {
    expect(detectPersonalRecord({ bestWeight: null, bestOneRepMax: null }, 200, 1)).toBeNull();
    expect(detectPersonalRecord(records, 0, 50)).toBeNull();
  });

  it('reports a heavier weight first', () => {
    expect(detectPersonalRecord(records, 102.5, 1)).toBe('Heaviest ever: 102.5 kg (previous best 100 kg)');
  });

  it('reports a better estimated 1RM at a lower weight', () => {
    // 95 × 8 → 120.33
    expect(detectPersonalRecord(records, 95, 8)).toBe('Best estimated 1RM: 120.3 kg (previous 120 kg)');
  });

  it('tolerates rounding differences against the server\'s best', () => {
    // 90 × 10 → exactly 120
    expect(detectPersonalRecord({ bestWeight: 100, bestOneRepMax: 119.995 }, 90, 10)).toBeNull();
  });

  it('is null when nothing is beaten, and ignores a missing best 1RM', () => {
    expect(detectPersonalRecord(records, 100, 5)).toBeNull();
    expect(detectPersonalRecord({ bestWeight: 100, bestOneRepMax: null }, 90, 15)).toBeNull();
  });
});

describe('personalRecordOf', () => {
  it('checks the heaviest working set first', () => {
    const log = exerciseLog({ bestWeight: 100, bestOneRepMax: 200, sets: [set(5, 95), set(1, 105)] });
    expect(personalRecordOf(log)).toBe('Heaviest ever: 105 kg (previous best 100 kg)');
  });

  it('then the set with the best estimated 1RM', () => {
    const log = exerciseLog({ bestWeight: 100, bestOneRepMax: 120, sets: [set(1, 100), set(10, 92.5)] });
    expect(personalRecordOf(log)).toBe('Best estimated 1RM: 123.3 kg (previous 120 kg)');
  });

  it('ignores warm-ups and sets without weight', () => {
    const log = exerciseLog({ bestWeight: 100, bestOneRepMax: 120, sets: [warmup(1, 140), set(20), set(5, 80)] });
    expect(personalRecordOf(log)).toBeNull();
  });

  it('only lets timed sets set weight records, since their reps are seconds', () => {
    const timed = { repUnit: 'seconds' as const, bestWeight: 20, bestOneRepMax: 25 };
    expect(personalRecordOf(exerciseLog({ ...timed, sets: [set(90, 20)] }))).toBeNull();
    expect(personalRecordOf(exerciseLog({ ...timed, sets: [set(30, 22.5)] })))
      .toBe('Heaviest ever: 22.5 kg (previous best 20 kg)');
  });

  it('is null for a first session or one without sets', () => {
    expect(personalRecordOf(exerciseLog({ sets: [set(5, 100)] }))).toBeNull();
    expect(personalRecordOf(exerciseLog({ bestWeight: 100, sets: undefined }))).toBeNull();
  });
});

describe('calculatePlates', () => {
  it('loads the biggest plates first, per side', () => {
    expect(calculatePlates(100)).toEqual({ perSide: [25, 15], remainder: 0 });
    expect(calculatePlates(142.5)).toEqual({ perSide: [25, 25, 10, 1.25], remainder: 0 });
  });

  it('handles an empty bar and a custom bar', () => {
    expect(calculatePlates(20)).toEqual({ perSide: [], remainder: 0 });
    expect(calculatePlates(25, 15)).toEqual({ perSide: [5], remainder: 0 });
  });

  it('reports what the plates cannot make', () => {
    expect(calculatePlates(21)).toEqual({ perSide: [], remainder: 1 });
    expect(calculatePlates(63)).toEqual({ perSide: [20, 1.25], remainder: 0.5 });
  });

  it('avoids float drift with small plates', () => {
    expect(calculatePlates(22.5)).toEqual({ perSide: [1.25], remainder: 0 });
    expect(calculatePlates(20 + 2 * 3.75)).toEqual({ perSide: [2.5, 1.25], remainder: 0 });
  });

  it('is null below the bar or for invalid input', () => {
    expect(calculatePlates(15)).toBeNull();
    expect(calculatePlates(NaN)).toBeNull();
    expect(calculatePlates(Infinity)).toBeNull();
  });
});

describe('formatKg', () => {
  it('drops trailing zeros and keeps one decimal', () => {
    expect(formatKg(60)).toBe('60');
    expect(formatKg(62.5)).toBe('62.5');
    expect(formatKg(133.333)).toBe('133.3');
    expect(formatKg(59.96)).toBe('60');
    expect(formatKg(0)).toBe('0');
  });
});
