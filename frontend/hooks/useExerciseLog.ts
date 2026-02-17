import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { trainingLogsApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import {getErrorMessage} from "@/utils/errorHandler";

export interface ExerciseLogDto {
  setsCompleted: number;
  repsCompleted: number;
  weightUsed: number | null;
  completed: boolean;
}

export function useExerciseLog(exerciseLogId: string, trainingLogId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: (data: ExerciseLogDto) =>
      trainingLogsApi.updateExercise(Number(exerciseLogId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.training(trainingLogId) });
      Alert.alert('Success', 'Exercise updated!');
      router.back();
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const saveExercise = (sets: string, reps: string, weight: string) => {
    mutation.mutate({
      setsCompleted: sets ? parseInt(sets) : 0,
      repsCompleted: reps ? parseInt(reps) : 0,
      weightUsed: weight ? parseFloat(weight) : null,
      completed: true,
    });
  };

  return { saveExercise, isPending: mutation.isPending };
}