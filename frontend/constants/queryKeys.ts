export const QUERY_KEYS = {
  splits: ['splits'] as const,
  workouts: (splitId: string) => ['workouts', splitId] as const,
  workout: (workoutId: string) => ['workout', workoutId] as const,
  exercises: (workoutId: string) => ['exercises', workoutId] as const,
  exercise: (exerciseId: string) => ['exercise', exerciseId] as const,
  training: (id: string) => ['training', id] as const,
};