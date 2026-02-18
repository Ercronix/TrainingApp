import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { trainingLogsApi } from '@/services/api';
import { getErrorMessage } from '@/utils/errorHandler';

export function useStartTraining(workoutId: string, workoutName: string) {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: () => trainingLogsApi.start(Number(workoutId)),
    onSuccess: (data) => {
      router.push({
        pathname: '/training',
        params: { trainingLogId: data.id.toString() },
      });
    },
    onError: (error: unknown) => {
      Alert.alert('Error', getErrorMessage(error));
    },
  });

  const startTraining = (exerciseCount: number) => {
    if (exerciseCount === 0) {
      Alert.alert('No Exercises', 'Add at least one exercise before starting training');
      return;
    }
    Alert.alert(
      'Start Training',
      `Start training session for "${workoutName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start', onPress: () => mutation.mutate() },
      ]
    );
  };

  return { startTraining, isPending: mutation.isPending };
}