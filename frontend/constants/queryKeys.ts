export const QUERY_KEYS = {
  splits: ['splits'] as const,
  workouts: (splitId: string) => ['workouts', splitId] as const,
  workout: (workoutId: string) => ['workout', workoutId] as const,
  exercises: (workoutId: string) => ['exercises', workoutId] as const,
  exercise: (exerciseId: string) => ['exercise', exerciseId] as const,
  training: (id: string) => ['training', id] as const,
  activeTraining: ['activeTraining'] as const,
  library: ['library'] as const,
  // Versioned: the catalog is cached for a day, so a change to its shape needs a new key
  catalog: ['catalog', 2] as const,
  illustration: (catalogExerciseId: number, index: 0 | 1) => ['illustration', catalogExerciseId, index] as const,
  stats: ['stats'] as const,
};