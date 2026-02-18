import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { exercisesApi } from '@/services/api';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { getErrorMessage } from '@/utils/errorHandler';

export function useExerciseDetail(workoutId: string, exerciseId: string) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data: { videoUrl?: string | null; description?: string | null }) =>
      exercisesApi.update(Number(workoutId), Number(exerciseId), data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.exercises(workoutId) });
      Alert.alert('Saved!');
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const saveVideo = (videoUrl: string, onDone: () => void) => {
    updateMutation.mutate(
      { videoUrl: videoUrl.trim() || null },
      { onSuccess: onDone }
    );
  };

  const saveDescription = (description: string, onDone: () => void) => {
    updateMutation.mutate(
      { description: description.trim() || null },
      { onSuccess: onDone }
    );
  };

  return {
    saveVideo,
    saveDescription,
    isPending: updateMutation.isPending,
  };
}