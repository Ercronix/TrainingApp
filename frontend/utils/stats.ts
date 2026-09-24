import { ExerciseProgressEntry, TrainingLog } from '@/types';
import { estimateOneRepMax } from '@/utils/strength';

const DAY_MS = 86_400_000;
const WEEK_MS = 7 * DAY_MS;

// ─── One-rep max ────────────────────────────────────────────────────────────

export interface OneRepMaxFormula {
  id: string;
  name: string;
  estimate: (weight: number, reps: number) => number;
}

// Every formula returns the weight itself for a single, so they only differ on rep sets
const single = (fn: (w: number, r: number) => number) => (w: number, r: number) =>
  w <= 0 || r <= 0 ? 0 : r === 1 ? w : fn(w, r);

export const ONE_REP_MAX_FORMULAS: OneRepMaxFormula[] = [
  { id: 'epley', name: 'Epley', estimate: estimateOneRepMax },
  { id: 'brzycki', name: 'Brzycki', estimate: single((w, r) => (r < 37 ? (w * 36) / (37 - r) : 0)) },
  { id: 'lander', name: 'Lander', estimate: single((w, r) => (100 * w) / (101.3 - 2.67123 * r)) },
  { id: 'lombardi', name: 'Lombardi', estimate: single((w, r) => w * Math.pow(r, 0.1)) },
  { id: 'mayhew', name: 'Mayhew', estimate: single((w, r) => (100 * w) / (52.2 + 41.9 * Math.exp(-0.055 * r))) },
  { id: 'oconner', name: "O'Conner", estimate: single((w, r) => w * (1 + r / 40)) },
  { id: 'wathan', name: 'Wathan', estimate: single((w, r) => (100 * w) / (48.8 + 53.8 * Math.exp(-0.075 * r))) },
];

export interface OneRepMaxBreakdown {
  formulas: { id: string; name: string; value: number }[];
  average: number;
  low: number;
  high: number;
  /** Rep-based estimates get less accurate the further a set is from a single. */
  reliability: 'high' | 'medium' | 'low';
}

export function oneRepMaxBreakdown(weight: number, reps: number): OneRepMaxBreakdown | null {
  if (!(weight > 0) || !(reps > 0)) return null;
  const formulas = ONE_REP_MAX_FORMULAS
    .map((f) => ({ id: f.id, name: f.name, value: f.estimate(weight, reps) }))
    .filter((f) => Number.isFinite(f.value) && f.value > 0);
  const values = formulas.map((f) => f.value);
  return {
    formulas,
    average: values.reduce((s, v) => s + v, 0) / values.length,
    low: Math.min(...values),
    high: Math.max(...values),
    reliability: reps <= 5 ? 'high' : reps <= 10 ? 'medium' : 'low',
  };
}

export const REP_MAX_TABLE_REPS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

/** Weight expected to be doable for `reps` given a one-rep max (inverse Epley). */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (oneRepMax <= 0 || reps <= 0) return 0;
  return reps === 1 ? oneRepMax : oneRepMax / (1 + reps / 30);
}

export function repMaxTable(oneRepMax: number): { reps: number; weight: number; percent: number }[] {
  return REP_MAX_TABLE_REPS.map((reps) => {
    const weight = weightForReps(oneRepMax, reps);
    return { reps, weight, percent: (weight / oneRepMax) * 100 };
  });
}

/** Rounds to the nearest loadable increment (2.5 kg by default: two 1.25 kg plates). */
export function roundToIncrement(value: number, increment = 2.5): number {
  return Math.round(value / increment) * increment;
}

// ─── Per-session points ─────────────────────────────────────────────────────

export type ExerciseKind = 'weighted' | 'bodyweight' | 'timed';

export interface SessionPoint {
  date: number;
  weight: number;
  sets: number;
  /** Reps per set, or seconds per set for timed exercises. */
  reps: number;
  e1rm: number;
  /** Tonnage: weight × sets × reps. Zero for bodyweight and timed work. */
  volume: number;
  totalReps: number;
  trainingLogId: number;
  workoutName: string;
}

export function toSessionPoints(entries: ExerciseProgressEntry[], timed = false): SessionPoint[] {
  return entries
    .map((e) => {
      const weight = Number(e.weightUsed ?? 0) || 0;
      const sets = e.setsCompleted || 0;
      const reps = e.repsCompleted || 0;
      return {
        date: new Date(e.date).getTime(),
        weight,
        sets,
        reps,
        e1rm: timed ? 0 : estimateOneRepMax(weight, reps),
        volume: timed ? 0 : weight * sets * reps,
        totalReps: sets * reps,
        trainingLogId: e.trainingLogId,
        workoutName: e.workoutName,
      };
    })
    .filter((p) => Number.isFinite(p.date))
    .sort((a, b) => a.date - b.date);
}

