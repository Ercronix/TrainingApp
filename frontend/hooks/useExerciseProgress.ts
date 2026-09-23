import { useQuery } from '@tanstack/react-query';
import { exercisesApi, libraryApi } from '@/services/api';

// Progress covers every workout using the same library exercise. Pass the library id when it is
// known (it is required when there is no workout exercise, e.g. from the library screen).
export function useExerciseProgress(exerciseId: string, libraryExerciseId?: string) {
  const query = useQuery({
    queryKey: libraryExerciseId
      ? ['exercise-progress', 'library', libraryExerciseId]
      : ['exercise-progress', exerciseId],
    queryFn: () => libraryExerciseId
      ? libraryApi.getProgress(Number(libraryExerciseId))
      : exercisesApi.getProgress(Number(exerciseId)),
    enabled: !!libraryExerciseId || !!exerciseId,
  });

  return {
    progress: query.data,
    isLoading: query.isLoading,
  };
}
