import {
  analyzeProgression,
  classifyExercise,
  computeExerciseStats,
  computeTrainingAnalytics,
  formatDuration,
  formatNumber,
  formatSigned,
  formatWeeks,
  linearRegression,
  oneRepMaxBreakdown,
  primaryValue,
  repMaxTable,
  roundToIncrement,
  startOfPeriod,
  startOfWeek,
  summarizePeriods,
  toSessionPoints,
  totalsOf,
  weightForReps,
} from '@/utils/stats';
import { estimateOneRepMax } from '@/utils/strength';
import { exerciseLog, local, progressEntry, set, trainingLog, warmup } from '@/test/factories';

const DAY_MS = 86_400_000;
// Wednesday 18 Nov 2026, noon
const NOW = local(2026, 11, 18);

// ─── One-rep max ────────────────────────────────────────────────────────────

describe('oneRepMaxBreakdown', () => {
  it('averages every formula and spans their range', () => {
    const b = oneRepMaxBreakdown(100, 5)!;
    expect(b.formulas.map((f) => f.id)).toEqual(['epley', 'brzycki', 'lander', 'lombardi', 'mayhew', 'oconner', 'wathan']);
    expect(b.formulas.find((f) => f.id === 'epley')!.value).toBeCloseTo(116.67, 2);
    expect(b.formulas.find((f) => f.id === 'brzycki')!.value).toBeCloseTo(112.5, 5);
    expect(b.low).toBe(Math.min(...b.formulas.map((f) => f.value)));
    expect(b.high).toBe(Math.max(...b.formulas.map((f) => f.value)));
    expect(b.average).toBeGreaterThan(b.low);
    expect(b.average).toBeLessThan(b.high);
    expect(b.reliability).toBe('high');
  });

  it('agrees on the weight itself for a single', () => {
    const b = oneRepMaxBreakdown(140, 1)!;
    expect(b.formulas.every((f) => f.value === 140)).toBe(true);
    expect(b.average).toBe(140);
  });

  it('rates reliability by rep count', () => {
    expect(oneRepMaxBreakdown(100, 10)!.reliability).toBe('medium');
    expect(oneRepMaxBreakdown(100, 11)!.reliability).toBe('low');
  });

  it('drops formulas that break down at very high reps', () => {
    const ids = oneRepMaxBreakdown(20, 40)!.formulas.map((f) => f.id);
    expect(ids).not.toContain('brzycki');
    expect(ids).not.toContain('lander');
    expect(ids).toContain('epley');
  });

  it('is null without weight or reps', () => {
    expect(oneRepMaxBreakdown(0, 5)).toBeNull();
    expect(oneRepMaxBreakdown(100, 0)).toBeNull();
    expect(oneRepMaxBreakdown(NaN, 5)).toBeNull();
  });
});

describe('rep maxes', () => {
  it('inverts Epley', () => {
    expect(weightForReps(estimateOneRepMax(80, 8), 8)).toBeCloseTo(80, 10);
    expect(weightForReps(100, 1)).toBe(100);
    expect(weightForReps(0, 5)).toBe(0);
    expect(weightForReps(100, 0)).toBe(0);
  });

  it('builds a table of weights and percentages', () => {
    const table = repMaxTable(100);
    expect(table.map((r) => r.reps)).toEqual([1, 2, 3, 4, 5, 6, 8, 10, 12, 15]);
    expect(table[0]).toEqual({ reps: 1, weight: 100, percent: 100 });
    const ten = table.find((r) => r.reps === 10)!;
    expect(ten.weight).toBeCloseTo(75, 10);
    expect(ten.percent).toBeCloseTo(75, 10);
  });

  it('rounds to loadable increments', () => {
    expect(roundToIncrement(61.2)).toBe(60);
    expect(roundToIncrement(61.3)).toBe(62.5);
    expect(roundToIncrement(103, 5)).toBe(105);
  });
});

// ─── Per-session points ─────────────────────────────────────────────────────

