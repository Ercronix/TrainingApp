import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trainingLogsApi } from '@/services/api';
import { Alert } from 'react-native';

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
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to update exercise');
    },
  });

  // Complete Training
  const completeTraining = useMutation({
    mutationFn: () => trainingLogsApi.complete(Number(trainingLogId)),
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data || 'Failed to complete training');
    },
  });

  return {
    training: trainingQuery.data,
    isLoading: trainingQuery.isLoading,
    updateExercise,
    completeTraining,
  };
}