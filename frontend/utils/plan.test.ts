import { formatPlan, formatRepRange, repRangeError, repsMaxOf } from '@/utils/plan';

describe('formatRepRange', () => {
  it('shows a range, or the fixed count', () => {
    expect(formatRepRange(8, 12)).toBe('8–12');
    expect(formatRepRange(8, null)).toBe('8');
    expect(formatRepRange(8)).toBe('8');
  });

  it('leaves out a top that isn\'t above the bottom', () => {
    expect(formatRepRange(8, 8)).toBe('8');
    expect(formatRepRange(8, 6)).toBe('8');
  });
});

describe('formatPlan', () => {
  it('formats sets, reps or a range, and the weight', () => {
    expect(formatPlan({ sets: 3, reps: 8, repsMax: 12, weight: 60 }, 'reps')).toBe('3 × 8–12 reps @ 60 kg');
    expect(formatPlan({ sets: 3, reps: 5, weight: 100 }, 'reps')).toBe('3 × 5 reps @ 100 kg');
    expect(formatPlan({ sets: 2, reps: 30, repsMax: 45, weight: 0 }, 'sec')).toBe('2 × 30–45 sec');
    expect(formatPlan({ sets: 3, reps: 8, repsMax: 12 }, '')).toBe('3 × 8–12');
  });

  it('is null without planned sets and reps', () => {
    expect(formatPlan({ sets: 3, reps: null }, 'reps')).toBeNull();
    expect(formatPlan({ sets: null, reps: 8 }, 'reps')).toBeNull();
    expect(formatPlan({}, 'reps')).toBeNull();
  });
});

describe('repRangeError', () => {
  it('accepts no top, or a top at or above the bottom', () => {
    expect(repRangeError('8', '')).toBeNull();
    expect(repRangeError('', ' ')).toBeNull();
    expect(repRangeError('8', '12')).toBeNull();
    expect(repRangeError('8', '8')).toBeNull();
  });

  it('rejects a top below the bottom', () => {
    expect(repRangeError('12', '8')).toBe('The top of the rep range (8) is below its minimum (12)');
  });

  it('rejects a top without a bottom, or one that isn\'t a whole number', () => {
    expect(repRangeError('', '12')).toBe('A rep range needs a minimum');
    expect(repRangeError('8', '10.5')).toBe('The top of the rep range must be a whole number');
    expect(repRangeError('8', '-3')).toBe('The top of the rep range must be a whole number');
  });
});

describe('repsMaxOf', () => {
  it('parses the top, or gives the empty value', () => {
    expect(repsMaxOf('12', null)).toBe(12);
    expect(repsMaxOf('', null)).toBeNull();
    expect(repsMaxOf('', 0)).toBe(0);
    expect(repsMaxOf('0', 0)).toBe(0);
  });
});