describe('toSessionPoints', () => {
  it('summarizes working sets per session, oldest first', () => {
    const points = toSessionPoints([
      progressEntry(local(2026, 11, 10), [set(5, 100)]),
      progressEntry(local(2026, 11, 3), [warmup(10, 60), set(8, 80), set(6, 85), set(10, 70)]),
    ]);
    expect(points.map((p) => p.date)).toEqual([local(2026, 11, 3).getTime(), local(2026, 11, 10).getTime()]);
    const p = points[0];
    expect(p.weight).toBe(85);
    expect(p.sets).toBe(3);
    expect(p.reps).toBe(10);
    expect(p.e1rm).toBeCloseTo(Math.max(estimateOneRepMax(80, 8), estimateOneRepMax(85, 6), estimateOneRepMax(70, 10)), 10);
    expect(p.volume).toBe(8 * 80 + 6 * 85 + 10 * 70);
    expect(p.totalReps).toBe(24);
    expect(p.workingSets).toHaveLength(3);
  });

  it('expands legacy summaries', () => {
    const [p] = toSessionPoints([progressEntry(local(2026, 11, 3), [], { sets: undefined, setsCompleted: 3, repsCompleted: 8, weightUsed: 60 })]);
    expect(p).toMatchObject({ weight: 60, sets: 3, reps: 8, volume: 3 * 8 * 60, totalReps: 24 });
  });

  it('has no 1RM or tonnage for timed exercises', () => {
    const [p] = toSessionPoints([progressEntry(local(2026, 11, 3), [set(60, 10), set(45, 10)])], true);
    expect(p).toMatchObject({ weight: 10, reps: 60, e1rm: 0, volume: 0, totalReps: 105 });
  });

  it('gives zeros for a session with only warm-ups, and drops unparseable dates', () => {
    const points = toSessionPoints([
      progressEntry(local(2026, 11, 3), [warmup(10, 40)]),
      progressEntry(local(2026, 11, 4), [set(5, 100)], { date: 'not a date' }),
    ]);
    expect(points).toHaveLength(1);
    expect(points[0]).toMatchObject({ weight: 0, sets: 0, reps: 0, e1rm: 0, volume: 0 });
  });
});

describe('classifyExercise / primaryValue', () => {
  const [weighted] = toSessionPoints([progressEntry(NOW, [set(8, 60)])]);
  const [bodyweight] = toSessionPoints([progressEntry(NOW, [set(12)])]);

  it('classifies by unit and whether any session used weight', () => {
    expect(classifyExercise([weighted], true)).toBe('timed');
    expect(classifyExercise([bodyweight, weighted], false)).toBe('weighted');
    expect(classifyExercise([bodyweight], false)).toBe('bodyweight');
    expect(classifyExercise([], false)).toBe('bodyweight');
  });

  it('measures weighted work by weight and the rest by reps', () => {
    expect(primaryValue(weighted, 'weighted')).toBe(60);
    expect(primaryValue(weighted, 'bodyweight')).toBe(8);
    expect(primaryValue(weighted, 'timed')).toBe(8);
  });
});

// ─── Regression & progression ───────────────────────────────────────────────

describe('linearRegression', () => {
  it('fits a perfect line', () => {
    const fit = linearRegression([0, 1, 2, 3], [1, 3, 5, 7])!;
    expect(fit.slope).toBeCloseTo(2, 10);
    expect(fit.intercept).toBeCloseTo(1, 10);
    expect(fit.r2).toBeCloseTo(1, 10);
  });

  it('explains a flat series perfectly', () => {
    expect(linearRegression([0, 1, 2], [5, 5, 5])).toEqual({ slope: 0, intercept: 5, r2: 1 });
  });

  it('reports a weak fit for noisy data', () => {
    const fit = linearRegression([0, 1, 2, 3], [1, 3, 1, 3])!;
    expect(fit.r2).toBeCloseTo(0.2, 10);
  });

  it('is null for too few points, mismatched lengths or a single x', () => {
    expect(linearRegression([1], [1])).toBeNull();
    expect(linearRegression([1, 2], [1])).toBeNull();
    expect(linearRegression([2, 2, 2], [1, 2, 3])).toBeNull();
  });
});

