import { useRouter } from 'expo-router';
import { alert } from '@/utils/confirm';
import { useUpdateExerciseLog } from './useUpdateExerciseLog';
import { useExerciseProgress } from './useExerciseProgress';
import { detectPersonalRecord, getPersonalRecords } from '@/utils/strength';

export function useExerciseLog(exerciseLogId: string, trainingLogId: string, exerciseId?: string) {
  const router = useRouter();
  const mutation = useUpdateExerciseLog(trainingLogId);
  const { progress } = useExerciseProgress(exerciseId ?? '');

  const saveExercise = (sets: string, reps: string, weight: string) => {
    const setsCompleted = sets ? parseInt(sets) : 0;
    const repsCompleted = reps ? parseInt(reps) : 0;
    const weightUsed = weight ? parseFloat(weight.replace(',', '.')) : null;

    mutation.mutate({
      exerciseLogId: Number(exerciseLogId),
      data: { setsCompleted, repsCompleted, weightUsed, completed: true },
    });

    // Optimistic: don't wait for the server (it may be unreachable at the gym)
    router.back();

    const record = progress && weightUsed != null
      ? detectPersonalRecord(getPersonalRecords(progress.entries), weightUsed, repsCompleted)
      : null;
    if (record) alert('New personal record! 🏆', record);
  };

  return { saveExercise, isPending: mutation.isPending };
}
