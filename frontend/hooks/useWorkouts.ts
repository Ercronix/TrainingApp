import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '@/services/api';
import { Alert } from 'react-native';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useWorkouts(splitId: string) {
  const queryClient = useQueryClient();

  const workoutsQuery = useQuery({
    queryKey: QUERY_KEYS.workouts(splitId),
    queryFn: () => workoutsApi.getBySplit(Number(splitId)),
  });

  const createWorkout = useMutation({
    mutationFn: (name: string) => workoutsApi.create(Number(splitId), { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workouts(splitId) });
      Alert.alert('Success', 'Workout created!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const deleteWorkout = useMutation({
    mutationFn: workoutsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workouts(splitId) });
      Alert.alert('Success', 'Workout deleted!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  return {
    workouts: workoutsQuery.data,
    isLoading: workoutsQuery.isLoading,
    isRefetching: workoutsQuery.isRefetching,
    refetch: workoutsQuery.refetch,
    createWorkout,
    deleteWorkout,
  };
}