describe('analyzeProgression', () => {
  const t0 = local(2026, 9, 1).getTime();
  const series = (values: [day: number, value: number][]) => values.map(([d, value]) => ({ date: t0 + d * DAY_MS, value }));

  it('fits and projects a steady weekly gain', () => {
    const p = analyzeProgression(series([[0, 100], [7, 102.5], [14, 105], [21, 107.5]]), 107.5)!;
    expect(p.sessions).toBe(4);
    expect(p.windowDays).toBe(21);
    expect(p.trendValue).toBeCloseTo(107.5, 10);
    expect(p.perWeek).toBeCloseTo(2.5, 10);
    expect(p.pctPerMonth).toBeCloseTo(((2.5 / 7) * 30 / 107.5) * 100, 10);
    expect(p.r2).toBeCloseTo(1, 10);
    // Fewer than 6 sessions caps the confidence at medium
    expect(p.confidence).toBe('medium');
    expect(p.lastDate).toBe(t0 + 21 * DAY_MS);
    expect(p.projections.map((x) => x.weeks)).toEqual([4, 8, 12]);
    expect(p.projections.map((x) => x.value)).toEqual([117.5, 127.5, 137.5].map((v) => expect.closeTo(v, 10)));
    // Next 5 kg step above the best
    expect(p.milestone!.target).toBe(110);
    expect(p.milestone!.weeks).toBeCloseTo(1, 10);
  });

  it('is confident with six or more well-fitting sessions', () => {
    const p = analyzeProgression(series([[0, 60], [7, 61], [14, 62.5], [21, 63], [28, 64.5], [35, 65]]), 65)!;
    expect(p.confidence).toBe('high');
  });

  it('puts the milestone above a best that sits exactly on a step', () => {
    const p = analyzeProgression(series([[0, 90], [7, 95], [14, 100]]), 100)!;
    expect(p.milestone!.target).toBe(105);
    // Small numbers step by 1, mid-range by 2.5
    expect(analyzeProgression(series([[0, 10], [7, 11], [14, 12]]), 12)!.milestone!.target).toBe(13);
    expect(analyzeProgression(series([[0, 30], [7, 31], [14, 32]]), 32)!.milestone!.target).toBe(32.5);
    expect(analyzeProgression(series([[0, 150], [7, 155], [14, 160]]), 160)!.milestone!.target).toBe(170);
  });

  it('has no time to the milestone and clamps projections at zero when declining', () => {
    const p = analyzeProgression(series([[0, 30], [7, 20], [14, 10]]), 30)!;
    expect(p.perWeek).toBeCloseTo(-10, 10);
    expect(p.milestone!.weeks).toBeNull();
    expect(p.projections.every((x) => x.value === 0)).toBe(true);
  });

  it('fits only the 90 days before the latest session', () => {
    const p = analyzeProgression(series([[0, 50], [200, 100], [207, 102.5], [214, 105]]), 105)!;
    expect(p.sessions).toBe(3);
    expect(p.windowDays).toBe(14);
    expect(p.perWeek).toBeCloseTo(2.5, 10);
  });

  it('falls back to the last three sessions after a long break', () => {
    const p = analyzeProgression(series([[0, 90], [100, 95], [200, 100]]), 100)!;
    expect(p.sessions).toBe(3);
    expect(p.windowDays).toBe(200);
  });

  it('skips zero values and needs three sessions over at least a week', () => {
    expect(analyzeProgression([], 0)).toBeNull();
    expect(analyzeProgression(series([[0, 100], [7, 0], [14, 105]]), 105)).toBeNull();
    expect(analyzeProgression(series([[0, 100], [3, 101], [6, 102]]), 102)).toBeNull();
  });

  it('is null when the trend falls to zero or below', () => {
    expect(analyzeProgression(series([[0, 30], [7, 10], [14, 1]]), 30)).toBeNull();
  });
});

// ─── Per-exercise statistics ────────────────────────────────────────────────

