import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { trainingLogsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getErrorMessage } from '@/utils/errorHandler';

export interface AddExerciseLogDto {
  name: string;
  sets?: number | null;
  reps?: number | null;
  plannedWeight?: number | null;
  addToWorkout: boolean;
}

export function useAddExerciseLog(trainingLogId?: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (data: AddExerciseLogDto) => {
      if (!trainingLogId) throw new Error('Missing trainingLogId');
      return trainingLogsApi.addExerciseLog(Number(trainingLogId), data);
    },
    onSuccess: () => {
      if (trainingLogId) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.training(trainingLogId) });
      }
      void queryClient.invalidateQueries({ queryKey: ['exercises'] });
      void queryClient.invalidateQueries({ queryKey: ['workouts'] });
      Alert.alert('Success', 'Exercise added!');
      router.back();
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  return { addExerciseLog: mutation, isPending: mutation.isPending };
}
