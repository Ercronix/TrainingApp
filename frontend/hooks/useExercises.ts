import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exercisesApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { Exercise, CreateExerciseRequest } from '@/types';

export function useExercises(workoutId: string) {
  const queryClient = useQueryClient();
  const queryKey = QUERY_KEYS.exercises(workoutId);

  const query = useQuery({
    queryKey,
    queryFn: () => exercisesApi.getByWorkout(Number(workoutId)),
    enabled: !!workoutId,
  });

  const createExercise = useMutation({
    mutationFn: (data: CreateExerciseRequest) => exercisesApi.create(Number(workoutId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const deleteExercise = useMutation({
    mutationFn: (exerciseId: number) => exercisesApi.delete(Number(workoutId), exerciseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const reorderExercises = useMutation({
    mutationFn: (exercises: { id: number; orderIndex: number }[]) =>
      exercisesApi.reorder(Number(workoutId), exercises),
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: Exercise[]) => {
        if (!old) return old;
        const indexMap = new Map(newOrder.map((e) => [e.id, e.orderIndex]));
        return [...old]
          .map((e) => ({ ...e, orderIndex: indexMap.get(e.id) ?? e.orderIndex }))
          .sort((a, b) => a.orderIndex - b.orderIndex);
      });
      return { previous };
    },
    onError: (error: unknown, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      alert('Error', getErrorMessage(error));
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    exercises: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    createExercise,
    deleteExercise,
    reorderExercises,
  };
}