describe('computeExerciseStats', () => {
  beforeEach(() => jest.useFakeTimers({ now: NOW }));
  afterEach(() => jest.useRealTimers());

  it('summarizes a weighted exercise', () => {
    const entries = [
      progressEntry(local(2026, 10, 21), [set(8, 60), set(8, 60)]),
      progressEntry(local(2026, 10, 28), [set(8, 65), set(8, 65)]),
      progressEntry(local(2026, 11, 4), [set(5, 70)]),
      progressEntry(local(2026, 11, 11), [set(10, 67.5), set(10, 67.5)]),
    ];
    const stats = computeExerciseStats(entries, false)!;
    expect(stats.kind).toBe('weighted');
    expect(stats.sessions).toBe(4);
    expect(stats.best).toBe(70);
    expect(stats.latest).toBe(67.5);
    expect(stats.change).toBe(7.5);
    expect(stats.changePct).toBeCloseTo(12.5, 10);
    expect(stats.bestWeight!.weight).toBe(70);
    // 67.5 × 10 beats 70 × 5 on estimated 1RM and on volume
    expect(stats.bestE1rm!.weight).toBe(67.5);
    expect(stats.bestVolume!.volume).toBe(1350);
    expect(stats.bestReps!.reps).toBe(10);
    expect(stats.totalVolume).toBe(960 + 1040 + 350 + 1350);
    expect(stats.totalSets).toBe(7);
    expect(stats.totalReps).toBe(16 + 16 + 5 + 20);
    expect(stats.sessionsPerWeek).toBeCloseTo(4 / 3, 2);
    expect(stats.latestIntensity).toBeCloseTo((67.5 / 70) * 100, 10);
    expect(stats.sincePr).toEqual({ sessions: 1, days: 14 });
    expect(stats.progression).not.toBeNull();
  });

  it('gives ties to the latest session', () => {
    const entries = [
      progressEntry(local(2026, 11, 1), [set(5, 100)]),
      progressEntry(local(2026, 11, 8), [set(5, 100)]),
    ];
    const stats = computeExerciseStats(entries, false)!;
    expect(stats.bestWeight!.date).toBe(local(2026, 11, 8).getTime());
    // The PR is the first time the best was reached
    expect(stats.sincePr).toEqual({ sessions: 1, days: 17 });
  });

  it('tracks reps for bodyweight work and seconds for timed work', () => {
    const bodyweight = computeExerciseStats([
      progressEntry(local(2026, 11, 1), [set(8), set(6)]),
      progressEntry(local(2026, 11, 8), [set(10), set(8)]),
    ], false)!;
    expect(bodyweight.kind).toBe('bodyweight');
    expect(bodyweight.best).toBe(10);
    expect(bodyweight.change).toBe(2);
    expect(bodyweight.bestWeight).toBeNull();
    expect(bodyweight.bestE1rm).toBeNull();
    expect(bodyweight.bestVolume).toBeNull();
    expect(bodyweight.totalVolume).toBe(0);

    const timed = computeExerciseStats([progressEntry(local(2026, 11, 1), [set(60, 10)])], true)!;
    expect(timed.kind).toBe('timed');
    expect(timed.best).toBe(60);
    expect(timed.totalVolume).toBe(0);
  });

  it('has no rates or PR distance for a single session', () => {
    const stats = computeExerciseStats([progressEntry(local(2026, 11, 1), [set(5, 100)])], false)!;
    expect(stats.sessionsPerWeek).toBe(0);
    expect(stats.sincePr).toBeNull();
    expect(stats.progression).toBeNull();
    expect(stats.change).toBe(0);
  });

  it('is null without a session that has reps or weight', () => {
    expect(computeExerciseStats([], false)).toBeNull();
    expect(computeExerciseStats([progressEntry(NOW, [warmup(10, 40)]), progressEntry(NOW, [])], false)).toBeNull();
  });
});

// ─── Training-wide statistics ───────────────────────────────────────────────

describe('startOfWeek / startOfPeriod', () => {
  it('starts weeks on Monday at midnight', () => {
    expect(startOfWeek(NOW.getTime())).toBe(local(2026, 11, 16, 0).getTime());
    expect(startOfWeek(local(2026, 11, 16, 0).getTime())).toBe(local(2026, 11, 16, 0).getTime());
    expect(startOfWeek(local(2026, 11, 22, 23, 59).getTime())).toBe(local(2026, 11, 16, 0).getTime());
    // Across the end of daylight saving time in Europe
    expect(startOfWeek(local(2026, 10, 25, 23).getTime())).toBe(local(2026, 10, 19, 0).getTime());
  });

  it('starts months and years on the first day', () => {
    expect(startOfPeriod('week', NOW.getTime())).toBe(local(2026, 11, 16, 0).getTime());
    expect(startOfPeriod('month', NOW.getTime())).toBe(local(2026, 11, 1, 0).getTime());
    expect(startOfPeriod('year', NOW.getTime())).toBe(local(2026, 1, 1, 0).getTime());
  });
});

describe('totalsOf', () => {
  it('counts completed exercises, with tonnage only for non-timed ones', () => {
    const log = trainingLog(NOW, [
      exerciseLog({ sets: [warmup(10, 40), set(5, 100), set(5, 100)] }),
      exerciseLog({ repUnit: 'seconds', sets: [set(60, 20)] }),
      exerciseLog({ completed: false, sets: [set(10, 50)] }),
    ], { durationSeconds: 2700 });
    expect(totalsOf(log)).toEqual({ sessions: 1, volume: 1000, minutes: 45, sets: 3 });
  });

  it('treats a missing duration as zero', () => {
    expect(totalsOf(trainingLog(NOW, [], { durationSeconds: null }))).toEqual({ sessions: 1, volume: 0, minutes: 0, sets: 0 });
  });
});

