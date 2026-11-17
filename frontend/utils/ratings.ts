import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import { ExerciseProgressEntry, TrainingLog, TrainingReview } from '@/types';
import { computeExerciseStats, primaryValue, totalsOf } from './stats';
import { setsOf } from './sets';

export type RatingKey = 'rating' | 'energy' | 'sleep';

export interface RatingField {
  key: RatingKey;
  /** Short name, e.g. for badges. */
  label: string;
  question: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

export const RATING_FIELDS: RatingField[] = [
  { key: 'rating', label: 'FEEL', question: 'HOW DID IT FEEL?', icon: 'star' },
  { key: 'energy', label: 'ENERGY', question: 'ENERGY', icon: 'flash' },
  { key: 'sleep', label: 'SLEEP', question: 'SLEEP LAST NIGHT', icon: 'moon' },
];

/** The session's review, with missing values (data cached by older versions) as null. */
export function reviewOf(log: TrainingLog): TrainingReview {
  return { rating: log.rating ?? null, energy: log.energy ?? null, sleep: log.sleep ?? null, notes: log.notes ?? null };
}

export function sameReview(a: TrainingReview, b: TrainingReview): boolean {
  return a.rating === b.rating && a.energy === b.energy && a.sleep === b.sleep && (a.notes ?? null) === (b.notes ?? null);
}

// ─── Ratings against performance ────────────────────────────────────────────

/** Ratings at or above this are "high", below it "low". */
export const HIGH_RATING = 4;
/** Each group needs this many sessions before a factor is shown. */
export const MIN_SESSIONS_PER_GROUP = 3;

export interface RatingGroup {
  sessions: number;
  /**
   * Mean of each session's volume against the usual (mean) volume of its workout, in %: 0 is a
   * usual session. Comparing with the same workout keeps leg days from outweighing arm days.
   * Null when no session in the group has a workout with an earlier or later one to compare with.
   */
  volumeVsUsualPct: number | null;
  /** Personal records per session (sessions that beat every earlier one of an exercise). */
  prsPerSession: number;
  /** Mean "how did it feel" rating, null when none was given. */
  avgFeel: number | null;
}

export interface FactorInsight {
  key: 'energy' | 'sleep';
  high: RatingGroup;
  low: RatingGroup;
  /** How much more volume (in %) the high group moved than the low group, relative to the usual. */
  volumeDiffPct: number | null;
}

export interface RatingInsight {
  /** Energy and sleep, each only when both groups have enough sessions. */
  factors: FactorInsight[];
  /** Completed sessions with at least one rating. */
  ratedSessions: number;
}

const logTime = (log: TrainingLog) => new Date(log.completedAt ?? log.startedAt).getTime();

/** Records set per session, counted as in the dashboard's analytics. */
function recordsPerSession(completed: TrainingLog[]): Map<number, number> {
  const byExercise = new Map<number, { timed: boolean; entries: ExerciseProgressEntry[] }>();
  for (const log of completed) {
    for (const ex of log.exercises ?? []) {
      if (!ex.completed) continue;
      const group = byExercise.get(ex.libraryExerciseId) ?? { timed: ex.repUnit === 'seconds', entries: [] };
      group.entries.push({
        date: new Date(logTime(log)).toISOString(),
        weightUsed: ex.weightUsed,
        setsCompleted: ex.setsCompleted,
        repsCompleted: ex.repsCompleted,
        sets: setsOf(ex),
        trainingLogId: log.id,
        workoutName: log.workoutName,
      });
      byExercise.set(ex.libraryExerciseId, group);
    }
  }
  const records = new Map<number, number>();
  for (const { timed, entries } of byExercise.values()) {
    const stats = computeExerciseStats(entries, timed);
    if (!stats) continue;
    let running = -Infinity;
    stats.points.forEach((p, i) => {
      const value = primaryValue(p, stats.kind);
      if (value <= running) return;
      if (i > 0) records.set(p.trainingLogId, (records.get(p.trainingLogId) ?? 0) + 1);
      running = value;
    });
  }
  return records;
}

const mean = (values: number[]) => (values.length ? values.reduce((s, v) => s + v, 0) / values.length : null);

/**
 * Relates energy and sleep ratings to performance: for sessions rated high (4–5) against low (1–3),
 * the volume against each workout's usual, records per session and how the session felt.
 */
export function computeRatingInsight(logs: TrainingLog[]): RatingInsight {
  // Deload sessions are lighter on purpose, so they'd skew the volume and records comparison
  const completed = logs.filter((l) => l.isCompleted && !l.deload).sort((a, b) => logTime(a) - logTime(b));

  // Usual volume per workout, over all its completed sessions, rated or not
  const volumes = new Map(completed.map((log) => [log.id, totalsOf(log).volume]));
  const byWorkout = new Map<number, number[]>();
  for (const log of completed) byWorkout.set(log.workoutId, [...(byWorkout.get(log.workoutId) ?? []), volumes.get(log.id)!]);
  const relativeVolume = (log: TrainingLog): number | null => {
    const all = byWorkout.get(log.workoutId) ?? [];
    const usual = mean(all);
    return all.length >= 2 && usual != null && usual > 0 ? volumes.get(log.id)! / usual - 1 : null;
  };

  const records = recordsPerSession(completed);
  const group = (sessions: TrainingLog[]): RatingGroup => {
    const relative = sessions.map(relativeVolume).filter((v): v is number => v != null);
    const avgRelative = mean(relative);
    return {
      sessions: sessions.length,
      volumeVsUsualPct: avgRelative == null ? null : avgRelative * 100,
      prsPerSession: sessions.length ? sessions.reduce((s, l) => s + (records.get(l.id) ?? 0), 0) / sessions.length : 0,
      avgFeel: mean(sessions.map((l) => l.rating).filter((r): r is number => r != null)),
    };
  };

  const factors: FactorInsight[] = [];
  for (const key of ['energy', 'sleep'] as const) {
    const rated = completed.filter((l) => l[key] != null);
    const high = group(rated.filter((l) => l[key]! >= HIGH_RATING));
    const low = group(rated.filter((l) => l[key]! < HIGH_RATING));
    if (high.sessions < MIN_SESSIONS_PER_GROUP || low.sessions < MIN_SESSIONS_PER_GROUP) continue;
    const lowFactor = low.volumeVsUsualPct != null ? 1 + low.volumeVsUsualPct / 100 : 0;
    const volumeDiffPct = high.volumeVsUsualPct != null && lowFactor > 0
      ? ((1 + high.volumeVsUsualPct / 100) / lowFactor - 1) * 100
      : null;
    factors.push({ key, high, low, volumeDiffPct });
  }

  return {
    factors,
    ratedSessions: completed.filter((l) => l.rating != null || l.energy != null || l.sleep != null).length,
  };
}
