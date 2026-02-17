// types/workout.ts
export interface CreateWorkoutDto {
  name: string;
  sets: number | null;
  reps: number | null;
  plannedWeight: number | null;
}

export interface WorkoutFormData {
  name: string;
  sets: string;
  reps: string;
  weight: string;
}