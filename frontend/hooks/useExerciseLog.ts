import { useRouter } from 'expo-router';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';
import { SetLog } from '@/types';

export function useExerciseLog(exerciseLogId: string, trainingLogId: string) {
  const router = useRouter();
  const mutation = useUpdateExerciseLog(trainingLogId);

  const saveExercise = (sets: SetLog[]) => {
    mutation.mutate({
      exerciseLogId: Number(exerciseLogId),
      data: { sets, completed: true },
    });

    // Optimistic: don't wait for the server (it may be unreachable at the gym)
    router.back();
  };

  return { saveExercise, isPending: mutation.isPending };
}
