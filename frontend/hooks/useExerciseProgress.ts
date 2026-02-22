import { useQuery } from '@tanstack/react-query';
import { exercisesApi } from '@/services/api';

export function useExerciseProgress(exerciseId: string) {
  const query = useQuery({
    queryKey: ['exercise-progress', exerciseId],
    queryFn: () => exercisesApi.getProgress(Number(exerciseId)),
    enabled: !!exerciseId,
  });

  return {
    progress: query.data,
    isLoading: query.isLoading,
  };
}
