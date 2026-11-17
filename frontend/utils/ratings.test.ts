import { computeRatingInsight, reviewOf, sameReview } from './ratings';
import { exerciseLog, local, set, trainingLog } from '@/test/factories';
import { TrainingLog } from '@/types';

/** A completed session on day `day` of one workout, with one exercise of 10 reps at `weight`. */
function session(day: number, workoutId: number, weight: number, overrides: Partial<TrainingLog> = {}): TrainingLog {
  return trainingLog(
    local(2026, 3, day),
    [exerciseLog({ libraryExerciseId: workoutId * 100, sets: [set(10, weight)] })],
    { workoutId, ...overrides },
  );
}

describe('reviewOf', () => {
  it('reads missing ratings of older cached data as null', () => {
    expect(reviewOf(session(1, 1, 50, { notes: 'ok' }))).toEqual({ rating: null, energy: null, sleep: null, notes: 'ok' });
    expect(reviewOf(session(1, 1, 50, { rating: 4, energy: 2, sleep: 5 })))
      .toEqual({ rating: 4, energy: 2, sleep: 5, notes: null });
  });
});

describe('sameReview', () => {
  it('compares every rating and the note', () => {
    const review = { rating: 3, energy: null, sleep: 4, notes: 'x' };
    expect(sameReview(review, { ...review })).toBe(true);
    expect(sameReview(review, { ...review, energy: 1 })).toBe(false);
    expect(sameReview(review, { ...review, notes: null })).toBe(false);
  });
});

describe('computeRatingInsight', () => {
  // Push (workout 1) usually moves 1000 kg and Pull (workout 2) 200 kg. High-energy sessions are
  // 10% above their workout's usual and low-energy ones 10% below, so the lighter workout counts
  // as much as the heavier one.
  const logs = [
    session(1, 1, 90, { energy: 1 }),
    session(2, 1, 90, { energy: 2 }),
    session(3, 1, 110, { energy: 4, rating: 5 }), // record: beats day 1 and 2
    session(4, 1, 110, { energy: 5, rating: 4 }), // ties, not a record
    session(5, 2, 18, { energy: 2 }),
    session(6, 2, 22, { energy: 5 }), // record
  ];

  it('compares high and low energy sessions against each workout\'s usual volume', () => {
    const insight = computeRatingInsight(logs);
    expect(insight.ratedSessions).toBe(6);
    expect(insight.factors).toHaveLength(1);
    const [energy] = insight.factors;
    expect(energy.key).toBe('energy');
    expect(energy.high.sessions).toBe(3);
    expect(energy.low.sessions).toBe(3);
    expect(energy.high.volumeVsUsualPct).toBeCloseTo(10);
    expect(energy.low.volumeVsUsualPct).toBeCloseTo(-10);
    expect(energy.volumeDiffPct).toBeCloseTo((1.1 / 0.9 - 1) * 100);
  });

  it('leaves deload sessions out', () => {
    const insight = computeRatingInsight([...logs, session(7, 1, 50, { energy: 1, deload: true })]);
    expect(insight.ratedSessions).toBe(6);
    expect(insight.factors[0].low.volumeVsUsualPct).toBeCloseTo(-10);
  });

  it('counts records per session and averages how the sessions felt', () => {
    const [energy] = computeRatingInsight(logs).factors;
    expect(energy.high.prsPerSession).toBeCloseTo(2 / 3);
    expect(energy.low.prsPerSession).toBe(0);
    expect(energy.high.avgFeel).toBe(4.5);
    expect(energy.low.avgFeel).toBeNull();
  });

  it('leaves a factor out until both groups have three sessions', () => {
    const insight = computeRatingInsight(logs.slice(0, 5));
    expect(insight.factors).toEqual([]);
    expect(insight.ratedSessions).toBe(5);
  });

  it('uses unrated sessions for the usual volume but not in the groups', () => {
    // A heavy unrated Push session raises Push's usual from 1000 to 1200
    const insight = computeRatingInsight([...logs, session(7, 1, 200)]);
    const [energy] = insight.factors;
    expect(insight.ratedSessions).toBe(6);
    expect(energy.high.sessions).toBe(3);
    // Push: 1100 / 1200 − 1 twice, Pull: +10%
    expect(energy.high.volumeVsUsualPct).toBeCloseTo(((1100 / 1200 - 1) * 2 + 0.1) / 3 * 100);
  });

  it('ignores sessions in progress and has no volume to compare for a workout done once', () => {
    const once = [
      session(1, 1, 100, { sleep: 5 }), session(2, 2, 100, { sleep: 5 }), session(3, 3, 100, { sleep: 4 }),
      session(4, 4, 100, { sleep: 1 }), session(5, 5, 100, { sleep: 2 }), session(6, 6, 100, { sleep: 3 }),
      session(7, 1, 100, { sleep: 1, isCompleted: false, completedAt: null }),
    ];
    const insight = computeRatingInsight(once);
    expect(insight.ratedSessions).toBe(6);
    const [sleep] = insight.factors;
    expect(sleep.key).toBe('sleep');
    expect(sleep.low.sessions).toBe(3);
    expect(sleep.high.volumeVsUsualPct).toBeNull();
    expect(sleep.volumeDiffPct).toBeNull();
  });
});
