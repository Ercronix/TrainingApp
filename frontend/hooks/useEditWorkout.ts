import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { workoutsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';

export function useEditWorkout(workoutId: string, splitId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (name: string) => workoutsApi.update(Number(workoutId), name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.workouts(splitId) });
      router.back();
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const save = (name: string) => {
    if (!name.trim()) {
      alert('Error', 'Please enter a name');
      return;
    }
    mutation.mutate(name.trim());
  };

  return { save, isPending: mutation.isPending };
}