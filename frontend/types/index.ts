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
  setsCompleted: number;
  repsCompleted: number;
  weightUsed: number | null;
  completed: boolean;
  notes: string | null;
  repUnit: 'reps' | 'seconds' | null;
  // Most recent completed session for this exercise (null if never trained)
  previousSets: number | null;
  previousReps: number | null;
  previousWeight: number | null;
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
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number | null;
  completed?: boolean;
  notes?: string;
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
  workoutCount: number;
  lastTrainedAt: string | null;
}

export interface UpdateLibraryExerciseRequest {
  name?: string;
  description?: string | null;
  videoUrl?: string | null;
  repUnit?: 'reps' | 'seconds';
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
}

export interface ExerciseProgressEntry {
  date: string;
  weightUsed: number | null;
  setsCompleted: number;
  repsCompleted: number;
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


