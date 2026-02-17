import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '@/services/api';
import { Alert } from 'react-native';

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
      queryClient.invalidateQueries({ queryKey: ['workouts', splitId] });
      Alert.alert('Success', 'Workout created!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to create workout');
    },
  });

  // Delete Workout
  const deleteWorkout = useMutation({
    mutationFn: workoutsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts', splitId] });
      Alert.alert('Success', 'Workout deleted!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to delete workout');
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