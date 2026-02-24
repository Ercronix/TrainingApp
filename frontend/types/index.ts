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
}

export interface DashboardStats {
  streak: {
    current: number;
    longest: number;
    last7Days: boolean[];
  };
  sessions: {
    week: number;
    month: number;
    year: number;
  };
  volume: {
    week: number;
    month: number;
    year: number;
  };
  time: {
    week: string;
    month: string;
    year: string;
  };
  averageVolume: number;
  lastSession: TrainingLog | null;
  mostActiveDay: string;
  sessionsByDay: Record<string, number>;
}


