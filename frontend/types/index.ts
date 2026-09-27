export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
    refreshToken?: string;
    type: string;
    userId: number;
    username: string;
    email: string;
}

// User Type
export interface User {
    id: number;
    username: string;
    email: string;
}

// Training Split Types
export interface TrainingSplit {
    id: number;
    name: string;
    isActive: boolean;
    currentBlock: number;
    workoutCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSplitRequest {
    name: string;
}

export interface TrainingLog {
  id: number;
  splitId: number;
  splitName: string;
  workoutId: number;      
  workoutName: string;    
  startedAt: string;
  completedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  exercises: ExerciseLog[];
  isCompleted: boolean;
}

export interface ExerciseLog {
  id: number;
  exerciseId: number;
  libraryExerciseId: number;
  exerciseName: string;
  workoutId: number;
  workoutName: string;
  plannedSets: number | null;
  plannedReps: number | null;
  plannedWeight: number | null;
  // Summary of the working sets: their count, and the reps and weight of the heaviest
  setsCompleted: number;
  repsCompleted: number;
  weightUsed: number | null;
  // Optional: sessions cached before per-set logging don't have them
  sets?: SetLog[];
  completed: boolean;
  notes: string | null;
  repUnit: 'reps' | 'seconds' | null;
  // Most recent completed session for this exercise (null if never trained)
  previousSets: number | null;
  previousReps: number | null;
  previousWeight: number | null;
  previousSetLogs?: SetLog[] | null;
  // Best working set weight and estimated 1RM of sessions completed before this one (null if
  // none). Optional: sessions cached before records were added don't have them.
  bestWeight?: number | null;
  bestOneRepMax?: number | null;
}

// One performed set. `reps` holds seconds for exercises timed in seconds.
export interface SetLog {
  reps: number;
  weight: number | null;
  rpe: number | null;
  warmup: boolean;
}

export interface Workout {
  id: number;
  name: string;
  exerciseCount?: number;
}

export interface Exercise {
  id: number;
  libraryExerciseId: number;
  name: string;
  description?: string | null;
  videoUrl?: string | null;
  videoId?: string | null;
  sets?: number | null;
  reps?: number | null;
  repUnit?: 'reps' | 'seconds' | null;
  plannedWeight?: number | null;
  orderIndex: number;
  lastUsedWeight?: number | null;
}

export interface UpdateExerciseLogRequest {
  // Replaces every logged set; the summary fields are derived from it on the server
  sets?: SetLog[];
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number | null;
  completed?: boolean;
  notes?: string;
}

// Shoulders are split into the three delt heads
export type Muscle =
  | 'CHEST' | 'LATS' | 'MIDDLE_BACK' | 'TRAPS' | 'LOWER_BACK'
  | 'FRONT_DELTS' | 'SIDE_DELTS' | 'REAR_DELTS'
  | 'BICEPS' | 'TRICEPS' | 'FOREARMS'
  | 'QUADRICEPS' | 'HAMSTRINGS' | 'GLUTES' | 'CALVES' | 'ADDUCTORS' | 'ABDUCTORS'
  | 'ABDOMINALS' | 'NECK';

// A set counts fully for a primary muscle and half for a secondary one
export type MuscleRole = 'PRIMARY' | 'SECONDARY';

export interface MuscleTarget {
  muscle: Muscle;
  role: MuscleRole;
}

// A common exercise from the shared, read-only catalog
export interface CatalogExercise {
  id: number;
  name: string;
  equipment: string | null;
  category: string;
  muscles: MuscleTarget[];
}

// An exercise in the user's library. Workout exercises link to one and add their own plan
// (sets/reps/weight), so name, notes, video and rep unit are shared by every workout using it.
export interface LibraryExercise {
  id: number;
  name: string;
  description: string | null;
  videoUrl: string | null;
  videoId: string | null;
  repUnit: 'reps' | 'seconds';
  // Primary muscles first, empty until assigned. Missing in data cached before muscles existed.
  muscles?: MuscleTarget[];
  workoutCount: number;
  lastTrainedAt: string | null;
}

export interface UpdateLibraryExerciseRequest {
  name?: string;
  description?: string | null;
  videoUrl?: string | null;
  repUnit?: 'reps' | 'seconds';
  // Replaces the muscles; an empty list clears them
  muscles?: MuscleTarget[];
}

export interface CreateExerciseRequest {
  // Either an existing library entry, or a name that is matched against the library
  // (ignoring case) and added to it when new
  libraryExerciseId?: number;
  name?: string;
  description?: string | null;
  videoUrl?: string | null;
  videoId?: string | null;
  sets?: number | null;
  reps?: number | null;
  repUnit?: string;
  plannedWeight?: number | null;
  // Replaces the library entry's muscles when sent
  muscles?: MuscleTarget[];
}

export interface ExerciseProgressEntry {
  date: string;
  weightUsed: number | null;
  setsCompleted: number;
  repsCompleted: number;
  sets?: SetLog[];
  trainingLogId: number;
  workoutName: string;
}

// Covers every workout that uses the same library exercise
export interface ExerciseProgress {
  exerciseId: number | null;
  libraryExerciseId: number;
  exerciseName: string;
  entries: ExerciseProgressEntry[];
}

// Rolling windows of the last 7, 30 and 365 days
export interface RangeValues {
  week: number;
  month: number;
  year: number;
}

export type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// Computed by the backend over completed sessions. Volume is in kg and skips timed exercises.
export interface DashboardStats {
  sessions: RangeValues;
  volume: RangeValues;
  durationSeconds: RangeValues;
  averageVolume: RangeValues;
  streak: {
    current: number;
    longest: number;
    // Oldest first, ending today; dates are yyyy-MM-dd in the requested time zone
    last7Days: { date: string; trained: boolean }[];
  };
  mostActiveDay: Weekday | null;
  mostActiveDaySessions: number;
  lastSession: {
    id: number;
    workoutName: string;
    splitName: string;
    startedAt: string;
    exerciseCount: number;
  } | null;
}