export function classifyExercise(points: SessionPoint[], timed: boolean): ExerciseKind {
  if (timed) return 'timed';
  return points.some((p) => p.weight > 0) ? 'weighted' : 'bodyweight';
}

/** The number that best describes strength for the kind of exercise. */
export function primaryValue(p: SessionPoint, kind: ExerciseKind): number {
  return kind === 'weighted' ? p.e1rm : p.reps;
}

// ─── Regression & progression ───────────────────────────────────────────────

export interface LinearFit {
  slope: number;
  intercept: number;
  /** Coefficient of determination: how much of the variation the trend line explains. */
  r2: number;
}

export function linearRegression(xs: number[], ys: number[]): LinearFit | null {
  const n = xs.length;
  if (n < 2 || n !== ys.length) return null;
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let sxx = 0, sxy = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
    syy += (ys[i] - my) ** 2;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  // A flat series is perfectly explained by a flat line
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept: my - slope * mx, r2 };
}

export interface Progression {
  /** Sessions and days the trend was fitted on. */
  sessions: number;
  windowDays: number;
  /** Trend value at the latest session (smooths out a single good or bad day). */
  trendValue: number;
  perWeek: number;
  /** Rate relative to the trend value, per 30 days. */
  pctPerMonth: number;
  r2: number;
  confidence: 'high' | 'medium' | 'low';
  lastDate: number;
  projections: { weeks: number; value: number }[];
  milestone: { target: number; weeks: number | null } | null;
}

const PROGRESSION_WINDOW_DAYS = 90;
export const PROJECTION_WEEKS = [4, 8, 12];

function milestoneStep(value: number): number {
  if (value < 20) return 1;
  if (value < 50) return 2.5;
  if (value < 150) return 5;
  return 10;
}

/**
 * Fits a least-squares line through the last 90 days of training (relative to the latest
 * session, so a break doesn't erase the trend) and extrapolates it. Linear projections
 * overshoot over long horizons, so they stop at 12 weeks.
 */
export function analyzeProgression(series: { date: number; value: number }[], best: number): Progression | null {
  const valid = series.filter((p) => p.value > 0);
  if (valid.length < 3) return null;
  const lastDate = valid[valid.length - 1].date;
  let window = valid.filter((p) => lastDate - p.date <= PROGRESSION_WINDOW_DAYS * DAY_MS);
  if (window.length < 3) window = valid.slice(-3);

  const t0 = window[0].date;
  const windowDays = (lastDate - t0) / DAY_MS;
  if (windowDays < 7) return null;

  const fit = linearRegression(window.map((p) => (p.date - t0) / DAY_MS), window.map((p) => p.value));
  if (!fit) return null;

  const trendValue = fit.intercept + fit.slope * windowDays;
  if (trendValue <= 0) return null;
  const perWeek = fit.slope * 7;
  const confidence = window.length >= 6 && fit.r2 >= 0.6 ? 'high' : fit.r2 >= 0.3 ? 'medium' : 'low';

  const step = milestoneStep(best);
  const target = Math.floor(best / step + 1e-9) * step + step;
  const weeksToTarget = perWeek > 0 ? (target - trendValue) / perWeek : null;

  return {
    sessions: window.length,
    windowDays,
    trendValue,
    perWeek,
    pctPerMonth: ((fit.slope * 30) / trendValue) * 100,
    r2: fit.r2,
    confidence,
    lastDate,
    projections: PROJECTION_WEEKS.map((weeks) => ({ weeks, value: Math.max(0, trendValue + perWeek * weeks) })),
    milestone: { target, weeks: weeksToTarget != null ? Math.max(0, weeksToTarget) : null },
  };
}

// ─── Per-exercise statistics ────────────────────────────────────────────────

export interface ExerciseStats {
  kind: ExerciseKind;
  points: SessionPoint[];
  sessions: number;
  bestWeight: SessionPoint | null;
  bestE1rm: SessionPoint | null;
  bestVolume: SessionPoint | null;
  bestReps: SessionPoint | null;
  /** Best of the primary metric (e1RM, reps or seconds). */
  best: number;
  latest: number;
  /** Primary metric: first session to latest session. */
  change: number;
  changePct: number | null;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  sessionsPerWeek: number;
  /** Latest session relative to the best, in %. */
  latestIntensity: number | null;
  sincePr: { sessions: number; days: number } | null;
  progression: Progression | null;
}

