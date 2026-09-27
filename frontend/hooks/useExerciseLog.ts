import { useRouter } from 'expo-router';
import { alert } from '@/utils/confirm';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';
import { personalRecordOf } from '@/utils/strength';
import { ExerciseLog, SetLog } from '@/types';

export function useExerciseLog(exerciseLogId: string, trainingLogId: string, log?: ExerciseLog) {
  const router = useRouter();
  const mutation = useUpdateExerciseLog(trainingLogId);

  const saveExercise = (sets: SetLog[]) => {
    mutation.mutate({
      exerciseLogId: Number(exerciseLogId),
      data: { sets, completed: true },
    });

    // Optimistic: don't wait for the server (it may be unreachable at the gym)
    router.back();

    const record = log ? personalRecordOf(log, sets) : null;
    if (record) alert('New personal record! 🏆', record);
  };

  return { saveExercise, isPending: mutation.isPending };
}
