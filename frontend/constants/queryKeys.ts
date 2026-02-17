export const QUERY_KEYS = {
  splits: ['splits'] as const,
  workouts: (splitId: string) => ['workouts', splitId] as const,
  training: (id: string) => ['training', id] as const,
};