function maxBy<T>(items: T[], fn: (t: T) => number): T | null {
  let best: T | null = null;
  let bestValue = -Infinity;
  for (const item of items) {
    const v = fn(item);
    // `>=` so ties go to the latest session
    if (v > 0 && v >= bestValue) {
      best = item;
      bestValue = v;
    }
  }
  return best;
}

export function computeExerciseStats(entries: ExerciseProgressEntry[], timed: boolean): ExerciseStats | null {
  const points = toSessionPoints(entries, timed).filter((p) => p.reps > 0 || p.weight > 0);
  if (points.length === 0) return null;
  const kind = classifyExercise(points, timed);
  const value = (p: SessionPoint) => primaryValue(p, kind);

  const first = value(points[0]);
  const last = points[points.length - 1];
  const latest = value(last);
  const best = Math.max(...points.map(value));

  // Sessions and days since the primary metric last hit a new high
  let prIndex = 0;
  let running = -Infinity;
  points.forEach((p, i) => {
    if (value(p) > running) {
      running = value(p);
      prIndex = i;
    }
  });

  const spanWeeks = Math.max(1, (last.date - points[0].date) / WEEK_MS);

  return {
    kind,
    points,
    sessions: points.length,
    bestWeight: kind === 'weighted' ? maxBy(points, (p) => p.weight) : null,
    bestE1rm: kind === 'weighted' ? maxBy(points, (p) => p.e1rm) : null,
    bestVolume: kind === 'weighted' ? maxBy(points, (p) => p.volume) : null,
    bestReps: maxBy(points, (p) => p.reps),
    best,
    latest,
    change: latest - first,
    changePct: first > 0 ? ((latest - first) / first) * 100 : null,
    totalVolume: points.reduce((s, p) => s + p.volume, 0),
    totalSets: points.reduce((s, p) => s + p.sets, 0),
    totalReps: points.reduce((s, p) => s + p.totalReps, 0),
    sessionsPerWeek: points.length > 1 ? points.length / spanWeeks : 0,
    latestIntensity: best > 0 ? (latest / best) * 100 : null,
    sincePr: points.length > 1
      ? { sessions: points.length - 1 - prIndex, days: Math.floor((Date.now() - points[prIndex].date) / DAY_MS) }
      : null,
    progression: analyzeProgression(points.map((p) => ({ date: p.date, value: value(p) })), best),
  };
}

// ─── Training-wide statistics ───────────────────────────────────────────────