describe('summarizePeriods', () => {
  const session = (at: Date, kg: number, extra: Parameters<typeof trainingLog>[2] = {}) =>
    trainingLog(at, [exerciseLog({ sets: [set(1, kg)] })], { durationSeconds: 600, ...extra });

  it('compares the running week with the previous one up to the same point', () => {
    const logs = [
      session(local(2026, 11, 17), 100),
      session(local(2026, 11, 18, 11), 50),
      session(local(2026, 11, 10), 80), // last Tuesday: before the cutoff
      session(local(2026, 11, 11, 13), 70), // last Wednesday, after this week's "now"
      session(local(2026, 11, 2), 60),
      session(local(2026, 10, 5), 999), // seven weeks back: outside 6 periods
      session(local(2026, 11, 18, 13), 999), // in the future
      session(local(2026, 11, 17), 999, { isCompleted: false }),
    ];
    const summary = summarizePeriods(logs, 'week', 6, NOW.getTime());
    expect(summary.current).toEqual({ sessions: 2, volume: 150, minutes: 20, sets: 2 });
    expect(summary.previousToDate).toEqual({ sessions: 1, volume: 80, minutes: 10, sets: 1 });
    expect(summary.recent.map((t) => t.volume)).toEqual([0, 0, 0, 60, 150, 150]);
  });

  it('works on calendar months and years', () => {
    const now = local(2026, 3, 15).getTime();
    const logs = [
      session(local(2026, 1, 31), 10),
      session(local(2026, 2, 10), 20),
      session(local(2026, 2, 20), 30),
      session(local(2026, 3, 1, 0, 0), 40),
      session(local(2025, 12, 31, 23, 59), 50),
    ];
    const months = summarizePeriods(logs, 'month', 3, now);
    expect(months.recent.map((t) => t.volume)).toEqual([10, 50, 40]);
    expect(months.current.volume).toBe(40);
    expect(months.previousToDate.volume).toBe(20);

    const years = summarizePeriods(logs, 'year', 2, now);
    expect(years.recent.map((t) => t.volume)).toEqual([50, 100]);
  });

  it('is all zeros without sessions', () => {
    const summary = summarizePeriods([], 'week', 3, NOW.getTime());
    const zero = { sessions: 0, volume: 0, minutes: 0, sets: 0 };
    expect(summary).toEqual({ current: zero, previousToDate: zero, recent: [zero, zero, zero] });
  });
});

