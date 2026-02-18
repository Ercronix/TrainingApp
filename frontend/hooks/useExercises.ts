import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exercisesApi } from '@/services/api';
import { Alert } from 'react-native';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useExercises(workoutId: string) {
  const queryClient = useQueryClient();

  const exercisesQuery = useQuery({
    queryKey: QUERY_KEYS.exercises(workoutId),
    queryFn: () => exercisesApi.getByWorkout(Number(workoutId)),
    enabled: !!workoutId,
  });

  const createExercise = useMutation({
    mutationFn: (data: {
      name: string;
      description?: string | null;
      videoUrl?: string | null;
      videoId?: string | null;
      sets?: number | null;
      reps?: number | null;
      plannedWeight?: number | null;
    }) => exercisesApi.create(Number(workoutId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exercises(workoutId) });
      Alert.alert('Success', 'Exercise created!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const deleteExercise = useMutation({
    mutationFn: (exerciseId: number) =>
      exercisesApi.delete(Number(workoutId), exerciseId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exercises(workoutId) });
      Alert.alert('Success', 'Exercise deleted!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  return {
    exercises: exercisesQuery.data,
    isLoading: exercisesQuery.isLoading,
    isRefetching: exercisesQuery.isRefetching,
    refetch: exercisesQuery.refetch,
    createExercise,
    deleteExercise,
  };
}