export function startOfWeek(time: number): number {
  const d = new Date(time);
  d.setHours(0, 0, 0, 0);
  // Weeks start on Monday
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

export interface WeekBucket {
  start: number;
  sessions: number;
  volume: number;
  minutes: number;
  sets: number;
}

export interface ExerciseTrend {
  libraryExerciseId: number;
  name: string;
  kind: ExerciseKind;
  best: number;
  latest: number;
  sessions: number;
  lastDate: number;
  progression: Progression | null;
}

export interface TrainingAnalytics {
  weeks: WeekBucket[];
  lifetime: {
    sessions: number;
    volume: number;
    sets: number;
    reps: number;
    minutes: number;
    avgMinutes: number;
    avgVolume: number;
    avgSets: number;
    avgExercises: number;
    firstDate: number | null;
    exercisesTrained: number;
  };
  /** Average over the charted weeks. */
  sessionsPerWeek: number;
  /** Volume of the last 4 weeks against the 4 before, in %. */
  volumeChangePct: number | null;
  prsLast30Days: number;
  /** Completed sessions per weekday, Monday first. */
  weekdayCounts: number[];
  trends: ExerciseTrend[];
}

const logDate = (log: TrainingLog) => new Date(log.completedAt ?? log.startedAt).getTime();

export function computeTrainingAnalytics(logs: TrainingLog[], weekCount = 12, now = Date.now()): TrainingAnalytics {
  const completed = logs.filter((l) => l.isCompleted).sort((a, b) => logDate(a) - logDate(b));

  const thisWeek = startOfWeek(now);
  const weeks: WeekBucket[] = Array.from({ length: weekCount }, (_, i) => {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - (weekCount - 1 - i) * 7);
    return { start: d.getTime(), sessions: 0, volume: 0, minutes: 0, sets: 0 };
  });
  const weekIndex = new Map(weeks.map((w, i) => [w.start, i]));

  const weekdayCounts = Array(7).fill(0);
  const byExercise = new Map<number, { name: string; timed: boolean; entries: ExerciseProgressEntry[] }>();
  let volume = 0, sets = 0, reps = 0, minutes = 0, exerciseCount = 0;

  for (const log of completed) {
    const date = logDate(log);
    let logVolume = 0, logSets = 0;
    for (const ex of log.exercises ?? []) {
      if (!ex.completed) continue;
      exerciseCount++;
      const timed = ex.repUnit === 'seconds';
      const weight = Number(ex.weightUsed ?? 0) || 0;
      logSets += ex.setsCompleted || 0;
      if (!timed) {
        logVolume += weight * (ex.setsCompleted || 0) * (ex.repsCompleted || 0);
        reps += (ex.setsCompleted || 0) * (ex.repsCompleted || 0);
      }
      const group = byExercise.get(ex.libraryExerciseId)
        ?? { name: ex.exerciseName, timed, entries: [] };
      group.entries.push({
        date: new Date(date).toISOString(),
        weightUsed: ex.weightUsed,
        setsCompleted: ex.setsCompleted,
        repsCompleted: ex.repsCompleted,
        trainingLogId: log.id,
        workoutName: log.workoutName,
      });
      byExercise.set(ex.libraryExerciseId, group);
    }
    const logMinutes = (log.durationSeconds || 0) / 60;
    volume += logVolume;
    sets += logSets;
    minutes += logMinutes;
    weekdayCounts[(new Date(date).getDay() + 6) % 7]++;

    const i = weekIndex.get(startOfWeek(date));
    if (i != null) {
      weeks[i].sessions++;
      weeks[i].volume += logVolume;
      weeks[i].minutes += logMinutes;
      weeks[i].sets += logSets;
    }
  }

  // Personal records: sessions that beat every earlier session of the same exercise
  let prsLast30Days = 0;
  const trends: ExerciseTrend[] = [];
  for (const [libraryExerciseId, group] of byExercise) {
    const stats = computeExerciseStats(group.entries, group.timed);
    if (!stats) continue;
    let running = -Infinity;
    stats.points.forEach((p, i) => {
      const v = primaryValue(p, stats.kind);
      if (v > running) {
        if (i > 0 && now - p.date <= 30 * DAY_MS) prsLast30Days++;
        running = v;
      }
    });
    trends.push({
      libraryExerciseId,
      name: group.name,
      kind: stats.kind,
      best: stats.best,
      latest: stats.latest,
      sessions: stats.sessions,
      lastDate: stats.points[stats.points.length - 1].date,
      progression: stats.progression,
    });
  }
  trends.sort((a, b) => (b.progression?.pctPerMonth ?? -Infinity) - (a.progression?.pctPerMonth ?? -Infinity)
    || b.sessions - a.sessions);

  const sum = (ws: WeekBucket[]) => ws.reduce((s, w) => s + w.volume, 0);
  const recent = sum(weeks.slice(-4));
  const prior = sum(weeks.slice(-8, -4));
  const n = completed.length;

  return {
    weeks,
    lifetime: {
      sessions: n,
      volume,
      sets,
      reps,
      minutes,
      avgMinutes: n ? minutes / n : 0,
      avgVolume: n ? volume / n : 0,
      avgSets: n ? sets / n : 0,
      avgExercises: n ? exerciseCount / n : 0,
      firstDate: n ? logDate(completed[0]) : null,
      exercisesTrained: byExercise.size,
    },
    sessionsPerWeek: weeks.reduce((s, w) => s + w.sessions, 0) / weekCount,
    volumeChangePct: prior > 0 ? ((recent - prior) / prior) * 100 : null,
    prsLast30Days,
    weekdayCounts,
    trends,
  };
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/** 1234 → "1,234"; 1234567 → "1.23M". Keeps big numbers readable in tight tiles. */
export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 100_000) return `${(value / 1000).toFixed(1)}k`;
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatSigned(value: number, decimals = 1, suffix = ''): string {
  const fixed = value.toFixed(decimals);
  const sign = value > 0 && Number(fixed) !== 0 ? '+' : '';
  return `${sign}${fixed}${suffix}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatWeeks(weeks: number): string {
  if (weeks < 1) return '< 1 week';
  if (weeks > 52) return '> 1 year';
  const w = Math.round(weeks);
  return `~${w} ${w === 1 ? 'week' : 'weeks'}`;
}
