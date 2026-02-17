import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '@/services/api';
import { Alert } from 'react-native';
import {getErrorMessage} from "@/utils/errorHandler";

export function useWorkouts(splitId: string) {
  const queryClient = useQueryClient();

  // Get Workouts
  const workoutsQuery = useQuery({
    queryKey: ['workouts', splitId],
    queryFn: () => workoutsApi.getBySplit(Number(splitId)),
  });

  // Create Workout
  const createWorkout = useMutation({
    mutationFn: (data: any) => workoutsApi.create(Number(splitId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts', splitId] });
      Alert.alert('Success', 'Workout created!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  // Delete Workout
  const deleteWorkout = useMutation({
    mutationFn: workoutsApi.delete,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workouts', splitId] });
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