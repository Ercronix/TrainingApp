// Builders for the API types the pure utils consume, with only the fields a test cares about set.
import { ExerciseLog, ExerciseProgressEntry, LibraryExercise, MuscleTarget, SetLog, TrainingLog } from '@/types';
import type { SetRow } from '@/store/setDraftStore';

export const set = (reps: number, weight: number | null = null, warmup = false): SetLog =>
  ({ reps, weight, rpe: null, warmup });

export const warmup = (reps: number, weight: number | null = null): SetLog => set(reps, weight, true);

/** A row of the log exercise screen, as typed: not done and empty unless overridden. */
export const setRow = (overrides: Partial<SetRow> = {}): SetRow =>
  ({ weight: '', reps: '', rpe: '', warmup: false, done: false, ...overrides });

let nextId = 1;

export function exerciseLog(overrides: Partial<ExerciseLog> = {}): ExerciseLog {
  return {
    id: nextId++,
    exerciseId: 1,
    libraryExerciseId: 1,
    exerciseName: 'Bench Press',
    workoutId: 1,
    workoutName: 'Push',
    plannedSets: null,
    plannedReps: null,
    plannedWeight: null,
    setsCompleted: 0,
    repsCompleted: 0,
    weightUsed: null,
    sets: [],
    completed: true,
    notes: null,
    repUnit: 'reps',
    previousSets: null,
    previousReps: null,
    previousWeight: null,
    ...overrides,
  };
}

/** A completed session at `at` (completedAt), lasting `durationSeconds`. */
export function trainingLog(at: Date, exercises: ExerciseLog[], overrides: Partial<TrainingLog> = {}): TrainingLog {
  return {
    id: nextId++,
    splitId: 1,
    splitName: 'PPL',
    workoutId: 1,
    workoutName: 'Push',
    startedAt: new Date(at.getTime() - 3_600_000).toISOString(),
    completedAt: at.toISOString(),
    durationSeconds: 3600,
    notes: null,
    exercises,
    isCompleted: true,
    ...overrides,
  };
}

export function libraryExercise(id: number, muscles?: MuscleTarget[]): LibraryExercise {
  return {
    id,
    name: `Exercise ${id}`,
    description: null,
    videoUrl: null,
    videoId: null,
    repUnit: 'reps',
    muscles,
    workoutCount: 1,
    lastTrainedAt: null,
  };
}

export function progressEntry(at: Date, sets: SetLog[], overrides: Partial<ExerciseProgressEntry> = {}): ExerciseProgressEntry {
  return {
    date: at.toISOString(),
    weightUsed: null,
    setsCompleted: 0,
    repsCompleted: 0,
    sets,
    trainingLogId: nextId++,
    workoutName: 'Push',
    ...overrides,
  };
}

/** Local time, so week and day boundaries hold in any time zone. Months are 1-based here. */
export const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
