import { ExerciseLog, SetLog } from '@/types';
import { formatKg } from './strength';

interface SetSource {
  sets?: SetLog[] | null;
  setsCompleted: number;
  repsCompleted: number;
  weightUsed: number | null;
}

/**
 * The sets of a log or progress entry. Data cached before per-set logging only has the
 * summary, which is expanded into identical sets (as the server's migration did).
 */
export function setsOf(source: SetSource): SetLog[] {
  if (source.sets) return source.sets;
  return Array.from({ length: source.setsCompleted ?? 0 }, () => ({
    reps: source.repsCompleted ?? 0, weight: source.weightUsed, rpe: null, warmup: false,
  }));
}

/** The sets of the most recent completed session, or none if the exercise wasn't trained before. */
export function previousSetsOf(log: ExerciseLog): SetLog[] {
  if (log.previousSetLogs) return log.previousSetLogs;
  if (log.previousSets == null) return [];
  return setsOf({ setsCompleted: log.previousSets, repsCompleted: log.previousReps ?? 0, weightUsed: log.previousWeight });
}

export function workingSets(sets: SetLog[]): SetLog[] {
  return sets.filter((s) => !s.warmup);
}

/** Mirrors the server: working set count, and the reps and weight of the heaviest working set. */
export function summarizeSets(sets: SetLog[]) {
  const working = workingSets(sets);
  let top: SetLog | null = null;
  for (const s of working) {
    const w = Number(s.weight ?? 0);
    const topW = Number(top?.weight ?? 0);
    if (!top || w > topW || (w === topW && s.reps > top.reps)) top = s;
  }
  return {
    setsCompleted: working.length,
    repsCompleted: top?.reps ?? 0,
    weightUsed: top?.weight ?? null,
  };
}

/** Total weight × reps over the working sets. */
export function setVolume(sets: SetLog[]): number {
  return workingSets(sets).reduce((total, s) => total + Number(s.weight ?? 0) * s.reps, 0);
}

/**
 * Short description of the working sets: "3×8 @ 60 kg" when they're all the same,
 * otherwise each set, e.g. "8@60 · 8@65 · 6@70 kg". Warm-ups are counted separately.
 */
export function formatSets(sets: SetLog[], repUnit?: string | null): string {
  const unit = repUnit === 'seconds' ? 's' : '';
  const working = workingSets(sets);
  const warmups = sets.length - working.length;
  const warmupText = warmups > 0 ? ` (+${warmups} warm-up)` : '';
  if (working.length === 0) return warmups > 0 ? `${warmups} warm-up` : '';

  const first = working[0];
  const uniform = working.every((s) => s.reps === first.reps && Number(s.weight ?? 0) === Number(first.weight ?? 0));
  if (uniform) {
    const weight = first.weight != null && Number(first.weight) > 0 ? ` @ ${formatKg(Number(first.weight))} kg` : '';
    return `${working.length}×${first.reps}${unit}${weight}${warmupText}`;
  }
  const hasWeight = working.some((s) => s.weight != null && Number(s.weight) > 0);
  const parts = working.map((s) =>
    s.weight != null && Number(s.weight) > 0 ? `${s.reps}${unit}@${formatKg(Number(s.weight))}` : `${s.reps}${unit}`);
  return `${parts.join(' · ')}${hasWeight ? ' kg' : ''}${warmupText}`;
}
