import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { Alert } from 'react-native';
import {getErrorMessage} from "@/utils/errorHandler";

export function useTraining(trainingLogId: string) {
  const queryClient = useQueryClient();

  // Get Training
  const trainingQuery = useQuery({
    queryKey: ['training', trainingLogId],
    queryFn: () => trainingLogsApi.getById(Number(trainingLogId)),
    refetchInterval: 5000,
  });

  // Update Exercise
  const updateExercise = useMutation({
    mutationFn: ({ exerciseLogId, data }: any) =>
      trainingLogsApi.updateExercise(exerciseLogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training', trainingLogId] });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  // Complete Training
  const completeTraining = useMutation({
    mutationFn: () => trainingLogsApi.complete(Number(trainingLogId)),
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  return {
    training: trainingQuery.data,
    isLoading: trainingQuery.isLoading,
    updateExercise,
    completeTraining,
  };
}