describe('computeTrainingAnalytics', () => {
  const bench = (kg: number) => exerciseLog({ libraryExerciseId: 1, exerciseName: 'Bench', sets: [set(5, kg), set(5, kg), set(5, kg)] });
  const plank = exerciseLog({ libraryExerciseId: 5, exerciseName: 'Plank', repUnit: 'seconds', sets: [set(60), set(60), set(60)] });
  const pullups = exerciseLog({ libraryExerciseId: 6, exerciseName: 'Pullups', sets: [set(10), set(10), set(10)] });
  const logs = [
    trainingLog(local(2026, 11, 17), [bench(90), pullups], { durationSeconds: 2700 }), // Tuesday
    trainingLog(local(2026, 10, 1), [bench(80)], { durationSeconds: 3600 }), // Thursday
    trainingLog(local(2026, 11, 2), [bench(85), plank], { durationSeconds: 1800 }), // Monday
    trainingLog(local(2026, 11, 18, 9), [bench(200)], { isCompleted: false, completedAt: null }),
  ];
  const a = computeTrainingAnalytics(logs, 12, NOW.getTime());

  it('adds up lifetime totals over completed sessions', () => {
    expect(a.lifetime).toEqual({
      sessions: 3,
      volume: 15 * (80 + 85 + 90),
      sets: 15,
      // Timed sets hold seconds, not reps
      reps: 45 + 30,
      minutes: 135,
      avgMinutes: 45,
      avgVolume: (15 * (80 + 85 + 90)) / 3,
      avgSets: 5,
      avgExercises: 5 / 3,
      firstDate: local(2026, 10, 1).getTime(),
      exercisesTrained: 3,
    });
  });

  it('buckets sessions into weeks and weekdays', () => {
    expect(a.weeks).toHaveLength(12);
    expect(a.weeks[11].start).toBe(local(2026, 11, 16, 0).getTime());
    expect(a.weeks[11]).toMatchObject({ sessions: 1, volume: 1350, minutes: 45, sets: 6 });
    expect(a.weeks[9]).toMatchObject({ sessions: 1, volume: 1275, minutes: 30, sets: 6 });
    expect(a.weeks[4]).toMatchObject({ start: local(2026, 9, 28, 0).getTime(), sessions: 1, volume: 1200 });
    expect(a.weekdayCounts).toEqual([1, 1, 0, 1, 0, 0, 0]);
    expect(a.sessionsPerWeek).toBe(3 / 12);
  });

  it('compares the volume of the last four weeks with the four before', () => {
    expect(a.volumeChangePct).toBeCloseTo(((1275 + 1350 - 1200) / 1200) * 100, 10);
  });

  it('counts personal records of the last 30 days', () => {
    expect(a.prsLast30Days).toBe(2);
    expect(a.recentRecords).toEqual([
      { libraryExerciseId: 1, name: 'Bench', kind: 'weighted', value: 90, previous: 85, date: local(2026, 11, 17).getTime() },
    ]);
  });

  it('lists trends, the fastest progressing first, then by sessions and first trained', () => {
    expect(a.trends.map((t) => [t.libraryExerciseId, t.kind])).toEqual([[1, 'weighted'], [5, 'timed'], [6, 'bodyweight']]);
    expect(a.trends[0]).toMatchObject({ name: 'Bench', best: 90, latest: 90, sessions: 3 });
    expect(a.trends[0].progression).not.toBeNull();
    expect(a.trends[1].progression).toBeNull();
  });

  it('handles an empty history', () => {
    const empty = computeTrainingAnalytics([], 4, NOW.getTime());
    expect(empty.weeks).toHaveLength(4);
    expect(empty.lifetime).toMatchObject({ sessions: 0, volume: 0, avgMinutes: 0, avgVolume: 0, firstDate: null, exercisesTrained: 0 });
    expect(empty.volumeChangePct).toBeNull();
    expect(empty.prsLast30Days).toBe(0);
    expect(empty.recentRecords).toEqual([]);
    expect(empty.trends).toEqual([]);
    expect(empty.sessionsPerWeek).toBe(0);
  });
});

// ─── Formatting ─────────────────────────────────────────────────────────────

describe('formatting', () => {
  it('shortens big numbers', () => {
    expect(formatNumber(1_234_567)).toBe('1.23M');
    expect(formatNumber(-2_000_000)).toBe('-2.00M');
    expect(formatNumber(123_456)).toBe('123.5k');
    expect(formatNumber(NaN)).toBe('—');
    expect(formatNumber(Infinity)).toBe('—');
    // Below 100k the device locale decides the separators
    expect(formatNumber(1234)).toBe((1234).toLocaleString(undefined, { maximumFractionDigits: 0 }));
    expect(formatNumber(12.345, 1)).toBe((12.3).toLocaleString(undefined, { minimumFractionDigits: 1 }));
  });

  it('signs positive values, but not zero', () => {
    expect(formatSigned(1.23)).toBe('+1.2');
    expect(formatSigned(-1.23)).toBe('-1.2');
    expect(formatSigned(0)).toBe('0.0');
    expect(formatSigned(0.04)).toBe('0.0');
    expect(formatSigned(12.345, 0, '%')).toBe('+12%');
  });

  it('does not show a minus sign on a value that rounds to zero', () => {
    expect(formatSigned(-0.04)).toBe('0.0');
  });

  it('formats durations in minutes and hours', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(45.4)).toBe('45m');
    expect(formatDuration(60)).toBe('1h');
    expect(formatDuration(90)).toBe('1h 30m');
    expect(formatDuration(125)).toBe('2h 5m');
  });

  it('rolls rounded minutes over into the next hour', () => {
    expect(formatDuration(119.6)).toBe('2h');
    expect(formatDuration(59.6)).toBe('1h');
  });

  it('formats a number of weeks', () => {
    expect(formatWeeks(0)).toBe('< 1 week');
    expect(formatWeeks(0.9)).toBe('< 1 week');
    expect(formatWeeks(1)).toBe('~1 week');
    expect(formatWeeks(1.4)).toBe('~1 week');
    expect(formatWeeks(3.6)).toBe('~4 weeks');
    expect(formatWeeks(52)).toBe('~52 weeks');
    expect(formatWeeks(52.5)).toBe('> 1 year');
  });
});
