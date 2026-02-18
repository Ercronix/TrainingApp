import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { workoutsApi } from '@/services/api';
import { Alert } from 'react-native';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useCreateWorkout(splitId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (name: string) =>
      workoutsApi.create(Number(splitId), { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workouts(splitId) });
      router.back();
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const createWorkout = (name: string) => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a workout name');
      return;
    }
    mutation.mutate(name.trim());
  };

  return { createWorkout, isPending: mutation.isPending };
}