import { DEFAULT_WEIGHT_INCREMENT, formatSuggestion, suggestTarget } from '@/utils/progression';
import { rpeSet, set, warmup } from '@/test/factories';

const range = { reps: 8, repsMax: 12, weight: 60 };
const fixed = { reps: 5, weight: 100 };

describe('suggestTarget', () => {
  describe('without anything to build on', () => {
    it('falls back to the plan (null) without history', () => {
      expect(suggestTarget(range, [])).toBeNull();
      expect(suggestTarget(range, null)).toBeNull();
      expect(suggestTarget(range, undefined)).toBeNull();
    });

    it('ignores a last session of warm-ups only', () => {
      expect(suggestTarget(range, [warmup(10, 20), warmup(5, 40)])).toBeNull();
    });

    it('needs planned reps', () => {
      expect(suggestTarget({ reps: null, weight: 60 }, [set(8, 60)])).toBeNull();
      expect(suggestTarget({ reps: 0, weight: 60 }, [set(8, 60)])).toBeNull();
    });

    it('is null in a deload, so the plan is shown as it is', () => {
      expect(suggestTarget(range, [set(12, 60), set(12, 60)], { deload: true })).toBeNull();
      expect(suggestTarget(range, [set(12, 60)], { deload: false })).not.toBeNull();
    });
  });

  describe('with a rep range', () => {
    it('adds the default increment at the bottom once every set hits the top', () => {
      expect(suggestTarget(range, [set(12, 60), set(12, 60), set(12, 60)])).toEqual({
        weight: 62.5, reps: 8, reason: 'Hit 12 reps on all sets last time → +2.5 kg',
      });
      expect(DEFAULT_WEIGHT_INCREMENT).toBe(2.5);
    });

    it('counts sets above the top as reaching it', () => {
      expect(suggestTarget(range, [set(14, 60), set(12, 60)])).toMatchObject({ weight: 62.5, reps: 8 });
    });

    it('uses the library entry\'s increment', () => {
      expect(suggestTarget(range, [set(12, 60)], { increment: 1.25 })).toEqual({
        weight: 61.25, reps: 8, reason: 'Hit 12 reps on all sets last time → +1.25 kg',
      });
      expect(suggestTarget(range, [set(12, 60)], { increment: 5 })).toMatchObject({ weight: 65 });
    });

    it('treats a missing or non-positive increment as the default', () => {
      expect(suggestTarget(range, [set(12, 60)], { increment: null })).toMatchObject({ weight: 62.5 });
      expect(suggestTarget(range, [set(12, 60)], { increment: 0 })).toMatchObject({ weight: 62.5 });
      expect(suggestTarget(range, [set(12, 60)], { increment: -5 })).toMatchObject({ weight: 62.5 });
    });

    it('ignores warm-ups when checking the top', () => {
      expect(suggestTarget(range, [warmup(5, 20), set(12, 60), set(12, 60)])).toMatchObject({ weight: 62.5, reps: 8 });
    });

    it('builds on the weight lifted, not the planned one', () => {
      expect(suggestTarget(range, [set(12, 70), set(12, 70)])).toMatchObject({ weight: 72.5, reps: 8 });
    });

    it('takes the heaviest working weight when sets differed', () => {
      expect(suggestTarget(range, [set(12, 60), set(12, 57.5)])).toMatchObject({ weight: 62.5 });
      expect(suggestTarget(range, [set(10, 60), set(12, 57.5)])).toMatchObject({ weight: 60, reps: 11 });
    });

    it('keeps the weight and aims one rep above the lowest set when short of the top', () => {
      expect(suggestTarget(range, [set(12, 60), set(11, 60), set(10, 60)])).toEqual({
        weight: 60, reps: 11, reason: 'Got 10–12 reps last time → aim for 11 reps at 60 kg',
      });
      expect(suggestTarget(range, [set(9, 60), set(9, 60)])).toEqual({
        weight: 60, reps: 10, reason: 'Got 9 reps last time → aim for 10 reps at 60 kg',
      });
    });

    it('caps the reps at the top of the range', () => {
      expect(suggestTarget({ reps: 8, repsMax: 12, weight: 60 }, [set(12, 60), set(11, 60)])).toMatchObject({ reps: 12 });
    });

    it('aims one above a set below the bottom after a single bad session', () => {
      expect(suggestTarget(range, [set(6, 60), set(5, 60)], { earlierSessionSets: [set(9, 60)] })).toEqual({
        weight: 60, reps: 6, reason: 'Got 5–6 reps last time → aim for 6 reps at 60 kg',
      });
    });

    it('rounds the new weight to two decimals', () => {
      expect(suggestTarget({ reps: 8, repsMax: 12, weight: 0.1 }, [set(12, 0.1)], { increment: 0.2 })).toMatchObject({ weight: 0.3 });
    });
  });

  describe('RPE', () => {
    it('adds weight when the average RPE is at most 9', () => {
      expect(suggestTarget(range, [rpeSet(12, 60, 8), rpeSet(12, 60, 9)])).toMatchObject({ weight: 62.5, reps: 8 });
      expect(suggestTarget(range, [rpeSet(12, 60, 9), rpeSet(12, 60, 9)])).toMatchObject({ weight: 62.5 });
    });

    it('stays at the top when the sets were too hard', () => {
      expect(suggestTarget(range, [rpeSet(12, 60, 9.5), rpeSet(12, 60, 10)])).toEqual({
        weight: 60, reps: 12, reason: 'Hit 12 reps on all sets, but at RPE 9.8 → stay at 60 kg',
      });
    });

    it('averages only the sets that have an RPE', () => {
      expect(suggestTarget(range, [rpeSet(12, 60, 9.5), set(12, 60), set(12, 60)])).toMatchObject({ weight: 60, reps: 12 });
      expect(suggestTarget(range, [rpeSet(12, 60, 8.5), set(12, 60)])).toMatchObject({ weight: 62.5 });
    });

    it('ignores the RPE of warm-ups', () => {
      expect(suggestTarget(range, [{ ...warmup(5, 20), rpe: 10 }, set(12, 60)])).toMatchObject({ weight: 62.5 });
    });

    it('holds a fixed rep count too', () => {
      expect(suggestTarget(fixed, [rpeSet(5, 100, 10), rpeSet(5, 100, 10)])).toEqual({
        weight: 100, reps: 5, reason: 'Hit 5 reps on all sets, but at RPE 10 → stay at 100 kg',
      });
    });
  });

  describe('with a fixed rep count', () => {
    it('adds the increment when every set got the reps', () => {
      expect(suggestTarget(fixed, [set(5, 100), set(5, 100), set(6, 100)])).toEqual({
        weight: 102.5, reps: 5, reason: 'Hit 5 reps on all sets last time → +2.5 kg',
      });
    });

    it('keeps the weight at the planned reps when a set fell short', () => {
      expect(suggestTarget(fixed, [set(5, 100), set(4, 100)])).toEqual({
        weight: 100, reps: 5, reason: 'Missed 5 reps on a set last time → stay at 100 kg',
      });
    });

    it('treats a top that isn\'t above the bottom as a fixed count', () => {
      expect(suggestTarget({ reps: 5, repsMax: 5, weight: 100 }, [set(5, 100)])).toMatchObject({ weight: 102.5, reps: 5 });
      expect(suggestTarget({ reps: 5, repsMax: 3, weight: 100 }, [set(5, 100)])).toMatchObject({ weight: 102.5, reps: 5 });
    });

    it('says when one rep was hit', () => {
      expect(suggestTarget({ reps: 1, weight: 150 }, [set(1, 150)])?.reason).toBe('Hit 1 rep on all sets last time → +2.5 kg');
    });
  });

  describe('below the bottom two sessions in a row', () => {
    it('keeps the weight and says so', () => {
      expect(suggestTarget(range, [set(7, 60), set(6, 60)], { earlierSessionSets: [set(8, 60), set(7, 60)] })).toEqual({
        weight: 60, reps: 7, reason: 'Below 8 reps two sessions in a row → stay at 60 kg',
      });
    });

    it('never lowers the weight, even far below', () => {
      expect(suggestTarget(range, [set(3, 80)], { earlierSessionSets: [set(4, 80)] })).toMatchObject({ weight: 80 });
    });

    it('applies to a fixed rep count, aiming for it', () => {
      expect(suggestTarget(fixed, [set(4, 100)], { earlierSessionSets: [set(3, 100)] })).toEqual({
        weight: 100, reps: 5, reason: 'Below 5 reps two sessions in a row → stay at 100 kg',
      });
    });

    it('needs both sessions below the bottom', () => {
      expect(suggestTarget(range, [set(7, 60)], { earlierSessionSets: [set(8, 60)] })?.reason).not.toMatch(/two sessions/);
      expect(suggestTarget(range, [set(8, 60)], { earlierSessionSets: [set(6, 60)] })?.reason).not.toMatch(/two sessions/);
      expect(suggestTarget(range, [set(7, 60)], { earlierSessionSets: [warmup(3, 20)] })?.reason).not.toMatch(/two sessions/);
      expect(suggestTarget(range, [set(7, 60)], { earlierSessionSets: null })?.reason).not.toMatch(/two sessions/);
    });

    it('ignores warm-ups in the earlier session', () => {
      expect(suggestTarget(range, [set(7, 60)], { earlierSessionSets: [warmup(3, 20), set(9, 60)] })?.reason)
        .not.toMatch(/two sessions/);
    });
  });

  describe('timed exercises', () => {
    const hold = { reps: 30, weight: null, timed: true };
    const holdRange = { reps: 30, repsMax: 60, weight: null, timed: true };

    it('adds 5 s instead of weight once every set reached the time', () => {
      expect(suggestTarget(hold, [set(30), set(35)])).toEqual({
        weight: null, reps: 35, reason: 'Held 30 s on all sets last time → +5 s',
      });
    });

    it('keeps the weight of a loaded hold', () => {
      expect(suggestTarget(hold, [set(40, 10), set(40, 10)])).toEqual({
        weight: 10, reps: 45, reason: 'Held 40 s on all sets last time → +5 s',
      });
    });

    it('aims for the planned time again after falling short', () => {
      expect(suggestTarget(hold, [set(30), set(25)])).toEqual({
        weight: null, reps: 30, reason: 'Short of 30 s on a set last time → aim for 30 s again',
      });
    });

    it('stays when it was too hard', () => {
      expect(suggestTarget(hold, [rpeSet(40, null, 10)])).toMatchObject({ reps: 40 });
      expect(suggestTarget(holdRange, [rpeSet(40, null, 10)])).toEqual({
        weight: null, reps: 40, reason: 'Held 40 s at RPE 10 last time → stay at 40 s',
      });
    });

    it('steps through a range and caps at its top', () => {
      expect(suggestTarget(holdRange, [set(40), set(45)])).toEqual({
        weight: null, reps: 45, reason: 'Held 40–45 s last time → aim for 45 s',
      });
      expect(suggestTarget(holdRange, [set(58), set(60)])).toMatchObject({ reps: 60 });
      expect(suggestTarget(holdRange, [set(60), set(65)])).toEqual({
        weight: null, reps: 60, reason: 'Held 60 s on all sets last time → top of the range',
      });
    });

    it('never adds weight', () => {
      expect(suggestTarget({ ...holdRange, weight: 10 }, [set(60, 10)], { increment: 5 })).toMatchObject({ weight: 10, reps: 60 });
    });

    it('keeps the weight two sessions below the bottom', () => {
      expect(suggestTarget(holdRange, [set(20, 10)], { earlierSessionSets: [set(25, 10)] })).toEqual({
        weight: 10, reps: 25, reason: 'Below 30 s two sessions in a row → stay at 10 kg',
      });
    });
  });

  describe('bodyweight exercises', () => {
    const pullUps = { reps: 6, repsMax: 10, weight: null };

    it('adds reps within the range', () => {
      expect(suggestTarget(pullUps, [set(8), set(7)])).toEqual({
        weight: null, reps: 8, reason: 'Got 7–8 reps last time → aim for 8 reps',
      });
    });

    it('calls out the top of the range instead of adding weight', () => {
      expect(suggestTarget(pullUps, [set(10), set(10)])).toEqual({
        weight: null, reps: 10, reason: 'Hit 10 reps on all sets last time → add weight or a harder variation',
      });
    });

    it('treats a weight of 0 as none', () => {
      expect(suggestTarget(pullUps, [set(10, 0)])).toMatchObject({ weight: null, reps: 10 });
    });

    it('aims for a missed fixed count again', () => {
      expect(suggestTarget({ reps: 10, weight: null }, [set(8)])).toEqual({
        weight: null, reps: 10, reason: 'Missed 10 reps on a set last time → aim for 10 reps again',
      });
    });

    it('says two sessions below the bottom without a weight to keep', () => {
      expect(suggestTarget(pullUps, [set(4)], { earlierSessionSets: [set(5)] })).toEqual({
        weight: null, reps: 5, reason: 'Below 6 reps two sessions in a row → aim for 5 reps',
      });
    });
  });
});

describe('formatSuggestion', () => {
  it('shows the weight and reps, or seconds', () => {
    expect(formatSuggestion({ weight: 62.5, reps: 8, reason: '' }, 'reps')).toBe('NEXT: 62.5 kg × 8 reps');
    expect(formatSuggestion({ weight: null, reps: 35, reason: '' }, 'sec')).toBe('NEXT: 35 sec');
    expect(formatSuggestion({ weight: 0, reps: 11, reason: '' }, 'reps')).toBe('NEXT: 11 reps');
    expect(formatSuggestion({ weight: 10, reps: 45, reason: '' }, 'sec')).toBe('NEXT: 10 kg × 45 sec');
    expect(formatSuggestion({ weight: 61.25, reps: 8, reason: '' }, 'reps')).toBe('NEXT: 61.25 kg × 8 reps');
  });
});
