import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { trainingLogsApi } from '@/services/api';
import { confirm, alert } from '@/utils/confirm';
import { getErrorMessage } from '@/utils/errorHandler';
import { QUERY_KEYS } from '@/constants/queryKeys';

export function useStartTraining(workoutId: string, workoutName: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => trainingLogsApi.start(Number(workoutId)),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activeTraining });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      router.push({
        pathname: '/training',
        params: { trainingLogId: data.id.toString() },
      });
    },
    onError: (error: unknown) => {
      alert('Error', getErrorMessage(error));
    },
  });

  const startTraining = (exerciseCount: number) => {
    if (exerciseCount === 0) {
      alert('No Exercises', 'Add at least one exercise before starting training');
      return;
    }
    mutation.mutate();
  };

  return { startTraining, isPending: mutation.isPending };
}